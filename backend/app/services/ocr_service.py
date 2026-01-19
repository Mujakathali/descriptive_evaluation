from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
import io
import logging
from typing import Optional, Dict, Tuple
import re

logger = logging.getLogger(__name__)


def _extract_native_text_from_pdf(pdf_bytes: bytes) -> Optional[str]:
    try:
        import fitz
    except Exception:
        return None

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception:
        return None

    parts = []
    try:
        for page in doc:
            try:
                parts.append(page.get_text("text"))
            except Exception:
                continue
    finally:
        try:
            doc.close()
        except Exception:
            pass

    text = "\n".join([p for p in parts if p]).strip()
    return text if text else None


def _render_pdf_to_images_pymupdf(pdf_bytes: bytes, dpi: int = 300):
    import fitz

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    try:
        for page in doc:
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img_bytes = pix.tobytes("png")
            images.append(Image.open(io.BytesIO(img_bytes)))
    finally:
        try:
            doc.close()
        except Exception:
            pass

    return images


def extract_text_from_image(image_bytes: bytes, get_confidence: bool = False) -> Tuple[str, Optional[float]]:
    """
    Extract text from image using OCR with confidence scoring
    
    Args:
        image_bytes: Image file as bytes
        get_confidence: Whether to return confidence score
    
    Returns:
        Tuple of (extracted text, confidence score) or (text, None)
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        
        confidence = None
        if get_confidence:
            # Get detailed OCR data with confidence
            try:
                data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
                confidence = sum(confidences) / len(confidences) if confidences else 0.0
            except Exception as e:
                logger.warning(f"Could not extract OCR confidence: {e}")
                confidence = None
        
        return text.strip(), confidence
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        raise


def extract_text_from_pdf(pdf_bytes: bytes, get_confidence: bool = False) -> Tuple[str, Optional[float]]:
    """
    Extract text from PDF using OCR with confidence scoring
    
    Args:
        pdf_bytes: PDF file as bytes
        get_confidence: Whether to return confidence score
    
    Returns:
        Tuple of (extracted text, average confidence score) or (text, None)
    """
    try:
        native_text = _extract_native_text_from_pdf(pdf_bytes)
        if native_text:
            return native_text.strip(), None

        # Convert PDF to images (higher DPI for better OCR)
        try:
            images = convert_from_bytes(pdf_bytes, dpi=300)
        except Exception as e:
            logger.warning(f"pdf2image failed for PDF conversion: {e}. Trying PyMuPDF fallback.")
            try:
                images = _render_pdf_to_images_pymupdf(pdf_bytes, dpi=300)
            except Exception as e2:
                raise RuntimeError(
                    "Failed to render PDF for OCR. Install Poppler (for pdf2image) or PyMuPDF (pymupdf) as a fallback."
                ) from e2
        
        # Extract text from each page
        texts = []
        confidences = []
        
        for image in images:
            text = pytesseract.image_to_string(image)
            texts.append(text.strip())
            
            if get_confidence:
                try:
                    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                    page_confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
                    if page_confidences:
                        confidences.append(sum(page_confidences) / len(page_confidences))
                except Exception as e:
                    logger.warning(f"Could not extract OCR confidence for page: {e}")
        
        combined_text = "\n\n".join(texts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else None
        
        return combined_text, avg_confidence
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise


def extract_text_from_file(file_bytes: bytes, content_type: str, get_confidence: bool = False) -> Tuple[str, Optional[float]]:
    """
    Extract text from file based on content type with confidence scoring
    
    Args:
        file_bytes: File content as bytes
        content_type: MIME type of the file
        get_confidence: Whether to return confidence score
    
    Returns:
        Tuple of (extracted text, confidence score) or (text, None)
    """
    if content_type.startswith('image/'):
        return extract_text_from_image(file_bytes, get_confidence)
    elif content_type == 'application/pdf':
        return extract_text_from_pdf(file_bytes, get_confidence)
    else:
        raise ValueError(f"Unsupported file type: {content_type}")


def assess_ocr_quality(text: str, confidence: Optional[float] = None) -> Dict:
    """
    Assess OCR extraction quality and determine if warnings are needed
    
    Args:
        text: Extracted text
        confidence: OCR confidence score (0-100)
    
    Returns:
        Dictionary with quality assessment
    """
    # Count meaningful words (exclude very short words)
    words = re.findall(r'\b\w+\b', text.lower())
    meaningful_words = [w for w in words if len(w) > 2]
    word_count = len(meaningful_words)
    
    # Check text length
    text_length = len(text.strip())
    
    # Determine if warning is needed
    needs_warning = False
    warning_reasons = []
    
    # Low confidence warning
    if confidence is not None and confidence < 70:
        needs_warning = True
        warning_reasons.append("Low OCR confidence")
    
    # Very short text warning
    if text_length < 50:
        needs_warning = True
        warning_reasons.append("Extracted text is very short")
    
    # Very few words warning
    if word_count < 10:
        needs_warning = True
        warning_reasons.append("Very few words extracted")
    
    # Check for OCR artifacts (excessive special characters)
    special_char_ratio = len(re.findall(r'[^\w\s]', text)) / max(len(text), 1)
    if special_char_ratio > 0.3:
        needs_warning = True
        warning_reasons.append("High proportion of special characters (possible OCR errors)")
    
    return {
        'needs_warning': needs_warning,
        'warning_reasons': warning_reasons,
        'confidence': confidence,
        'word_count': word_count,
        'text_length': text_length,
        'quality_score': confidence if confidence else 50.0  # Default to medium if unknown
    }


