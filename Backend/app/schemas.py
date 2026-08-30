from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# Auth/User schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    allergies: Optional[str] = None
    blood_group: Optional[str] = None
    role: str = "patient"  # "patient" or "pharmacy"
    medical_license: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserProfile(BaseModel):
    id: str
    email: EmailStr
    name: str
    age: Optional[int]
    gender: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    allergies: Optional[str]
    blood_group: Optional[str]
    role: str
    medical_license: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_email_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    allergies: Optional[str] = None
    blood_group: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    token: str


class VerifyEmailResponse(BaseModel):
    status: str = "success"
    message: str
    email: Optional[str] = None
    is_verified: bool = True


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    status: str = "success"
    message: str
    already_verified: bool = False
    delivery_status: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    status: str = "success"
    message: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=4)


class ResetPasswordResponse(BaseModel):
    status: str = "success"
    message: str



# Medicine schemas
class MedicineResponse(BaseModel):
    id: int
    name: str
    brand: str
    price: int
    type: str
    rx: bool
    color: str
    image_url: Optional[str] = None
    packaging_type: Optional[str] = None
    salt_composition: Optional[str] = None
    stock: int
    expiry_date: Optional[str] = None
    manufacturing_date: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MedicineCreate(BaseModel):
    name: str
    brand: str
    price: int
    type: str
    rx: bool = False
    color: str = "blue"
    image_url: Optional[str] = None
    packaging_type: Optional[str] = None
    salt_composition: Optional[str] = None
    stock: int = 100
    expiry_date: Optional[str] = None
    manufacturing_date: Optional[str] = None


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[int] = None
    type: Optional[str] = None
    rx: Optional[bool] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    packaging_type: Optional[str] = None
    stock: Optional[int] = None
    expiry_date: Optional[str] = None
    manufacturing_date: Optional[str] = None


# Order schemas
class OrderItemCreate(BaseModel):
    medicine_id: int
    quantity: int


class OrderItemSchema(BaseModel):
    id: int
    medicine_id: int
    name: str
    brand: str
    quantity: int
    price: int

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    payment_method: str
    address: Optional[str] = None
    prescription_name: Optional[str] = None
    idempotency_key: Optional[str] = None
    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    id: str
    user_id: str
    pharmacy_id: Optional[str] = None
    patient_name: Optional[str] = "Customer"
    patient_phone: Optional[str] = None
    pharmacy_name: Optional[str] = "Care & Cure Pharmacy"
    status: str
    total: int
    address: str
    payment_method: str
    payment_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    prescription_url: Optional[str] = None
    created_at: datetime
    items: List[OrderItemSchema]

    class Config:
        from_attributes = True



class OrderStatusUpdate(BaseModel):
    status: str  # "Placed", "Confirmed", "Review", "Packing", "Shipped", "Arriving", "Delivered", "Cancelled"


# Prescription schemas
class PrescriptionResponse(BaseModel):
    id: int
    user_id: str
    file_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# Razorpay schemas
class RazorpayOrderCreate(BaseModel):
    items: List[OrderItemCreate]
    address: Optional[str] = None
    prescription_name: Optional[str] = None


class RazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int  # Amount in paise (e.g. 50000 for ₹500)
    currency: str = "INR"
    key_id: str


class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    items: List[OrderItemCreate]
    address: Optional[str] = None
    prescription_name: Optional[str] = None
    payment_method: str = "Razorpay"
    idempotency_key: Optional[str] = None
