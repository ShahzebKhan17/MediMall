import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core import security
from app.models import Medicine, User
from app import schemas

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
MEDICINES_UPLOAD_DIR = os.path.join(UPLOAD_DIR, "medicines")
os.makedirs(MEDICINES_UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit

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
        "salt_composition": "Paracetamol (650mg)",
        "stock": 120,
        "expiry_date": "2028-06-15",
        "manufacturing_date": "2025-06-15"
    },
    {
        "name": "Calpol 650mg",
        "brand": "Calpol 650 · Strip of 15 tablets",
        "price": 31,
        "type": "Pain relief & Fever",
        "rx": False,
        "color": "orange",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 15 Tablets (Blue/White Blister)",
        "salt_composition": "Paracetamol (650mg)",
        "stock": 95,
        "expiry_date": "2028-09-10",
        "manufacturing_date": "2025-09-10"
    },
    {
        "name": "Crocin 650mg Advance",
        "brand": "Crocin 650 · Strip of 15 tablets",
        "price": 35,
        "type": "Pain relief & Fever",
        "rx": False,
        "color": "orange",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 15 Fast-Action Tablets (Red/White)",
        "salt_composition": "Paracetamol (650mg)",
        "stock": 80,
        "expiry_date": "2028-07-20",
        "manufacturing_date": "2025-07-20"
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
        "salt_composition": "Oral Rehydration Salts (WHO Formula)",
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
        "salt_composition": "Loperamide Hydrochloride (2mg)",
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
        "salt_composition": "Ondansetron (4mg)",
        "stock": 70,
        "expiry_date": "2028-02-15",
        "manufacturing_date": "2025-02-15"
    },
    {
        "name": "Cetirizine 10mg",
        "brand": "Cetzine / Alerid · Strip of 10 tablets",
        "price": 28,
        "type": "Allergy care & Cold",
        "rx": False,
        "color": "blue",
        "image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 10 Tablets (Blue Foil Strip)",
        "salt_composition": "Cetirizine Hydrochloride (10mg)",
        "stock": 90,
        "expiry_date": "2028-05-10",
        "manufacturing_date": "2025-05-10"
    },
    {
        "name": "Levocetirizine 5mg",
        "brand": "Levocet / Teczine · Strip of 10 tablets",
        "price": 42,
        "type": "Allergy care & Cold",
        "rx": False,
        "color": "blue",
        "image_url": "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 10 Tablets (White/Green)",
        "salt_composition": "Levocetirizine (5mg)",
        "stock": 85,
        "expiry_date": "2028-04-12",
        "manufacturing_date": "2025-04-12"
    },
    {
        "name": "Pantoprazole 40mg",
        "brand": "Pan-40 / Pantocid · Strip of 15 tablets",
        "price": 89,
        "type": "Antacid & Gastric",
        "rx": False,
        "color": "yellow",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Strip of 15 Tablets (Silver/Yellow Foil)",
        "salt_composition": "Pantoprazole Gastro-resistant (40mg)",
        "stock": 80,
        "expiry_date": "2027-11-15",
        "manufacturing_date": "2025-11-15"
    },
    {
        "name": "Rabeprazole 20mg",
        "brand": "Razo-20 · Strip of 15 tablets",
        "price": 92,
        "type": "Antacid & Gastric",
        "rx": False,
        "color": "yellow",
        "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Alu-Alu Strip of 15 Tablets",
        "salt_composition": "Rabeprazole Sodium (20mg)",
        "stock": 60,
        "expiry_date": "2027-08-15",
        "manufacturing_date": "2025-08-15"
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
        "salt_composition": "Diclofenac Diethylamine + Methyl Salicylate + Menthol",
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
        "salt_composition": "Dichlorobenzyl Alcohol + Amylmetacresol",
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
        "salt_composition": "Diphenhydramine HCl + Ammonium Chloride + Sodium Citrate",
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
        "salt_composition": "Cholecalciferol (Vitamin D3 60,000 IU)",
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
        "salt_composition": "Amoxicillin Trihydrate (500mg)",
        "stock": 35,
        "expiry_date": "2027-07-01",
        "manufacturing_date": "2025-07-01"
    },
    {
        "name": "Augmentin 625 Duo",
        "brand": "Augmentin 625 · Strip of 10 tablets",
        "price": 204,
        "type": "Antibiotic (Prescription)",
        "rx": True,
        "color": "green",
        "image_url": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80",
        "packaging_type": "Alu-Alu Strip of 10 Tablets",
        "salt_composition": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
        "stock": 40,
        "expiry_date": "2027-11-20",
        "manufacturing_date": "2025-11-20"
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
        "salt_composition": "Montelukast (10mg) + Levocetirizine (5mg)",
        "stock": 60,
        "expiry_date": "2028-01-10",
        "manufacturing_date": "2025-01-10"
    }
]


@router.post("/upload-image")
def upload_medicine_image(
    file: UploadFile = File(...),
    current_user: User = Depends(security.require_pharmacy_user),
):
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPG, JPEG, PNG, and WEBP are supported."
        )

    clean_original = os.path.basename(file.filename or "medicine").replace(" ", "_")
    unique_filename = f"{uuid.uuid4().hex}_{clean_original}"
    file_path = os.path.join(MEDICINES_UPLOAD_DIR, unique_filename)

    total_bytes = 0
    try:
        with open(file_path, "wb") as buffer:
            while chunk := file.file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE_BYTES:
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Image file size exceeds maximum limit of 10 MB.",
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded image: {str(e)}",
        )

    return {"image_url": f"/uploads/medicines/{unique_filename}"}


@router.get("/inventory", response_model=List[schemas.MedicineResponse])
def get_pharmacy_inventory(
    current_user: User = Depends(security.require_pharmacy_user),
    db: Session = Depends(get_db),
):
    """
    Returns only the medicines managed by the authenticated pharmacy.
    """
    return db.query(Medicine).filter(Medicine.pharmacy_id == current_user.id).order_by(Medicine.created_at.desc()).all()


@router.get("/", response_model=List[schemas.MedicineResponse])
def get_medicines(
    q: Optional[str] = None,
    type: Optional[str] = None,
    pharmacy_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Medicine)
    if pharmacy_id:
        query = query.filter(Medicine.pharmacy_id == pharmacy_id)
    if q:
        query = query.filter(
            (Medicine.name.ilike(f"%{q}%")) |
            (Medicine.brand.ilike(f"%{q}%")) |
            (Medicine.salt_composition.ilike(f"%{q}%"))
        )
    if type and type != "All medicines":
        query = query.filter(Medicine.type.ilike(f"%{type}%"))
    return query.all()


@router.get("/{id}", response_model=schemas.MedicineResponse)
def get_medicine_by_id(id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == id).first()
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {id} not found."
        )
    return med


@router.get("/{id}/substitutes", response_model=List[schemas.MedicineResponse])
def get_substitutes(id: int, db: Session = Depends(get_db)):
    target = db.query(Medicine).filter(Medicine.id == id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {id} not found."
        )

    substitutes = []
    if target.salt_composition:
        substitutes = (
            db.query(Medicine)
            .filter(
                Medicine.id != target.id,
                Medicine.salt_composition == target.salt_composition,
                Medicine.stock > 0
            )
            .all()
        )

    if not substitutes and target.type:
        substitutes = (
            db.query(Medicine)
            .filter(
                Medicine.id != target.id,
                Medicine.type == target.type,
                Medicine.stock > 0
            )
            .limit(4)
            .all()
        )

    return substitutes


@router.post("/", response_model=schemas.MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    med_in: schemas.MedicineCreate,
    current_user: User = Depends(security.require_pharmacy_user),
    db: Session = Depends(get_db)
):
    existing = (
        db.query(Medicine)
        .filter(Medicine.name.ilike(med_in.name), Medicine.pharmacy_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A medicine with this name already exists in your inventory.",
        )
    
    med_data = med_in.model_dump()
    med_data["pharmacy_id"] = current_user.id
    new_med = Medicine(**med_data)
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med


@router.patch("/{id}", response_model=schemas.MedicineResponse)
def update_medicine(
    id: int,
    med_update: schemas.MedicineUpdate,
    current_user: User = Depends(security.require_pharmacy_user),
    db: Session = Depends(get_db)
):
    db_med = db.query(Medicine).filter(Medicine.id == id).first()
    if not db_med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {id} not found."
        )
    
    if db_med.pharmacy_id and db_med.pharmacy_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify another pharmacy's inventory.",
        )

    update_data = med_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_med, field, value)
    
    db.commit()
    db.refresh(db_med)
    return db_med


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_medicine(
    id: int,
    current_user: User = Depends(security.require_pharmacy_user),
    db: Session = Depends(get_db)
):
    db_med = db.query(Medicine).filter(Medicine.id == id).first()
    if not db_med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID {id} not found."
        )

    if db_med.pharmacy_id and db_med.pharmacy_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete another pharmacy's inventory.",
        )

    db.delete(db_med)
    db.commit()
    return {"status": "success", "message": "Medicine deleted from your inventory."}

