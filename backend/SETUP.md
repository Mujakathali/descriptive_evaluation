# Quick Setup Guide

## Prerequisites Checklist

- [ ] Python 3.10+ installed
- [ ] MongoDB Atlas account (or local MongoDB)
- [ ] OpenAI API key (optional, for enhanced feedback)
- [ ] Tesseract OCR installed

## Step-by-Step Setup

### 1. Install Python Dependencies

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### 2. Install Tesseract OCR

**Windows:**
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Install and add to PATH

**Linux:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**Mac:**
```bash
brew install tesseract
```

### 3. Configure Environment

Create a `.env` file in the `backend` directory:

```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority
DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Note:** 
- MongoDB is optional (app will work without it, but won't save evaluations)
- OpenAI API is optional (will use fallback feedback if not provided)

### 4. Run the Application

```bash
# Option 1: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Option 2: Using the run script
python run.py

# Option 3: Using Python module
python -m app.main
```

### 5. Verify Installation

Visit http://localhost:8000/docs to see the API documentation.

Test the health endpoint:
```bash
curl http://localhost:8000/health
```

## Common Issues

### Models Not Loading
- First run downloads models (~2GB) - be patient
- Ensure sufficient RAM (models need ~2GB)
- Check internet connection for model downloads

### MongoDB Connection Failed
- Verify DATABASE_URL format
- Check network connectivity
- App will continue without database (with warnings)

### OCR Not Working
- Verify Tesseract is installed: `tesseract --version`
- Check Tesseract is in PATH
- For PDFs, ensure poppler is installed (Linux/Mac)

### OpenAI API Errors
- Verify API key is correct
- Check API quota/limits
- System uses fallback feedback if API fails

## Testing the API

### Test Evaluation Endpoint

```bash
curl -X POST "http://localhost:8000/evaluate" \
  -F "question=Explain photosynthesis." \
  -F "modelAnswer=Photosynthesis is the process by which plants use sunlight to make food." \
  -F "studentAnswer=Plants prepare food using sunlight." \
  -F "maxMarks=10" \
  -F "semanticWeight=0.7" \
  -F "conceptWeight=0.3"
```

## Next Steps

1. Connect your React frontend (update API URL in frontend config)
2. Test file uploads (PDF, images)
3. Configure production settings for deployment


