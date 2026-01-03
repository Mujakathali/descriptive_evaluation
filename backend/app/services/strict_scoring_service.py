from typing import Dict, Tuple
import logging
import re

logger = logging.getLogger(__name__)


def count_words(text: str) -> int:
    """Count words in text"""
    if not text or not text.strip():
        return 0
    words = re.findall(r'\b\w+\b', text)
    return len(words)


def calculate_length_penalty(student_answer: str, max_marks: float) -> float:
    """
    Apply length-based penalty to marks
    
    Rules:
    - < 6 words → cap max marks at 2
    - < 10 words → apply 40% penalty
    - < 15 words → apply 20% penalty
    """
    word_count = count_words(student_answer)
    
    if word_count < 6:
        # Cap at 2 marks maximum
        return min(max_marks, 2.0)
    elif word_count < 10:
        # Apply 40% penalty
        return max_marks * 0.6
    elif word_count < 15:
        # Apply 20% penalty
        return max_marks * 0.8
    else:
        # No penalty
        return max_marks


def apply_concept_gating(
    concept_coverage: float,
    covered_concepts: list,
    required_concepts: list,
    max_marks: float
) -> float:
    """
    Apply concept-based gating to marks
    
    Rules:
    - If < 50% required concepts present → max marks capped at 5
    - If zero core concepts present → max marks capped at 2
    """
    if not required_concepts:
        # If no required concepts defined, don't apply gating
        return max_marks
    
    # Calculate percentage of required concepts covered
    # Check which required concepts are actually covered
    covered_set = set(c.lower().strip() for c in covered_concepts)
    required_set = set(c.lower().strip() for c in required_concepts)
    
    # Count how many required concepts are covered (fuzzy matching)
    covered_required = 0
    for req_concept in required_set:
        # Check if any covered concept matches (exact or substring)
        if any(req_concept in covered or covered in req_concept for covered in covered_set):
            covered_required += 1
    
    required_count = len(required_concepts)
    concept_percentage = (covered_required / required_count) * 100 if required_count > 0 else 0
    
    if concept_percentage == 0:
        # Zero core concepts → cap at 2
        return min(max_marks, 2.0)
    elif concept_percentage < 50:
        # Less than 50% concepts → cap at 5
        return min(max_marks, 5.0)
    else:
        # More than 50% concepts → no gating
        return max_marks


def map_to_score_band(
    combined_score: float,
    max_marks: float
) -> Tuple[float, str]:
    """
    Map combined similarity + concept score to grading bands
    
    Score Bands (STRICT):
    - < 0.35 → POOR (0-3 marks)
    - 0.35-0.55 → AVERAGE (4-5 marks)
    - 0.55-0.75 → GOOD (6-7 marks)
    - 0.75-0.90 → VERY GOOD (8-9 marks)
    - > 0.90 → EXCELLENT (10 marks or max_marks)
    
    Marks are chosen within the band, not continuous.
    
    Returns:
        (marks, label)
    """
    # Scale bands to max_marks if different from 10
    scale_factor = max_marks / 10.0
    
    if combined_score < 0.35:
        # POOR: 0-3 marks (scaled)
        # Map 0-0.35 to 0-3 range
        marks = (combined_score / 0.35) * (3.0 * scale_factor) if combined_score > 0 else 0.0
        label = "Poor"
    elif combined_score < 0.55:
        # AVERAGE: 4-5 marks (scaled)
        # Map 0.35-0.55 to 4-5 range
        normalized = (combined_score - 0.35) / (0.55 - 0.35)
        marks = (4.0 * scale_factor) + (normalized * (1.0 * scale_factor))
        label = "Average"
    elif combined_score < 0.75:
        # GOOD: 6-7 marks (scaled)
        # Map 0.55-0.75 to 6-7 range
        normalized = (combined_score - 0.55) / (0.75 - 0.55)
        marks = (6.0 * scale_factor) + (normalized * (1.0 * scale_factor))
        label = "Good"
    elif combined_score < 0.90:
        # VERY GOOD: 8-9 marks (scaled)
        # Map 0.75-0.90 to 8-9 range
        normalized = (combined_score - 0.75) / (0.90 - 0.75)
        marks = (8.0 * scale_factor) + (normalized * (1.0 * scale_factor))
        label = "Very Good"
    else:
        # EXCELLENT: 10 marks or max_marks
        marks = max_marks
        label = "Excellent"
    
    # Ensure marks don't exceed max_marks
    marks = min(marks, max_marks)
    
    # Round to 1 decimal place
    marks = round(marks, 1)
    
    return marks, label


def calculate_strict_marks(
    semantic_similarity: float,
    concept_coverage: float,
    semantic_weight: float,
    concept_weight: float,
    max_marks: float,
    student_answer: str,
    covered_concepts: list,
    required_concepts: list = None
) -> Dict:
    """
    Calculate marks using strict academic standards
    
    Steps:
    1. Combine similarity and concept scores with weights
    2. Map to score bands (not linear)
    3. Apply length penalty
    4. Apply concept gating
    5. Determine final label
    
    Returns:
        dict with marks, label, penalties_applied
    """
    # Step 1: Combine scores (50/50 weight by default for strictness)
    # Use provided weights but ensure they sum to 1.0
    weight_sum = semantic_weight + concept_weight
    if abs(weight_sum - 1.0) > 0.01:
        semantic_weight = semantic_weight / weight_sum
        concept_weight = concept_weight / weight_sum
    
    # Convert concept coverage from 0-100 to 0-1
    concept_coverage_normalized = concept_coverage / 100.0
    
    # Combined score
    combined_score = (semantic_similarity * semantic_weight) + (concept_coverage_normalized * concept_weight)
    
    # Step 2: Map to score bands
    marks, label = map_to_score_band(combined_score, max_marks)
    
    # Step 3: Apply length penalty
    length_penalty_max = calculate_length_penalty(student_answer, max_marks)
    if marks > length_penalty_max:
        marks = length_penalty_max
        if label in ["Excellent", "Very Good"]:
            label = "Good"  # Downgrade label if length penalty applied
    
    # Step 4: Apply concept gating
    if required_concepts is None or len(required_concepts) == 0:
        # If no required concepts provided, use covered + missing as proxy
        # This is a fallback - ideally caller should provide required_concepts
        required_concepts = list(set(covered_concepts))  # Will be updated by caller
    
    concept_gated_max = apply_concept_gating(
        concept_coverage,
        covered_concepts,
        required_concepts,
        max_marks
    )
    
    if marks > concept_gated_max:
        marks = concept_gated_max
        # Downgrade label if concept gating applied
        if concept_gated_max <= 2.0:
            label = "Poor"
        elif concept_gated_max <= 5.0:
            if label in ["Excellent", "Very Good", "Good"]:
                label = "Average"
    
    # Step 5: Ensure marks are non-negative and don't exceed max
    marks = max(0.0, min(marks, max_marks))
    marks = round(marks, 1)
    
    # Final label adjustment based on final marks (scaled to max_marks)
    # Scale thresholds if max_marks != 10
    scale_factor = max_marks / 10.0
    poor_threshold = 3.0 * scale_factor
    average_threshold = 5.0 * scale_factor
    good_threshold = 7.0 * scale_factor
    very_good_threshold = 9.0 * scale_factor
    
    if marks <= poor_threshold:
        label = "Poor"
    elif marks <= average_threshold:
        label = "Average"
    elif marks <= good_threshold:
        label = "Good"
    elif marks <= very_good_threshold:
        label = "Very Good"
    else:
        label = "Excellent"
    
    return {
        'marks': marks,
        'label': label,
        'combined_score': round(combined_score, 3),
        'length_penalty_applied': length_penalty_max < max_marks,
        'concept_gating_applied': concept_gated_max < max_marks
    }

