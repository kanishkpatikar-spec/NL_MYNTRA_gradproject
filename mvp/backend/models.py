"""
MVP Backend — Pydantic models for request/response schemas.
"""

from __future__ import annotations
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Product / Catalog
# ---------------------------------------------------------------------------

class ProductAttribute(BaseModel):
    material: str = ""
    pattern: str = ""
    fit: str = ""
    sleeve: str = ""
    occasion: str = ""


class Product(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    price: int
    sizes: list[str] = []
    image_url: str = ""
    attributes: ProductAttribute = ProductAttribute()
    rating: float = 0.0
    review_count: int = 0


# ---------------------------------------------------------------------------
# Price History
# ---------------------------------------------------------------------------

class PricePoint(BaseModel):
    date: str
    price: int


# ---------------------------------------------------------------------------
# Module results
# ---------------------------------------------------------------------------

class ModuleResult(BaseModel):
    module_id: str
    display_name: str
    content: str
    confidence: float | None = None
    metadata: dict = {}


# ---------------------------------------------------------------------------
# Wishlist API
# ---------------------------------------------------------------------------

class WishlistItemResponse(BaseModel):
    product: Product
    modules_available: list[str] = []


class WishlistResponse(BaseModel):
    items: list[WishlistItemResponse]
    total: int


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------

class EventLog(BaseModel):
    event_type: str
    item_id: str | None = None
    module_type: str | None = None
    session_id: str | None = None
    time_spent_ms: int | None = None


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = ""
    products_count: int = 0
    review_corpus_size: int = 0
