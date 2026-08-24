"""
Wishlist API routes.

GET  /api/wishlist            — all wishlisted items
GET  /api/wishlist/{item_id}  — single item with full details + price history
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.services import catalog_service

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.get("")
def get_wishlist(limit: int = 24, offset: int = 0):
    """Return all items in the user's wishlist (pre-populated from mock catalog)."""
    products = catalog_service.get_all_products()
    module_config = catalog_service.get_module_config()
    enabled_modules = [k for k, v in module_config.items() if v.get("enabled")]

    items = []
    for product in products[offset : offset + limit]:
        items.append({
            "product": product,
            "modules_available": enabled_modules,
        })

    return {
        "items": items,
        "total": len(products),
    }


@router.get("/{item_id}")
def get_wishlist_item(item_id: str):
    """Return a single wishlisted item with full details and price history."""
    product = catalog_service.get_product(item_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {item_id} not found")

    price_history = catalog_service.get_price_history(item_id)
    reviews = catalog_service.get_reviews_for_product(item_id, limit=20)
    similar = catalog_service.get_similar_products(item_id, max_results=3)
    module_config = catalog_service.get_module_config()
    enabled_modules = [k for k, v in module_config.items() if v.get("enabled")]

    return {
        "product": product,
        "price_history": price_history,
        "reviews": reviews,
        "similar_products": similar,
        "modules_available": enabled_modules,
    }
