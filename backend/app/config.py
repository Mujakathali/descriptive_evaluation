from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Descriptive Evaluation System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    
    # Database
    DATABASE_URL: str = ""
    
    # Models
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    CONCEPT_MODEL: str = "bert-base-uncased"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

