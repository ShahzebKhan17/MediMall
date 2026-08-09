import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

settings = get_settings()

db_url = settings.database_url
# Detect if PostgreSQL is available, else fallback to SQLite for easy offline development
if db_url.startswith("postgresql"):
    try:
        # Test connection with a short timeout
        test_engine = create_engine(db_url)
        # Use a quick low-level check
        with test_engine.connect() as conn:
            pass
        engine = create_engine(db_url, pool_pre_ping=True)
    except Exception:
        print("\n" + "="*80)
        print("WARNING: PostgreSQL database is not reachable at database_url.")
        print("Falling back to local SQLite database (sqlite:///./medimall.db) for development.")
        print("="*80 + "\n")
        engine = create_engine(
            "sqlite:///./medimall.db",
            connect_args={"check_same_thread": False}
        )
else:
    engine = create_engine(db_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
