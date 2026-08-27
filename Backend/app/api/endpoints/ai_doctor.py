from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

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
    requires_rx: bool
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
                id=1,
                name="Paracetamol 650mg",
                brand="Dolo 650 · Strip of 15 tablets",
                type="Pain relief & Antipyretic",
                purpose="Relief from fever, headaches, and mild body aches",
                requires_rx=False,
                price=34,
                image_url="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
                packaging_type="Blister Strip of 15 Tablets (Orange/White)"
            )
        )
        lifestyle.append("Stay well hydrated with warm water and electrolytes.")
        lifestyle.append("Ensure adequate rest and monitor temperature every 4-6 hours.")

    if any(k in text for k in ["cold", "sneezing", "runny nose", "allergy", "itchy", "congestion", "cough"]):
        overview_parts.append("Upper respiratory / allergic rhinitis symptoms")
        recommendations.append(
            RecommendedMedicine(
                id=2,
                name="Cetirizine 10mg",
                brand="Cetzine · Strip of 10 tablets",
                type="Allergy care / Antihistamine",
                purpose="Relieves sneezing, runny nose, and allergic reactions",
                requires_rx=False,
                price=28,
                image_url="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80",
                packaging_type="Strip of 10 Tablets (Blue Foil Strip)"
            )
        )
        lifestyle.append("Steam inhalation twice daily can help clear nasal congestion.")
        lifestyle.append("Avoid cold drinks, dust, and known allergens.")

    if any(k in text for k in ["weakness", "fatigue", "tired", "energy", "bone", "joint"]):
        overview_parts.append("General fatigue & nutritional support indication")
        recommendations.append(
            RecommendedMedicine(
                id=3,
                name="Vitamin D3 60K",
                brand="Uprise-D3 · Pack of 4 capsules",
                type="Vitamins & Nutrition",
                purpose="Supports bone health, immunity, and overall energy levels",
                requires_rx=False,
                price=116,
                image_url="https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&auto=format&fit=crop&q=80",
                packaging_type="Box of 4 Softgel Capsules (Gold Blister)"
            )
        )
        lifestyle.append("Maintain a balanced diet rich in leafy greens, proteins, and citrus fruits.")

    if any(k in text for k in ["infection", "throat pain", "tonsil", "pus", "bacterial", "severe"]):
        overview_parts.append("Potential bacterial infection requiring clinical diagnosis")
        recommendations.append(
            RecommendedMedicine(
                id=4,
                name="Amoxicillin 500mg",
                brand="Mox 500 · Strip of 10 capsules",
                type="Antibiotic (Schedule H)",
                purpose="Prescription antibiotic for bacterial infections",
                requires_rx=True,
                price=133,
                image_url="https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80",
                packaging_type="Strip of 10 Capsules (Green/Red Blister)"
            )
        )
        requires_rx_review = True
        urgency = "Moderate"
        lifestyle.append("Antibiotics must only be taken after pharmacist validation and doctor's prescription.")

    if any(k in text for k in ["acidity", "gas", "reflux", "heartburn", "stomach"]):
        overview_parts.append("Gastric acidity / acid reflux symptoms")
        recommendations.append(
            RecommendedMedicine(
                id=5,
                name="Pantoprazole 40mg",
                brand="Pan-40 · Strip of 15 tablets",
                type="Antacid & Gastric",
                purpose="Reduces stomach acid, heartburn, and gastroesophageal reflux",
                requires_rx=False,
                price=89,
                image_url="https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80",
                packaging_type="Strip of 15 Tablets (Silver/Yellow Foil)"
            )
        )
        lifestyle.append("Avoid heavy, oily meals and eat smaller, frequent portions.")

    if not recommendations:
        overview_parts.append("General non-specific wellness symptoms")
        recommendations.append(
            RecommendedMedicine(
                id=1,
                name="Paracetamol 650mg",
                brand="Dolo 650 · Strip of 15 tablets",
                type="General relief",
                purpose="General symptomatic relief and pharmacist consultation",
                requires_rx=False,
                price=34,
                image_url="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
                packaging_type="Blister Strip of 15 Tablets (Orange/White)"
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
