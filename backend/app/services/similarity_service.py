import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.services.embedding_service import generate_embedding
import logging

logger = logging.getLogger(__name__)


def calculate_cosine_similarity(text1: str, text2: str) -> float:
    """
    Calculate cosine similarity between two texts using embeddings
    
    Returns:
        float: Similarity score between 0 and 1
    """
    try:
        # Generate embeddings
        embedding1 = generate_embedding(text1)
        embedding2 = generate_embedding(text2)
        
        # Reshape for cosine_similarity (needs 2D array)
        embedding1 = embedding1.reshape(1, -1)
        embedding2 = embedding2.reshape(1, -1)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(embedding1, embedding2)[0][0]
        
        # Ensure value is between 0 and 1
        similarity = max(0.0, min(1.0, similarity))
        
        return float(similarity)
    except Exception as e:
        logger.error(f"Error calculating similarity: {e}")
        raise


def calculate_semantic_similarity(teacher_answer: str, student_answer: str) -> float:
    """
    Calculate semantic similarity between teacher and student answers
    
    Returns:
        float: Similarity score between 0 and 1
    """
    if not teacher_answer or not student_answer:
        return 0.0
    
    return calculate_cosine_similarity(teacher_answer, student_answer)


