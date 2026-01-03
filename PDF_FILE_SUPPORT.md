# PDF and Image File Support

## Current Status

### ✅ What Works NOW (Without Setup):
- **Text input** - Fully functional
- **Text-based evaluation** - Works perfectly
- **All core features** - Semantic similarity, concept coverage, scoring, feedback

### ⚠️ What Requires Setup:
- **PDF file uploads** - Requires Tesseract OCR
- **Image file uploads** - Requires Tesseract OCR
- **Handwritten answer sheets** - Requires Tesseract OCR

## How It Works

### Without Tesseract (Current State):
1. ✅ Text input works perfectly
2. ⚠️ PDF/image uploads will fail gracefully
3. ✅ System falls back to text input if file processing fails
4. ✅ Evaluation continues normally

### With Tesseract (Full Support):
1. ✅ Text input works
2. ✅ PDF uploads work (extracts text from PDF)
3. ✅ Image uploads work (extracts text from images)
4. ✅ Handwritten sheets work (OCR converts to text)

## Code Behavior

The backend has **smart error handling**:

```python
if teacherFile:
    try:
        # Try to extract text from PDF/image
        extracted_text = extract_text_from_file(...)
        teacher_answer = extracted_text
    except Exception as e:
        # If OCR fails, use text input instead
        logger.warning(f"Error processing teacher file: {e}. Using text input.")
```

**Result**: Even if PDF processing fails, the system uses your text input and continues working!

## To Enable PDF/Image Support

### Step 1: Install Tesseract OCR

**Windows:**
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install the `.exe` file
3. Add to PATH (usually done automatically)
4. Verify: Open CMD and type `tesseract --version`

**Linux:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**Mac:**
```bash
brew install tesseract
```

### Step 2: Install Poppler (for PDF processing)

**Windows:**
- Download from: https://github.com/oschwartz10612/poppler-windows/releases
- Extract and add `bin` folder to PATH

**Linux:**
```bash
sudo apt-get install poppler-utils
```

**Mac:**
```bash
brew install poppler
```

### Step 3: Restart Backend

After installing Tesseract, restart your backend server:
```bash
python run.py
```

## Testing PDF Support

### Test 1: Check Tesseract Installation
```bash
tesseract --version
# Should show version number
```

### Test 2: Test PDF Upload
1. Go to evaluation page
2. Upload a PDF file
3. Check backend logs - should see text extraction
4. If Tesseract not installed, you'll see warning but text input still works

## Summary

| Feature | Works Now? | Requires Setup? |
|---------|-----------|-----------------|
| Text input | ✅ Yes | ❌ No |
| Text evaluation | ✅ Yes | ❌ No |
| PDF upload | ⚠️ Partial | ✅ Tesseract |
| Image upload | ⚠️ Partial | ✅ Tesseract |
| Handwritten sheets | ⚠️ Partial | ✅ Tesseract |

## Recommendation

**For now**: Use text input - it works perfectly!

**Later**: Install Tesseract if you need PDF/image processing. The system will automatically use it once installed.

The project is **fully functional** with text input. PDF support is a bonus feature that requires Tesseract installation.

