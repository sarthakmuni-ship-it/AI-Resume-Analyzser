import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import analyzer


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once on startup.
    Creates all tables that don't exist yet — safe to run repeatedly.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="AI Resume Analyzer API",
    version="1.2",
    description="Analyze resumes against job descriptions using Groq AI.",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allows the React dev server (port 5173 / 3000) to call this backend.
# In production replace "*" with your actual frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyzer.router)


@app.get("/")
async def root():
    return {
        "message": "AI Resume Analyzer API is running.",
        "docs": "/docs",
        "version": "1.2",
    }
