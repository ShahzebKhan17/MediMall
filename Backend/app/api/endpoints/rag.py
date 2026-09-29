import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.rag_orchestrator import UnifiedRAGOrchestrator, OrchestratedTriageResponse, PatientContext

logger = logging.getLogger("medimall.api.rag")
router = APIRouter()


class TriageConsultRequest(BaseModel):
    query: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    allergies: Optional[str] = None
    language: Optional[str] = "English"


@router.post("/rag-triage", response_model=OrchestratedTriageResponse)
def execute_rag_triage(
    payload: TriageConsultRequest,
    db: Session = Depends(get_db)
) -> OrchestratedTriageResponse:
    """
    Executes the 2-Tier Hybrid RAG Pipeline:
    - Tier-1: Hybrid dense (pgvector) + sparse (BM25) clinical retrieval with RRF.
    - Tier-2: Real-time inventory grounding against pharmacy catalog with emergency safety enforcement.
    - Synthesis: Clinical explanation with patient lifestyle advice and dosage cautions.
    """
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    orchestrator = UnifiedRAGOrchestrator(db=db)
    context = PatientContext(
        patient_age=payload.patient_age,
        patient_gender=payload.patient_gender,
        allergies=payload.allergies,
        language=payload.language
    )

    try:
        response = orchestrator.run_pipeline(query=payload.query, patient_context=context)
        return response
    except Exception as e:
        logger.error(f"Error in RAG triage pipeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Clinical triage pipeline error: {str(e)}")
