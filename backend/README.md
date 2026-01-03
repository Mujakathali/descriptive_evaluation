# Automated Descriptive Answer Evaluation System - Backend

A Python-based REST API backend that evaluates descriptive answers using NLP and Large Language Models. The system compares student answers with teacher-provided model answers, assigns fair marks, and generates human-like feedback.

## 🏗️ Architecture

- **Framework**: FastAPI
- **Language**: Python 3.10+
- **ML Stack**: 
  - Hugging Face Transformers
  - Sentence-Transformers
  - OpenAI GPT (for feedback generation)
- **Storage**: MongoDB Atlas
- **Async API Design**: Full async/await support

## 📂 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management
│   ├── api/
│   │   └── evaluate.py        # API endpoints
│   ├── services/
│   │   ├── preprocessing.py    # Text preprocessing
│   │   ├── embedding_service.py  # Sentence embeddings
│   │   ├── similarity_service.py # Semantic similarity
│   │   ├── concept_service.py    # Concept extraction & coverage
│   │   ├── scoring_service.py   # Mark calculation
│   │   ├── feedback_service.py  # LLM-based feedback
│   │   └── ocr_service.py       # OCR for file processing
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   └── database/
│       └── db.py               # MongoDB connection
├── requirements.txt
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites

- Python 3.10 or higher
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key (for feedback generation)
- Tesseract OCR (for image/PDF processing)

### Installation

1. **Clone the repository and navigate to backend directory**

```bash
cd backend
```

2. **Create a virtual environment**

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On Linux/Mac
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Install Tesseract OCR**

- **Windows**: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki) and add to PATH
- **Linux**: `sudo apt-get install tesseract-ocr`
- **Mac**: `brew install tesseract`

5. **Configure environment variables**

Create a `.env` file in the `backend` directory:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB Atlas Configuration
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority

# Application Configuration
APP_NAME=Descriptive Evaluation System
APP_VERSION=1.0.0
DEBUG=True

# Model Configuration
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CONCEPT_MODEL=bert-base-uncased

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

6. **Run the application**

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use Python directly
python -m app.main
```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 API Endpoints

### 1. Health Check
```
GET /health
```

Returns backend status and version.

### 2. Evaluate Answer (Core API)
```
POST /api/evaluate
```

**Request (FormData)**:
- `question` (string): The question to be evaluated
- `modelAnswer` (string): Teacher's model answer
- `studentAnswer` (string): Student's answer
- `maxMarks` (float): Maximum marks for the question
- `semanticWeight` (float): Weight for semantic similarity (0-1)
- `conceptWeight` (float): Weight for concept coverage (0-1)
- `teacherFile` (file, optional): PDF/DOCX/TXT file with question & answer
- `studentFile` (file, optional): PDF/Image file with student answer

**Response**:
```json
{
  "finalScore": 7.5,
  "maxMarks": 10.0,
  "semanticSimilarity": 82.0,
  "conceptCoverage": 65.0,
  "coveredConcepts": ["sunlight", "food preparation"],
  "missingConcepts": ["chlorophyll"],
  "feedback": {
    "strengths": ["The answer captures the core idea..."],
    "weaknesses": ["Key biological terms were missing..."],
    "suggestions": ["Include the role of chlorophyll..."]
  },
  "conceptAnalysis": [
    {
      "concept": "sunlight",
      "status": "covered",
      "coverage": 100.0
    }
  ]
}
```

### 3. Process Teacher File
```
POST /api/process-teacher-file
```

**Request (FormData)**:
- `file` (file): PDF, DOCX, or TXT file containing questions and answers

**Response**:
```json
{
  "questions": [
    {
      "question": "Explain photosynthesis.",
      "answer": "Photosynthesis is the process..."
    }
  ]
}
```

## 🧩 Processing Pipeline

1. **Input Validation**: Validates required fields and weight constraints
2. **Text Preprocessing**: Lowercasing, whitespace cleanup, sentence splitting
3. **Semantic Embedding**: Generates embeddings using `all-MiniLM-L6-v2`
4. **Semantic Similarity**: Calculates cosine similarity between embeddings
5. **Concept Extraction**: Extracts key concepts from teacher answer using BERT
6. **Concept Coverage**: Checks concept presence in student answer
7. **Mark Allocation**: Calculates final marks using weighted formula
8. **Feedback Generation**: Uses OpenAI GPT to generate human-like feedback
9. **Storage**: Saves evaluation results to MongoDB

## 🧠 Model Management

- Models are loaded once at application startup
- Cached in memory for performance
- No training required (pre-trained models only)
- Models used:
  - **Embedding**: `sentence-transformers/all-MiniLM-L6-v2`
  - **Concept Extraction**: `bert-base-uncased`

## 🔐 Configuration

All configuration is managed through environment variables in `.env` file. See `.env.example` for reference.

## 🐛 Troubleshooting

### Model Loading Issues
- Ensure you have sufficient RAM (models require ~2GB)
- First run will download models (may take time)

### MongoDB Connection Issues
- Verify `DATABASE_URL` is correct
- Check network connectivity to MongoDB Atlas
- Application will continue without database (with warnings)

### OCR Issues
- Ensure Tesseract is installed and in PATH
- For PDF processing, ensure `poppler` is installed (Linux/Mac)

### OpenAI API Issues
- Verify API key is correct
- Check API quota/limits
- System will use fallback feedback if API fails

## 📝 Notes

- The system works without OpenAI API (uses fallback feedback)
- MongoDB is optional (evaluations won't be saved if not configured)
- First API call may be slower due to model initialization
- File uploads are processed synchronously (consider async for production)

## 🚀 Production Deployment

For production deployment:

1. Set `DEBUG=False` in `.env`
2. Use a production ASGI server (e.g., Gunicorn with Uvicorn workers)
3. Configure proper CORS origins
4. Set up proper logging
5. Use environment-specific MongoDB connection strings
6. Consider caching for frequently used models
7. Implement rate limiting
8. Add authentication/authorization

## 📄 License

[Your License Here]


