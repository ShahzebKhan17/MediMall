import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.services.rag_orchestrator import UnifiedRAGOrchestrator, PatientContext


def run_pipeline_verification():
    print("=" * 80)
    print("RUNNING END-TO-END RAG ORCHESTRATION PIPELINE TESTS (STEP 5)")
    print("=" * 80)

    db = SessionLocal()
    orchestrator = UnifiedRAGOrchestrator(db=db)
    client = TestClient(app)

    all_passed = True

    # Test Case 1: Direct Python Orchestration (Acute Diarrhea)
    print("\n--- Test Case 1: Direct Orchestrator (Diarrhea & Dehydration) ---")
    res1 = orchestrator.run_pipeline("Watery loose motions and feeling dehydrated")
    print(f"Condition: {res1.condition_name} (Category: {res1.category})")
    print(f"Urgency: {res1.urgency_level} | Emergency: {res1.is_emergency}")
    print(f"Total Grounded Inventory Items: {res1.inventory_grounding.total_items_found}")
    print(f"OTC Items: {[m.name for m in res1.inventory_grounding.otc_items]}")
    if res1.condition_name == "Acute Diarrhea & Dehydration" and not res1.is_emergency:
        print("[PASS] Test Case 1 Orchestration verified.")
    else:
        print("[FAIL] Test Case 1 condition mismatch.")
        all_passed = False

    # Test Case 2: Emergency Safety Gate (Chest Pain)
    print("\n--- Test Case 2: Emergency Safety Suppression (Chest Pain) ---")
    res2 = orchestrator.run_pipeline("severe chest pain radiating to left arm with cold sweat")
    print(f"Condition: {res2.condition_name}")
    print(f"Emergency Flag: {res2.is_emergency}")
    print(f"Grounded Items: {res2.inventory_grounding.total_items_found}")
    if res2.is_emergency and res2.inventory_grounding.total_items_found == 0:
        print("[PASS] Test Case 2 Emergency Safety Gate enforced cleanly.")
    else:
        print("[FAIL] Test Case 2 emergency safety failure.")
        all_passed = False

    # Test Case 3: FastAPI HTTP Endpoint /api/v1/consult/rag-triage
    print("\n--- Test Case 3: FastAPI Endpoint POST /api/v1/consult/rag-triage (Acidity & Heartburn) ---")
    payload = {
        "query": "pet me jalan ho rahi hai aur khana hazam nahi ho raha acidity",
        "language": "Hinglish",
        "patient_age": 32,
        "patient_gender": "Male"
    }
    http_resp = client.post("/api/v1/consult/rag-triage", json=payload)
    print(f"HTTP Status: {http_resp.status_code}")
    if http_resp.status_code == 200:
        data = http_resp.json()
        print(f"Matched Condition: {data['condition_name']}")
        print(f"Urgency Level: {data['urgency_level']}")
        grounding = data["inventory_grounding"]
        print(f"Grounded Meds Found: {grounding['total_items_found']}")
        otc_names = [m["name"] for m in grounding["otc_items"]]
        print(f"OTC Items Available: {otc_names}")
        print(f"AI Markdown snippet:\n{data['ai_summary_markdown'][:200]}...")
        if "Pantoprazole" in str(otc_names):
            print("[PASS] Test Case 3 HTTP API verified.")
        else:
            print("[FAIL] Expected Pantoprazole in inventory grounding.")
            all_passed = False
    else:
        print(f"[FAIL] HTTP error: {http_resp.text}")
        all_passed = False

    # Test Case 4: FastAPI HTTP Endpoint /api/consult/rag-triage (Alternative Prefix)
    print("\n--- Test Case 4: FastAPI Endpoint POST /api/consult/rag-triage (Pain & Fever) ---")
    payload2 = {
        "query": "high fever, severe body ache and headache",
        "patient_age": 28
    }
    http_resp2 = client.post("/api/consult/rag-triage", json=payload2)
    print(f"HTTP Status: {http_resp2.status_code}")
    if http_resp2.status_code == 200:
        data2 = http_resp2.json()
        print(f"Matched Condition: {data2['condition_name']}")
        otc_names2 = [m["name"] for m in data2["inventory_grounding"]["otc_items"]]
        print(f"Grounded Options: {otc_names2}")
        if len(otc_names2) >= 2:
            print("[PASS] Test Case 4 Alternative Prefix & Brand comparison verified.")
        else:
            print("[FAIL] Fewer brand options than expected.")
            all_passed = False
    else:
        print(f"[FAIL] HTTP error: {http_resp2.text}")
        all_passed = False

    print("\n" + "=" * 80)
    db.close()
    if all_passed:
        print("ALL STEP 5 UNIFIED RAG ORCHESTRATION TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME STEP 5 TESTS FAILED (CHECK ABOVE)")
    print("=" * 80)


if __name__ == "__main__":
    run_pipeline_verification()
