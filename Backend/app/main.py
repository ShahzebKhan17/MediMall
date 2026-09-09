import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import Base, engine, SessionLocal
from app.models import Medicine, User
from app.api.endpoints.medicines import DEFAULT_MEDICINES
from app.core import security

logger = logging.getLogger("medimall.app")
settings = get_settings()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Tables
    try:
        from sqlalchemy import inspect
        Base.metadata.create_all(bind=engine)
        
        # Safely migrate existing users table schema if needed
        with engine.connect() as conn:
            inspector = inspect(engine)
            if "users" in inspector.get_table_names():
                existing_cols = [c["name"] for c in inspector.get_columns("users")]
                if "is_email_verified" not in existing_cols:
                    is_sqlite = engine.name == "sqlite"
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT 0 NOT NULL" if is_sqlite else "ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE NOT NULL"))
                    conn.commit()
                if "email_verification_token" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255)"))
                    conn.commit()
                if "email_verification_expires_at" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email_verification_expires_at TIMESTAMP" if engine.name == "sqlite" else "ALTER TABLE users ADD COLUMN email_verification_expires_at TIMESTAMP WITH TIME ZONE"))
                    conn.commit()
                if "password_reset_token" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255)"))
                    conn.commit()
                if "password_reset_expires_at" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP" if engine.name == "sqlite" else "ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP WITH TIME ZONE"))
                    conn.commit()
                if "bank_beneficiary_name" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN bank_beneficiary_name VARCHAR(255)"))
                    conn.commit()
                if "bank_account_number" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN bank_account_number VARCHAR(50)"))
                    conn.commit()
                if "bank_ifsc_code" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN bank_ifsc_code VARCHAR(20)"))
                    conn.commit()
                if "bank_name" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN bank_name VARCHAR(100)"))
                    conn.commit()
                if "upi_id" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN upi_id VARCHAR(100)"))
                    conn.commit()

            if "medicines" in inspector.get_table_names():
                existing_med_cols = [c["name"] for c in inspector.get_columns("medicines")]
                if "salt_composition" not in existing_med_cols:
                    conn.execute(text("ALTER TABLE medicines ADD COLUMN salt_composition VARCHAR(255)"))
                    conn.commit()

            if "orders" in inspector.get_table_names():
                existing_order_cols = [c["name"] for c in inspector.get_columns("orders")]
                if "payment_id" not in existing_order_cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN payment_id VARCHAR(100)"))
                    conn.commit()
                if "idempotency_key" not in existing_order_cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(100)"))
                    conn.commit()
    except Exception as err:
        logger.error("Database table initialization/migration error: %s", err)

    # Seed initial medicines & default pharmacy
    db = SessionLocal()
    try:
        # 1. Seed / verify default medicine catalog items
        for med in DEFAULT_MEDICINES:
            db_med = db.query(Medicine).filter(Medicine.name == med["name"]).first()
            if not db_med:
                new_med = Medicine(**med)
                db.add(new_med)
            else:
                if not db_med.image_url:
                    db_med.image_url = med.get("image_url")
                if not db_med.packaging_type:
                    db_med.packaging_type = med.get("packaging_type")
                if not db_med.salt_composition and med.get("salt_composition"):
                    db_med.salt_composition = med.get("salt_composition")

        db.commit()
    except Exception as err:
        db.rollback()
        logger.error("Startup seeding error: %s", err)
    finally:
        db.close()

    yield
    # Shutdown logic (if any)


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

# Robust CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_frontend_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Static file uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
@app.get("/api/v1/health", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    """Liveness & Readiness probe for cloud orchestrators (Render, Railway, Kubernetes)"""
    db_status = "healthy"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if "healthy" in db_status else "degraded",
        "app_name": settings.app_name,
        "environment": settings.environment,
        "database": db_status,
    }


@app.get("/health/email", tags=["Health"])
@app.get("/api/v1/health/email", tags=["Health"])
def email_health_check():
    from app.services.email import _get_active_provider
    provider = _get_active_provider()
    return {
        "active_provider": provider,
        "brevo_configured": bool(settings.brevo_api_key),
        "brevo_sender_email": settings.brevo_sender_email or "not_set",
        "smtp_configured": bool(settings.smtp_user and settings.smtp_password),
        "resend_configured": bool(settings.resend_api_key),
        "frontend_url": settings.frontend_url,
    }


app.include_router(api_router, prefix="/api/v1")


