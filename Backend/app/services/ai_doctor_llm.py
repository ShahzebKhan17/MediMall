import json
import logging
import urllib.request
import urllib.error
from typing import Dict, List, Optional, Any

from app.core.config import get_settings

logger = logging.getLogger("medimall.ai_doctor")
settings = get_settings()

CLINICAL_SYSTEM_PROMPT = """You are MediAssist AI, an expert clinical triage and pharmacist intelligence assistant for MediMall India.
Your goal is to carefully analyze the patient's symptoms (which may be written or spoken in English, Hindi, Kannada, Tamil, Telugu, Bengali, Marathi, Gujarati, Malayalam, Punjabi, or Hinglish) and return a structured medical analysis adhering to Indian pharmacopeia and CDSCO OTC standards.

CRITICAL CLINICAL RULES:
1. SPECIFICITY: Recommend medications that specifically treat the patient's actual reported symptoms.
   - For LOOSE MOTION / DIARRHEA / FOOD POISONING / DAST: Recommend ORS (Electral / Oral Rehydration Salts) and/or Loperamide 2mg. NEVER recommend Paracetamol unless fever or severe pain is explicitly mentioned.
   - For VOMITING / NAUSEA / ULTI: Recommend Ondansetron 4mg (Emeset) or Domperidone.
   - For COUGH / SORE THROAT / KHASI: Recommend Cough Syrup (Dextromethorphan/Ambroxol) and Strepsils / Throat Lozenges.
   - For ACIDITY / GAS / HEARTBURN / PET JALAN: Recommend Pantoprazole 40mg (Pan-40) or Antacid.
   - For FEVER / HEADACHE / BODY ACHE / BUKHAR: Recommend Paracetamol 650mg (Dolo 650).
   - For ALLERGIES / COLD / RUNNY NOSE / SNEEZING / SARDI: Recommend Cetirizine 10mg.
   - For MUSCLE PAIN / SPRAINS / JOINT PAIN / MOCH: Recommend Volini Pain Relief Gel or Ibuprofen.
2. EMERGENCY RED FLAGS: If symptoms indicate cardiac issues (chest pain radiating to arm), stroke, breathing failure, severe bleeding, or loss of consciousness:
   - Set urgency_level to "High / Urgent".
   - Set recommended_otc to empty list [].
   - Provide immediate emergency hospital / ambulance advice.
3. OUTPUT FORMAT: Respond ONLY with a valid JSON object with these exact keys:
{
  "summary": "Short 3-6 word medical summary of condition",
  "condition_overview": "2-3 sentences explaining what these symptoms indicate and why they occur in clear, reassuring language",
  "urgency_level": "Low" | "Moderate" | "High / Urgent",
  "recommended_otc": [
    {
      "name": "Generic Salt Name (e.g. Electral ORS 21.8g)",
      "brand": "Popular Indian Brand (e.g. Electral · WHO Formula Sachet)",
      "type": "Therapeutic Category (e.g. Hydration & Loose Motion)",
      "purpose": "Precise reason for this medicine",
      "requires_rx": false,
      "price": 22,
      "packaging_type": "Packaging description"
    }
  ],
  "lifestyle_advice": [
    "Actionable recovery advice 1",
    "Actionable recovery advice 2",
    "Dietary precaution 3"
  ],
  "disclaimer": "MediAssist provides clinical triage guidance. For worsening symptoms, consult a licensed physician.",
  "requires_pharmacist_review": false
}"""


def query_gemini_llm(symptoms: str, language: str, api_key: str) -> Optional[Dict[str, Any]]:
    """Calls Google Gemini API with structured JSON output."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    prompt_content = f"Language: {language}\nPatient Symptoms: \"{symptoms}\"\n\nProvide the clinical analysis strictly as the requested JSON object."

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": CLINICAL_SYSTEM_PROMPT},
                    {"text": prompt_content}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
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
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            candidate_text = result["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(candidate_text)
    except Exception as e:
        logger.error("Gemini LLM call failed: %s", e)
        return None


def query_openai_llm(symptoms: str, language: str, api_key: str) -> Optional[Dict[str, Any]]:
    """Calls OpenAI API with structured JSON output."""
    url = "https://api.openai.com/v1/chat/completions"
    
    prompt_content = f"Language: {language}\nPatient Symptoms: \"{symptoms}\"\n\nProvide the clinical analysis strictly as the requested JSON object."

    payload = {
        "model": "gpt-4o-mini",
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": CLINICAL_SYSTEM_PROMPT},
            {"role": "user", "content": prompt_content}
        ],
        "temperature": 0.2
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            content_text = result["choices"][0]["message"]["content"]
            return json.loads(content_text)
    except Exception as e:
        logger.error("OpenAI LLM call failed: %s", e)
        return None


def clinical_rule_engine_fallback(symptoms: str, language: str) -> Dict[str, Any]:
    """
    Comprehensive multi-lingual clinical fallback engine when LLM API keys are unset.
    Accurately maps Indian and English symptom descriptions to precise medical categories.
    """
    text = symptoms.lower()
    recommendations = []
    lifestyle = []
    overview_parts = []
    urgency = "Low"
    requires_rx = False

    # 1. Emergency Red Flags
    emergency_kw = ["chest pain", "shortness of breath", "fainting", "heart attack", "unconscious", "dil ka daura", "chhati me dard", "stroke"]
    if any(k in text for k in emergency_kw):
        return {
            "summary": "Emergency Symptoms Detected",
            "condition_overview": "Your symptoms may indicate a severe or life-threatening condition requiring immediate medical intervention.",
            "urgency_level": "High / Urgent",
            "recommended_otc": [],
            "lifestyle_advice": [
                "Call emergency medical services (108/112) or visit the nearest emergency room immediately.",
                "Do not attempt home self-medication for acute cardiac or respiratory distress."
            ],
            "disclaimer": "CRITICAL: Immediate emergency hospital care is required.",
            "requires_pharmacist_review": True
        }

    # 2. Loose Motion / Diarrhea / Food Poisoning
    loose_motion_kw = [
        "loose motion", "diarrhea", "dast", "watery stool", "loose stool", "pait kharab", "pet kharab",
        "food poisoning", "dysentery", "dehydration", "bhedi", "jhedi", "motion", "stomach infection"
    ]
    if any(k in text for k in loose_motion_kw):
        overview_parts.append("Acute Gastrointestinal upset / Diarrhea")
        recommendations.append({
            "name": "Electral ORS 21.8g",
            "brand": "Electral · WHO Formula Sachet",
            "type": "Hydration & Loose Motion",
            "purpose": "Essential electrolyte replenishment to prevent dehydration from loose stools",
            "requires_rx": False,
            "price": 22,
            "packaging_type": "Foil Sachet 21.8g (Electrolyte Energy)"
        })
        recommendations.append({
            "name": "Loperamide 2mg",
            "brand": "Imodium / Lopamide · Strip of 10 capsules",
            "type": "Anti-Diarrheal",
            "purpose": "Slows intestinal rhythm and reduces frequency of loose motions",
            "requires_rx": False,
            "price": 25,
            "packaging_type": "Strip of 10 Capsules (Silver/Green)"
        })
        lifestyle.append("Drink 1 liter of reconstituted ORS solution throughout the day in small frequent sips.")
        lifestyle.append("Consume bland foods (curd rice, bananas, khichdi, toast) and strictly avoid oily/spicy foods and milk.")

    # 3. Nausea & Vomiting
    vomiting_kw = ["vomit", "vomiting", "nausea", "ulti", "chardi", "morning sickness", "motion sickness"]
    if any(k in text for k in vomiting_kw):
        overview_parts.append("Nausea & Emesis symptoms")
        recommendations.append({
            "name": "Ondansetron 4mg",
            "brand": "Emeset · Strip of 10 tablets",
            "type": "Nausea & Vomiting",
            "purpose": "Provides rapid relief from nausea and controls vomiting",
            "requires_rx": False,
            "price": 45,
            "packaging_type": "Strip of 10 Tablets (Yellow Blister)"
        })
        lifestyle.append("Sip cold water or ginger tea slowly; avoid eating large meals immediately after vomiting.")

    # 4. Cough & Sore Throat
    cough_kw = ["cough", "khasi", "sore throat", "gale me dard", "gala kharab", "dry cough", "wet cough", "phlegm", "kaph"]
    if any(k in text for k in cough_kw):
        overview_parts.append("Respiratory tract irritation / Cough")
        recommendations.append({
            "name": "Benadryl Cough Syrup",
            "brand": "Benadryl 100ml Bottle",
            "type": "Cough & Cold",
            "purpose": "Soothes throat irritation and suppresses persistent coughing",
            "requires_rx": False,
            "price": 115,
            "packaging_type": "Pet Bottle 100ml (Syrup with Measuring Cup)"
        })
        recommendations.append({
            "name": "Strepsils Lozenges",
            "brand": "Strepsils Honey & Lemon · Strip of 8",
            "type": "Sore Throat & Cough",
            "purpose": "Antibacterial lozenge that provides immediate relief for sore throat",
            "requires_rx": False,
            "price": 35,
            "packaging_type": "Blister of 8 Lozenges (Yellow Pack)"
        })
        lifestyle.append("Perform warm salt water gargles twice daily.")
        lifestyle.append("Stay hydrated with warm water, herbal teas, or honey-ginger concoction.")

    # 5. Fever & Headache / Pain
    fever_kw = ["fever", "headache", "body ache", "bukhar", "sardard", "badan dard", "temperature", "taap", "chills", "jwara", "kaychal"]
    if any(k in text for k in fever_kw):
        overview_parts.append("Febrile / Pain symptoms")
        recommendations.append({
            "name": "Paracetamol 650mg",
            "brand": "Dolo 650 · Strip of 15 tablets",
            "type": "Pain relief & Fever",
            "purpose": "Reduces high body temperature and relieves headache or body ache",
            "requires_rx": False,
            "price": 34,
            "packaging_type": "Blister Strip of 15 Tablets (Orange/White)"
        })
        lifestyle.append("Monitor temperature every 4 hours and ensure ample physical rest.")

    # 6. Cold & Allergic Rhinitis
    cold_kw = ["cold", "sneezing", "runny nose", "sardi", "jukham", "chheenk", "nasal congestion", "itchy nose"]
    if any(k in text for k in cold_kw):
        overview_parts.append("Allergic rhinitis & nasal congestion")
        recommendations.append({
            "name": "Cetirizine 10mg",
            "brand": "Cetzine · Strip of 10 tablets",
            "type": "Allergy care & Cold",
            "purpose": "Relieves sneezing, runny nose, and allergic inflammation",
            "requires_rx": False,
            "price": 28,
            "packaging_type": "Strip of 10 Tablets (Blue Foil Strip)"
        })
        lifestyle.append("Use steam inhalation twice daily to clear blocked nasal passages.")

    # 7. Acidity & Indigestion / Gas
    acidity_kw = ["acidity", "gas", "heartburn", "bloating", "acid reflux", "pet me jalan", "khatta dakar", "indigestion"]
    if any(k in text for k in acidity_kw):
        overview_parts.append("Gastric hyperacidity & indigestion")
        recommendations.append({
            "name": "Pantoprazole 40mg",
            "brand": "Pan-40 · Strip of 15 tablets",
            "type": "Antacid & Gastric",
            "purpose": "Inhibits excess gastric acid secretion and relieves heartburn",
            "requires_rx": False,
            "price": 89,
            "packaging_type": "Strip of 15 Tablets (Silver/Yellow Foil)"
        })
        lifestyle.append("Take meals on time, avoid midnight snacking, and avoid excessively spicy foods.")

    # 8. Muscle / Joint Pain / Sprain
    muscle_kw = ["muscle pain", "sprain", "moch", "kamar dard", "back pain", "joint pain", "ghutne me dard", "neck pain"]
    if any(k in text for k in muscle_kw):
        overview_parts.append("Musculoskeletal pain & inflammation")
        recommendations.append({
            "name": "Volini Pain Relief Gel",
            "brand": "Volini 30g Tube",
            "type": "Joint & Muscle Pain",
            "purpose": "Topical application provides rapid relief from muscle stiffness and joint sprains",
            "requires_rx": False,
            "price": 95,
            "packaging_type": "Lami Tube 30g (Fast Relief)"
        })
        lifestyle.append("Apply warm compress or ice pack according to injury type and rest the affected area.")

    # Default fallback if no specific keywords matched
    if not recommendations:
        overview_parts.append("General health assessment")
        recommendations.append({
            "name": "Vitamin D3 60K",
            "brand": "Uprise-D3 · Pack of 4 capsules",
            "type": "Vitamins & Immunity",
            "purpose": "Supports immune resilience and general vitality",
            "requires_rx": False,
            "price": 116,
            "packaging_type": "Box of 4 Softgel Capsules (Gold Blister)"
        })
        lifestyle.append("Stay well hydrated, maintain balanced nutrition, and consult a doctor if symptoms persist.")

    summary_text = " · ".join(overview_parts)
    overview_text = f"MediAssist has analyzed your symptoms ({summary_text}) and generated targeted over-the-counter recommendations."

    return {
        "summary": summary_text or "Clinical Symptom Triage",
        "condition_overview": overview_text,
        "urgency_level": urgency,
        "recommended_otc": recommendations,
        "lifestyle_advice": lifestyle,
        "disclaimer": "MediAssist is an AI clinical assistant. All medicine orders are subject to pharmacist verification.",
        "requires_pharmacist_review": requires_rx
    }


def analyze_patient_symptoms(symptoms: str, language: str = "English") -> Dict[str, Any]:
    """
    Main triage coordinator:
    1. Tries Google Gemini LLM if GEMINI_API_KEY is configured.
    2. Tries OpenAI LLM if OPENAI_API_KEY is configured.
    3. Falls back seamlessly to the enhanced Clinical Rule Engine.
    """
    # 1. Try Gemini
    gemini_key = settings.gemini_api_key.strip() if settings.gemini_api_key else ""
    if gemini_key:
        result = query_gemini_llm(symptoms=symptoms, language=language, api_key=gemini_key)
        if result and "recommended_otc" in result:
            return result

    # 2. Try OpenAI
    openai_key = settings.openai_api_key.strip() if settings.openai_api_key else ""
    if openai_key:
        result = query_openai_llm(symptoms=symptoms, language=language, api_key=openai_key)
        if result and "recommended_otc" in result:
            return result

    # 3. Clinical Rule Fallback (understands loose motion, cough, vomiting, acidity, fever, etc. in English + Indian languages)
    return clinical_rule_engine_fallback(symptoms=symptoms, language=language)
