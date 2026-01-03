from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.api import evaluate
from app.database.db import connect_to_mongo, close_mongo_connection
from app.models.schemas import HealthResponse
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting up application...")
    
    # Connect to MongoDB
    await connect_to_mongo()
    
    # Pre-load ML models (this will cache them)
    try:
        from app.services.embedding_service import get_embedding_model
        from app.services.concept_service import get_concept_model
        
        logger.info("Loading ML models...")
        get_embedding_model()
        get_concept_model()
        logger.info("ML models loaded successfully")
    except Exception as e:
        logger.error(f"Error loading ML models: {e}")
        logger.warning("Application will continue, but some features may not work")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await close_mongo_connection()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automated Descriptive Answer Evaluation System using NLP and LLMs",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(evaluate.router)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow()
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Descriptive Evaluation System API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )

