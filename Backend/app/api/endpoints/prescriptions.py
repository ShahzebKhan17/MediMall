import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core import security
from app.core.database import get_db
from app.models import PrescriptionRecord, User
from app import schemas

router = APIRouter()

# Consistent uploads directory path matching app/main.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=schemas.PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def upload_prescription(
    file: UploadFile = File(...),
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    # Verify user exists
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Validate file type extension
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in [".pdf", ".png", ".jpg", ".jpeg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF, PNG, JPG, JPEG are supported.",
        )

    # Sanitize and make unique file name
    clean_original = os.path.basename(file.filename or "prescription").replace(" ", "_")
    unique_filename = f"{uuid.uuid4().hex}_{clean_original}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    total_bytes = 0
    try:
        with open(file_path, "wb") as buffer:
            while chunk := file.file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE_BYTES:
                    # Clean up partial file
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds maximum allowed limit of 10 MB.",
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file contents: {str(e)}",
        )


    # Save record to database
    # Storing relative filename so frontend can retrieve it easily
    new_record = PrescriptionRecord(
        user_id=current_user_id,
        file_path=unique_filename,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/", response_model=List[schemas.PrescriptionResponse])
def get_prescriptions(
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    records = (
        db.query(PrescriptionRecord)
        .filter(PrescriptionRecord.user_id == current_user_id)
        .order_by(PrescriptionRecord.uploaded_at.desc())
        .all()
    )
    return records
