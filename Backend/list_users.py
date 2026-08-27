r"""
MediMall Developer Tool: Inspect Registered Users
Usage:
    cd Backend
    .\.venv\Scripts\python.exe list_users.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "medimall.db")

def display_users():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    cur.execute("SELECT id, name, email, role, phone, address, created_at FROM users ORDER BY created_at DESC")
    users = cur.fetchall()
    
    total_count = len(users)
    patient_count = sum(1 for u in users if u[3] == "patient")
    pharmacy_count = sum(1 for u in users if u[3] == "pharmacy")
    
    print("\n" + "=" * 80)
    print("                      MEDIMALL REGISTERED USERS")
    print("=" * 80)
    print(f"Total Registered Users : {total_count}")
    print(f"Patients               : {patient_count}")
    print(f"Pharmacies / Stores    : {pharmacy_count}")
    print("-" * 80)
    print(f"{'Role':<10} | {'Name':<24} | {'Email':<30} | {'Phone':<15}")
    print("-" * 80)
    
    for u in users:
        role = u[3] or "N/A"
        name = (u[1] or "N/A")[:23]
        email = (u[2] or "N/A")[:29]
        phone = (u[4] or "—")[:14]
        print(f"{role:<10} | {name:<24} | {email:<30} | {phone:<15}")
        
    print("=" * 80 + "\n")
    conn.close()

if __name__ == "__main__":
    display_users()
