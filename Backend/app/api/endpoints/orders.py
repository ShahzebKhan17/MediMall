import math
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

try:
    import razorpay
except ImportError:
    razorpay = None


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


def get_assigned_pharmacy(
    db: Session,
    patient_lat: float,
    patient_lng: float,
    exclude_pharmacy_ids: Optional[List[str]] = None
) -> Optional[User]:
    query = db.query(User).filter(User.role == "pharmacy")
    if exclude_pharmacy_ids:
        query = query.filter(~User.id.in_(exclude_pharmacy_ids))
    
    pharmacies = query.all()
    if not pharmacies:
        return None

    pharmacy_distances = []
    for pharm in pharmacies:
        p_lat = pharm.latitude if pharm.latitude is not None else 12.9716
        p_lng = pharm.longitude if pharm.longitude is not None else 77.5946
        dist = haversine_distance(patient_lat, patient_lng, p_lat, p_lng)
        pharmacy_distances.append((pharm, dist))

    pharmacy_distances.sort(key=lambda x: x[1])
    return pharmacy_distances[0][0]


@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: schemas.OrderCreate,
    idempotency_header: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to place orders. Check your inbox or request a new verification link from your dashboard.",
        )

    # Idempotency Check: If key already processed for this user, return existing order directly
    effective_idempotency_key = order_in.idempotency_key or idempotency_header
    if effective_idempotency_key:
        existing_order = (
            db.query(Order)
            .filter(
                Order.user_id == current_user_id,
                Order.idempotency_key == effective_idempotency_key,
            )
            .first()
        )
        if existing_order:
            return existing_order

    address = order_in.address or user.address
    if not address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A delivery address is required.",
        )

    if not order_in.items and not order_in.prescription_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The cart must contain at least one item or an attached prescription.",
        )

    total = 0
    has_rx = False
    items_to_create = []

    # Calculate price dynamically and check prescriptions
    if order_in.items:
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


    # Match nearest pharmacy
    patient_lat = user.latitude if user.latitude is not None else 12.9716
    patient_lng = user.longitude if user.longitude is not None else 77.5946
    assigned_pharmacy = get_assigned_pharmacy(db, patient_lat, patient_lng)
    if not assigned_pharmacy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No registered pharmacy partners are currently available in your service area. Please register a pharmacy partner or try again shortly.",
        )

    # Create Order with Idempotency Key
    new_order = Order(
        user_id=current_user_id,
        pharmacy_id=assigned_pharmacy.id,
        status=status_str,
        total=total,
        address=address,
        payment_method=order_in.payment_method,
        idempotency_key=effective_idempotency_key,
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


@router.get("/", response_model=List[schemas.OrderResponse])
def get_all_orders(
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.role == "pharmacy":
        orders = (
            db.query(Order)
            .filter(Order.pharmacy_id == current_user_id)
            .order_by(Order.created_at.desc())
            .all()
        )
    else:
        orders = (
            db.query(Order)
            .filter(Order.user_id == current_user_id)
            .order_by(Order.created_at.desc())
            .all()
        )
    return orders


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
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Active shopkeeper orders queue
    if user.role == "pharmacy":
        queue = (
            db.query(Order)
            .filter((Order.pharmacy_id == current_user_id) | (Order.pharmacy_id == None))
            .order_by(Order.created_at.desc())
            .all()
        )
    else:
        # Allow testing/previewing the dispatch queue
        queue = (
            db.query(Order)
            .order_by(Order.created_at.desc())
            .all()
        )
    return queue


@router.put("/{id}/status", response_model=schemas.OrderResponse)
@router.patch("/{id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    id: str,
    status_update: schemas.OrderStatusUpdate,
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Update status and commit
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order


@router.post("/{id}/reassign", response_model=schemas.OrderResponse)
@router.patch("/{id}/reassign", response_model=schemas.OrderResponse)
def reassign_order_to_next_pharmacy(
    id: str,
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Cascades/transfers an order to the next closest pharmacy partner if the current
    assigned pharmacy is unable to fulfill it.
    """
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Determine patient coordinates
    patient = db.query(User).filter(User.id == order.user_id).first()
    patient_lat = patient.latitude if (patient and patient.latitude is not None) else 12.9716
    patient_lng = patient.longitude if (patient and patient.longitude is not None) else 77.5946

    # Exclude current pharmacy and find the next nearest
    next_pharmacy = get_assigned_pharmacy(
        db,
        patient_lat=patient_lat,
        patient_lng=patient_lng,
        exclude_pharmacy_ids=[order.pharmacy_id] if order.pharmacy_id else [current_user_id]
    )

    if not next_pharmacy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No alternative pharmacy partner found in this service zone to fulfill the order.",
        )

    order.pharmacy_id = next_pharmacy.id
    db.commit()
    db.refresh(order)
    return order



@router.post("/razorpay/create", response_model=schemas.RazorpayOrderResponse)
def create_razorpay_order(
    payload: schemas.RazorpayOrderCreate,
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    from app.core.config import get_settings
    settings = get_settings()

    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to make payments. Check your inbox or request a new verification link.",
        )

    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The cart must contain at least one item.",
        )

    total = 0
    for item in payload.items:
        med = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        if not med:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine ID {item.medicine_id} not found.",
            )
        if med.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {med.name}. Available: {med.stock}",
            )
        total += med.price * item.quantity

    amount_in_paise = int(total * 100)
    key_id = settings.razorpay_key_id or "rzp_test_placeholder"
    key_secret = settings.razorpay_key_secret or "placeholder_secret"

    rzp_order_id = f"order_test_{current_user_id[:8]}_{int(total)}"
    if razorpay:
        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            razorpay_data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"rcpt_{current_user_id[:8]}",
                "notes": {
                    "user_id": current_user_id,
                    "user_name": user.name,
                },
            }
            rzp_order = client.order.create(data=razorpay_data)
            if rzp_order and "id" in rzp_order:
                rzp_order_id = rzp_order["id"]
        except Exception as e:
            # Fallback to simulated order ID for local test environments
            print(f"Razorpay Client creation warning: {e}. Using simulated order ID {rzp_order_id}")

    return schemas.RazorpayOrderResponse(
        razorpay_order_id=rzp_order_id,
        amount=amount_in_paise,
        currency="INR",
        key_id=key_id,
    )


@router.post("/razorpay/verify", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def verify_razorpay_payment(
    verify_in: schemas.RazorpayVerifyRequest,
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    from app.core.config import get_settings
    settings = get_settings()

    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to confirm payments.",
        )

    # Idempotency Check: If already processed for this payment_id or idempotency_key, return existing order immediately
    existing_order = None
    if verify_in.razorpay_payment_id:
        existing_order = db.query(Order).filter(Order.payment_id == verify_in.razorpay_payment_id).first()
    if not existing_order and verify_in.idempotency_key:
        existing_order = db.query(Order).filter(Order.user_id == current_user_id, Order.idempotency_key == verify_in.idempotency_key).first()
    if existing_order:
        return existing_order

    address = verify_in.address or user.address
    if not address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A delivery address is required.",
        )

    if not verify_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The cart must contain at least one item.",
        )

    # Cryptographic signature check (when using real keys)
    key_id = settings.razorpay_key_id
    key_secret = settings.razorpay_key_secret
    if razorpay and key_id and key_secret and not key_id.startswith("rzp_test_placeholder"):
        try:
            client = razorpay.Client(auth=(key_id, key_secret))
            client.utility.verify_payment_signature({
                "razorpay_order_id": verify_in.razorpay_order_id,
                "razorpay_payment_id": verify_in.razorpay_payment_id,
                "razorpay_signature": verify_in.razorpay_signature,
            })
        except Exception as e:
            # If verification fails with real keys, raise 400
            print(f"Razorpay Signature Verification Error: {e}")

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment signature verification failed. Transaction cannot be confirmed.",
            )

    total = 0
    has_rx = False
    items_to_create = []

    for item in verify_in.items:
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

    # Match nearest pharmacy
    patient_lat = user.latitude if user.latitude is not None else 12.9716
    patient_lng = user.longitude if user.longitude is not None else 77.5946
    assigned_pharmacy = get_assigned_pharmacy(db, patient_lat, patient_lng)
    if not assigned_pharmacy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No registered pharmacy partners are currently available in your service area. Please register a pharmacy partner or try again shortly.",
        )

    status_str = "Review" if has_rx else "Confirmed"


    new_order = Order(
        user_id=current_user_id,
        pharmacy_id=assigned_pharmacy.id,
        status=status_str,
        total=total,
        address=address,
        payment_method=f"Razorpay ({verify_in.payment_method}) [Ref: {verify_in.razorpay_payment_id}]",
        payment_id=verify_in.razorpay_payment_id,
        idempotency_key=verify_in.idempotency_key,
        prescription_url=verify_in.prescription_name,
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Decrement inventory and record items
    for med, qty in items_to_create:
        med.stock -= qty
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
