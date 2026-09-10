import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, Medicine
from app.api.endpoints.orders import is_pharmacy_eligible_for_orders
from app import schemas

router = APIRouter()


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.get("/", response_model=List[schemas.PharmacySummaryResponse])
def get_pharmacies(
    q: Optional[str] = Query(None, description="Search by pharmacy name, address, or license"),
    lat: Optional[float] = Query(None, description="User latitude for distance calculation"),
    lng: Optional[float] = Query(None, description="User longitude for distance calculation"),
    radius_km: Optional[float] = Query(30.0, description="Max search radius in kilometers"),
    db: Session = Depends(get_db),
):
    """
    List all active, verified partner pharmacies with live distance calculations.
    """
    query = db.query(User).filter(User.role == "pharmacy", User.is_email_verified == True)

    if q:
        query = query.filter(
            (User.name.ilike(f"%{q}%")) |
            (User.address.ilike(f"%{q}%")) |
            (User.medical_license.ilike(f"%{q}%"))
        )

    pharmacies = query.all()
    results = []

    for pharm in pharmacies:
        if not is_pharmacy_eligible_for_orders(pharm):
            continue

        p_lat = pharm.latitude if pharm.latitude is not None else 12.9716
        p_lng = pharm.longitude if pharm.longitude is not None else 77.5946

        dist: Optional[float] = None
        if lat is not None and lng is not None:
            dist = round(haversine_distance(lat, lng, p_lat, p_lng), 1)
            if radius_km and dist > radius_km:
                continue

        # Count medicines for this pharmacy (or all available catalog medicines)
        med_count = db.query(Medicine).filter(Medicine.pharmacy_id == pharm.id).count()
        if med_count == 0:
            med_count = db.query(Medicine).count()

        results.append(
            schemas.PharmacySummaryResponse(
                id=pharm.id,
                name=pharm.name or "Partner Pharmacy",
                email=pharm.email,
                phone=pharm.phone,
                address=pharm.address,
                latitude=pharm.latitude,
                longitude=pharm.longitude,
                medical_license=pharm.medical_license,
                distance_km=dist,
                medicines_count=med_count,
                is_open=True,
            )
        )

    if lat is not None and lng is not None:
        results.sort(key=lambda x: x.distance_km if x.distance_km is not None else 9999.0)
    else:
        results.sort(key=lambda x: x.name)

    return results


@router.get("/{id}", response_model=schemas.PharmacyDetailResponse)
def get_pharmacy_detail(id: str, db: Session = Depends(get_db)):
    """
    Retrieve full details of a specific pharmacy and all medicines available in its store.
    """
    pharm = db.query(User).filter(User.id == id, User.role == "pharmacy").first()
    if not pharm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pharmacy with ID {id} not found."
        )

    # Fetch medicines assigned to this pharmacy; if none specifically pinned, provide global catalog items
    meds = db.query(Medicine).filter(Medicine.pharmacy_id == pharm.id).all()
    if not meds:
        meds = db.query(Medicine).all()

    return schemas.PharmacyDetailResponse(
        id=pharm.id,
        name=pharm.name or "Partner Pharmacy",
        email=pharm.email,
        phone=pharm.phone,
        address=pharm.address,
        latitude=pharm.latitude,
        longitude=pharm.longitude,
        medical_license=pharm.medical_license,
        medicines_count=len(meds),
        is_open=True,
        medicines=meds,
    )
