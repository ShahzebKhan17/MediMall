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
    # Auto-create all tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed default medicines and users
    db = SessionLocal()
    try:
        # Seed Medicines
        for med in DEFAULT_MEDICINES:
            db_med = db.query(Medicine).filter(Medicine.name == med["name"]).first()
            if not db_med:
                new_med = Medicine(**med)
                db.add(new_med)
        
        # Seed Patient: Ananya Sharma
        patient_email = "ananya@example.com"
        db_patient = db.query(User).filter(User.email == patient_email).first()
        if not db_patient:
            new_patient = User(
                email=patient_email,
                hashed_password=security.get_password_hash("securepassword"),
                name="Ananya Sharma",
                age=28,
                gender="Female",
                phone="+91 98765 43210",
                address="12, 3rd Cross, Indiranagar, Bengaluru, Karnataka 560038",
                allergies="No known allergies",
                blood_group="O+",
                role="patient",
                latitude=12.9716,
                longitude=77.5946
            )
            db.add(new_patient)

        # Seed Pharmacy A: Care & Cure Pharmacy (0.4 km away)
        pharmacy_email_a = "pharmacy@example.com"
        db_pharm_a = db.query(User).filter(User.email == pharmacy_email_a).first()
        if not db_pharm_a:
            new_pharm_a = User(
                email=pharmacy_email_a,
                hashed_password=security.get_password_hash("securepassword"),
                name="Care & Cure Pharmacy",
                role="pharmacy",
                medical_license="DL-12345-X",
                address="56, 100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038",
                latitude=12.9720,
                longitude=77.5980
            )
            db.add(new_pharm_a)

        # Seed Pharmacy B: MedLife Pharmacy (2.5 km away)
        pharmacy_email_b = "medlife@example.com"
        db_pharm_b = db.query(User).filter(User.email == pharmacy_email_b).first()
        if not db_pharm_b:
            new_pharm_b = User(
                email=pharmacy_email_b,
                hashed_password=security.get_password_hash("securepassword"),
                name="MedLife Pharmacy",
                role="pharmacy",
                medical_license="DL-67890-Y",
                address="102, Residency Rd, Ashok Nagar, Bengaluru, Karnataka 560025",
                latitude=12.9850,
                longitude=77.6050
            )
            db.add(new_pharm_b)

        db.commit()
    finally:
        db.close()



app.include_router(api_router, prefix="/api/v1")

