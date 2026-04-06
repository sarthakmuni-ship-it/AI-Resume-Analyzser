import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import analyzer

# This function runs when the server starts up
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create database tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="AI Resume Analyzer API",
    version="1.1",
    lifespan=lifespan
)

# --- CORS SETTINGS ---
# This allows your React frontend (usually on port 5173 or 3000) 
# to make requests to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our routes
app.include_router(analyzer.router)

@app.get("/")
async def root():
    return {
        "message": "AI Resume Analyzer API is active",
        "docs": "/docs"
    }