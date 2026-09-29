import hashlib
import logging
from typing import List, Optional
import numpy as np

from app.core.config import get_settings

logger = logging.getLogger("medimall.embeddings")
settings = get_settings()

DIMENSION = 768


FALLBACK_STOPWORDS = {
    "and", "the", "with", "for", "from", "having", "severe", "acute", "mild", "very",
    "hai", "me", "ka", "ki", "ke", "aur", "ho", "raha", "rahi", "bahut", "a", "an", "in", "to", "of"
}

def _generate_fallback_embedding(text: str, dim: int = DIMENSION) -> List[float]:
    """
    Deterministic pseudo-semantic embedding vector when no LLM API key is present.
    Ensures pgvector operations and cosine distance queries run without errors.
    """
    cleaned = text.lower().strip()
    words = cleaned.split()
    
    vec = np.zeros(dim, dtype=np.float32)
    valid_count = 0
    for word in words:
        if len(word) <= 2 or word in FALLBACK_STOPWORDS:
            continue
        # Generate hash-based deterministic coordinates
        h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        val = ((h >> 8) % 1000) / 1000.0 - 0.5
        vec[idx] += val
        valid_count += 1
        
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    else:
        # Default unit vector if empty
        vec[0] = 1.0
    return vec.tolist()


def get_embedding(text: str) -> List[float]:
    """
    Generates a 768-dimensional dense embedding for the given text.
    Uses Google Gemini text-embedding-004 if GEMINI_API_KEY is configured,
    otherwise falls back to deterministic vectorization.
    """
    if not text or not text.strip():
        return [0.0] * DIMENSION

    api_key = (settings.gemini_api_key or "").strip()
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model=settings.rag_embedding_model,
                content=text.strip(),
                task_type="retrieval_document",
                output_dimensionality=DIMENSION
            )
            embedding = result.get("embedding", [])
            if embedding and len(embedding) == DIMENSION:
                return embedding
        except Exception as e:
            logger.warning("Gemini embedding generation failed (%s), using fallback embedding", e)

    return _generate_fallback_embedding(text, DIMENSION)


def get_query_embedding(query: str) -> List[float]:
    """
    Generates an embedding specifically tuned for retrieval queries.
    """
    if not query or not query.strip():
        return [0.0] * DIMENSION

    api_key = (settings.gemini_api_key or "").strip()
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model=settings.rag_embedding_model,
                content=query.strip(),
                task_type="retrieval_query",
                output_dimensionality=DIMENSION
            )
            embedding = result.get("embedding", [])
            if embedding and len(embedding) == DIMENSION:
                return embedding
        except Exception as e:
            logger.warning("Gemini query embedding failed (%s), using fallback embedding", e)

    return _generate_fallback_embedding(query, DIMENSION)
