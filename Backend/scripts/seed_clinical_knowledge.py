import os
import sys
import json
import logging

# Add Backend root directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.core.database import engine, SessionLocal, Base
from app.models import ClinicalKnowledgeChunk
from app.core.embeddings import get_embedding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medimall.seed_clinical")

CLINICAL_KNOWLEDGE_DATA = [
    {
        "condition_name": "Acute Diarrhea & Dehydration",
        "category": "Gastrointestinal",
        "symptoms_keywords": "loose motion, diarrhea, dast, watery stool, loose stool, pet kharab, pait kharab, food poisoning, dehydration, frequent bowel movements, stomach cramps",
        "is_emergency": False,
        "red_flags": "Blood or mucus in stool (dysentery), high fever (>102F), severe lethargy, inability to retain liquids, severe oliguria (no urination for >8 hours).",
        "contraindications": "Do not administer Loperamide in patients with high fever or bloody diarrhea (bacterial enteritis).",
        "target_salts": json.dumps([
            {"salt": "Oral Rehydration Salts (WHO Formula)", "form": "Sachet", "purpose": "Rapid electrolyte & fluid restoration to prevent severe dehydration"},
            {"salt": "Loperamide Hydrochloride (2mg)", "form": "Capsule / Tablet", "purpose": "Anti-motility agent to reduce intestinal transit speed and frequency of stools"}
        ]),
        "lifestyle_advice": json.dumps([
            "Dissolve 1 full sachet of WHO-formula ORS in 1 liter of clean drinking water; drink in small frequent sips.",
            "Follow a BRAT diet (Bananas, Rice/Khichdi, Applesauce, Toast) and curd.",
            "Avoid dairy, greasy, fatty, or heavily spiced foods until bowel movements normalize."
        ]),
        "content_chunk": "Clinical Guidelines for Acute Diarrhea & Dehydration: Initial priority is preventing water and electrolyte depletion using WHO formulation Oral Rehydration Salts (ORS). For non-invasive acute watery diarrhea in adults without fever or bloody stools, antimotility agents such as Loperamide 2mg can be used safely to reduce stool frequency. If blood in stool or high fever is observed, refer to physician immediately."
    },
    {
        "condition_name": "Acute Nausea & Emesis",
        "category": "Gastrointestinal",
        "symptoms_keywords": "vomit, vomiting, nausea, ulti, chardi, stomach upset, morning sickness, motion sickness, queasiness, throwing up",
        "is_emergency": False,
        "red_flags": "Coffee-ground emesis (hematemesis), persistent vomiting for >24 hours, projectile vomiting following head trauma, severe abdominal rigidity.",
        "contraindications": "Known hypersensitivity to serotonin 5-HT3 receptor antagonists or prolonged QT interval syndrome.",
        "target_salts": json.dumps([
            {"salt": "Ondansetron (4mg)", "form": "Tablet / Orally Disintegrating Strip", "purpose": "Selective 5-HT3 receptor antagonist for fast control of acute nausea and vomiting"},
            {"salt": "Domperidone (10mg)", "form": "Tablet", "purpose": "Peripheral dopamine antagonist to accelerate gastric emptying"}
        ]),
        "lifestyle_advice": json.dumps([
            "Take small sips of chilled clear fluids, ginger tea, or electrolyte solution; do not gulp large volumes.",
            "Avoid solid food for 2 hours after an episode of emesis, then introduce bland crackers or toast.",
            "Avoid lying flat immediately after drinking liquids; elevate the head of the bed by 30 degrees."
        ]),
        "content_chunk": "Clinical Guidelines for Acute Nausea & Emesis: Ondansetron 4mg provides rapid antiemetic action by blocking peripheral and central 5-HT3 receptors. Indicated for symptomatic nausea and acute gastroenteritis-induced vomiting in adults. Patients must remain hydrated with frequent sips of cool fluids. Hematemesis or signs of acute surgical abdomen warrant immediate hospital referral."
    },
    {
        "condition_name": "Gastric Hyperacidity, GERD & Dyspepsia",
        "category": "Gastrointestinal",
        "symptoms_keywords": "acidity, gas, heartburn, acid reflux, pet me jalan, seene me jalan, bloating, sour burps, khatta dakar, indigestion, gastric pain, epigastric discomfort",
        "is_emergency": False,
        "red_flags": "Difficulty swallowing (dysphagia), unexplained weight loss, persistent vomiting, radiation of pain to left arm or jaw (rule out acute coronary syndrome).",
        "contraindications": "Known hypersensitivity to substituted benzimidazoles.",
        "target_salts": json.dumps([
            {"salt": "Pantoprazole (40mg)", "form": "Tablet (Enteric Coated)", "purpose": "Proton pump inhibitor (PPI) that suppresses excess gastric hydrochloric acid secretion"},
            {"salt": "Magaldrate + Simethicone", "form": "Oral Suspension / Chewable Tablet", "purpose": "Rapid neutralizing antacid and anti-flatulent for immediate burning sensation"}
        ]),
        "lifestyle_advice": json.dumps([
            "Take proton pump inhibitors (Pantoprazole) 30-45 minutes before the morning meal with water.",
            "Avoid caffeinated drinks, carbonated sodas, citrus fruits, and excessively spicy or deep-fried food items.",
            "Maintain an upright posture for at least 2 hours after meals; avoid late-night dining."
        ]),
        "content_chunk": "Clinical Guidelines for Gastric Acidity & Gastroesophageal Reflux: Pantoprazole 40mg once daily provides sustained gastric acid suppression by inhibiting the H+/K+-ATPase enzyme. Liquid antacids containing Magaldrate/Simethicone provide prompt symptomatic buffering for immediate heartburn. Any pain radiating to shoulder, jaw, or accompanied by sweating must be treated as potential cardiac ischemia."
    },
    {
        "condition_name": "Pharyngitis, Sore Throat & Cough",
        "category": "Respiratory",
        "symptoms_keywords": "cough, khasi, sore throat, gale me dard, gala kharab, dry cough, wet cough, phlegm, kaph, throat tickle, painful swallowing",
        "is_emergency": False,
        "red_flags": "Stridor, drooling, inability to swallow saliva (suspected epiglottitis/peritonsillar abscess), hemoptysis (coughing blood), severe shortness of breath.",
        "contraindications": "Patients with severe hypertension or taking MAO inhibitors should avoid excessive sympathomimetic decongestants.",
        "target_salts": json.dumps([
            {"salt": "Diphenhydramine HCl + Ammonium Chloride + Sodium Citrate", "form": "Cough Syrup (100ml)", "purpose": "Relieves persistent dry/allergic coughing, soothes inflamed bronchial passages"},
            {"salt": "Dichlorobenzyl Alcohol + Amylmetacresol", "form": "Lozenges", "purpose": "Dual antibacterial and local soothing action for acute sore throat irritation"}
        ]),
        "lifestyle_advice": json.dumps([
            "Gargle with warm salt water (1/2 teaspoon salt in a glass of warm water) 3 times daily.",
            "Stay well hydrated with warm liquids such as herbal tea with honey and ginger.",
            "Avoid smoking, cold refrigerated drinks, and dry dusty environments."
        ]),
        "content_chunk": "Clinical Guidelines for Pharyngitis & Cough: Uncomplicated upper respiratory cough and throat discomfort are commonly viral. Symptomatic management includes antiseptic lozenge formulations (Amylmetacresol / Dichlorobenzyl Alcohol) to relieve pharyngeal pain, and antitussive/expectorant syrups to mitigate coughing fits and facilitate mucosal clearance."
    },
    {
        "condition_name": "Febrile Syndrome & Acute Headache",
        "category": "Pain & Fever",
        "symptoms_keywords": "fever, headache, body ache, bukhar, sardard, sar dard, badan dard, temperature, taap, chills, feeling hot, myalgia, fatigue",
        "is_emergency": False,
        "red_flags": "Stiff neck (nuchal rigidity), petechial/purpuric rash (suspected meningitis), confusion, temperature exceeding 104F, persistent vomiting.",
        "contraindications": "Severe active hepatic impairment or known paracetamol hypersensitivity. Do not exceed 4000mg Paracetamol in 24 hours.",
        "target_salts": json.dumps([
            {"salt": "Paracetamol (650mg)", "form": "Tablet", "purpose": "Antipyretic and analgesic agent of choice for reducing elevated temperature and relieving general body aches"}
        ]),
        "lifestyle_advice": json.dumps([
            "Maintain bed rest in a well-ventilated room and monitor temperature every 4-6 hours.",
            "Use lukewarm water sponge on forehead and body if temperature is above 101F; do not use ice water.",
            "Drink plenty of fluids (coconut water, clear broths, fruit juices) to compensate for insensible fluid loss."
        ]),
        "content_chunk": "Clinical Guidelines for Fever & Headache: Paracetamol (Acetaminophen) 650mg is the first-line antipyretic and analgesic for acute febrile episodes and tension-type headaches in adults. Doses can be taken every 6 to 8 hours as needed, with a strict maximum limit of 4000mg daily. Patients must be monitored for warning signs including altered mental state or meningeal signs."
    },
    {
        "condition_name": "Allergic Rhinitis & Common Cold",
        "category": "Respiratory",
        "symptoms_keywords": "cold, sneezing, runny nose, sardi, jukham, chheenk, nasal congestion, itchy nose, watery eyes, blocked nose, allergy",
        "is_emergency": False,
        "red_flags": "Facial swelling, swelling of lips/tongue (angioedema), severe wheezing, oxygen saturation below 94%.",
        "contraindications": "End-stage renal disease (CrCl < 10 ml/min) or severe renal impairment.",
        "target_salts": json.dumps([
            {"salt": "Cetirizine Hydrochloride (10mg)", "form": "Tablet", "purpose": "Second-generation H1-antihistamine providing 24-hour relief from sneezing, rhinorrhea, and ocular itching"}
        ]),
        "lifestyle_advice": json.dumps([
            "Perform steam inhalation twice daily with plain warm water vapor to relieve nasal congestion.",
            "Minimize exposure to known environmental allergens (dust mites, pet dander, pollens, incense smoke).",
            "Drink warm water throughout the day and wear protective clothing in changing seasons."
        ]),
        "content_chunk": "Clinical Guidelines for Allergic Rhinitis & Upper Respiratory Allergies: Second-generation oral antihistamines such as Cetirizine 10mg once daily effectively block peripheral H1 receptors, relieving allergic rhinorrhea, sneezing, and ocular pruritus with minimal central sedation compared to first-generation alternatives."
    },
    {
        "condition_name": "Acute Musculoskeletal Pain, Joint Strain & Sprains",
        "category": "Pain & Inflammation",
        "symptoms_keywords": "muscle pain, sprain, moch, kamar dard, back pain, joint pain, ghutne me dard, neck pain, stiff neck, shoulder pain, muscle pull, sports injury",
        "is_emergency": False,
        "red_flags": "Visible joint deformity, inability to bear weight on extremity, severe numbness/tingling distal to injury site, loss of bowel/bladder control.",
        "contraindications": "Do not apply topical NSAID gels on open wounds, broken skin, or mucous membranes.",
        "target_salts": json.dumps([
            {"salt": "Diclofenac Diethylamine + Methyl Salicylate + Menthol", "form": "Topical Gel / Spray (30g)", "purpose": "Topical non-steroidal anti-inflammatory formulation for targeted pain relief and localized anti-inflammatory action"}
        ]),
        "lifestyle_advice": json.dumps([
            "Apply the R.I.C.E. protocol for acute sprains: Rest the affected joint, Ice pack for 15 minutes, Compress gently, Elevate above heart level.",
            "Gently apply pain relief gel 3 to 4 times daily without vigorous rubbing.",
            "Avoid strenuous athletic activity or heavy weightlifting until pain and inflammation subside completely."
        ]),
        "content_chunk": "Clinical Guidelines for Musculoskeletal Pain & Sprains: Topical NSAIDs such as Diclofenac Diethylamine formulated with Methyl Salicylate and Menthol provide localized analgesia and anti-inflammatory activity with negligible systemic gastrointestinal side effects. Ideal for muscular strains, sprains, and tendon discomfort."
    },
    {
        "condition_name": "General Vitality & Vitamin D Deficiency",
        "category": "Vitamins & Immunity",
        "symptoms_keywords": "weakness, fatigue, low energy, lethargy, bone weakness, lack of sunlight, general tiredness, joint stiffness without injury",
        "is_emergency": False,
        "red_flags": "Profound unexplained weight loss, chronic low-grade fever with night sweats, severe progressive muscular weakness.",
        "contraindications": "Hypercalcemia, hypervitaminosis D, or severe calcium nephrolithiasis.",
        "target_salts": json.dumps([
            {"salt": "Cholecalciferol (Vitamin D3 60,000 IU)", "form": "Capsule / Sachet", "purpose": "High-potency cholecalciferol to replenish depleted 25-hydroxyvitamin D stores and maintain musculoskeletal integrity"}
        ]),
        "lifestyle_advice": json.dumps([
            "Take Cholecalciferol 60K once weekly with a fat-containing meal or milk for optimal absorption.",
            "Ensure 15-20 minutes of midday sunlight exposure on hands and face.",
            "Maintain a diet rich in dairy, fortified cereals, eggs, and leafy greens."
        ]),
        "content_chunk": "Clinical Guidelines for Hypovitaminosis D & Vitality: Cholecalciferol (Vitamin D3) 60,000 IU taken once weekly for 8 weeks is the standard therapeutic regimen for correcting vitamin D insufficiency in adults, promoting intestinal calcium absorption and bone mineral homeostasis."
    },
    {
        "condition_name": "EMERGENCY: Acute Coronary Syndrome / Myocardial Infarction",
        "category": "Cardiovascular Emergency",
        "symptoms_keywords": "chest pain, heart attack, dil ka daura, chhati me dard, crushing chest pressure, pain radiating to left arm, pain radiating to jaw, severe sweating, cold sweat",
        "is_emergency": True,
        "red_flags": "Crushing retrosternal chest pain >15 mins, radiation to arm/neck/jaw, diaphoresis, dyspnea, presyncope.",
        "contraindications": "NEVER recommend OTC home therapy or delay hospital transport.",
        "target_salts": json.dumps([]),
        "lifestyle_advice": json.dumps([
            "Call National Emergency Services (108 or 112) or reach the nearest cardiac emergency facility IMMEDIATELY.",
            "Keep the patient calm, seated or in a semi-reclined position; loosen all tight clothing.",
            "Do not give any solid food or oral fluids while awaiting medical dispatch."
        ]),
        "content_chunk": "CRITICAL EMERGENCY PROTOCOL: Acute chest pain radiating to the left arm, neck, or jaw accompanied by diaphoresis and shortness of breath indicates life-threatening acute coronary syndrome (myocardial infarction). No OTC medications should be provided. Immediate emergency ambulance dispatch and cardiac catheterization / emergency room triage is mandated."
    },
    {
        "condition_name": "EMERGENCY: Acute Stroke / Cerebrovascular Event",
        "category": "Neurological Emergency",
        "symptoms_keywords": "stroke, lakwa, face drooping, arm weakness, slurred speech, sudden numbness, sudden loss of balance, sudden blindness, falij",
        "is_emergency": True,
        "red_flags": "FAST criteria positive: Face drooping, Arm weakness, Speech difficulty, Time to call emergency.",
        "contraindications": "NEVER administer aspirin or oral medications without prior CT scan ruling out hemorrhagic stroke.",
        "target_salts": json.dumps([]),
        "lifestyle_advice": json.dumps([
            "Call emergency medical services (108/112) immediately. Note the exact time when symptoms first appeared.",
            "Position the patient on their side (recovery position) if consciousness is altered to protect airway.",
            "Do NOT give any food, water, or medications by mouth."
        ]),
        "content_chunk": "CRITICAL EMERGENCY PROTOCOL: Sudden facial droop, unilateral limb weakness, speech disturbance, or acute ataxia indicates acute ischemic or hemorrhagic stroke. Time to thrombolysis is vital ('Time is Brain'). Immediate emergency ambulance transit to a designated stroke-ready hospital is non-negotiable. Oral home self-medication is strictly prohibited."
    },
    {
        "condition_name": "EMERGENCY: Acute Respiratory Failure / Severe Dyspnea",
        "category": "Respiratory Emergency",
        "symptoms_keywords": "shortness of breath, gasping, cannot breathe, saans lene me takleef, choking, cyanosis, blue lips, severe asthma attack, stridor",
        "is_emergency": True,
        "red_flags": "Inability to speak in full sentences, cyanosis of lips or fingertips, stridor, accessory muscle breathing, SpO2 < 90%.",
        "contraindications": "Do not administer sedatives or cough syrups; patient requires oxygenation and airway stabilization.",
        "target_salts": json.dumps([]),
        "lifestyle_advice": json.dumps([
            "Call emergency services (108/112) immediately.",
            "Sit upright and lean slightly forward with arms supported; avoid lying flat.",
            "If prescribed an emergency rescue inhaler (Salbutamol), use it immediately via spacer while awaiting help."
        ]),
        "content_chunk": "CRITICAL EMERGENCY PROTOCOL: Acute severe breathlessness, stridor, accessory respiratory muscle retractions, or central cyanosis indicates impending respiratory failure or acute anaphylaxis. Requires urgent clinical oxygen therapy, airway management, and emergency department stabilization."
    }
]


def seed_clinical_knowledge():
    """Seeds the clinical_knowledge_chunks table with standardized CDSCO OTC & emergency guidelines."""
    # 1. Ensure table exists in database
    logger.info("Verifying database schema...")
    Base.metadata.create_all(bind=engine, tables=[ClinicalKnowledgeChunk.__table__])
    
    db = SessionLocal()
    try:
        # Check current count
        existing_count = db.query(ClinicalKnowledgeChunk).count()
        logger.info(f"Existing clinical knowledge records: {existing_count}")
        
        # Clear or update existing
        db.query(ClinicalKnowledgeChunk).delete()
        db.commit()
        
        inserted = 0
        for item in CLINICAL_KNOWLEDGE_DATA:
            # Generate embedding for the chunk (condition + symptoms + content)
            combined_text = f"{item['condition_name']}. Category: {item['category']}. Symptoms: {item['symptoms_keywords']}. {item['content_chunk']}"
            embedding_vector = get_embedding(combined_text)
            
            chunk = ClinicalKnowledgeChunk(
                condition_name=item["condition_name"],
                category=item["category"],
                symptoms_keywords=item["symptoms_keywords"],
                is_emergency=item["is_emergency"],
                red_flags=item.get("red_flags"),
                contraindications=item.get("contraindications"),
                target_salts=item["target_salts"],
                content_chunk=item["content_chunk"],
                lifestyle_advice=item.get("lifestyle_advice"),
                embedding=embedding_vector
            )
            db.add(chunk)
            inserted += 1

        db.commit()
        logger.info(f"Successfully seeded {inserted} clinical knowledge chunks with 768-dim embeddings!")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed clinical knowledge chunks: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_clinical_knowledge()
