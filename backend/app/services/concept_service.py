from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from app.config import settings
from app.services.preprocessing import extract_key_phrases, clean_text
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

# Global model instances
_concept_tokenizer = None
_concept_model = None


def get_concept_model():
    """Get or load the concept extraction model (singleton pattern)"""
    global _concept_tokenizer, _concept_model
    if _concept_tokenizer is None or _concept_model is None:
        try:
            logger.info(f"Loading concept model: {settings.CONCEPT_MODEL}")
            _concept_tokenizer = AutoTokenizer.from_pretrained(settings.CONCEPT_MODEL)
            _concept_model = AutoModel.from_pretrained(settings.CONCEPT_MODEL)
            _concept_model.eval()  # Set to evaluation mode
            logger.info("Concept model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading concept model: {e}")
            raise
    return _concept_tokenizer, _concept_model


def extract_concepts_from_text(text: str, max_concepts: int = 10) -> list:
    """
    Extract key concepts from text using BERT embeddings and key phrase extraction
    
    Args:
        text: Input text
        max_concepts: Maximum number of concepts to extract
    
    Returns:
        List of concept strings
    """
    if not text or not text.strip():
        return []
    
    try:
        # First, extract key phrases using simple NLP
        key_phrases = extract_key_phrases(text, min_length=3)
        
        # Limit to max_concepts
        concepts = key_phrases[:max_concepts]
        
        # If we have fewer concepts, try to extract more using n-grams
        if len(concepts) < max_concepts:
            words = clean_text(text).split()
            # Extract 2-word phrases
            for i in range(len(words) - 1):
                if len(concepts) >= max_concepts:
                    break
                phrase = f"{words[i]} {words[i+1]}"
                if phrase not in concepts and len(phrase) > 5:
                    concepts.append(phrase)
        
        return concepts[:max_concepts]
    except Exception as e:
        logger.error(f"Error extracting concepts: {e}")
        # Fallback to simple word extraction
        words = clean_text(text).split()
        return [w for w in words if len(w) > 3][:max_concepts]


def get_text_embedding(text: str) -> np.ndarray:
    """
    Get BERT embedding for a text (for concept matching)
    """
    try:
        tokenizer, model = get_concept_model()
        
        # Tokenize and encode
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
        
        with torch.no_grad():
            outputs = model(**inputs)
            # Use [CLS] token embedding (first token)
            embedding = outputs.last_hidden_state[0][0].numpy()
        
        return embedding
    except Exception as e:
        logger.error(f"Error getting text embedding: {e}")
        # Return zero vector as fallback
        return np.zeros(768)


def check_concept_presence(concept: str, student_answer: str, threshold: float = 0.3) -> tuple:
    """
    Check if a concept is present in student answer
    
    Returns:
        tuple: (is_present: bool, coverage: float 0-100, status: str)
    """
    if not concept or not student_answer:
        return False, 0.0, "missing"
    
    # Simple keyword matching first
    concept_lower = concept.lower()
    student_lower = student_answer.lower()
    
    # Exact match
    if concept_lower in student_lower:
        return True, 100.0, "covered"
    
    # Check if all words in concept are present
    concept_words = concept_lower.split()
    if len(concept_words) > 1:
        words_found = sum(1 for word in concept_words if word in student_lower)
        word_coverage = (words_found / len(concept_words)) * 100
        
        if word_coverage >= 80:
            return True, word_coverage, "covered"
        elif word_coverage >= 50:
            return True, word_coverage, "partial"
    
    # Semantic similarity check using embeddings
    try:
        concept_embedding = get_text_embedding(concept).reshape(1, -1)
        student_embedding = get_text_embedding(student_answer).reshape(1, -1)
        
        similarity = cosine_similarity(concept_embedding, student_embedding)[0][0]
        
        if similarity >= 0.5:
            coverage = similarity * 100
            status = "covered" if similarity >= 0.7 else "partial"
            return True, coverage, status
    except Exception as e:
        logger.warning(f"Error in semantic concept matching: {e}")
    
    return False, 0.0, "missing"


def calculate_concept_coverage(teacher_answer: str, student_answer: str) -> dict:
    """
    Calculate concept coverage between teacher and student answers
    
    Returns:
        dict with:
            - coverage: float (0-100)
            - covered_concepts: list
            - missing_concepts: list
            - concept_analysis: list of dicts with concept, status, coverage
    """
    if not teacher_answer or not student_answer:
        return {
            "coverage": 0.0,
            "covered_concepts": [],
            "missing_concepts": [],
            "concept_analysis": []
        }
    
    # Extract concepts from teacher answer
    concepts = extract_concepts_from_text(teacher_answer, max_concepts=15)
    
    if not concepts:
        return {
            "coverage": 0.0,
            "covered_concepts": [],
            "missing_concepts": [],
            "concept_analysis": []
        }
    
    covered_concepts = []
    missing_concepts = []
    concept_analysis = []
    total_coverage = 0.0
    
    for concept in concepts:
        is_present, coverage, status = check_concept_presence(concept, student_answer)
        
        concept_analysis.append({
            "concept": concept,
            "status": status,
            "coverage": round(coverage, 1)
        })
        
        if is_present:
            covered_concepts.append(concept)
            total_coverage += coverage
        else:
            missing_concepts.append(concept)
    
    # Calculate average coverage percentage
    avg_coverage = (total_coverage / len(concepts)) if concepts else 0.0
    
    return {
        "coverage": round(avg_coverage, 1),
        "covered_concepts": covered_concepts,
        "missing_concepts": missing_concepts,
        "concept_analysis": concept_analysis
    }


