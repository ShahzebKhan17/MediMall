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
        Base.metadata.create_all(bind=engine)
    except Exception as err:
        logger.error("Database table initialization error: %s", err)

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
        
        # 2. Ensure at least one default active pharmacy exists for hyperlocal order routing
        default_pharmacy = db.query(User).filter(User.role == "pharmacy").first()
        if not default_pharmacy:
            pharmacy_user = User(
                email="pharmacy@medimall.in",
                hashed_password=security.get_password_hash("securepassword"),
                name="Care & Cure Pharmacy",
                role="pharmacy",
                medical_license="DL-KA-BNG-2025-0042",
                address="100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
                phone="+91 80 4123 4567",
                latitude=12.9716,
                longitude=77.5946,
            )
            db.add(pharmacy_user)
            logger.info("Initialized default pharmacy profile: %s", pharmacy_user.name)

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


app.include_router(api_router, prefix="/api/v1")


