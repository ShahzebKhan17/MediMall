import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
    allergies = Column(String(500), nullable=True)
    blood_group = Column(String(20), nullable=True)
    role = Column(String(50), default="patient", nullable=False)  # "patient" or "pharmacy"
    medical_license = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan", foreign_keys="Order.user_id")
    prescriptions = relationship("PrescriptionRecord", back_populates="user", cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    brand = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)
    type = Column(String(100), nullable=False)
    rx = Column(Boolean, default=False, nullable=False)
    color = Column(String(50), default="blue", nullable=False)
    stock = Column(Integer, default=100, nullable=False)
    expiry_date = Column(String(100), nullable=True)
    manufacturing_date = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


    order_items = relationship("OrderItem", back_populates="medicine")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    pharmacy_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="Placed", nullable=False)  # "Placed", "Confirmed", etc.
    total = Column(Integer, nullable=False)
    address = Column(String(500), nullable=False)
    payment_method = Column(String(100), nullable=False)
    prescription_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    pharmacy = relationship("User", foreign_keys=[pharmacy_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    medicine = relationship("Medicine", back_populates="order_items")

    @property
    def name(self) -> str:
        return self.medicine.name if self.medicine else ""

    @property
    def brand(self) -> str:
        return self.medicine.brand if self.medicine else ""



class PrescriptionRecord(Base):
    __tablename__ = "prescription_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="prescriptions")
