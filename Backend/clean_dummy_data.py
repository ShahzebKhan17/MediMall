r"""
MediMall Maintenance Script: Clean Artificial & Dummy Test Data
Removes test/dummy users, test pharmacies, and orphan test orders.
Usage:
    cd Backend
    .\.venv\Scripts\python.exe clean_dummy_data.py
"""
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models import User, Order, OrderItem, PrescriptionRecord

def clean_database():
    db = SessionLocal()
    try:
        # Find dummy/test users
        test_users = db.query(User).filter(
            (User.email.like("%@example.com")) |
            (User.email.like("patient_%")) |
            (User.email.like("pharmacy_%")) |
            (User.email.like("test_%")) |
            (User.name.like("%777d05%")) |
            (User.name.like("%be2058%")) |
            (User.name.like("%cbe403%")) |
            (User.name.like("%ed701c%")) |
            (User.name.like("%c116e6%")) |
            (User.name.like("%db4da2%")) |
            (User.name.like("%587118%")) |
            (User.name == "string") |
            (User.email == "production_test_user@medimall.in")
        ).all()

        deleted_count = len(test_users)
        for u in test_users:
            db.delete(u)

        db.commit()
        print(f"\n[SUCCESS] Successfully removed {deleted_count} dummy/test accounts from the database.")

        remaining = db.query(User).count()
        print(f"[STATUS] Database now contains {remaining} clean, registered user(s).\n")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database cleanup failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
