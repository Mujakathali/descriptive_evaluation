from typing import Dict
import logging

logger = logging.getLogger(__name__)


def calculate_final_marks(
    semantic_similarity: float,
    concept_coverage: float,
    semantic_weight: float,
    concept_weight: float,
    max_marks: float
) -> float:
    """
    Calculate final marks based on semantic similarity and concept coverage
    
    Formula:
        Final Marks = (Semantic Similarity × Semantic Weight + 
                      Concept Coverage × Concept Weight) × Max Marks
    
    Args:
        semantic_similarity: Score between 0-1
        concept_coverage: Score between 0-100 (converted to 0-1)
        semantic_weight: Weight for semantic similarity (0-1)
        concept_weight: Weight for concept coverage (0-1)
        max_marks: Maximum marks for the question
    
    Returns:
        Final marks rounded to 1 decimal place
    """
    # Validate weights sum to 1.0 (with small tolerance)
    weight_sum = semantic_weight + concept_weight
    if abs(weight_sum - 1.0) > 0.01:
        logger.warning(f"Weights don't sum to 1.0 (sum={weight_sum}). Normalizing.")
        # Normalize weights
        total = semantic_weight + concept_weight
        semantic_weight = semantic_weight / total
        concept_weight = concept_weight / total
    
    # Convert concept coverage from 0-100 to 0-1
    concept_coverage_normalized = concept_coverage / 100.0
    
    # Calculate weighted score
    weighted_score = (semantic_similarity * semantic_weight) + (concept_coverage_normalized * concept_weight)
    
    # Calculate final marks
    final_marks = weighted_score * max_marks
    
    # Round to 1 decimal place
    return round(final_marks, 1)


def validate_weights(semantic_weight: float, concept_weight: float) -> bool:
    """
    Validate that weights sum to approximately 1.0
    """
    weight_sum = semantic_weight + concept_weight
    return abs(weight_sum - 1.0) < 0.01


