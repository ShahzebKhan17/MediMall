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


# Medicine schemas
class MedicineResponse(BaseModel):
    id: int
    name: str
    brand: str
    price: int
    type: str
    rx: bool
    color: str
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
    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    id: str
    user_id: str
    pharmacy_id: Optional[str] = None
    status: str
    total: int
    address: str
    payment_method: str
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
