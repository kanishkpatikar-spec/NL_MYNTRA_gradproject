"""
Health check route.

GET /api/health — returns service status and data counts.
"""

from __future__ import annotations

from fastapi import APIRouter

from backend.config import APP_VERSION
from backend.services import catalog_service

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health_check():
    """Return service health status and basic data counts."""
    products = catalog_service.get_all_products()
    corpus_size = catalog_service.get_corpus_size()

    return {
        "status": "ok",
        "version": APP_VERSION,
        "products_count": len(products),
        "review_corpus_size": corpus_size,
    }
