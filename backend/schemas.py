from pydantic import BaseModel
from typing import List, Optional, Any

class RewrittenBullet(BaseModel):
    original: str
    rewritten: str

class AnalysisResponse(BaseModel):
    match_score: float
    # Add matched skills (Optional so old history doesn't crash)
    matched_skills: Optional[List[str]] = [] 
    missing_skills: List[Any] 
    ats_feedback: List[str]
    rewritten_bullets: List[RewrittenBullet]

class APIResponse(BaseModel):
    status: str
    data: AnalysisResponse
    history_id: int
    extracted_text: Optional[str] = None