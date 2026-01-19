from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, Body
from typing import Optional, List
import io
from pydantic import BaseModel, Field
from app.models.schemas import EvaluationResponse, TeacherFileProcessResponse
from app.services.preprocessing import preprocess_text
from app.services.similarity_service import calculate_semantic_similarity
from app.services.concept_service import calculate_concept_coverage, extract_concepts_from_text
from app.services.scoring_service import validate_weights
from app.services.strict_scoring_service import calculate_strict_marks
from app.services.feedback_service import generate_feedback_llm
from app.services.ocr_service import extract_text_from_file
from app.services.full_paper_evaluator import evaluate_full_paper
from app.database.db import save_evaluation, get_evaluation, get_evaluations
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["evaluation"])


@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(
    question: str = Form(...),
    modelAnswer: str = Form(...),
    studentAnswer: str = Form(...),
    maxMarks: float = Form(...),
    semanticWeight: float = Form(...),
    conceptWeight: float = Form(...),
    teacherFile: Optional[UploadFile] = File(None),
    studentFile: Optional[UploadFile] = File(None)
):
    """
    Evaluate a student's descriptive answer against a model answer
    
    Supports both text input and file uploads (PDF, images for OCR)
    """
    try:
        # Step 1: Input Validation
        if maxMarks <= 0:
            raise HTTPException(status_code=400, detail="maxMarks must be greater than 0")
        
        if not validate_weights(semanticWeight, conceptWeight):
            raise HTTPException(
                status_code=400,
                detail=f"Weights must sum to 1.0 (got {semanticWeight + conceptWeight})"
            )
        
        # Step 2: Process file uploads if present
        teacher_answer = modelAnswer
        student_answer = studentAnswer
        
        if teacherFile:
            try:
                file_bytes = await teacherFile.read()
                extracted_text = extract_text_from_file(file_bytes, teacherFile.content_type)
                if extracted_text.strip():
                    teacher_answer = extracted_text
            except Exception as e:
                logger.warning(f"Error processing teacher file: {e}. Using text input.")
        
        if studentFile:
            try:
                file_bytes = await studentFile.read()
                extracted_text = extract_text_from_file(file_bytes, studentFile.content_type)
                if extracted_text.strip():
                    student_answer = extracted_text
            except Exception as e:
                logger.warning(f"Error processing student file: {e}. Using text input.")
        
        # Validate that we have answers
        if not teacher_answer.strip() or not student_answer.strip():
            raise HTTPException(
                status_code=400,
                detail="Both teacher answer and student answer are required"
            )
        
        # Step 3: Check if not answered (early detection)
        from app.services.strict_scoring_service import is_not_answered
        
        if is_not_answered(student_answer):
            # Return early with not answered response
            response_data = {
                "finalScore": 0.0,
                "maxMarks": maxMarks,
                "label": "Not Answered",
                "semanticSimilarity": 0.0,
                "conceptCoverage": 0.0,
                "coveredConcepts": [],
                "missingConcepts": [],
                "requiredConcepts": [],
                "feedback": {
                    "strengths": [],
                    "weaknesses": ["No answer provided."],
                    "suggestions": ["Please provide an answer."]
                },
                "conceptAnalysis": [],
                "penaltiesApplied": {
                    "lengthPenalty": False,
                    "conceptGating": False
                },
                "reasonForMarks": "No answer provided."
            }
            return EvaluationResponse(**response_data)
        
        # Step 4: Preprocess text
        teacher_answer_processed = preprocess_text(teacher_answer)
        student_answer_processed = preprocess_text(student_answer)
        
        # Step 5: Calculate semantic similarity
        semantic_similarity_score = calculate_semantic_similarity(
            teacher_answer_processed,
            student_answer_processed
        )
        semantic_similarity_percent = round(semantic_similarity_score * 100, 1)
        
        # Step 6: Calculate concept coverage
        concept_data = calculate_concept_coverage(
            teacher_answer_processed,
            student_answer_processed
        )
        
        # Extract required concepts from model answer for gating
        required_concepts = extract_concepts_from_text(teacher_answer_processed, max_concepts=15)
        
        # Step 7: Calculate final marks using strict scoring
        scoring_result = calculate_strict_marks(
            semantic_similarity_score,
            concept_data["coverage"],
            semanticWeight,
            conceptWeight,
            maxMarks,
            student_answer_processed,
            concept_data["covered_concepts"],
            required_concepts
        )
        
        final_marks = scoring_result['marks']
        
        # Step 8: Generate feedback
        feedback = generate_feedback_llm(
            question=question,
            teacher_answer=teacher_answer_processed,
            student_answer=student_answer_processed,
            missing_concepts=concept_data["missing_concepts"],
            final_marks=final_marks,
            max_marks=maxMarks
        )
        
        # If wrong definition, add explicit feedback
        if scoring_result.get('is_wrong_definition', False):
            if 'weaknesses' not in feedback:
                feedback['weaknesses'] = []
            feedback['weaknesses'].insert(0, 'Answer is conceptually incorrect.')
        
        # Step 9: Prepare response
        response_data = {
            "finalScore": final_marks,
            "maxMarks": maxMarks,
            "label": scoring_result['label'],
            "semanticSimilarity": semantic_similarity_percent,
            "conceptCoverage": concept_data["coverage"],
            "coveredConcepts": concept_data["covered_concepts"],
            "missingConcepts": concept_data["missing_concepts"],
            "requiredConcepts": required_concepts,
            "feedback": feedback,
            "conceptAnalysis": concept_data["concept_analysis"],
            "penaltiesApplied": {
                "lengthPenalty": scoring_result['length_penalty_applied'],
                "conceptGating": scoring_result['concept_gating_applied']
            },
            "reasonForMarks": scoring_result.get('reason_for_marks', 'Answer evaluated based on semantic similarity and concept coverage.')
        }
        
        # Step 9: Save to database (async, non-blocking)
        try:
            evaluation_record = {
                "question": question,
                "teacher_answer": teacher_answer_processed,
                "student_answer": student_answer_processed,
                "max_marks": maxMarks,
                "final_marks": final_marks,
                "semantic_similarity": semantic_similarity_percent,
                "concept_coverage": concept_data["coverage"],
                "covered_concepts": concept_data["covered_concepts"],
                "missing_concepts": concept_data["missing_concepts"],
                "feedback": feedback,
                "concept_analysis": concept_data["concept_analysis"],
                "timestamp": datetime.utcnow()
            }
            await save_evaluation(evaluation_record)
        except Exception as e:
            logger.warning(f"Failed to save evaluation to database: {e}")
        
        return EvaluationResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in evaluation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.post("/process-teacher-file", response_model=TeacherFileProcessResponse)
async def process_teacher_file(file: UploadFile = File(...)):
    """
    Process teacher file to extract questions and answers
    
    Supports PDF, DOCX, and TXT files
    """
    try:
        file_bytes = await file.read()
        content_type = file.content_type or "application/octet-stream"
        
        # Extract text based on file type
        if content_type == "application/pdf":
            from app.services.ocr_service import extract_text_from_pdf
            extracted_text = extract_text_from_pdf(file_bytes)
        elif content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            # Handle DOCX files
            from docx import Document
            doc = Document(io.BytesIO(file_bytes))
            extracted_text = "\n".join([para.text for para in doc.paragraphs])
        elif content_type == "text/plain":
            extracted_text = file_bytes.decode('utf-8')
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {content_type}"
            )
        
        # Simple extraction: split by common patterns
        # This is a basic implementation - can be enhanced with NLP
        questions = []
        
        # Try to find Q&A patterns
        lines = extracted_text.split('\n')
        current_question = None
        current_answer = []
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_question and current_answer:
                    questions.append({
                        "question": current_question,
                        "answer": " ".join(current_answer)
                    })
                    current_question = None
                    current_answer = []
                continue
            
            # Check if line looks like a question
            if line.lower().startswith(('q:', 'question', 'q.')) or line.endswith('?'):
                if current_question and current_answer:
                    questions.append({
                        "question": current_question,
                        "answer": " ".join(current_answer)
                    })
                current_question = line
                current_answer = []
            elif current_question:
                current_answer.append(line)
        
        # Add last Q&A pair if exists
        if current_question and current_answer:
            questions.append({
                "question": current_question,
                "answer": " ".join(current_answer)
            })
        
        # If no structured Q&A found, create a single entry
        if not questions:
            questions.append({
                "question": "Extracted from file",
                "answer": extracted_text[:500]  # First 500 chars
            })
        
        return TeacherFileProcessResponse(questions=questions)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing teacher file: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process file: {str(e)}"
        )


@router.get("/evaluations")
async def get_evaluation_history(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """
    Get evaluation history
    
    Optional endpoint for retrieving past evaluations
    """
    try:
        evaluations = await get_evaluations(limit=limit, skip=skip)
        return {
            "evaluations": evaluations,
            "count": len(evaluations),
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error getting evaluation history: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evaluation history: {str(e)}"
        )


@router.get("/evaluations/{evaluation_id}")
async def get_evaluation_result(evaluation_id: str):
    """
    Get specific evaluation result by ID
    
    Optional endpoint for retrieving a specific evaluation
    """
    try:
        evaluation = await get_evaluation(evaluation_id)
        if not evaluation:
            raise HTTPException(
                status_code=404,
                detail=f"Evaluation with ID {evaluation_id} not found"
            )
        return evaluation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting evaluation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evaluation: {str(e)}"
        )


@router.post("/evaluations/{evaluation_id}/feedback")
async def submit_feedback(evaluation_id: str, feedback: dict):
    """
    Submit feedback on an evaluation
    
    Optional endpoint for user feedback on evaluation quality
    """
    try:
        # This is a placeholder - implement actual feedback storage if needed
        return {
            "message": "Feedback submitted successfully",
            "evaluation_id": evaluation_id,
            "feedback": feedback
        }
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit feedback: {str(e)}"
        )


# Full Paper Evaluation Models
class FullPaperEvaluationRequest(BaseModel):
    questions: str
    model_answers: str = Field(..., description="Model answer key text")
    student_answers: str = Field(..., description="Student answer sheet text")
    marks_per_question: float = Field(..., gt=0, description="Marks per question")
    semantic_weight: float = Field(0.5, ge=0, le=1, description="Weight for semantic similarity")
    concept_weight: float = Field(0.5, ge=0, le=1, description="Weight for concept coverage")
    
    class Config:
        protected_namespaces = ()


@router.post("/evaluate/full-paper")
async def evaluate_full_paper_endpoint(request: FullPaperEvaluationRequest = Body(...)):
    """
    Evaluate a full question paper with multiple questions
    
    Accepts:
    - Full question paper text (numbered: 1. Question 2. Question...)
    - Full model answer key (numbered: 1. Answer 2. Answer...)
    - Full student answer sheet (numbered: 1. Answer 2. Answer...)
    - Marks per question
    - Evaluation weights
    
    Returns:
    - Summary with total marks, marks obtained, overall performance
    - Question-wise detailed results with marks, similarity, feedback
    """
    try:
        # Validate weights
        if not validate_weights(request.semantic_weight, request.concept_weight):
            raise HTTPException(
                status_code=400,
                detail=f"Weights must sum to 1.0 (got {request.semantic_weight + request.concept_weight})"
            )
        
        if request.marks_per_question <= 0:
            raise HTTPException(
                status_code=400,
                detail="marks_per_question must be greater than 0"
            )
        
        # Validate inputs
        if not request.questions.strip():
            raise HTTPException(
                status_code=400,
                detail="Questions text cannot be empty"
            )
        
        if not request.model_answers.strip():
            raise HTTPException(
                status_code=400,
                detail="Model answers text cannot be empty"
            )
        
        if not request.student_answers.strip():
            raise HTTPException(
                status_code=400,
                detail="Student answers text cannot be empty"
            )
        
        # For strict evaluation, default to 50/50 weights for balanced scoring
        # But allow override if explicitly provided
        if request.semantic_weight == 0.0 and request.concept_weight == 0.0:
            # Use default 50/50 for strict evaluation
            semantic_weight = 0.5
            concept_weight = 0.5
        else:
            semantic_weight = request.semantic_weight
            concept_weight = request.concept_weight
            # Ensure weights sum to 1.0
            if abs(semantic_weight + concept_weight - 1.0) > 0.01:
                total = semantic_weight + concept_weight
                semantic_weight = semantic_weight / total
                concept_weight = concept_weight / total
        
        # Evaluate full paper
        result = evaluate_full_paper(
            questions_text=request.questions,
            model_answers_text=request.model_answers,
            student_answers_text=request.student_answers,
            marks_per_question=request.marks_per_question,
            semantic_weight=semantic_weight,
            concept_weight=concept_weight
        )
        
        return result
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in full paper evaluation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Full paper evaluation failed: {str(e)}"
        )

