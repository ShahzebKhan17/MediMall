r"""
MediMall Developer Tool: Inspect Registered Users
Works seamlessly with both local SQLite and remote PostgreSQL databases.
Usage:
    cd Backend
    .\.venv\Scripts\python.exe list_users.py
"""
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models import User

def display_users():
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.created_at.desc()).all()
        
        total_count = len(users)
        patient_count = sum(1 for u in users if u.role == "patient")
        pharmacy_count = sum(1 for u in users if u.role == "pharmacy")
        
        print("\n" + "=" * 90)
        print("                        MEDIMALL REGISTERED USERS")
        print("=" * 90)
        print(f"Total Registered Users : {total_count}")
        print(f"Patients (Customers)   : {patient_count}")
        print(f"Pharmacies / Stores    : {pharmacy_count}")
        print("-" * 90)
        print(f"{'Role':<10} | {'Name':<24} | {'Email':<30} | {'Phone':<16}")
        print("-" * 90)
        
        for u in users:
            role = u.role or "patient"
            name = (u.name or "N/A")[:23]
            email = (u.email or "N/A")[:29]
            phone = (u.phone or "-")[:15]
            print(f"{role:<10} | {name:<24} | {email:<30} | {phone:<16}")

            
        print("=" * 90 + "\n")
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    display_users()

