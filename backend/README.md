# AI Resume Analyzer — Backend

FastAPI + Groq AI + PostgreSQL backend for the Resume ATS Audit tool.

---

## Project structure

```
resume-audit-backend/
├── main.py                  # FastAPI app, CORS, lifespan
├── database.py              # Settings, async engine, session, Base
├── models.py                # SQLAlchemy ORM model (AnalysisHistory)
├── schemas.py               # Pydantic schemas (request / response shapes)
├── routers/
│   └── analyzer.py          # All 4 API endpoints
├── services/
│   ├── pdf_service.py       # PDF → plain text (PyMuPDF)
│   ├── txt_service.py       # TXT → plain text (UTF-8 / latin-1)
│   └── llm_service.py       # Groq API call + score math override
├── requirements.txt
├── .env.example             # Copy to .env and fill in your values
└── README.md
```

---

## Quick start

### 1. Clone and create a virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Now open .env and fill in DATABASE_URL, GROQ_API_KEY, GROQ_MODEL
```

### 3. Start a PostgreSQL database

If you have Docker:
```bash
docker run -d \
  --name resume-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=resume_analyzer \
  -p 5432:5432 \
  postgres:16
```

Update `.env` accordingly:
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/resume_analyzer
```

### 4. Run the server

```bash
uvicorn main:app --reload --port 8000
```

The API is now at `http://127.0.0.1:8000`.  
Interactive docs: `http://127.0.0.1:8000/docs`

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/analyze/` | Upload a PDF or TXT resume + job description |
| `POST` | `/api/v1/analyze/text` | Submit raw resume text (no file upload) |
| `GET` | `/api/v1/analyze/history` | Fetch all past scans (newest first) |
| `DELETE` | `/api/v1/analyze/history/{id}` | Delete a single history record |

---

## What changed from v1.1

| Area | Change |
|------|--------|
| **TXT support** | `POST /analyze/` now accepts `.txt` files via the new `txt_service.py` |
| **matched_skills in history** | `HistoryRecord` schema now includes `matched_skills`; the column was already in models.py but excluded from the GET response — now it is returned |
| **Schemas** | Added `HistoryRecord` and `HistoryListResponse` so `/history` returns typed, validated data |
| **Code cleanup** | Extracted `_save_to_db` helper to remove duplication between the two POST endpoints |
| **Error handling** | Empty extracted text now returns a clear 422 instead of a confusing LLM error |
