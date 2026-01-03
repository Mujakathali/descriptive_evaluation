from sentence_transformers import SentenceTransformer
from app.config import settings
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Global model instance (loaded once at startup)
_embedding_model = None


def get_embedding_model():
    """Get or load the embedding model (singleton pattern)"""
    global _embedding_model
    if _embedding_model is None:
        try:
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading embedding model: {e}")
            raise
    return _embedding_model


def generate_embedding(text: str) -> np.ndarray:
    """
    Generate embedding for a single text
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")
    
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
    return embedding


def generate_embeddings(texts: list) -> np.ndarray:
    """
    Generate embeddings for multiple texts (batch processing)
    """
    if not texts:
        raise ValueError("Texts list cannot be empty")
    
    # Filter out empty texts
    valid_texts = [text for text in texts if text and text.strip()]
    if not valid_texts:
        raise ValueError("No valid texts to encode")
    
    model = get_embedding_model()
    embeddings = model.encode(valid_texts, convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False)
    return embeddings


