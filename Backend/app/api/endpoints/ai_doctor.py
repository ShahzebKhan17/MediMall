import logging
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Medicine
from app.services.ai_doctor_llm import analyze_patient_symptoms

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

    # 1. Execute LLM clinical analysis (Gemini / OpenAI / Clinical Engine)
    analysis_raw = analyze_patient_symptoms(symptoms=symptoms_text, language=language_text)

    # 2. Enrich recommendations with real inventory from DB
    processed_recommendations: List[RecommendedMedicine] = []
    
    for rec in analysis_raw.get("recommended_otc", []):
        med_name = rec.get("name", "")
        med_brand = rec.get("brand", "")
        
        # Search inventory for exact or partial salt/name match
        db_med = None
        if med_name:
            first_word = med_name.split()[0]
            db_med = db.query(Medicine).filter(
                (Medicine.name.ilike(f"%{first_word}%")) | 
                (Medicine.brand.ilike(f"%{first_word}%"))
            ).first()

        if db_med:
            processed_recommendations.append(
                RecommendedMedicine(
                    id=db_med.id,
                    name=db_med.name,
                    brand=db_med.brand,
                    type=db_med.type,
                    purpose=rec.get("purpose") or db_med.type,
                    requires_rx=db_med.rx,
                    price=db_med.price,
                    image_url=db_med.image_url or rec.get("image_url"),
                    packaging_type=db_med.packaging_type or rec.get("packaging_type")
                )
            )
        else:
            processed_recommendations.append(
                RecommendedMedicine(
                    id=rec.get("id"),
                    name=rec.get("name", "Recommended OTC Medicine"),
                    brand=rec.get("brand"),
                    type=rec.get("type", "General Wellness"),
                    purpose=rec.get("purpose", "Symptomatic relief"),
                    requires_rx=bool(rec.get("requires_rx", False)),
                    price=rec.get("price") or 45,
                    image_url=rec.get("image_url") or "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
                    packaging_type=rec.get("packaging_type") or "Standard Unit Packaging"
                )
            )

    return SymptomAnalysisResponse(
        summary=analysis_raw.get("summary", "Symptom Analysis"),
        condition_overview=analysis_raw.get("condition_overview", "Your symptoms have been analyzed by MediAssist AI."),
        urgency_level=analysis_raw.get("urgency_level", "Low"),
        recommended_otc=processed_recommendations,
        lifestyle_advice=analysis_raw.get("lifestyle_advice", [
            "Stay adequately hydrated throughout the day.",
            "Rest and monitor symptoms closely. If condition worsens, consult a doctor."
        ]),
        disclaimer=analysis_raw.get("disclaimer", "MediAssist provides clinical triage guidance. For worsening symptoms, consult a licensed physician."),
        requires_pharmacist_review=bool(analysis_raw.get("requires_pharmacist_review", False))
    )
