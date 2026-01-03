import re
import nltk
from typing import List
import logging

logger = logging.getLogger(__name__)

# Download required NLTK data (only once)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)


def preprocess_text(text: str) -> str:
    """
    Preprocess text: lowercase, clean whitespace, remove extra spaces
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    return text


def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences using NLTK
    """
    if not text:
        return []
    
    try:
        sentences = nltk.sent_tokenize(text)
        # Clean each sentence
        sentences = [preprocess_text(s) for s in sentences if s.strip()]
        return sentences
    except Exception as e:
        logger.warning(f"Error splitting sentences: {e}. Using simple split.")
        # Fallback to simple period-based splitting
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        return sentences


def clean_text(text: str) -> str:
    """
    Comprehensive text cleaning
    """
    if not text:
        return ""
    
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s.,!?;:\-()]', '', text)
    
    # Normalize whitespace
    text = preprocess_text(text)
    
    return text


def extract_key_phrases(text: str, min_length: int = 3) -> List[str]:
    """
    Extract key phrases from text (simple word-based approach)
    """
    if not text:
        return []
    
    # Clean and split
    text = clean_text(text)
    words = text.split()
    
    # Filter out very short words and common stop words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can'}
    
    key_phrases = [word for word in words if len(word) >= min_length and word not in stop_words]
    
    # Remove duplicates while preserving order
    seen = set()
    unique_phrases = []
    for phrase in key_phrases:
        if phrase not in seen:
            seen.add(phrase)
            unique_phrases.append(phrase)
    
    return unique_phrases


