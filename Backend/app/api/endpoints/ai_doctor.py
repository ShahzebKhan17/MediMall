import logging
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.rag_orchestrator import UnifiedRAGOrchestrator, PatientContext

logger = logging.getLogger("medimall.ai_doctor")
router = APIRouter()


class SymptomRequest(BaseModel):
    symptoms: str
    language: Optional[str] = "English"


class RecommendedMedicine(BaseModel):
    id: Optional[int] = None
    name: str
    brand: Optional[str] = None
    type: str
    purpose: str
    requires_rx: bool = False
    price: Optional[int] = None
    image_url: Optional[str] = None
    packaging_type: Optional[str] = None


class SymptomAnalysisResponse(BaseModel):
    summary: str
    condition_overview: str
    urgency_level: str  # "Low", "Moderate", "High / Urgent"
    recommended_otc: List[RecommendedMedicine]
    lifestyle_advice: List[str]
    disclaimer: str
    requires_pharmacist_review: bool = False


@router.post("/analyze", response_model=SymptomAnalysisResponse)
def analyze_symptoms(payload: SymptomRequest, db: Session = Depends(get_db)) -> SymptomAnalysisResponse:
    symptoms_text = payload.symptoms.strip()
    language_text = payload.language or "English"

    # Execute 2-tier Hybrid RAG Orchestrator
    orchestrator = UnifiedRAGOrchestrator(db=db)
    context = PatientContext(language=language_text)
    rag_result = orchestrator.run_pipeline(query=symptoms_text, patient_context=context)

    # Convert grounded inventory items into RecommendedMedicine
    processed_recommendations: List[RecommendedMedicine] = []
    
    # If not emergency, ground live catalog inventory into recommendation cards
    if not rag_result.is_emergency:
        for med in rag_result.inventory_grounding.otc_items + rag_result.inventory_grounding.rx_items:
            processed_recommendations.append(
                RecommendedMedicine(
                    id=med.id,
                    name=med.name,
                    brand=med.brand,
                    type=med.packaging_type or "Medication",
                    purpose=f"Active Salt: {med.salt_composition or med.name}",
                    requires_rx=med.rx,
                    price=med.price,
                    image_url=med.image_url,
                    packaging_type=med.packaging_type
                )
            )

    overview = (
        rag_result.inventory_grounding.emergency_notice 
        if rag_result.is_emergency 
        else rag_result.inventory_grounding.clinical_summary
    )

    return SymptomAnalysisResponse(
        summary=rag_result.condition_name,
        condition_overview=overview,
        urgency_level=rag_result.urgency_level,
        recommended_otc=processed_recommendations,
        lifestyle_advice=rag_result.inventory_grounding.lifestyle_advice,
        disclaimer=rag_result.disclaimer,
        requires_pharmacist_review=rag_result.is_emergency or any(m.requires_rx for m in processed_recommendations)
    )
