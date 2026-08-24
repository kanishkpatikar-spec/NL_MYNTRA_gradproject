"""
Base Module — Abstract base class for all AI confidence modules.

Every module inherits from this class and implements the `generate` method.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ModuleResult:
    """Standardized output from any module."""
    module_id: str
    display_name: str
    content: str
    confidence: float | None = None
    metadata: dict = field(default_factory=dict)


class BaseModule(ABC):
    """
    Abstract base class for all Myntra Aura AI modules.

    Subclasses must define:
      - module_id:    unique string identifier (e.g. "fit_confidence")
      - display_name: human-readable name (e.g. "Fit Confidence")
      - generate():   async method that produces a ModuleResult
    """

    module_id: str = ""
    display_name: str = ""

    @abstractmethod
    async def generate(
        self,
        product: dict,
        reviews: list[dict],
        price_history: list[dict] | None = None,
        similar_products: list[dict] | None = None,
    ) -> ModuleResult:
        """
        Generate AI-powered insight for a product.

        Args:
            product: The product dict from the catalog.
            reviews: Relevant review-corpus snippets for this product's category.
            price_history: 90-day price history (used by price_context module).
            similar_products: Products in the same category (used by comparison_clarity).

        Returns:
            A ModuleResult with the generated content.
        """
        ...
