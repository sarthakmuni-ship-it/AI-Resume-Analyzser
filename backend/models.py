from sqlalchemy import Column, Integer, String, Text, Float, JSON, DateTime
from sqlalchemy.sql import func
from database import Base

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    
    # Store the name of the file (or "Manual Entry (Edited)")
    filename = Column(String(255))
    
    # The actual text of the job description
    job_description = Column(Text)
    
    # The ATS match score (0-100)
    match_score = Column(Float)
    
    # JSON columns allow us to store Python lists and dictionaries directly 
    # without needing extra tables for skills or feedback.
    matched_skills = Column(JSON,)
    missing_skills = Column(JSON)
    ats_feedback = Column(JSON)
    rewritten_bullets = Column(JSON)
    
    # Automatically track when the analysis was performed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
  

