"""
Catalog Service — loads mock product catalog, price history, and review corpus
into memory and exposes simple lookup methods for the API layer.
"""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Optional

from backend.config import MOCK_DATA_DIR

# ---------------------------------------------------------------------------
# In-memory stores (loaded once at import time)
# ---------------------------------------------------------------------------
_catalog: list[dict] = []
_catalog_index: dict[str, dict] = {}
_price_history: dict[str, list[dict]] = {}
_review_corpus: list[dict] = []

# Mapping: category keyword → list of review-corpus snippet indices
_category_review_map: dict[str, list[int]] = {}


def _load_all() -> None:
    """Load all mock data files into memory."""
    global _catalog, _catalog_index, _price_history, _review_corpus, _category_review_map

    # --- Catalog ---
    catalog_path = MOCK_DATA_DIR / "catalog.json"
    with open(catalog_path, "r", encoding="utf-8") as f:
        _catalog = json.load(f)
    _catalog_index = {p["id"]: p for p in _catalog}

    # --- Price History ---
    price_path = MOCK_DATA_DIR / "price_history.json"
    if price_path.exists():
        with open(price_path, "r", encoding="utf-8") as f:
            _price_history = json.load(f)

    # --- Review Corpus ---
    corpus_path = MOCK_DATA_DIR / "review_corpus.json"
    if corpus_path.exists():
        with open(corpus_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        _review_corpus = raw.get("snippets", [])

    # --- Build category → review index ---
    # Since the review corpus is from general Myntra reviews (not product-specific),
    # we map reviews to products via their tag categories.  A product in the "footwear"
    # category will get reviews tagged with fit_size_uncertainty, etc.
    _build_category_review_map()


def _build_category_review_map() -> None:
    """
    Map review corpus snippets to product categories via tag-based heuristics.

    Mapping logic:
    - fit_size_uncertainty → apparel + footwear
    - price_deal_timing → all categories
    - trust_review_credibility → all categories
    - comparison_paralysis → all categories
    - return_exchange_friction → apparel + footwear
    - styling_occasion_uncertainty → apparel (kurta, dress, saree, blazer)
    - external_research → all categories
    - wishlist_as_bookmark → all categories
    - social_validation_seeking → apparel + accessory
    """
    global _category_review_map

    tag_to_categories = {
        "fit_size_uncertainty": ["kurta", "shirt", "jeans", "hoodie", "dress", "tshirt", "joggers", "jacket", "footwear", "blazer", "saree"],
        "price_deal_timing": None,      # None = all categories
        "trust_review_credibility": None,
        "comparison_paralysis": None,
        "return_exchange_friction": ["kurta", "shirt", "jeans", "hoodie", "dress", "tshirt", "joggers", "jacket", "footwear", "blazer", "saree"],
        "styling_occasion_uncertainty": ["kurta", "dress", "saree", "blazer", "jacket"],
        "external_research": None,
        "wishlist_as_bookmark": None,
        "social_validation_seeking": ["kurta", "dress", "tshirt", "accessory", "bag"],
    }

    all_categories = set(p.get("category", "") for p in _catalog)

    for cat in all_categories:
        _category_review_map[cat] = []

    for idx, snippet in enumerate(_review_corpus):
        tags = snippet.get("tags", [])
        matched_categories: set[str] = set()

        for tag in tags:
            target = tag_to_categories.get(tag)
            if target is None:
                # This tag applies to all categories
                matched_categories.update(all_categories)
            else:
                matched_categories.update(t for t in target if t in all_categories)

        for cat in matched_categories:
            _category_review_map[cat].append(idx)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_all_products() -> list[dict]:
    """Return the full product catalog."""
    if not _catalog:
        _load_all()
    return _catalog


def get_product(product_id: str) -> Optional[dict]:
    """Return a single product by SKU ID, or None."""
    if not _catalog:
        _load_all()
    return _catalog_index.get(product_id)


def get_price_history(product_id: str) -> list[dict]:
    """Return the 90-day price history for a product."""
    if not _price_history:
        _load_all()
    return _price_history.get(product_id, [])


def get_reviews_for_product(product_id: str, limit: int = 20) -> list[dict]:
    """
    Return review-corpus snippets relevant to a product's category.

    Since the corpus contains general Myntra reviews (not product-specific),
    we match by category + tag heuristics and return a representative sample.
    """
    if not _catalog:
        _load_all()

    product = _catalog_index.get(product_id)
    if not product:
        return []

    category = product.get("category", "")
    indices = _category_review_map.get(category, [])

    if not indices:
        return []

    # Sample up to `limit` reviews
    sample_indices = random.sample(indices, min(limit, len(indices)))
    return [_review_corpus[i] for i in sample_indices]


def get_similar_products(product_id: str, max_results: int = 3) -> list[dict]:
    """
    Return products similar to the given one (same category, different SKU).
    Used for the Comparison Clarity module.
    """
    if not _catalog:
        _load_all()

    product = _catalog_index.get(product_id)
    if not product:
        return []

    category = product.get("category", "")
    similar = [p for p in _catalog if p["category"] == category and p["id"] != product_id]
    return similar[:max_results]


def get_corpus_size() -> int:
    """Return the total number of snippets in the review corpus."""
    if not _review_corpus:
        _load_all()
    return len(_review_corpus)


# ---------------------------------------------------------------------------
# Module config
# ---------------------------------------------------------------------------
_module_config: dict = {}


def get_module_config() -> dict:
    """Load and return the module toggle configuration."""
    global _module_config
    if not _module_config:
        config_path = MOCK_DATA_DIR / "module_config.json"
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                _module_config = json.load(f)
        else:
            _module_config = {
                "fit_confidence": {"enabled": True},
                "price_context": {"enabled": True},
                "styling_assist": {"enabled": True},
                "comparison_clarity": {"enabled": True},
                "review_digest": {"enabled": True},
            }
    return _module_config
