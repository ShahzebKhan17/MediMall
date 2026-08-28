from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import get_settings
from app.core.database import get_db
from app.models import User
from app import schemas

router = APIRouter()
settings = get_settings()


def set_auth_cookie(response: Response, token: str):
    """Sets environment-appropriate auth cookies (secure & samesite=none for production cross-origin)."""
    is_prod = settings.is_production
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=3600 * 24 * 7,  # 7 days
        samesite="none" if is_prod else "lax",
        secure=is_prod,
        path="/",
    )


@router.post("/register", response_model=schemas.UserProfile, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    
    import random
    
    hashed_password = security.get_password_hash(user_in.password)
    
    # Assign actual coordinates or fallback to random offset around center of Indiranagar, Bengaluru
    lat = user_in.latitude if user_in.latitude is not None else (12.9716 + random.uniform(-0.015, 0.015))
    lng = user_in.longitude if user_in.longitude is not None else (77.5946 + random.uniform(-0.015, 0.015))

    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        name=user_in.name,
        age=user_in.age,
        gender=user_in.gender,
        phone=user_in.phone,
        address=user_in.address,
        allergies=user_in.allergies,
        blood_group=user_in.blood_group,
        role=user_in.role,
        medical_license=user_in.medical_license,
        latitude=lat,
        longitude=lng,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Set authentication cookie for newly registered user
    access_token = security.create_access_token(subject=new_user.id)
    set_auth_cookie(response, access_token)

    return new_user


@router.post("/token", response_model=schemas.Token)
def login_oauth2(form_data: OAuth2PasswordRequestForm = Depends(), response: Response = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(subject=user.id)
    if response:
        set_auth_cookie(response, access_token)
    return {"access_token": access_token, "token_type": "bearer"}


from typing import Optional

# JSON-compatible login endpoint for frontend requests
class LoginJSONPayload(schemas.BaseModel):
    email: str
    password: str
    role: Optional[str] = None


@router.post("/login", response_model=schemas.Token)
def login_json(payload: LoginJSONPayload, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not security.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Strictly validate account role if a specific portal role was requested
    if payload.role and payload.role != user.role:
        if user.role == "patient":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This account is registered as a Patient. Please sign in under the 'For Patients' portal.",
            )
        elif user.role == "pharmacy":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: This account is registered as a Pharmacy. Please sign in under the 'For Pharmacies' portal.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Account role '{user.role}' does not match the requested '{payload.role}' portal.",
            )

    access_token = security.create_access_token(subject=user.id)
    set_auth_cookie(response, access_token)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    is_prod = settings.is_production
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="none" if is_prod else "lax",
        secure=is_prod,
        path="/",
    )
    return {"status": "ok", "message": "Logged out successfully"}


@router.get("/me", response_model=schemas.UserProfile)
def read_current_user(current_user_id: str = Depends(security.get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.put("/me", response_model=schemas.UserProfile)
def update_current_user(
    profile_in: schemas.UserProfileUpdate,
    current_user_id: str = Depends(security.get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
        
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/summary")
def get_users_summary(
    admin_user: User = Depends(security.require_pharmacy_user),
    db: Session = Depends(get_db),
):
    """Secured admin endpoint: Returns registration stats and user counts."""
    total = db.query(User).count()
    patients = db.query(User).filter(User.role == "patient").count()
    pharmacies = db.query(User).filter(User.role == "pharmacy").count()
    return {
        "total_users": total,
        "patients": patients,
        "pharmacies": pharmacies,
    }


@router.get("/users/all", response_model=list[schemas.UserProfile])
def get_all_users(
    admin_user: User = Depends(security.require_pharmacy_user),
    db: Session = Depends(get_db),
):
    """Secured admin endpoint: List registered users."""
    return db.query(User).order_by(User.created_at.desc()).all()


