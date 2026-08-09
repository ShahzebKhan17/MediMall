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

# Setup local uploads directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".pdf", ".png", ".jpg", ".jpeg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF, PNG, JPG, JPEG are supported.",
        )

    # Make unique file name to avoid collisions
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil_copy = file.file
            # Read and write in chunks to be memory efficient
            while chunk := shutil_copy.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
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
