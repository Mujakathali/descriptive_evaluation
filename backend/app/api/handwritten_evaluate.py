from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from app.services.ocr_service import extract_text_from_file, assess_ocr_quality
from app.services.full_paper_evaluator import evaluate_full_paper
from app.services.scoring_service import validate_weights
from app.services.paper_parser import parse_full_paper
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["handwritten-evaluation"])


@router.post("/evaluate/full-paper/handwritten")
async def evaluate_handwritten_full_paper(
    questions: Optional[str] = Form(None, description="Question paper text (numbered: 1. Question 2. Question...)"),
    model_answers: Optional[str] = Form(None, description="Model answer key text (numbered: 1. Answer 2. Answer...)"),
    student_answers: Optional[str] = Form(None, description="Student answer sheet text (numbered: 1. Answer 2. Answer...)"),
    question_file: Optional[UploadFile] = File(None, description="Question paper file (PDF, JPG, PNG, TXT)"),
    model_answer_file: Optional[UploadFile] = File(None, description="Model answer key file (PDF, JPG, PNG, TXT)"),
    student_answer_sheet: Optional[UploadFile] = File(None, description="Student answer sheet (PDF, JPG, PNG) - handwritten or typed"),
    marks_per_question: float = Form(..., gt=0, description="Marks per question"),
    semantic_weight: float = Form(0.5, ge=0, le=1, description="Weight for semantic similarity"),
    concept_weight: float = Form(0.5, ge=0, le=1, description="Weight for concept coverage")
):
    """
    Evaluate a handwritten answer sheet using OCR
    
    Steps:
    1. Extract text from handwritten sheet using OCR
    2. Parse numbered answers
    3. Match answers to questions by number
    4. Evaluate each answer independently
    5. Generate comprehensive report with OCR warnings
    
    Returns:
    - Summary with total marks, overall performance
    - Question-wise results with marks, feedback
    - OCR quality warnings (if applicable)
    """
    try:
        # Step 1: Validate weights
        if not validate_weights(semantic_weight, concept_weight):
            raise HTTPException(
                status_code=400,
                detail=f"Weights must sum to 1.0 (got {semantic_weight + concept_weight})"
            )
        
        # Step 2: Extract text from uploaded files (if provided)
        questions_text = questions or ""
        model_answers_text = model_answers or ""
        student_answers_text = student_answers or ""
        is_ocr_extracted = False
        ocr_confidence = None
        
        # Extract questions from file if provided
        if question_file:
            try:
                file_bytes = await question_file.read()
                content_type = question_file.content_type or "application/octet-stream"
                extracted, conf = extract_text_from_file(file_bytes, content_type, get_confidence=True)
                if extracted.strip():
                    questions_text = extracted
            except Exception as e:
                logger.warning(f"Error extracting questions from file: {e}")
                raise HTTPException(status_code=400, detail=f"Failed to extract questions from file: {str(e)}")
        
        # Extract model answers from file if provided
        if model_answer_file:
            try:
                file_bytes = await model_answer_file.read()
                content_type = model_answer_file.content_type or "application/octet-stream"
                extracted, conf = extract_text_from_file(file_bytes, content_type, get_confidence=True)
                if extracted.strip():
                    model_answers_text = extracted
            except Exception as e:
                logger.warning(f"Error extracting model answers from file: {e}")
                raise HTTPException(status_code=400, detail=f"Failed to extract model answers from file: {str(e)}")
        
        # Step 3: Validate inputs
        if not questions_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Questions are required (either text input or file upload)"
            )
        
        if not model_answers_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Model answers are required (either text input or file upload)"
            )
        
        # Step 4: Extract text from student answer sheet (handwritten or typed)
        if student_answer_sheet:
            try:
                file_bytes = await student_answer_sheet.read()
                content_type = student_answer_sheet.content_type or "application/octet-stream"
                
                # Extract text with confidence scoring
                extracted_text, ocr_confidence = extract_text_from_file(
                    file_bytes,
                    content_type,
                    get_confidence=True
                )
                
                if not extracted_text or not extracted_text.strip():
                    raise HTTPException(
                        status_code=400,
                        detail="Could not extract text from uploaded file. Please ensure the file contains readable text."
                    )
                
                student_answers_text = extracted_text
                is_ocr_extracted = True
                
            except ValueError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {str(e)}. Supported formats: PDF, JPG, PNG"
                )
            except Exception as e:
                logger.error(f"OCR extraction error: {e}", exc_info=True)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to extract text from student answer sheet: {str(e)}"
                )
        elif not student_answers_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Student answers are required (either text input or file upload)"
            )
        
        # Step 5: Assess OCR quality (if OCR was used)
        ocr_assessment = None
        ocr_warning = False
        ocr_quality_score = 100.0
        
        if is_ocr_extracted:
            ocr_assessment = assess_ocr_quality(student_answers_text, ocr_confidence)
            ocr_warning = ocr_assessment['needs_warning']
            ocr_quality_score = ocr_assessment['quality_score']
        
        # Step 6: Parse and match answers by number (STRICT NUMBER-BASED MATCHING)
        try:
            matched_pairs = parse_full_paper(
                questions_text,
                model_answers_text,
                student_answers_text
            )
            
            if not matched_pairs:
                raise HTTPException(
                    status_code=400,
                    detail="Could not match answers to questions. Please ensure answers are numbered (1., 2., 3., etc.)"
                )
            
        except Exception as e:
            logger.error(f"Error parsing answers: {e}", exc_info=True)
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse answers from extracted text: {str(e)}"
            )
        
        # Step 7: Evaluate full paper with OCR context
        try:
            result = evaluate_full_paper(
                questions_text=questions_text,
                model_answers_text=model_answers_text,
                student_answers_text=student_answers_text,
                marks_per_question=marks_per_question,
                semantic_weight=semantic_weight,
                concept_weight=concept_weight,
                is_ocr_extracted=True,
                ocr_quality_score=ocr_quality_score
            )
        except Exception as e:
            logger.error(f"Error evaluating full paper: {e}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Evaluation failed: {str(e)}"
            )
        
        # Step 8: Add OCR warnings to response
        result['ocr_warning'] = ocr_warning
        result['ocr_quality_score'] = ocr_quality_score if is_ocr_extracted else None
        result['ocr_warning_message'] = None
        result['is_ocr_extracted'] = is_ocr_extracted
        
        if ocr_warning and ocr_assessment:
            warning_message = "Handwriting clarity may affect evaluation accuracy. "
            if ocr_assessment.get('warning_reasons'):
                warning_message += "Reasons: " + ", ".join(ocr_assessment['warning_reasons']) + "."
            result['ocr_warning_message'] = warning_message
        
        # Step 9: Add OCR context to question-wise results
        for q_result in result.get('question_wise_results', []):
            q_result['is_ocr_extracted'] = is_ocr_extracted
            if is_ocr_extracted:
                q_result['ocr_quality_score'] = ocr_quality_score
            
            # Add OCR-related feedback if quality is low
            if ocr_quality_score < 70 and q_result.get('feedback'):
                if 'weaknesses' not in q_result['feedback']:
                    q_result['feedback']['weaknesses'] = []
                if not any('OCR' in w for w in q_result['feedback']['weaknesses']):
                    q_result['feedback']['weaknesses'].append("OCR extraction limitations may affect evaluation accuracy.")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in handwritten evaluation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Handwritten evaluation failed: {str(e)}"
        )

