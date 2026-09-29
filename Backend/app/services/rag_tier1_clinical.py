import json
import logging
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from rank_bm25 import BM25Okapi

from app.models import ClinicalKnowledgeChunk
from app.core.embeddings import get_query_embedding

logger = logging.getLogger("medimall.rag_tier1")


class ClinicalTriageResult(BaseModel):
    condition_id: int
    condition_name: str
    category: str
    is_emergency: bool
    urgency_level: str  # "Low", "Moderate", "High / Urgent"
    target_salts: List[Dict[str, str]]
    contraindications: Optional[str] = None
    red_flags: Optional[str] = None
    lifestyle_advice: List[str]
    clinical_summary: str
    content_chunk: str
    rrf_score: float
    dense_rank: int
    bm25_rank: int


def _tokenize(text: str) -> List[str]:
    """Tokenize and normalize text for BM25 matching."""
    cleaned = re.sub(r"[^\w\s]", " ", text.lower())
    return [word for word in cleaned.split() if len(word) > 1]


class Tier1HybridRetriever:
    """
    Tier-1 Hybrid Retrieval Engine:
    Combines Dense Vector Retrieval (pgvector cosine similarity) with
    Sparse Lexical Retrieval (BM25 Okapi) and fuses them via Reciprocal Rank Fusion (RRF).
    """

    def __init__(self, db: Session, rrf_k: int = 60, weight_dense: float = 0.5, weight_bm25: float = 0.5):
        self.db = db
        self.rrf_k = rrf_k
        self.weight_dense = weight_dense
        self.weight_bm25 = weight_bm25

        # Pre-load knowledge chunks for fast BM25 in-memory indexing
        self.chunks = self.db.query(ClinicalKnowledgeChunk).all()
        self.chunk_map: Dict[int, ClinicalKnowledgeChunk] = {c.id: c for c in self.chunks}

        # Build BM25 corpus
        self.corpus_tokens = []
        self.chunk_ids = []
        for c in self.chunks:
            # Index condition name and symptoms keywords with boosted term frequency
            doc_text = f"{c.condition_name} {c.condition_name} {c.category} {c.symptoms_keywords} {c.symptoms_keywords} {c.content_chunk}"
            self.corpus_tokens.append(_tokenize(doc_text))
            self.chunk_ids.append(c.id)

        self.bm25 = BM25Okapi(self.corpus_tokens) if self.corpus_tokens else None

    def dense_search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Dense semantic search using pgvector cosine distance."""
        query_vector = get_query_embedding(query)
        
        # In pgvector, cosine_distance operator is <=>
        results = (
            self.db.query(
                ClinicalKnowledgeChunk,
                ClinicalKnowledgeChunk.embedding.cosine_distance(query_vector).label("distance")
            )
            .order_by("distance")
            .limit(limit)
            .all()
        )

        ranked = []
        for rank, (chunk, distance) in enumerate(results, start=1):
            ranked.append({
                "chunk_id": chunk.id,
                "rank": rank,
                "score": 1.0 - float(distance) if distance is not None else 0.0
            })
        return ranked

    def bm25_search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Sparse lexical search using BM25 Okapi."""
        if not self.bm25 or not self.chunk_ids:
            return []

        query_tokens = _tokenize(query)
        if not query_tokens:
            return []

        doc_scores = self.bm25.get_scores(query_tokens)
        
        # Sort indices by score descending
        sorted_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:limit]

        ranked = []
        for rank, idx in enumerate(sorted_indices, start=1):
            chunk_id = self.chunk_ids[idx]
            ranked.append({
                "chunk_id": chunk_id,
                "rank": rank,
                "score": float(doc_scores[idx])
            })
        return ranked

    def retrieve(self, query: str, top_k: int = 3) -> List[ClinicalTriageResult]:
        """
        Executes hybrid retrieval (Dense + BM25) and combines results via Reciprocal Rank Fusion (RRF).
        RRF formula: RRF_score(d) = sum( weight / (k + rank) )
        """
        dense_results = self.dense_search(query, limit=10)
        bm25_results = self.bm25_search(query, limit=10)

        dense_rank_map = {r["chunk_id"]: r["rank"] for r in dense_results}
        bm25_rank_map = {r["chunk_id"]: r["rank"] for r in bm25_results}

        # Collect all candidate chunk IDs
        all_ids = set(dense_rank_map.keys()) | set(bm25_rank_map.keys())

        # Compute RRF score for each candidate
        rrf_scores: Dict[int, float] = {}
        for cid in all_ids:
            score = 0.0
            if cid in dense_rank_map:
                score += self.weight_dense / (self.rrf_k + dense_rank_map[cid])
            else:
                score += self.weight_dense / (self.rrf_k + 100)  # default penalty if absent

            if cid in bm25_rank_map:
                score += self.weight_bm25 / (self.rrf_k + bm25_rank_map[cid])
            else:
                score += self.weight_bm25 / (self.rrf_k + 100)

            rrf_scores[cid] = score

        # Sort candidate chunk IDs by RRF score descending
        sorted_cids = sorted(rrf_scores.keys(), key=lambda cid: rrf_scores[cid], reverse=True)[:top_k]

        results: List[ClinicalTriageResult] = []
        for cid in sorted_cids:
            chunk = self.chunk_map.get(cid)
            if not chunk:
                continue

            # Parse JSON target salts & lifestyle advice
            target_salts = []
            try:
                target_salts = json.loads(chunk.target_salts) if chunk.target_salts else []
            except Exception:
                target_salts = []

            lifestyle = []
            try:
                lifestyle = json.loads(chunk.lifestyle_advice) if chunk.lifestyle_advice else []
            except Exception:
                lifestyle = []

            urgency = "High / Urgent" if chunk.is_emergency else "Low"

            results.append(
                ClinicalTriageResult(
                    condition_id=chunk.id,
                    condition_name=chunk.condition_name,
                    category=chunk.category,
                    is_emergency=chunk.is_emergency,
                    urgency_level=urgency,
                    target_salts=target_salts,
                    contraindications=chunk.contraindications,
                    red_flags=chunk.red_flags,
                    lifestyle_advice=lifestyle,
                    clinical_summary=f"Clinical analysis indicates {chunk.condition_name} ({chunk.category}).",
                    content_chunk=chunk.content_chunk,
                    rrf_score=round(rrf_scores[cid], 5),
                    dense_rank=dense_rank_map.get(cid, 999),
                    bm25_rank=bm25_rank_map.get(cid, 999)
                )
            )

        return results


def triage_symptoms(symptoms: str, db: Session) -> Optional[ClinicalTriageResult]:
    """
    Convenience function: Retrieves the best-matching clinical knowledge chunk
    using Tier-1 Hybrid RAG.
    """
    retriever = Tier1HybridRetriever(db=db)
    results = retriever.retrieve(symptoms, top_k=1)
    return results[0] if results else None
