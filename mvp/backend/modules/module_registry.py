"""
Module Registry — Loads and provides active modules based on module_config.json.
"""

from __future__ import annotations

from backend.modules.base_module import BaseModule
from backend.services.catalog_service import get_module_config

# Import all modules here so they are registered
from backend.modules.fit_confidence import FitConfidenceModule
from backend.modules.review_digest import ReviewDigestModule
from backend.modules.price_context import PriceContextModule
from backend.modules.styling_assist import StylingAssistModule
from backend.modules.comparison_clarity import ComparisonClarityModule

# Manual registry of all available modules
_ALL_MODULES: dict[str, BaseModule] = {
    "fit_confidence": FitConfidenceModule(),
    "review_digest": ReviewDigestModule(),
    "price_context": PriceContextModule(),
    "styling_assist": StylingAssistModule(),
    "comparison_clarity": ComparisonClarityModule(),
}

def get_enabled_modules() -> dict[str, BaseModule]:
    """Return a dictionary of enabled modules, respecting module_config.json."""
    config = get_module_config()
    enabled = {}
    for mod_id, module in _ALL_MODULES.items():
        # Check if the config explicitly enables it (defaults to true if missing from config)
        if config.get(mod_id, {}).get("enabled", True):
            enabled[mod_id] = module
    return enabled

def get_module(module_id: str) -> BaseModule | None:
    """Return a specific module instance by ID, if it's enabled."""
    enabled_modules = get_enabled_modules()
    return enabled_modules.get(module_id)
