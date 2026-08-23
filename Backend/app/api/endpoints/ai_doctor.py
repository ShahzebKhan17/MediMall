from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SymptomRequest(BaseModel):
    symptoms: str
    language: Optional[str] = "English"


class RecommendedMedicine(BaseModel):
    name: str
    type: str
    purpose: str
    requires_rx: bool


class SymptomAnalysisResponse(BaseModel):
    summary: str
    condition_overview: str
    urgency_level: str  # "Low", "Moderate", "High / Urgent"
    recommended_otc: List[RecommendedMedicine]
    lifestyle_advice: List[str]
    disclaimer: str
    requires_pharmacist_review: bool


@router.post("/analyze", response_model=SymptomAnalysisResponse)
def analyze_symptoms(payload: SymptomRequest) -> SymptomAnalysisResponse:
    text = payload.symptoms.lower()
    
    recommendations: List[RecommendedMedicine] = []
    lifestyle: List[str] = []
    urgency = "Low"
    overview_parts = []
    requires_rx_review = False

    # Red flag / Emergency detection
    emergency_keywords = ["chest pain", "shortness of breath", "fainting", "severe blood", "difficulty breathing", "heart attack", "unconscious"]
    if any(k in text for k in emergency_keywords):
        return SymptomAnalysisResponse(
            summary="Emergency Symptoms Detected",
            condition_overview="Your symptoms may indicate a potentially urgent medical condition that requires immediate emergency medical evaluation.",
            urgency_level="High / Urgent",
            recommended_otc=[],
            lifestyle_advice=[
                "Seek immediate emergency room care or dial emergency medical services.",
                "Do not attempt self-medication for severe chest or respiratory distress."
            ],
            disclaimer="CRITICAL: MediAssist is an automated triage tool, not a doctor. Immediate in-person medical care is required.",
            requires_pharmacist_review=True
        )

    # Symptom parsing
    if any(k in text for k in ["fever", "headache", "body ache", "pain", "temperature"]):
        overview_parts.append("Mild febrile / pain symptoms")
        recommendations.append(
            RecommendedMedicine(
                name="Paracetamol 650mg (Dolo 650)",
                type="Pain relief & Antipyretic",
                purpose="Relief from fever, headaches, and mild body aches",
                requires_rx=False
            )
        )
        lifestyle.append("Stay well hydrated with warm water and electrolytes.")
        lifestyle.append("Ensure adequate rest and monitor temperature every 4-6 hours.")

    if any(k in text for k in ["cold", "sneezing", "runny nose", "allergy", "itchy", "congestion", "cough"]):
        overview_parts.append("Upper respiratory / allergic rhinitis symptoms")
        recommendations.append(
            RecommendedMedicine(
                name="Cetirizine 10mg (Cetzine)",
                type="Allergy care / Antihistamine",
                purpose="Relieves sneezing, runny nose, and allergic reactions",
                requires_rx=False
            )
        )
        lifestyle.append("Steam inhalation twice daily can help clear nasal congestion.")
        lifestyle.append("Avoid cold drinks, dust, and known allergens.")

    if any(k in text for k in ["weakness", "fatigue", "tired", "energy", "bone", "joint"]):
        overview_parts.append("General fatigue & nutritional support indication")
        recommendations.append(
            RecommendedMedicine(
                name="Vitamin D3 60K (Uprise-D3)",
                type="Vitamins & Nutrition",
                purpose="Supports bone health, immunity, and overall energy levels",
                requires_rx=False
            )
        )
        lifestyle.append("Maintain a balanced diet rich in leafy greens, proteins, and citrus fruits.")

    if any(k in text for k in ["infection", "throat pain", "tonsil", "pus", "bacterial", "severe"]):
        overview_parts.append("Potential bacterial infection requiring clinical diagnosis")
        recommendations.append(
            RecommendedMedicine(
                name="Amoxicillin 500mg (Mox 500)",
                type="Antibiotic (Schedule H)",
                purpose="Prescription antibiotic for bacterial infections",
                requires_rx=True
            )
        )
        requires_rx_review = True
        urgency = "Moderate"
        lifestyle.append("Antibiotics must only be taken after pharmacist validation and doctor's prescription.")

    if not recommendations:
        overview_parts.append("General non-specific wellness symptoms")
        recommendations.append(
            RecommendedMedicine(
                name="Consult Pharmacist",
                type="Pharmacist Verification",
                purpose="Personalized review of your symptoms by a nearby licensed chemist",
                requires_rx=False
            )
        )
        lifestyle.append("Keep a log of when symptoms started and drink plenty of fluids.")

    overview_text = " · ".join(overview_parts) + ". MediAssist has structured your symptoms for licensed pharmacist validation."
    
    return SymptomAnalysisResponse(
        summary=f"Analysis of {len(recommendations)} health indicator(s)",
        condition_overview=overview_text,
        urgency_level=urgency,
        recommended_otc=recommendations,
        lifestyle_advice=lifestyle,
        disclaimer="MediAssist provides guidance and preliminary triage. All prescription medicines require pharmacist approval prior to fulfillment.",
        requires_pharmacist_review=requires_rx_review
    )
