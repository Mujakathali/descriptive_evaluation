from typing import List, Dict
from app.services.paper_parser import parse_full_paper
from app.services.preprocessing import preprocess_text
from app.services.similarity_service import calculate_semantic_similarity
from app.services.concept_service import calculate_concept_coverage, extract_concepts_from_text
from app.services.strict_scoring_service import calculate_strict_marks
from app.services.feedback_service import generate_feedback_llm
import logging

logger = logging.getLogger(__name__)


def evaluate_full_paper(
    questions_text: str,
    model_answers_text: str,
    student_answers_text: str,
    marks_per_question: float,
    semantic_weight: float,
    concept_weight: float,
    is_ocr_extracted: bool = False,
    ocr_quality_score: float = 100.0
) -> Dict:
    """
    Evaluate a full question paper with multiple questions
    
    Returns:
        Complete evaluation report with question-wise results and summary
    """
    try:
        # Step 1: Parse and match questions with answers
        matched_items = parse_full_paper(
            questions_text,
            model_answers_text,
            student_answers_text
        )
        
        if not matched_items:
            raise ValueError("No questions matched successfully")
        
        # Step 2: Evaluate each question
        question_wise_results = []
        total_marks_obtained = 0.0
        total_questions = len(matched_items)
        
        for item in matched_items:
            question_no = item['question_no']
            question = item['question']
            model_answer = item['model_answer']
            student_answer = item['student_answer']
            has_answer = item['has_student_answer']
            
            # Check if not answered (using strict detection)
            from app.services.strict_scoring_service import is_not_answered
            
            if not has_answer or is_not_answered(student_answer):
                result = {
                    'question_no': question_no,
                    'question': question,
                    'marks': 0.0,
                    'max_marks': marks_per_question,
                    'label': 'Not Answered',
                    'semantic_similarity': 0.0,
                    'concept_coverage': 0.0,
                    'covered_concepts': [],
                    'missing_concepts': [],
                    'required_concepts': [],
                    'feedback': {
                        'strengths': [],
                        'weaknesses': ['No answer provided.'],
                        'suggestions': ['Please provide an answer for this question.']
                    },
                    'status': 'not_answered',
                    'penalties_applied': {
                        'length_penalty': False,
                        'concept_gating': False
                    },
                    'reason_for_marks': 'No answer provided.'
                }
                question_wise_results.append(result)
                continue
            
            # Preprocess texts
            model_answer_processed = preprocess_text(model_answer)
            student_answer_processed = preprocess_text(student_answer)
            
            # Calculate semantic similarity
            semantic_similarity_score = calculate_semantic_similarity(
                model_answer_processed,
                student_answer_processed
            )
            semantic_similarity_percent = round(semantic_similarity_score * 100, 1)
            
            # Calculate concept coverage
            concept_data = calculate_concept_coverage(
                model_answer_processed,
                student_answer_processed
            )
            
            # Extract required concepts from model answer for gating
            required_concepts = extract_concepts_from_text(model_answer_processed, max_concepts=15)
            
            # Calculate marks using strict scoring
            scoring_result = calculate_strict_marks(
                semantic_similarity_score,
                concept_data["coverage"],
                semantic_weight,
                concept_weight,
                marks_per_question,
                student_answer_processed,
                concept_data["covered_concepts"],
                required_concepts,
                is_ocr_extracted=is_ocr_extracted,
                ocr_quality_score=ocr_quality_score
            )
            
            marks = scoring_result['marks']
            label = scoring_result['label']
            
            # Generate feedback
            feedback = generate_feedback_llm(
                question=question,
                teacher_answer=model_answer_processed,
                student_answer=student_answer_processed,
                missing_concepts=concept_data["missing_concepts"],
                final_marks=marks,
                max_marks=marks_per_question
            )
            
            # Add OCR-related feedback if applicable
            if is_ocr_extracted and ocr_quality_score < 70:
                if 'weaknesses' not in feedback:
                    feedback['weaknesses'] = []
                feedback['weaknesses'].append("OCR extraction limitations may affect evaluation accuracy.")
            
            # Map label to status for consistency
            label_lower = label.lower().replace(' ', '_')
            status_map = {
                'excellent': 'excellent',
                'very_good': 'very_good',
                'good': 'good',
                'average': 'average',
                'poor': 'poor',
                'not_answered': 'not_answered'
            }
            status = status_map.get(label_lower, 'average')
            
            # Update feedback if wrong definition
            if scoring_result.get('is_wrong_definition', False):
                feedback['weaknesses'].insert(0, 'Answer is conceptually incorrect.')
            
            result = {
                'question_no': question_no,
                'question': question,
                'marks': marks,
                'max_marks': marks_per_question,
                'label': label,
                'semantic_similarity': semantic_similarity_percent,
                'concept_coverage': concept_data["coverage"],
                'covered_concepts': concept_data["covered_concepts"],
                'missing_concepts': concept_data["missing_concepts"],
                'required_concepts': required_concepts,
                'feedback': feedback,
                'status': status,
                'penalties_applied': {
                    'length_penalty': scoring_result['length_penalty_applied'],
                    'concept_gating': scoring_result['concept_gating_applied']
                },
                'reason_for_marks': scoring_result.get('reason_for_marks', 'Answer evaluated based on semantic similarity and concept coverage.'),
                'is_ocr_extracted': is_ocr_extracted,
                'ocr_quality_score': ocr_quality_score if is_ocr_extracted else None
            }
            
            question_wise_results.append(result)
            total_marks_obtained += marks
        
        # Step 3: Calculate summary
        total_marks = total_questions * marks_per_question
        overall_percentage = (total_marks_obtained / total_marks) * 100 if total_marks > 0 else 0
        
        # Determine overall performance based on percentage (STRICT MAPPING)
        # This ensures labels match marks accurately
        if overall_percentage >= 90:
            overall_performance = 'Excellent'
        elif overall_percentage >= 75:
            overall_performance = 'Very Good'
        elif overall_percentage >= 55:
            overall_performance = 'Good'
        elif overall_percentage >= 35:
            overall_performance = 'Average'
        elif overall_percentage > 0:
            overall_performance = 'Poor'
        else:
            overall_performance = 'Not Answered'
        
        # Calculate statistics based on labels (accurate counts)
        answered_count = sum(1 for r in question_wise_results if r.get('label') != 'Not Answered' and r['status'] != 'not_answered')
        not_answered_count = sum(1 for r in question_wise_results if r.get('label') == 'Not Answered' or r['status'] == 'not_answered')
        excellent_count = sum(1 for r in question_wise_results if r.get('label') == 'Excellent')
        very_good_count = sum(1 for r in question_wise_results if r.get('label') == 'Very Good')
        good_count = sum(1 for r in question_wise_results if r.get('label') == 'Good')
        average_count = sum(1 for r in question_wise_results if r.get('label') == 'Average')
        poor_count = sum(1 for r in question_wise_results if r.get('label') == 'Poor' and r.get('label') != 'Not Answered')
        
        summary = {
            'total_questions': total_questions,
            'total_marks': round(total_marks, 1),
            'marks_obtained': round(total_marks_obtained, 1),
            'overall_percentage': round(overall_percentage, 1),
            'overall_performance': overall_performance,
            'answered_questions': answered_count,
            'not_answered_questions': not_answered_count,
            'statistics': {
                'excellent': excellent_count,
                'very_good': very_good_count,
                'good': good_count,
                'average': average_count,
                'poor': poor_count,
                'not_answered': not_answered_count
            }
        }
        
        return {
            'summary': summary,
            'question_wise_results': question_wise_results
        }
        
    except Exception as e:
        logger.error(f"Error evaluating full paper: {e}", exc_info=True)
        raise

