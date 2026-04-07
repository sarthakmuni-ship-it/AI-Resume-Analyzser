from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import AnalysisHistory
from schemas import HistoryListResponse
from services.pdf_service import extract_text_from_pdf
from services.txt_service import extract_text_from_txt
from services.llm_service import analyze_resume_with_groq

router = APIRouter(prefix="/api/v1/analyze", tags=["Analyzer"])


# ── Helper: persist an analysis result to the DB ─────────────────────────────

async def _save_to_db(
    db: AsyncSession,
    filename: str,
    job_description: str,
    analysis: dict,
) -> AnalysisHistory:
    record = AnalysisHistory(
        filename=filename,
        job_description=job_description,
        match_score=analysis.get("match_score", 0),
        matched_skills=analysis.get("matched_skills", []),
        missing_skills=analysis.get("missing_skills", []),
        ats_feedback=analysis.get("ats_feedback", []),
        rewritten_bullets=analysis.get("rewritten_bullets", []),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


# ── POST /api/v1/analyze/  — upload PDF or TXT file ──────────────────────────

@router.post("/")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts a PDF or TXT resume file + a job description string.

    Steps:
      1. Detect file type and extract plain text.
      2. Send text + JD to Groq LLM.
      3. Save the result to the database.
      4. Return the analysis + the new history record id.
    """
    filename_lower = file.filename.lower()

    if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported.",
        )

    try:
        file_bytes = await file.read()

        # ── Step 1: Extract text ──────────────────────────────────────────
        if filename_lower.endswith(".pdf"):
            resume_text = await extract_text_from_pdf(file_bytes)
        else:
            resume_text = await extract_text_from_txt(file_bytes)

        if not resume_text:
            raise HTTPException(
                status_code=422,
                detail="Could not extract any text from the uploaded file. "
                       "Make sure the PDF is not scanned/image-only.",
            )

        # ── Step 2: AI analysis ───────────────────────────────────────────
        analysis_result = await analyze_resume_with_groq(resume_text, job_description)

        # ── Step 3: Persist ───────────────────────────────────────────────
        db_record = await _save_to_db(db, file.filename, job_description, analysis_result)

        return {
            "status": "success",
            "data": analysis_result,
            "history_id": db_record.id,
            "extracted_text": resume_text,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/v1/analyze/text  — paste raw text (live editor) ────────────────

@router.post("/text")
async def analyze_resume_text(
    resume_text: str = Form(...),
    job_description: str = Form(...),
    original_filename: str = Form("Manual Entry"),
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts raw resume text instead of a file upload.
    Useful for the in-browser editor / copy-paste flow.
    """
    try:
        analysis_result = await analyze_resume_with_groq(resume_text, job_description)
        db_record = await _save_to_db(
            db,
            f"{original_filename} (Edited)",
            job_description,
            analysis_result,
        )
        return {
            "status": "success",
            "data": analysis_result,
            "history_id": db_record.id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/v1/analyze/history  — all past scans ────────────────────────────

@router.get("/history", response_model=HistoryListResponse)
async def get_history(db: AsyncSession = Depends(get_db)):
    """
    Returns all analysis records sorted newest-first.
    Each record includes matched_skills so the frontend can display
    keyword counts and badges in the history grid.
    """
    try:
        result = await db.execute(
            select(AnalysisHistory).order_by(AnalysisHistory.created_at.desc())
        )
        records = result.scalars().all()
        return {"status": "success", "data": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DELETE /api/v1/analyze/history/{id}  — delete one record ─────────────────

@router.delete("/history/{history_id}")
async def delete_history_item(
    history_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently removes a single history record by id.
    Returns 404 if the id does not exist.
    """
    try:
        result = await db.execute(
            select(AnalysisHistory).filter(AnalysisHistory.id == history_id)
        )
        record = result.scalars().first()

        if not record:
            raise HTTPException(status_code=404, detail="History record not found.")

        await db.delete(record)
        await db.commit()
        return {"status": "success", "message": "Record deleted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
