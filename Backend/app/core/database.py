import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger("medimall.database")
settings = get_settings()

db_url = settings.database_url.strip()

# Normalize postgres URL schemes for psycopg3 (SQLAlchemy 2.0)
if db_url.startswith("postgres://"):
    db_url = "postgresql+psycopg://" + db_url[len("postgres://"):]
elif db_url.startswith("postgresql://") and "+psycopg" not in db_url:
    db_url = "postgresql+psycopg://" + db_url[len("postgresql://"):]

if db_url.startswith("postgresql"):
    engine_kwargs = {
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "pool_size": 10,
        "max_overflow": 20,
    }
    if not settings.is_production:
        try:
            # Test connectivity with a short timeout in local dev only
            test_engine = create_engine(db_url, connect_args={"connect_timeout": 3})
            with test_engine.connect():
                pass
            engine = create_engine(db_url, **engine_kwargs)
        except Exception as err:
            logger.warning(
                "PostgreSQL database is not reachable locally (%s). Falling back to SQLite for local development.",
                err,
            )
            engine = create_engine(
                "sqlite:///./medimall.db",
                connect_args={"check_same_thread": False}
            )
    else:
        # In production, connect strictly to the specified PostgreSQL database
        engine = create_engine(db_url, **engine_kwargs)
elif db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
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
