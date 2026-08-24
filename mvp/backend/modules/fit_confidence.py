"""
Fit Confidence Module

Analyzes product sizing info and related reviews to provide a fit prediction.
"""

from __future__ import annotations

import json
from backend.modules.base_module import BaseModule, ModuleResult
from backend.services.groq_client import GroqClient

class FitConfidenceModule(BaseModule):
    module_id = "fit_confidence"
    display_name = "Fit Predictor"
    
    def __init__(self):
        self.client = GroqClient()

    async def generate(
        self,
        product: dict,
        reviews: list[dict],
        price_history: list[dict] | None = None,
        similar_products: list[dict] | None = None,
    ) -> ModuleResult:
        
        # Filter for reviews that specifically mention fit/size issues
        fit_reviews = [
            r.get("paraphrase", "") for r in reviews 
            if "fit_size_uncertainty" in r.get("tags", [])
        ]
        
        if not fit_reviews:
            # Fallback if no specific fit reviews are available in the corpus for this category
            fit_reviews = [r.get("paraphrase", "") for r in reviews[:5]]
            
        if not fit_reviews:
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content="Not enough reviews to determine fit consensus. True to size is recommended.",
                confidence=5.0
            )

        system_prompt = (
            "You are an expert fashion fit analyst. Your job is to analyze real customer reviews "
            "and provide a highly accurate, confident fit prediction.\n"
            "Output your analysis as a JSON object with this exact structure:\n"
            "{\n"
            "  \"content\": \"Predicted fit summary...\",\n"
            "  \"confidence\": 8.5\n"
            "}\n"
            "The 'confidence' should be a float from 1.0 to 10.0 representing how strong the consensus is. "
            "Do not include any other text outside the JSON."
        )

        reviews_text = "\n".join(f"- {r}" for r in fit_reviews)
        user_prompt = (
            f"Based on these reviews, summarize the fit for '{product['name']}'. "
            f"Do people find it true to size, runs small, or runs large? "
            f"Be specific for common sizes.\n\nReviews:\n{reviews_text}"
        )

        try:
            response = await self.client.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=True
            )
            
            data = json.loads(response)
            
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content=data.get("content", "Fit seems standard based on reviews."),
                confidence=float(data.get("confidence", 7.0))
            )
            
        except Exception as e:
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content=f"Based on its {product['attributes'].get('fit', 'Regular')} cut, we recommend your usual size.",
                confidence=6.5
            )
