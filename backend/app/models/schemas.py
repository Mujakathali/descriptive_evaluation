from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


# Request Schemas
class EvaluationRequest(BaseModel):
    question: str = Field(..., description="The question to be evaluated")
    teacher_answer: str = Field(..., alias="modelAnswer", description="The model/teacher answer")
    student_answer: str = Field(..., alias="studentAnswer", description="The student's answer")
    max_marks: float = Field(..., alias="maxMarks", ge=0.1, description="Maximum marks for the question")
    semantic_weight: float = Field(..., alias="semanticWeight", ge=0, le=1, description="Weight for semantic similarity")
    concept_weight: float = Field(..., alias="conceptWeight", ge=0, le=1, description="Weight for concept coverage")
    
    class Config:
        populate_by_name = True


class ConceptAnalysis(BaseModel):
    concept: str
    status: str  # "covered", "partial", "missing"
    coverage: float  # 0-100


class Feedback(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]


# Response Schemas
class EvaluationResponse(BaseModel):
    finalScore: float = Field(..., description="Final marks awarded")
    maxMarks: float = Field(..., description="Maximum marks")
    label: Optional[str] = Field(None, description="Performance label (Poor/Average/Good/Very Good/Excellent)")
    semanticSimilarity: float = Field(..., description="Semantic similarity score (0-100)")
    conceptCoverage: float = Field(..., description="Concept coverage score (0-100)")
    coveredConcepts: List[str] = Field(default_factory=list)
    missingConcepts: List[str] = Field(default_factory=list)
    requiredConcepts: Optional[List[str]] = Field(default_factory=list, description="Required concepts from model answer")
    feedback: Feedback
    conceptAnalysis: List[ConceptAnalysis] = Field(default_factory=list)
    penaltiesApplied: Optional[Dict] = Field(default_factory=dict, description="Penalties applied (length, concept gating)")
    reasonForMarks: Optional[str] = Field(None, description="1-2 line explanation for marks awarded")
    
    class Config:
        populate_by_name = True


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime


class TeacherFileProcessResponse(BaseModel):
    questions: List[dict] = Field(default_factory=list, description="List of extracted question-answer pairs")


# Database Schemas
class EvaluationRecord(BaseModel):
    question: str
    teacher_answer: str
    student_answer: str
    max_marks: float
    final_marks: float
    semantic_similarity: float
    concept_coverage: float
    covered_concepts: List[str]
    missing_concepts: List[str]
    feedback: dict
    concept_analysis: List[dict]
    timestamp: datetime
    evaluation_id: Optional[str] = None

