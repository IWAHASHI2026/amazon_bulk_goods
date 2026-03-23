from sqlalchemy import create_engine, JSON
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/amazon_bulk"

    class Config:
        env_file = ".env"


settings = Settings()

# Fall back to SQLite if PostgreSQL is unavailable
_db_url = settings.database_url
use_sqlite = False
try:
    _test_engine = create_engine(_db_url)
    with _test_engine.connect() as _conn:
        pass
    _test_engine.dispose()
except Exception:
    _db_url = "sqlite:///./amazon_bulk.db"
    use_sqlite = True

engine = create_engine(_db_url, connect_args={"check_same_thread": False} if use_sqlite else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# Provide a JSONB-compatible type that works on both PostgreSQL and SQLite
if use_sqlite:
    CompatJSONB = JSON
else:
    from sqlalchemy.dialects.postgresql import JSONB as CompatJSONB


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
