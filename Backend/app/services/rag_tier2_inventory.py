import re
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models import Medicine
from app.services.rag_tier1_clinical import ClinicalTriageResult

logger = logging.getLogger("medimall.rag_tier2")


class MedicineSummary(BaseModel):
    id: int
    name: str
    brand: str
    price: int
    rx: bool
    in_stock: bool
    stock: int
    salt_composition: Optional[str] = None
    image_url: Optional[str] = None
    packaging_type: Optional[str] = None
    color: str = "blue"
    pharmacy_name: str = "MediMall Certified Pharmacy"


class SaltGroundingGroup(BaseModel):
    target_salt: str
    clinical_purpose: str
    matched: bool
    available_options: List[MedicineSummary] = []
    cheapest_option: Optional[MedicineSummary] = None


class InventoryGroundingResult(BaseModel):
    is_emergency: bool
    emergency_notice: Optional[str] = None
    condition_name: str
    urgency_level: str
    clinical_summary: str
    red_flags: Optional[str] = None
    contraindications: Optional[str] = None
    lifestyle_advice: List[str] = []
    salt_groups: List[SaltGroundingGroup] = []
    otc_items: List[MedicineSummary] = []
    rx_items: List[MedicineSummary] = []
    total_items_found: int = 0
    fulfillment_possible: bool = False
    warnings: List[str] = []


# Common salt synonyms & brand keywords for robust catalog matching
SALT_SYNONYMS = {
    "paracetamol": ["paracetamol", "acetaminophen", "dolo", "calpol", "crocin"],
    "oral rehydration salts": ["oral rehydration salts", "ors", "electral", "rehydration"],
    "loperamide": ["loperamide", "imodium", "lopamide"],
    "ondansetron": ["ondansetron", "emeset", "antiemetic"],
    "cetirizine": ["cetirizine", "cetzine", "alerid"],
    "levocetirizine": ["levocetirizine", "levocet", "teczine"],
    "pantoprazole": ["pantoprazole", "pan-40", "pantocid"],
    "rabeprazole": ["rabeprazole", "razo"],
    "diclofenac": ["diclofenac", "volini"],
    "strepsils": ["dichlorobenzyl", "amylmetacresol", "strepsils"],
    "diphenhydramine": ["diphenhydramine", "benadryl", "ammonium chloride"],
    "cholecalciferol": ["cholecalciferol", "vitamin d3", "uprise"],
    "amoxicillin": ["amoxicillin", "mox", "augmentin"],
    "montelukast": ["montelukast", "montair"]
}


COMMON_COUNTERIONS = {
    "hydrochloride", "hcl", "sodium", "potassium", "calcium", "maleate", "succinate",
    "tartrate", "hydrate", "trihydrate", "monohydrate", "citrate", "chloride",
    "gastro", "resistant", "modified", "release", "extended", "syrup", "tablet", "tablets", "capsule", "capsules"
}

def _extract_core_salt_tokens(salt_str: str) -> List[str]:
    """Extract clean distinctive words from salt string, ignoring dosages, bracketed units, and common counterions."""
    cleaned = re.sub(r"\([^)]*\)", " ", salt_str)
    cleaned = re.sub(r"\b\d+([a-zA-Z]+)?\b", " ", cleaned)
    cleaned = re.sub(r"[^\w\s]", " ", cleaned).lower()
    raw_tokens = [word for word in cleaned.split() if len(word) > 2]
    # Filter out counterions unless all tokens are counterions
    filtered = [t for t in raw_tokens if t not in COMMON_COUNTERIONS]
    return filtered if filtered else raw_tokens


class Tier2FormularyMatcher:
    """
    Tier-2 Inventory Grounding & Formulary Matcher:
    Takes clinical triage recommendations from Tier-1 and grounds them
    against real-time pharmacy inventory from the Medicine table.
    Enforces strict safety checks:
    - Emergency queries suppress all drug sales.
    - Rx medicines are tagged with prescription requirements.
    - Matches active salts and provides budget / branded alternatives.
    """

    def __init__(self, db: Session):
        self.db = db

    def ground_triage(self, triage: ClinicalTriageResult) -> InventoryGroundingResult:
        """
        Main grounding method for a Tier-1 clinical triage result.
        """
        # 1. Critical Emergency Protocol Check
        if triage.is_emergency:
            logger.warning(
                f"[SAFETY GATE ACTIVATED] Emergency condition detected: '{triage.condition_name}'. "
                "Suppressing all medicine recommendations."
            )
            return InventoryGroundingResult(
                is_emergency=True,
                emergency_notice=(
                    "CRITICAL EMERGENCY ALERT: Your symptoms suggest an urgent, potentially life-threatening "
                    "medical emergency. Please do NOT attempt self-medication. Call emergency services "
                    "(108 or 112 in India) or immediately visit the nearest emergency trauma center."
                ),
                condition_name=triage.condition_name,
                urgency_level=triage.urgency_level,
                clinical_summary=triage.clinical_summary,
                red_flags=triage.red_flags,
                contraindications=triage.contraindications,
                lifestyle_advice=triage.lifestyle_advice,
                salt_groups=[],
                otc_items=[],
                rx_items=[],
                total_items_found=0,
                fulfillment_possible=False,
                warnings=[
                    "Emergency protocol active: Automated medicine dispensing has been blocked for patient safety."
                ]
            )

        # 2. Fetch all medicines currently in catalog
        all_medicines = self.db.query(Medicine).all()

        salt_groups: List[SaltGroundingGroup] = []
        all_matched_otc: List[MedicineSummary] = []
        all_matched_rx: List[MedicineSummary] = []
        seen_med_ids = set()
        warnings = []

        if not triage.target_salts:
            warnings.append("No pharmacological active salts indicated for this condition. Supportive care recommended.")

        # 3. Match each target salt against pharmacy inventory
        for salt_info in triage.target_salts:
            salt_name = salt_info.get("salt", "")
            purpose = salt_info.get("purpose", "")

            matched_meds = self._find_matching_medicines(salt_name, all_medicines)
            med_summaries = [self._to_summary(m) for m in matched_meds]

            # Sort options: in-stock first, then by price ascending (cheapest / best generic first)
            med_summaries.sort(key=lambda x: (not x.in_stock, x.price))

            cheapest = next((m for m in med_summaries if m.in_stock), None)

            group = SaltGroundingGroup(
                target_salt=salt_name,
                clinical_purpose=purpose,
                matched=len(med_summaries) > 0,
                available_options=med_summaries,
                cheapest_option=cheapest
            )
            salt_groups.append(group)

            # Categorize into OTC vs Rx
            for med in med_summaries:
                if med.id not in seen_med_ids:
                    seen_med_ids.add(med.id)
                    if med.rx:
                        all_matched_rx.append(med)
                    else:
                        all_matched_otc.append(med)

            if not med_summaries:
                warnings.append(f"No in-stock formulation currently found for salt: '{salt_name}'.")

        total_items = len(seen_med_ids)
        fulfillment = any(g.matched and g.cheapest_option is not None for g in salt_groups)

        return InventoryGroundingResult(
            is_emergency=False,
            emergency_notice=None,
            condition_name=triage.condition_name,
            urgency_level=triage.urgency_level,
            clinical_summary=triage.clinical_summary,
            red_flags=triage.red_flags,
            contraindications=triage.contraindications,
            lifestyle_advice=triage.lifestyle_advice,
            salt_groups=salt_groups,
            otc_items=all_matched_otc,
            rx_items=all_matched_rx,
            total_items_found=total_items,
            fulfillment_possible=fulfillment,
            warnings=warnings
        )

    def _find_matching_medicines(self, salt_name: str, medicines: List[Medicine]) -> List[Medicine]:
        """
        Matches a given target salt string against catalog medicines
        using exact composition, token containment, and synonym expansion.
        """
        salt_tokens = _extract_core_salt_tokens(salt_name)
        matched = []

        # Find synonyms for any of the tokens
        expanded_keywords = set(salt_tokens)
        for token in salt_tokens:
            for key, syns in SALT_SYNONYMS.items():
                if token in key or key in token:
                    expanded_keywords.update(syns)

        for med in medicines:
            med_text = f"{med.name} {med.brand} {med.salt_composition or ''}".lower()
            
            # Check 1: direct substring of any expanded synonym
            hit = False
            for kw in expanded_keywords:
                if kw in med_text:
                    hit = True
                    break

            # Check 2: all core salt tokens present in medicine composition/name
            if not hit and salt_tokens:
                if all(tok in med_text for tok in salt_tokens):
                    hit = True

            if hit:
                matched.append(med)

        return matched

    @staticmethod
    def _to_summary(m: Medicine) -> MedicineSummary:
        return MedicineSummary(
            id=m.id,
            name=m.name,
            brand=m.brand,
            price=m.price,
            rx=m.rx,
            in_stock=(m.stock > 0),
            stock=m.stock,
            salt_composition=m.salt_composition,
            image_url=m.image_url,
            packaging_type=m.packaging_type,
            color=m.color,
            pharmacy_name=m.pharmacy_name
        )
