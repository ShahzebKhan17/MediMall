import logging
import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import get_settings
from app.core.database import get_db
from app.models import User
from app import schemas
from app.services import email as email_service

logger = logging.getLogger("medimall.auth")
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
    clean_email = user_in.email.strip().lower()
    db_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    
    # Assign actual coordinates or fallback to random offset around center of Indiranagar, Bengaluru
    lat = user_in.latitude if user_in.latitude is not None else (12.9716 + random.uniform(-0.015, 0.015))
    lng = user_in.longitude if user_in.longitude is not None else (77.5946 + random.uniform(-0.015, 0.015))

    # Generate cryptographically secure verification token (valid for 24 hours)
    user_temp_id = security.generate_uuid() if hasattr(security, "generate_uuid") else None
    verification_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    new_user = User(
        email=clean_email,
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
        is_email_verified=False,
        email_verification_token=None,
        email_verification_expires_at=verification_expires_at,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    raw_token, hashed_token = email_service.generate_verification_token(user_id=new_user.id)
    new_user.email_verification_token = hashed_token
    db.commit()

    # Dispatch branded verification email via Resend
    email_service.send_verification_email(
        to_email=new_user.email,
        user_name=new_user.name,
        raw_token=raw_token,
    )

    # Set authentication cookie for newly registered user
    access_token = security.create_access_token(subject=new_user.id)
    set_auth_cookie(response, access_token)

    return new_user



@router.post("/token", response_model=schemas.Token)
def login_oauth2(form_data: OAuth2PasswordRequestForm = Depends(), response: Response = None, db: Session = Depends(get_db)):
    clean_username = form_data.username.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_username).first()
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
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
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


@router.post("/verify-email", response_model=schemas.VerifyEmailResponse)
def verify_email(payload: schemas.VerifyEmailRequest, db: Session = Depends(get_db)):
    raw_token = payload.token.strip()
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token is required.",
        )

    user: Optional[User] = None

    # Handle user_id-prefixed tokens (e.g. "<user_id>.<random_secret>")
    if "." in raw_token:
        user_id_part, secret_part = raw_token.split(".", 1)
        user = db.query(User).filter(User.id == user_id_part).first()
        if user:
            if user.is_email_verified:
                return schemas.VerifyEmailResponse(
                    status="success",
                    message="Your email address is already verified.",
                    email=user.email,
                    is_verified=True,
                )
            # Verify secret hash
            hashed_secret = email_service.hash_token(secret_part)
            if user.email_verification_token != hashed_secret:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired verification token. Please request a new verification email.",
                )
    else:
        # Fallback to direct token hash lookup
        hashed_token = email_service.hash_token(raw_token)
        user = db.query(User).filter(User.email_verification_token == hashed_token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token. Please request a new verification email.",
        )

    # Check expiration (24 hours)
    now = datetime.now(timezone.utc)
    if user.email_verification_expires_at:
        exp = user.email_verification_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification link has expired (24-hour validity limit). Please request a new verification email.",
            )

    # If already verified
    if user.is_email_verified:
        return schemas.VerifyEmailResponse(
            status="success",
            message="Your email address is already verified.",
            email=user.email,
            is_verified=True,
        )

    # Set as verified and clear tokens immediately (one-time process)
    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.commit()
    db.refresh(user)

    logger.info("Successfully verified email for user %s (%s)", user.email, user.id)

    return schemas.VerifyEmailResponse(
        status="success",
        message="Email verified successfully! You now have full access to order medicines and manage prescriptions.",
        email=user.email,
        is_verified=True,
    )


@router.post("/resend-verification", response_model=schemas.ResendVerificationResponse)
def resend_verification(payload: schemas.ResendVerificationRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    # One-time verification rule: If already verified, never send another verification email
    if user.is_email_verified:
        return schemas.ResendVerificationResponse(
            status="already_verified",
            message=f"The email address {user.email} is already verified. No further verification emails are needed.",
            already_verified=True,
        )

    # Rate limiting protection: 60-second debounce between requests
    now = datetime.now(timezone.utc)
    if user.email_verification_expires_at:
        exp = user.email_verification_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        # 24h expiration was set; if expires_at - now > 23 hours 59 mins, wait cooldown
        time_left = exp - now
        if time_left > timedelta(hours=23, minutes=59):
            elapsed_sec = int((timedelta(hours=24) - time_left).total_seconds())
            wait_sec = max(1, 60 - elapsed_sec)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {wait_sec} seconds before requesting another verification email.",
            )

    # Generate fresh 24h token with user id
    raw_token, hashed_token = email_service.generate_verification_token(user_id=user.id)
    user.email_verification_token = hashed_token
    user.email_verification_expires_at = now + timedelta(hours=24)
    db.commit()

    # Dispatch email
    sent = email_service.send_verification_email(
        to_email=user.email,
        user_name=user.name,
        raw_token=raw_token,
    )

    if sent:
        return schemas.ResendVerificationResponse(
            status="success",
            message=f"A fresh verification email has been sent to {user.email}. Please check your inbox and spam folder.",
            already_verified=False,
            delivery_status="sent",
        )
    else:
        return schemas.ResendVerificationResponse(
            status="warning",
            message=f"Verification link generated for {user.email}. If using test mode, please verify delivery settings or check server logs.",
            already_verified=False,
            delivery_status="logged_fallback",
        )


@router.post("/forgot-password", response_model=schemas.ForgotPasswordResponse)
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email_clean).first()

    # For privacy/security, if user does not exist, return standard generic message
    if not user:
        return schemas.ForgotPasswordResponse(
            status="success",
            message="If an account exists with this email, a password reset link has been dispatched to your inbox.",
        )

    # Rate limiting: 60s cooldown if a reset request was sent in the last 60s
    now = datetime.now(timezone.utc)
    if user.password_reset_expires_at:
        exp = user.password_reset_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        # Token validity is 1 hour; if exp - now > 59 minutes, wait 60s
        time_left = exp - now
        if time_left > timedelta(minutes=59):
            elapsed_sec = int((timedelta(hours=1) - time_left).total_seconds())
            wait_sec = max(1, 60 - elapsed_sec)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {wait_sec} seconds before requesting another password reset email.",
            )

    # Generate fresh 1-hour reset token with user_id
    raw_token, hashed_token = email_service.generate_verification_token(user_id=user.id)
    user.password_reset_token = hashed_token
    user.password_reset_expires_at = now + timedelta(hours=1)
    db.commit()

    # Dispatch email
    email_service.send_password_reset_email(
        to_email=user.email,
        user_name=user.name,
        raw_token=raw_token,
    )

    return schemas.ForgotPasswordResponse(
        status="success",
        message=f"A password reset link has been sent to {user.email}. Please check your inbox and spam folder (valid for 1 hour).",
    )


@router.post("/reset-password", response_model=schemas.ResetPasswordResponse)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    raw_token = payload.token.strip()
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is required.",
        )

    user: Optional[User] = None

    if "." in raw_token:
        user_id_part, secret_part = raw_token.split(".", 1)
        user = db.query(User).filter(User.id == user_id_part).first()
        if user:
            hashed_secret = email_service.hash_token(secret_part)
            if user.password_reset_token != hashed_secret:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired password reset link. Please request a new link.",
                )
    else:
        hashed_token = email_service.hash_token(raw_token)
        user = db.query(User).filter(User.password_reset_token == hashed_token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link. Please request a new link.",
        )

    # Check 1-hour expiration
    now = datetime.now(timezone.utc)
    if user.password_reset_expires_at:
        exp = user.password_reset_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This password reset link has expired (1-hour validity limit). Please request a new link.",
            )

    # Update password and clear reset tokens
    user.hashed_password = security.get_password_hash(payload.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    db.commit()
    db.refresh(user)

    logger.info("Successfully reset password for user %s (%s)", user.email, user.id)

    return schemas.ResetPasswordResponse(
        status="success",
        message="Your password has been updated successfully! You can now sign in with your new password.",
    )


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


