import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import Base, engine, SessionLocal
from app.models import Medicine, User
from app.api.endpoints.medicines import DEFAULT_MEDICINES
from app.core import security

settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0")

origins = [
    settings.frontend_origin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static uploads directory for prescriptions
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup_db_setup():
    # Auto-create all database tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate columns for SQLite if they don't exist yet
    db = SessionLocal()
    try:
        from sqlalchemy import text
        try:
            db.execute(text("ALTER TABLE medicines ADD COLUMN image_url VARCHAR(500)"))
            db.commit()
        except Exception:
            db.rollback()
            
        try:
            db.execute(text("ALTER TABLE medicines ADD COLUMN packaging_type VARCHAR(100)"))
            db.commit()
        except Exception:
            db.rollback()

        # Auto-seed and refresh standard medicine catalog items with packaging photos
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
        db.commit()
    finally:
        db.close()



app.include_router(api_router, prefix="/api/v1")

