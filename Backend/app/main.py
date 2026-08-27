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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
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
    
    # Auto-seed standard medicine catalog items
    db = SessionLocal()
    try:
        for med in DEFAULT_MEDICINES:
            db_med = db.query(Medicine).filter(Medicine.name == med["name"]).first()
            if not db_med:
                new_med = Medicine(**med)
                db.add(new_med)
        db.commit()
    finally:
        db.close()



app.include_router(api_router, prefix="/api/v1")

