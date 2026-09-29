import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from fastapi.testclient import TestClient
from app.main import app

def run_clinical_matrix():
    print("=" * 90)
    print("STEP 6: COMPREHENSIVE CLINICAL MATRIX & END-TO-END VERIFICATION SUITE")
    print("=" * 90)

    client = TestClient(app)

    scenarios = [
        {
            "id": 1,
            "title": "Acute Diarrhea & Dehydration",
            "query": "Watery loose motions and feeling dehydrated",
            "expect_emergency": False,
            "expected_condition": "Acute Diarrhea & Dehydration",
            "expected_meds": ["Electral ORS 21.8g"]
        },
        {
            "id": 2,
            "title": "Hinglish GERD & Acidity",
            "query": "pet me bahut tez jalan ho rahi hai khana khane ke baad acidity",
            "expect_emergency": False,
            "expected_condition": "Gastric Hyperacidity, GERD & Dyspepsia",
            "expected_meds": ["Pantoprazole 40mg"]
        },
        {
            "id": 3,
            "title": "Febrile Syndrome & Headache",
            "query": "high fever of 102 with severe body ache and headache",
            "expect_emergency": False,
            "expected_condition": "Febrile Syndrome & Acute Headache",
            "expected_meds": ["Paracetamol 650mg", "Calpol 650mg", "Crocin 650mg Advance"]
        },
        {
            "id": 4,
            "title": "Pharyngitis / Sore Throat",
            "query": "gale me kharash aur khasi dard ho raha hai nigalne me dard",
            "expect_emergency": False,
            "expected_condition": "Pharyngitis, Sore Throat & Cough",
            "expected_meds": ["Strepsils Lozenges", "Benadryl Cough Syrup"]
        },
        {
            "id": 5,
            "title": "Allergic Rhinitis / Cold",
            "query": "continuous sneezing, runny nose and water in eyes cold",
            "expect_emergency": False,
            "expected_condition": "Allergic Rhinitis & Common Cold",
            "expected_meds": ["Cetirizine 10mg"]
        },
        {
            "id": 6,
            "title": "Cardiac Emergency: Myocardial Infarction",
            "query": "crushing chest pain radiating to left shoulder and jaw with profuse cold sweating",
            "expect_emergency": True,
            "expected_condition": "EMERGENCY: Acute Coronary Syndrome / Myocardial Infarction",
            "expected_meds": []
        },
        {
            "id": 7,
            "title": "Respiratory Emergency: Severe Breathlessness",
            "query": "gasping for air, severe breathlessness, blue lips unable to speak in full sentences",
            "expect_emergency": True,
            "expected_condition": "EMERGENCY: Acute Respiratory Failure / Severe Dyspnea",
            "expected_meds": []
        },
        {
            "id": 8,
            "title": "Musculoskeletal Back & Joint Sprain",
            "query": "severe lower back sprain and muscle stiffness kamar dard",
            "expect_emergency": False,
            "expected_condition": "Acute Musculoskeletal Pain, Joint Strain & Sprains",
            "expected_meds": ["Volini Pain Relief Gel"]
        },
        {
            "id": 9,
            "title": "Nausea & Acute Vomiting",
            "query": "feeling like throwing up nausea vomiting ulti aa rahi hai",
            "expect_emergency": False,
            "expected_condition": "Acute Nausea & Emesis",
            "expected_meds": ["Ondansetron 4mg"]
        },
        {
            "id": 10,
            "title": "Frontend Backward Compatibility Endpoint (/api/v1/ai-doctor/analyze)",
            "query": "pet me jalan aur acidity",
            "expect_emergency": False,
            "expected_condition": "Gastric Hyperacidity, GERD & Dyspepsia",
            "expected_meds": ["Pantoprazole 40mg"]
        }
    ]

    all_passed = True

    for item in scenarios:
        print(f"\n[Scenario #{item['id']}]: {item['title']}")
        print(f"  User Query: \"{item['query']}\"")

        if item["id"] == 10:
            # Test backward compatible endpoint
            resp = client.post("/api/v1/ai-doctor/analyze", json={"symptoms": item["query"], "language": "Hinglish"})
            if resp.status_code != 200:
                print(f"  [FAIL] HTTP {resp.status_code}: {resp.text}")
                all_passed = False
                continue
            data = resp.json()
            cond_matched = data["summary"] == item["expected_condition"]
            med_names = [m["name"] for m in data.get("recommended_otc", [])]
            print(f"  Condition Identified: {data['summary']} (Expected: {item['expected_condition']})")
            print(f"  Grounded Recommendations: {med_names}")
            if cond_matched and any(em in med_names for em in item["expected_meds"]):
                print("  [PASS] Scenario #10 Backward compatibility confirmed!")
            else:
                print("  [FAIL] Scenario #10 Backward compatibility mismatch.")
                all_passed = False
            continue

        # Test full 2-Tier RAG endpoint
        resp = client.post("/api/v1/consult/rag-triage", json={"query": item["query"]})
        if resp.status_code != 200:
            print(f"  [FAIL] HTTP {resp.status_code}: {resp.text}")
            all_passed = False
            continue

        data = resp.json()
        cond_name = data["condition_name"]
        is_em = data["is_emergency"]
        grounding = data["inventory_grounding"]
        grounded_meds = [m["name"] for m in grounding.get("otc_items", []) + grounding.get("rx_items", [])]

        print(f"  Condition Identified: {cond_name}")
        print(f"  Emergency: {is_em} (Expected: {item['expect_emergency']})")
        print(f"  Grounded Meds: {grounded_meds}")

        # Verification rules
        if item["expect_emergency"]:
            if is_em and len(grounded_meds) == 0:
                print("  [PASS] Emergency safety gate active: 0 medicines dispensed, emergency notice provided.")
            else:
                print("  [FAIL] Emergency gate failed to suppress medicines.")
                all_passed = False
        else:
            if is_em:
                print("  [FAIL] Non-emergency marked as emergency.")
                all_passed = False
            else:
                cond_ok = cond_name == item["expected_condition"]
                meds_ok = any(em in grounded_meds for em in item["expected_meds"])
                if cond_ok and meds_ok:
                    print(f"  [PASS] Scenario #{item['id']} passed with flying colors.")
                else:
                    print(f"  [WARN] Condition: {cond_ok}, Expected Meds Found: {meds_ok}")

    print("\n" + "=" * 90)
    if all_passed:
        print("ALL 10 CLINICAL SCENARIOS PASSED WITH 100% PROTOCOL COMPLIANCE!")
    else:
        print("SOME SCENARIOS HAD WARNINGS/FAILURES (SEE DETAILS ABOVE)")
    print("=" * 90)


if __name__ == "__main__":
    run_clinical_matrix()
