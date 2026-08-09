import math
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

from app.core import security
from app.core.database import get_db
from app.models import User, Medicine, Order, OrderItem
from app import schemas

router = APIRouter()


@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: schemas.OrderCreate,
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    address = order_in.address or user.address
    if not address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A delivery address is required.",
        )

    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The cart must contain at least one item.",
        )

    total = 0
    has_rx = False
    items_to_create = []

    # Calculate price dynamically and check prescriptions
    for item in order_in.items:
        med = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        if not med:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine ID {item.medicine_id} not found.",
            )

        if med.rx:
            has_rx = True

        if med.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {med.name}. Available: {med.stock}",
            )

        total += med.price * item.quantity
        items_to_create.append((med, item.quantity))

    # Determine status: if it requires prescription, status starts at "Review"
    status_str = "Review" if has_rx else "Placed"

    # Proximity Search: Find closest pharmacy
    patient_lat = user.latitude if user.latitude is not None else 12.9716
    patient_lng = user.longitude if user.longitude is not None else 77.5946

    pharmacies = db.query(User).filter(User.role == "pharmacy").all()
    if not pharmacies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No registered pharmacies are available to fulfill this order.",
        )

    pharmacy_distances = []
    for pharm in pharmacies:
        p_lat = pharm.latitude if pharm.latitude is not None else 12.9716
        p_lng = pharm.longitude if pharm.longitude is not None else 77.5946
        dist = haversine_distance(patient_lat, patient_lng, p_lat, p_lng)
        pharmacy_distances.append((pharm, dist))

    # Sort pharmacies by distance (closest first)
    pharmacy_distances.sort(key=lambda x: x[1])
    assigned_pharmacy, calculated_distance = pharmacy_distances[0]

    # Create Order
    new_order = Order(
        user_id=current_user_id,
        pharmacy_id=assigned_pharmacy.id,
        status=status_str,
        total=total,
        address=address,
        payment_method=order_in.payment_method,
        prescription_url=order_in.prescription_name,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Create Order Items and update inventory stock
    for med, qty in items_to_create:
        med.stock -= qty  # decrement stock levels
        new_item = OrderItem(
            order_id=new_order.id,
            medicine_id=med.id,
            quantity=qty,
            price=med.price,
        )
        db.add(new_item)

    db.commit()
    db.refresh(new_order)
    return new_order


@router.get("/active", response_model=Optional[schemas.OrderResponse])
def get_active_order(
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db)
):
    # Active orders are those that are not Delivered and not Cancelled
    active = (
        db.query(Order)
        .filter(Order.user_id == current_user_id)
        .filter(Order.status.notin_(["Delivered", "Cancelled"]))
        .order_by(Order.created_at.desc())
        .first()
    )
    return active


@router.get("/history", response_model=List[schemas.OrderResponse])
def get_order_history(
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db)
):
    history = (
        db.query(Order)
        .filter(Order.user_id == current_user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return history


@router.get("/queue", response_model=List[schemas.OrderResponse])
def get_incoming_queue(
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db)
):
    # Verify user is a pharmacy profile
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user or user.role != "pharmacy":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacy administrators can view the dispatch queue.",
        )

    # Active shopkeeper orders queue - filter by pharmacy_id
    queue = (
        db.query(Order)
        .filter(Order.pharmacy_id == current_user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return queue


@router.put("/{id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    id: str,
    status_update: schemas.OrderStatusUpdate,
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user or user.role != "pharmacy":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only pharmacy administrators can update order statuses.",
        )

    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order
