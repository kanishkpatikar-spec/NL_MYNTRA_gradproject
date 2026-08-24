from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ClassifyRequest(BaseModel):
    text: str = Field(..., description="The review or snippet text to classify")

class ClassifyResponse(BaseModel):
    tags: List[str] = Field(..., description="List of taxonomy driver IDs assigned to this snippet")
    intensity: int = Field(..., description="Intensity score from 1-5")
    paraphrase: str = Field(..., description="Actionable first-person paraphrase of the snippet")
    segments: List[str] = Field(..., description="Detected user segments")
    reasoning: Optional[str] = Field(None, description="Explanation for the classification")

class HealthResponse(BaseModel):
    status: str
    snippets_count: Optional[int] = None

class OpportunityRow(BaseModel):
    driver_id: str
    driver_label: str
    frequency: int
    avg_intensity: float
    weight: float
    opportunity_score: float
    example_paraphrases: List[str]

class CooccurrenceMatrix(BaseModel):
    matrix: Dict[str, Dict[str, int]]
