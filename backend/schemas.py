from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


# ── Nested Models ────────────────────────────────────────────────────────────

class RewrittenBullet(BaseModel):
    original: str
    rewritten: str


class MissingSkill(BaseModel):
    skill: str
    recommended_location: str


# ── Analysis Result (returned right after a scan) ────────────────────────────

class AnalysisResponse(BaseModel):
    match_score: float
    matched_skills: List[str]
    missing_skills: List[Any]   # Any = handles both str and {skill, recommended_location}
    ats_feedback: List[str]
    rewritten_bullets: List[RewrittenBullet]


# ── Full API response wrapper for POST /analyze ──────────────────────────────

class APIResponse(BaseModel):
    status: str
    data: AnalysisResponse
    history_id: int
    extracted_text: Optional[str] = None


# ── History record (returned from GET /history) ──────────────────────────────

class HistoryRecord(BaseModel):
    id: int
    filename: str
    job_description: str
    match_score: float
    matched_skills: Optional[List[str]] = []      # ← now included in history
    missing_skills: Optional[List[Any]] = []
    ats_feedback: Optional[List[str]] = []
    rewritten_bullets: Optional[List[Any]] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True                     # replaces orm_mode in Pydantic v2


# ── History list wrapper ──────────────────────────────────────────────────────

class HistoryListResponse(BaseModel):
    status: str
    data: List[HistoryRecord]
