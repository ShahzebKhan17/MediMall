import json
import logging
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.services.rag_tier1_clinical import Tier1HybridRetriever, ClinicalTriageResult
from app.services.rag_tier2_inventory import Tier2FormularyMatcher, InventoryGroundingResult

logger = logging.getLogger("medimall.rag_orchestrator")
settings = get_settings()


class PatientContext(BaseModel):
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    allergies: Optional[str] = None
    language: Optional[str] = "English"


class OrchestratedTriageResponse(BaseModel):
    query: str
    condition_name: str
    category: str
    urgency_level: str
    is_emergency: bool
    ai_summary_markdown: str
    inventory_grounding: InventoryGroundingResult
    disclaimer: str = (
        "MediMall AI Triage provides CDSCO-aligned educational guidance based on reported symptoms. "
        "It does not replace personalized evaluation by a certified medical practitioner. "
        "In case of worsening symptoms or severe discomfort, consult a doctor immediately."
    )


SYNTHESIS_SYSTEM_PROMPT = """You are MediAssist AI, the chief clinical intelligence assistant for MediMall India.
You synthesize clinical triage data and pharmacy inventory into clear, empathetic, and actionable patient guidance.

STRICT CLINICAL RULES:
1. STRICT GROUNDING: Never hallucinate or recommend medicines outside the provided Grounded Pharmacy Inventory.
2. EMERGENCY SAFETY: If marked as an emergency, strictly emphasize calling emergency services (108/112 in India) or visiting an emergency department immediately. Do NOT advise home self-medication.
3. LANGUAGE: Respond in the requested language (or friendly Hinglish/English if requested), with an empathetic, respectful, reassuring tone.
4. FORMATTING: Use clean markdown headers, bullet points, and highlight warnings prominently. Mention the active salt name alongside the product brand name."""


class UnifiedRAGOrchestrator:
    """
    Unified 2-Tier Hybrid RAG Orchestrator:
    1. Tier-1 Hybrid Clinical Retriever (Dense pgvector + Sparse BM25 + RRF) identifies condition & target therapeutic salts.
    2. Tier-2 Formulary Matcher grounds salts into live pharmacy inventory and enforces safety gates.
    3. Clinical Synthesis Layer generates empathetic, verified patient guidance using Gemini LLM or deterministic fallback.
    """

    def __init__(self, db: Session):
        self.db = db
        self.tier1 = Tier1HybridRetriever(db=db)
        self.tier2 = Tier2FormularyMatcher(db=db)

    def run_pipeline(
        self,
        query: str,
        patient_context: Optional[PatientContext] = None
    ) -> OrchestratedTriageResponse:
        context = patient_context or PatientContext()
        query_text = query.strip()

        # Step 1: Tier-1 Hybrid Clinical Retrieval
        triage_candidates = self.tier1.retrieve(query_text, top_k=2)

        if not triage_candidates:
            # Fallback if no knowledge chunk was retrieved
            empty_grounding = InventoryGroundingResult(
                is_emergency=False,
                condition_name="General Health Consultation",
                urgency_level="Low",
                clinical_summary="Symptoms could not be conclusively mapped to standard OTC protocols.",
                lifestyle_advice=["Rest, stay hydrated, and consult a qualified medical professional."]
            )
            return OrchestratedTriageResponse(
                query=query_text,
                condition_name="General Medical Consultation",
                category="General",
                urgency_level="Low",
                is_emergency=False,
                ai_summary_markdown=(
                    "### General Medical Guidance\n\n"
                    "We could not conclusively match your specific symptoms to a standard self-care OTC protocol. "
                    "Please provide more details regarding your symptoms, duration, and severity, or consult a licensed physician."
                ),
                inventory_grounding=empty_grounding
            )

        top_triage = triage_candidates[0]

        # Step 2: Tier-2 Inventory Grounding & Safety Gate
        grounding = self.tier2.ground_triage(top_triage)

        # Step 3: Synthesis Layer (LLM with deterministic fallback)
        ai_markdown = self._synthesize_guidance(query_text, top_triage, grounding, context)

        return OrchestratedTriageResponse(
            query=query_text,
            condition_name=top_triage.condition_name,
            category=top_triage.category,
            urgency_level=top_triage.urgency_level,
            is_emergency=top_triage.is_emergency,
            ai_summary_markdown=ai_markdown,
            inventory_grounding=grounding
        )

    def _synthesize_guidance(
        self,
        query: str,
        triage: ClinicalTriageResult,
        grounding: InventoryGroundingResult,
        context: PatientContext
    ) -> str:
        """Attempts Gemini synthesis; falls back to deterministic clinical formatter."""
        gemini_key = settings.gemini_api_key.strip() if settings.gemini_api_key else ""
        if gemini_key:
            llm_text = self._call_gemini_synthesis(query, triage, grounding, context, gemini_key)
            if llm_text:
                return llm_text

        return self._deterministic_synthesis(triage, grounding, context)

    def _call_gemini_synthesis(
        self,
        query: str,
        triage: ClinicalTriageResult,
        grounding: InventoryGroundingResult,
        context: PatientContext,
        api_key: str
    ) -> Optional[str]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        # Build prompt payload with grounded clinical facts
        facts = {
            "patient_query": query,
            "patient_age": context.patient_age,
            "patient_gender": context.patient_gender,
            "patient_allergies": context.allergies,
            "condition_identified": triage.condition_name,
            "category": triage.category,
            "is_emergency": triage.is_emergency,
            "urgency": triage.urgency_level,
            "red_flags": triage.red_flags,
            "contraindications": triage.contraindications,
            "lifestyle_advice": triage.lifestyle_advice,
            "available_medicines": [
                {
                    "name": m.name,
                    "brand": m.brand,
                    "price_inr": m.price,
                    "rx_required": m.rx,
                    "in_stock": m.in_stock
                }
                for m in grounding.otc_items + grounding.rx_items
            ]
        }

        user_content = (
            f"Patient Context & Verified Clinical RAG Facts:\n"
            f"{json.dumps(facts, indent=2)}\n\n"
            f"Generate an empathetic, well-structured clinical explanation for the patient in {context.language or 'English'}. "
            f"If emergency is true, issue urgent warnings and emphasize calling 108/112."
        )

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": SYNTHESIS_SYSTEM_PROMPT},
                        {"text": user_content}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode("utf-8"))
                return result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            logger.warning(f"Gemini synthesis call skipped/failed: {e}. Using deterministic clinical fallback.")
            return None

    def _deterministic_synthesis(
        self,
        triage: ClinicalTriageResult,
        grounding: InventoryGroundingResult,
        context: PatientContext
    ) -> str:
        """Deterministic clinical generator when LLM is unavailable or offline."""
        if triage.is_emergency:
            return (
                f"## 🚨 CRITICAL EMERGENCY ALERT: {triage.condition_name.upper()}\n\n"
                f"**Immediate Action Required:**\n"
                f"- Please call **108** or **112** (Emergency Medical Services) immediately.\n"
                f"- Do **NOT** attempt home self-medication or delay medical intervention.\n"
                f"- Proceed immediately to the nearest Emergency Room or Hospital Trauma Center.\n\n"
                f"### Clinical Red Flags\n"
                f"{triage.red_flags or 'Severe acute symptoms indicating potential systemic danger.'}\n\n"
                f"### Immediate First-Aid & Precautions\n"
                + "\n".join(f"- {advice}" for advice in triage.lifestyle_advice)
            )

        sections = []
        sections.append(f"## Clinical Assessment: {triage.condition_name}")
        sections.append(f"**Triage Level:** {triage.urgency_level} | **Category:** {triage.category}\n")
        sections.append(f"### Overview\n{triage.clinical_summary}\n")

        if grounding.salt_groups:
            sections.append("### Recommended Pharmacological Options (Live Pharmacy Inventory)")
            for group in grounding.salt_groups:
                sections.append(f"#### Active Ingredient: **{group.target_salt}**")
                sections.append(f"*{group.clinical_purpose}*\n")
                if group.available_options:
                    for opt in group.available_options:
                        cheapest_badge = " *(Best Value Generic)*" if group.cheapest_option and group.cheapest_option.id == opt.id else ""
                        rx_text = " [⚠️ Prescription Required]" if opt.rx else " [✅ OTC - Ready to Order]"
                        sections.append(
                            f"- **{opt.name}** ({opt.brand}) — **₹{opt.price}**{cheapest_badge}{rx_text}"
                        )
                else:
                    sections.append("- *No currently stocked brand in local pharmacy. Consult pharmacist for alternate formulation.*")
                sections.append("")

        if triage.lifestyle_advice:
            sections.append("### Supportive Care & Lifestyle Guidelines")
            for advice in triage.lifestyle_advice:
                sections.append(f"- {advice}")
            sections.append("")

        if triage.contraindications:
            sections.append(f"### ⚠️ Contraindications & Cautions\n{triage.contraindications}\n")

        if triage.red_flags:
            sections.append(f"### 🚩 When to See a Doctor (Red Flags)\n{triage.red_flags}\n")

        return "\n".join(sections)
