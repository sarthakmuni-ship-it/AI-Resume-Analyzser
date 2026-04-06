from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Load Environment Variables
class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str
    GROQ_MODEL: str  # Dynamically pulled from .env

    class Config:
        env_file = ".env"

settings = Settings()

# 2. Setup Async SQLAlchemy Engine
engine = create_async_engine(settings.DATABASE_URL, echo=True)

# 3. Create Async Session Factory
AsyncSessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# 4. Base Class for Models
Base = declarative_base()

# 5. Database Dependency for FastAPI Routes
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session