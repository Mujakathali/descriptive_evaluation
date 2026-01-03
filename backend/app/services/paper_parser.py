import re
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


def parse_questions_and_answers(text: str) -> List[Dict[str, str]]:
    """
    Parse questions/answers from text using numbering patterns
    
    Supports patterns like:
    - 1. Question text
    - 1) Question text
    - Q1. Question text
    - Question 1: Question text
    
    Returns:
        List of dicts with 'number' and 'content'
    """
    if not text or not text.strip():
        return []
    
    items = []
    lines = text.split('\n')
    current_item = None
    current_content = []
    
    # Pattern to detect start of new item
    number_pattern = re.compile(r'^(\d+)[\.\)]\s*(.+)$', re.IGNORECASE)
    q_pattern = re.compile(r'^[Qq](\d+)[\.\)]\s*(.+)$', re.IGNORECASE)
    question_pattern = re.compile(r'^[Qq]uestion\s+(\d+)[:\-\.]\s*(.+)$', re.IGNORECASE)
    
    for line in lines:
        line = line.strip()
        
        # Check if this line starts a new numbered item
        match = None
        number = None
        content_start = ''
        
        # Try different patterns
        for pattern in [number_pattern, q_pattern, question_pattern]:
            match = pattern.match(line)
            if match:
                number = int(match.group(1))
                content_start = match.group(2).strip() if len(match.groups()) > 1 else ''
                break
        
        if match:
            # Save previous item if exists
            if current_item:
                current_item['content'] = '\n'.join(current_content).strip()
                if current_item['content']:  # Only add if has content
                    items.append(current_item)
            
            # Start new item
            current_item = {
                'number': number,
                'content': content_start
            }
            current_content = [content_start] if content_start else []
        elif current_item:
            # Continue current item (multiline content)
            if line or current_content:  # Add line even if empty (preserves structure)
                current_content.append(line)
    
    # Add last item
    if current_item:
        current_item['content'] = '\n'.join(current_content).strip()
        if current_item['content']:  # Only add if has content
            items.append(current_item)
    
    return items


def match_questions_answers(
    questions: List[Dict[str, str]],
    model_answers: List[Dict[str, str]],
    student_answers: List[Dict[str, str]]
) -> List[Dict[str, any]]:
    """
    Match questions with their corresponding model and student answers
    
    Returns:
        List of matched items with question, model_answer, student_answer
    """
    matched = []
    
    # Create lookup dictionaries
    model_dict = {item['number']: item['content'] for item in model_answers}
    student_dict = {item['number']: item['content'] for item in student_answers}
    
    for question in questions:
        q_num = question['number']
        matched_item = {
            'question_no': q_num,
            'question': question['content'],
            'model_answer': model_dict.get(q_num, ''),
            'student_answer': student_dict.get(q_num, ''),
            'has_student_answer': q_num in student_dict
        }
        matched.append(matched_item)
    
    return matched


def parse_full_paper(
    questions_text: str,
    model_answers_text: str,
    student_answers_text: str
) -> List[Dict[str, any]]:
    """
    Parse full paper and match questions with answers
    
    Returns:
        List of matched question-answer pairs
    """
    try:
        questions = parse_questions_and_answers(questions_text)
        model_answers = parse_questions_and_answers(model_answers_text)
        student_answers = parse_questions_and_answers(student_answers_text)
        
        if not questions:
            raise ValueError("No questions found in the question paper")
        
        if not model_answers:
            raise ValueError("No model answers found")
        
        matched = match_questions_answers(questions, model_answers, student_answers)
        
        logger.info(f"Parsed {len(questions)} questions, {len(matched)} matched")
        
        return matched
    except Exception as e:
        logger.error(f"Error parsing full paper: {e}")
        raise

