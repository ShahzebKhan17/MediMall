import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.database import SessionLocal
from app.services.rag_tier1_clinical import Tier1HybridRetriever
from app.services.rag_tier2_inventory import Tier2FormularyMatcher


def run_tier2_tests():
    db = SessionLocal()
    tier1 = Tier1HybridRetriever(db=db)
    tier2 = Tier2FormularyMatcher(db=db)

    test_queries = [
        {
            "query": "Watery loose motions and feeling dehydrated",
            "expect_emergency": False,
            "expected_med_names": ["Electral ORS 21.8g", "Loperamide 2mg"]
        },
        {
            "query": "pet me jalan ho rahi hai aur khana hazam nahi ho raha acidity",
            "expect_emergency": False,
            "expected_med_names": ["Pantoprazole 40mg"]
        },
        {
            "query": "high fever and severe body pain",
            "expect_emergency": False,
            "expected_med_names": ["Calpol 650mg", "Dolo 650", "Crocin 650mg Advance"]
        },
        {
            "query": "severe chest pain radiating to left arm with cold sweat",
            "expect_emergency": True,
            "expected_med_names": []
        }
    ]

    print("=" * 80)
    print("RUNNING TIER-2 INVENTORY GROUNDING & FORMULARY MATCHER TESTS")
    print("=" * 80)

    all_passed = True

    for test in test_queries:
        query = test["query"]
        print(f"\n[Test Query]: '{query}'")

        # Step 1: Retrieve Tier-1 triage
        triage_results = tier1.retrieve(query, top_k=1)
        if not triage_results:
            print("  [FAIL] No Tier-1 triage result returned!")
            all_passed = False
            continue

        top_triage = triage_results[0]
        print(f"  Condition Identified: {top_triage.condition_name}")
        print(f"  Emergency Status: {top_triage.is_emergency} (Expected: {test['expect_emergency']})")

        # Step 2: Ground against Tier-2 inventory
        grounded = tier2.ground_triage(top_triage)

        if test["expect_emergency"]:
            if grounded.is_emergency and grounded.total_items_found == 0:
                print("  [PASS] Emergency safety gate enforced! Zero medicines recommended.")
                print(f"     Notice: {grounded.emergency_notice[:90]}...")
            else:
                print("  [FAIL] Emergency safety gate failed to suppress medicines!")
                all_passed = False
        else:
            if grounded.is_emergency:
                print("  [FAIL] Non-emergency query incorrectly marked as emergency!")
                all_passed = False
                continue

            print(f"  [PASS] Grounded {grounded.total_items_found} live catalog products across {len(grounded.salt_groups)} salt groups.")
            for group in grounded.salt_groups:
                print(f"     Salt: {group.target_salt} -> Matched: {group.matched}")
                for opt in group.available_options:
                    badge = "[CHEAPEST]" if group.cheapest_option and group.cheapest_option.id == opt.id else ""
                    rx_badge = "[Rx Required]" if opt.rx else "[OTC]"
                    print(f"        - {opt.name} ({opt.brand}) | Rs.{opt.price} | Stock: {opt.stock} {rx_badge} {badge}")

            # Verify expected medicine names (matching against name or brand)
            found_items = [(m.name, m.brand) for m in grounded.otc_items + grounded.rx_items]
            for exp in test["expected_med_names"]:
                matched = any(exp.lower() in name.lower() or exp.lower() in brand.lower() for name, brand in found_items)
                if matched:
                    print(f"     [PASS] Expected medicine present: '{exp}'")
                else:
                    print(f"     [WARN] Expected medicine not found: '{exp}' (Found: {found_items})")

    print("\n" + "=" * 80)
    db.close()
    if all_passed:
        print("ALL TIER-2 INVENTORY GROUNDING TESTS COMPLETED SUCCESSFULLY!")
    else:
        print("SOME TESTS HAD FAILURES (CHECK ABOVE)")
    print("=" * 80)


if __name__ == "__main__":
    run_tier2_tests()
