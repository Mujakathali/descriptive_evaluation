from openai import OpenAI
from app.config import settings
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

# Initialize OpenAI client
_openai_client = None


def get_openai_client():
    """Get or initialize OpenAI client"""
    global _openai_client
    if _openai_client is None and settings.OPENAI_API_KEY:
        try:
            _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized")
        except Exception as e:
            logger.error(f"Error initializing OpenAI client: {e}")
    return _openai_client


def generate_feedback_llm(
    question: str,
    teacher_answer: str,
    student_answer: str,
    missing_concepts: List[str],
    final_marks: float,
    max_marks: float
) -> Dict[str, List[str]]:
    """
    Generate feedback using OpenAI GPT model
    
    Returns:
        dict with keys: strengths, weaknesses, suggestions
    """
    client = get_openai_client()
    
    if not client:
        logger.warning("OpenAI API key not configured. Using fallback feedback.")
        return generate_fallback_feedback(missing_concepts, final_marks, max_marks)
    
    try:
        prompt = f"""You are an expert educational evaluator. Analyze the following student answer and provide constructive feedback.

Question: {question}

Model Answer (Teacher's Expected Answer):
{teacher_answer}

Student Answer:
{student_answer}

Marks Awarded: {final_marks}/{max_marks}

Missing Key Concepts: {', '.join(missing_concepts) if missing_concepts else 'None'}

Please provide feedback in the following format:
1. Strengths: List 2-3 specific positive aspects of the student's answer
2. Weaknesses: List 2-3 areas where the answer could be improved
3. Suggestions: Provide 2-3 actionable suggestions for improvement

Format your response as:
STRENGTHS:
- [strength 1]
- [strength 2]

WEAKNESSES:
- [weakness 1]
- [weakness 2]

SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert educational evaluator providing constructive feedback to students."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        feedback_text = response.choices[0].message.content
        
        # Parse the response
        return parse_feedback_response(feedback_text)
        
    except Exception as e:
        logger.error(f"Error generating LLM feedback: {e}")
        return generate_fallback_feedback(missing_concepts, final_marks, max_marks)


def parse_feedback_response(feedback_text: str) -> Dict[str, List[str]]:
    """Parse LLM feedback response into structured format"""
    strengths = []
    weaknesses = []
    suggestions = []
    
    current_section = None
    lines = feedback_text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect section headers
        if 'STRENGTHS' in line.upper() or 'STRENGTH' in line.upper():
            current_section = 'strengths'
            continue
        elif 'WEAKNESSES' in line.upper() or 'WEAKNESS' in line.upper():
            current_section = 'weaknesses'
            continue
        elif 'SUGGESTIONS' in line.upper() or 'SUGGESTION' in line.upper():
            current_section = 'suggestions'
            continue
        
        # Parse bullet points
        if line.startswith('-') or line.startswith('•') or line.startswith('*'):
            content = line[1:].strip()
            if current_section == 'strengths' and content:
                strengths.append(content)
            elif current_section == 'weaknesses' and content:
                weaknesses.append(content)
            elif current_section == 'suggestions' and content:
                suggestions.append(content)
    
    # Ensure we have at least some feedback
    if not strengths:
        strengths = ["The answer demonstrates understanding of the topic."]
    if not weaknesses:
        weaknesses = ["Some key concepts could be explained in more detail."]
    if not suggestions:
        suggestions = ["Review the model answer to identify missing concepts."]
    
    return {
        "strengths": strengths[:3],  # Limit to 3 items
        "weaknesses": weaknesses[:3],
        "suggestions": suggestions[:3]
    }


def generate_fallback_feedback(
    missing_concepts: List[str],
    final_marks: float,
    max_marks: float
) -> Dict[str, List[str]]:
    """
    Generate basic feedback when LLM is not available
    """
    percentage = (final_marks / max_marks) * 100
    
    strengths = []
    weaknesses = []
    suggestions = []
    
    if percentage >= 70:
        strengths.append("The answer demonstrates good understanding of the topic.")
        strengths.append("Key concepts are generally well explained.")
    elif percentage >= 50:
        strengths.append("The answer shows some understanding of the topic.")
        weaknesses.append("Some important concepts are missing or unclear.")
    else:
        weaknesses.append("The answer lacks depth and key concepts.")
        weaknesses.append("Important details are missing.")
    
    if missing_concepts:
        weaknesses.append(f"Missing key concepts: {', '.join(missing_concepts[:3])}")
        suggestions.append(f"Focus on including: {', '.join(missing_concepts[:2])}")
    
    suggestions.append("Compare your answer with the model answer to identify gaps.")
    suggestions.append("Provide more detailed explanations for better scores.")
    
    # Ensure we always have feedback
    if not strengths:
        strengths = ["The answer addresses the question."]
    if not weaknesses:
        weaknesses = ["Consider adding more detail to improve your score."]
    
    return {
        "strengths": strengths[:3],
        "weaknesses": weaknesses[:3],
        "suggestions": suggestions[:3]
    }


