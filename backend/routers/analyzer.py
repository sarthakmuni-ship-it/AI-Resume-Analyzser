from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models import AnalysisHistory
from services.pdf_service import extract_text_from_pdf
from services.llm_service import analyze_resume_with_groq

router = APIRouter(prefix="/api/v1/analyze", tags=["Analyzer"])

@router.post("/")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # 1. Extract Text
        file_bytes = await file.read()
        resume_text = await extract_text_from_pdf(file_bytes)

        # 2. Call Groq AI
        analysis_result = await analyze_resume_with_groq(resume_text, job_description)

        # 3. Save to Database
        db_record = AnalysisHistory(
            filename=file.filename,
            job_description=job_description,
            match_score=analysis_result.get("match_score", 0),
            # Note: If you eventually add a 'matched_skills' column to your models.py, you can uncomment this line!
            # matched_skills=analysis_result.get("matched_skills", []),
            missing_skills=analysis_result.get("missing_skills", []),
            ats_feedback=analysis_result.get("ats_feedback", []),
            rewritten_bullets=analysis_result.get("rewritten_bullets", [])
        )
        db.add(db_record)
        await db.commit()
        await db.refresh(db_record)

        return {
            "status": "success",
            "data": analysis_result,
            "history_id": db_record.id,
            "extracted_text": resume_text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/text")
async def analyze_resume_text(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    original_filename: str = Form("Manual Entry"),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Call Groq AI directly with the provided text
        analysis_result = await analyze_resume_with_groq(resume_text, job_description)

        # 2. Save to Database (append "(Edited)" to the filename so you know it was a live edit)
        db_record = AnalysisHistory(
            filename=f"{original_filename} (Edited)",
            job_description=job_description,
            match_score=analysis_result.get("match_score", 0),
            # Note: If you eventually add a 'matched_skills' column to your models.py, you can uncomment this line!
            # matched_skills=analysis_result.get("matched_skills", []),
            missing_skills=analysis_result.get("missing_skills", []),
            ats_feedback=analysis_result.get("ats_feedback", []),
            rewritten_bullets=analysis_result.get("rewritten_bullets", [])
        )
        db.add(db_record)
        await db.commit()
        await db.refresh(db_record)

        return {"status": "success", "data": analysis_result, "history_id": db_record.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(db: AsyncSession = Depends(get_db)):
    try:
        # Fetch all history, newest first
        result = await db.execute(
            select(AnalysisHistory).order_by(AnalysisHistory.created_at.desc())
        )
        records = result.scalars().all()
        return {"status": "success", "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{history_id}")
async def delete_history_item(history_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # 1. Find the specific record asynchronously
        result = await db.execute(
            select(AnalysisHistory).filter(AnalysisHistory.id == history_id)
        )
        record = result.scalars().first()
        
        # 2. If it doesn't exist, throw an error
        if not record:
            raise HTTPException(status_code=404, detail="History record not found")
            
        # 3. Delete it and commit asynchronously
        await db.delete(record)
        await db.commit()
        
        return {"status": "success", "message": "Record deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))