from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extract text from image using OCR
    
    Args:
        image_bytes: Image file as bytes
    
    Returns:
        Extracted text string
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        raise


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF using OCR
    
    Args:
        pdf_bytes: PDF file as bytes
    
    Returns:
        Extracted text string
    """
    try:
        # Convert PDF to images
        images = convert_from_bytes(pdf_bytes, dpi=200)
        
        # Extract text from each page
        texts = []
        for image in images:
            text = pytesseract.image_to_string(image)
            texts.append(text.strip())
        
        return "\n\n".join(texts)
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise


def extract_text_from_file(file_bytes: bytes, content_type: str) -> str:
    """
    Extract text from file based on content type
    
    Args:
        file_bytes: File content as bytes
        content_type: MIME type of the file
    
    Returns:
        Extracted text string
    """
    if content_type.startswith('image/'):
        return extract_text_from_image(file_bytes)
    elif content_type == 'application/pdf':
        return extract_text_from_pdf(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {content_type}")


