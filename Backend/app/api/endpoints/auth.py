from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.database import get_db
from app.models import User
from app import schemas

router = APIRouter()


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

    # Set HttpOnly cookie for newly registered user
    access_token = security.create_access_token(subject=new_user.id)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=3600,
        samesite="lax",
        secure=False,
        path="/"
    )

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
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=3600,
            samesite="lax",
            secure=False,
            path="/"
        )
    return {"access_token": access_token, "token_type": "bearer"}


# JSON-compatible login endpoint for frontend requests
class LoginJSONPayload(schemas.BaseModel):
    email: str
    password: str


@router.post("/login", response_model=schemas.Token)
def login_json(payload: LoginJSONPayload, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not security.verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(subject=user.id)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=3600,
        samesite="lax",
        secure=False,
        path="/"
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True, samesite="lax", path="/")
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
