from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Medicine
from app import schemas

router = APIRouter()

DEFAULT_MEDICINES = [
    { "name": "Paracetamol 650mg", "brand": "Dolo 650 · Strip of 15 tablets", "price": 34, "type": "Pain relief", "rx": False, "color": "orange", "stock": 120, "expiry_date": "2028-06-15", "manufacturing_date": "2025-06-15" },
    { "name": "Cetirizine 10mg", "brand": "Cetzine · Strip of 10 tablets", "price": 28, "type": "Allergy care", "rx": False, "color": "blue", "stock": 90, "expiry_date": "2028-05-10", "manufacturing_date": "2025-05-10" },
    { "name": "Vitamin D3 60K", "brand": "Uprise-D3 · Pack of 4 capsules", "price": 116, "type": "Vitamins", "rx": False, "color": "yellow", "stock": 50, "expiry_date": "2027-04-20", "manufacturing_date": "2025-04-20" },
    { "name": "Amoxicillin 500mg", "brand": "Mox 500 · Strip of 10 capsules", "price": 133, "type": "Antibiotic", "rx": True, "color": "green", "stock": 35, "expiry_date": "2027-07-01", "manufacturing_date": "2025-07-01" }
]


@router.get("/", response_model=List[schemas.MedicineResponse])
def get_medicines(
    q: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Medicine)
    if q:
        query = query.filter(
            (Medicine.name.ilike(f"%{q}%")) | (Medicine.brand.ilike(f"%{q}%"))
        )
    if type and type != "All medicines":
        query = query.filter(Medicine.type.ilike(f"%{type}%"))
    return query.all()


@router.post("/seed", response_model=List[schemas.MedicineResponse], status_code=status.HTTP_201_CREATED)
def seed_medicines(db: Session = Depends(get_db)):
    added_meds = []
    for med in DEFAULT_MEDICINES:
        db_med = db.query(Medicine).filter(Medicine.name == med["name"]).first()
        if not db_med:
            new_med = Medicine(**med)
            db.add(new_med)
            added_meds.append(new_med)
    db.commit()
    for med in added_meds:
        db.refresh(med)
    return db.query(Medicine).all()


@router.post("/", response_model=schemas.MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(med_in: schemas.MedicineCreate, db: Session = Depends(get_db)):
    db_med = db.query(Medicine).filter(Medicine.name == med_in.name).first()
    if db_med:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A medicine with this name already exists.",
        )
    new_med = Medicine(**med_in.model_dump())
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med


@router.patch("/{id}", response_model=schemas.MedicineResponse)
def update_medicine(
    id: int,
    med_update: schemas.MedicineUpdate,
    db: Session = Depends(get_db)
):
    db_med = db.query(Medicine).filter(Medicine.id == id).first()
    if not db_med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {id} not found."
        )
    
    update_data = med_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_med, field, value)
    
    db.commit()
    db.refresh(db_med)
    return db_med

