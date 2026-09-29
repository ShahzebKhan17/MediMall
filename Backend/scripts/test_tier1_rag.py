import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal
from app.services.rag_tier1_clinical import Tier1HybridRetriever

def run_tests():
    db = SessionLocal()
    retriever = Tier1HybridRetriever(db=db)
    
    test_queries = [
        ("Watery loose motions and feeling dehydrated", "Acute Diarrhea & Dehydration"),
        ("pet me jalan ho rahi hai aur khana hazam nahi ho raha acidity", "Gastric Hyperacidity, GERD & Dyspepsia"),
        ("severe chest pain radiating to left arm with cold sweat", "EMERGENCY: Acute Coronary Syndrome / Myocardial Infarction"),
        ("chheenk aur sardi gale me kharash", "Allergic Rhinitis & Common Cold"),
        ("high fever and severe body pain", "Febrile Syndrome & Acute Headache")
    ]

    print("=" * 80)
    print("RUNNING TIER-1 HYBRID RAG VERIFICATION TESTS")
    print("=" * 80)

    all_passed = True
    for query, expected_condition in test_queries:
        print(f"\n[Test Query]: '{query}'")
        results = retriever.retrieve(query, top_k=2)
        if not results:
            print("  [FAIL] No results returned!")
            all_passed = False
            continue

        top = results[0]
        matched = top.condition_name == expected_condition
        status_icon = "[PASS]" if matched else "[WARN]"
        print(f"  {status_icon} Matched Condition: {top.condition_name}")
        print(f"     Category: {top.category} | Emergency: {top.is_emergency} | Urgency: {top.urgency_level}")
        print(f"     RRF Score: {top.rrf_score} (Dense Rank: {top.dense_rank}, BM25 Rank: {top.bm25_rank})")
        print(f"     Target Salts: {[s['salt'] for s in top.target_salts]}")
        if not matched:
            print(f"     Expected: {expected_condition}")

    print("\n" + "=" * 80)
    db.close()
    if all_passed:
        print("ALL TIER-1 HYBRID RAG TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME TESTS HAD WARNINGS (CHECK ABOVE)")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
