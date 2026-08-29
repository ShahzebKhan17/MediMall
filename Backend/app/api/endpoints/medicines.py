from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Medicine
from app import schemas

router = APIRouter()

DEFAULT_MEDICINES = [
    {
        "name": "Paracetamol 650mg",
        "brand": "Dolo 650 · Strip of 15 tablets",
        "price": 34,
        "type": "Pain relief & Fever",
        "rx": False,
        "color": "orange",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Blister Strip of 15 Tablets (Orange/White)",
        "stock": 120,
        "expiry_date": "2028-06-15",
        "manufacturing_date": "2025-06-15"
    },
    {
        "name": "Electral ORS 21.8g",
        "brand": "Electral · WHO Formula Sachet",
        "price": 22,
        "type": "Hydration & Loose Motion",
        "rx": False,
        "color": "blue",
        "image_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Foil Sachet 21.8g (Electrolyte Energy)",
        "stock": 150,
        "expiry_date": "2028-08-20",
        "manufacturing_date": "2025-08-20"
    },
    {
        "name": "Loperamide 2mg",
        "brand": "Imodium / Lopamide · Strip of 10 capsules",
        "price": 25,
        "type": "Anti-Diarrheal",
        "rx": False,
        "color": "green",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 10 Capsules (Silver/Green)",
        "stock": 80,
        "expiry_date": "2027-10-15",
        "manufacturing_date": "2025-10-15"
    },
    {
        "name": "Ondansetron 4mg",
        "brand": "Emeset · Strip of 10 tablets",
        "price": 45,
        "type": "Nausea & Vomiting",
        "rx": False,
        "color": "yellow",
        "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 10 Tablets (Yellow Blister)",
        "stock": 70,
        "expiry_date": "2028-02-15",
        "manufacturing_date": "2025-02-15"
    },
    {
        "name": "Cetirizine 10mg",
        "brand": "Cetzine · Strip of 10 tablets",
        "price": 28,
        "type": "Allergy care & Cold",
        "rx": False,
        "color": "blue",
        "image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 10 Tablets (Blue Foil Strip)",
        "stock": 90,
        "expiry_date": "2028-05-10",
        "manufacturing_date": "2025-05-10"
    },
    {
        "name": "Pantoprazole 40mg",
        "brand": "Pan-40 · Strip of 15 tablets",
        "price": 89,
        "type": "Antacid & Gastric",
        "rx": False,
        "color": "yellow",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 15 Tablets (Silver/Yellow Foil)",
        "stock": 80,
        "expiry_date": "2027-11-15",
        "manufacturing_date": "2025-11-15"
    },
    {
        "name": "Volini Pain Relief Gel",
        "brand": "Volini 30g Tube",
        "price": 95,
        "type": "Joint & Muscle Pain",
        "rx": False,
        "color": "orange",
        "image_url": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Lami Tube 30g (Fast Relief)",
        "stock": 65,
        "expiry_date": "2027-12-01",
        "manufacturing_date": "2025-12-01"
    },
    {
        "name": "Strepsils Lozenges",
        "brand": "Strepsils Honey & Lemon · Strip of 8",
        "price": 35,
        "type": "Sore Throat & Cough",
        "rx": False,
        "color": "yellow",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Blister of 8 Lozenges (Yellow Pack)",
        "stock": 100,
        "expiry_date": "2028-04-10",
        "manufacturing_date": "2025-04-10"
    },
    {
        "name": "Benadryl Cough Syrup",
        "brand": "Benadryl 100ml Bottle",
        "price": 115,
        "type": "Cough & Cold",
        "rx": False,
        "color": "orange",
        "image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Pet Bottle 100ml (Syrup with Measuring Cup)",
        "stock": 55,
        "expiry_date": "2027-09-20",
        "manufacturing_date": "2025-09-20"
    },
    {
        "name": "Vitamin D3 60K",
        "brand": "Uprise-D3 · Pack of 4 capsules",
        "price": 116,
        "type": "Vitamins & Immunity",
        "rx": False,
        "color": "yellow",
        "image_url": "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Box of 4 Softgel Capsules (Gold Blister)",
        "stock": 50,
        "expiry_date": "2027-04-20",
        "manufacturing_date": "2025-04-20"
    },
    {
        "name": "Amoxicillin 500mg",
        "brand": "Mox 500 · Strip of 10 capsules",
        "price": 133,
        "type": "Antibiotic (Prescription)",
        "rx": True,
        "color": "green",
        "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 10 Capsules (Green/Red Blister)",
        "stock": 35,
        "expiry_date": "2027-07-01",
        "manufacturing_date": "2025-07-01"
    },
    {
        "name": "Montair-LC",
        "brand": "Montelukast + Levocetirizine · Strip of 10",
        "price": 165,
        "type": "Allergy & Respiratory",
        "rx": True,
        "color": "blue",
        "image_url": "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Alu-Alu Strip of 10 Tablets (Blue Pack)",
        "stock": 60,
        "expiry_date": "2028-01-10",
        "manufacturing_date": "2025-01-10"
    }
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

