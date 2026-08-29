"""
MediMall Clean Database Reset Script
------------------------------------
This script resets the MediMall database into a 100% fresh state:
- Drops and recreates all tables with the full updated schema.
- Clears all test users, orders, prescriptions, and test pharmacies.
- Populates ONLY the default medicine catalog.
- Leaves zero dummy users or dummy pharmacies.
"""

import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine, SessionLocal
from app.models import User, Medicine, Order, OrderItem, PrescriptionRecord
from app.api.endpoints.medicines import DEFAULT_MEDICINES


def reset_database():
    print("==================================================")
    print("      MEDIMALL CLEAN DATABASE RESET SCRIPT        ")
    print("==================================================")

    # 1. Drop and Recreate All Tables with Complete Schema
    print("\n[1/3] Dropping old tables and recreating full schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("  [OK] Tables created successfully with all columns intact.")

    # 2. Seed Medicines Catalog Only
    print("\n[2/3] Seeding default medicines catalog...")
    db = SessionLocal()
    try:
        seeded_count = 0
        for med_data in DEFAULT_MEDICINES:
            med = Medicine(**med_data)
            db.add(med)
            seeded_count += 1
        db.commit()
        print(f"  [OK] Seeded {seeded_count} medicines into catalog.")
    except Exception as e:
        db.rollback()
        print(f"  [ERROR] Error seeding medicines: {e}")
        raise
    finally:
        db.close()

    # 3. Verification
    print("\n[3/3] Verifying clean database state...")
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        order_count = db.query(Order).count()
        prescription_count = db.query(PrescriptionRecord).count()
        med_count = db.query(Medicine).count()

        print("--------------------------------------------------")
        print(f"  * Registered Users (Patients & Pharmacies) : {user_count} (Fresh start)")
        print(f"  * Total Active/Historic Orders             : {order_count} (Empty)")
        print(f"  * Uploaded Prescriptions                   : {prescription_count} (Empty)")
        print(f"  * Medicine Catalog Items                   : {med_count} (Ready)")
        print("--------------------------------------------------")

        if user_count == 0 and order_count == 0 and med_count > 0:
            print("\n*** DATABASE RESET COMPLETED SUCCESSFULLY! ***")
        else:
            print("\nWarning: Unexpected record counts found.")
    finally:
        db.close()


if __name__ == "__main__":
    reset_database()
