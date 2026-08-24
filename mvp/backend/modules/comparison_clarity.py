"""
Comparison Clarity Module

Takes multiple products and highlights key differences to help the user choose.
"""

from __future__ import annotations

import json
from backend.modules.base_module import BaseModule, ModuleResult
from backend.services.groq_client import GroqClient

class ComparisonClarityModule(BaseModule):
    module_id = "comparison_clarity"
    display_name = "Comparison Clarity"
    
    def __init__(self):
        self.client = GroqClient()

    async def generate(
        self,
        product: dict,
        reviews: list[dict],
        price_history: list[dict] | None = None,
        similar_products: list[dict] | None = None,
    ) -> ModuleResult:
        
        # This implementation serves the single-item view where it compares the item
        # against ONE similar item to generate an insight panel.
        
        if not similar_products:
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content="No similar products available for comparison.",
                confidence=0.0
            )

        compare_product = similar_products[0]

        system_prompt = (
            "You are an expert personal shopper. Your job is to compare two products and "
            "highlight key differences to help a customer decide.\n"
            "Output your analysis as a JSON object with this exact structure:\n"
            "{\n"
            "  \"content\": \"The comparison text...\",\n"
            "  \"confidence\": 8.5\n"
            "}\n"
            "The 'confidence' should be a float from 1.0 to 10.0 representing how clearly the items differ. "
            "Do not include any other text outside the JSON."
        )

        user_prompt = (
            f"Compare these two products:\n"
            f"1. {product['name']} (Brand: {product['brand']}, Material: {product['attributes'].get('material')}, Fit: {product['attributes'].get('fit')})\n"
            f"2. {compare_product['name']} (Brand: {compare_product['brand']}, Material: {compare_product['attributes'].get('material')}, Fit: {compare_product['attributes'].get('fit')})\n\n"
            f"Highlight one key difference in material and one key difference in fit. "
            f"Conclude with a 1-sentence recommendation based on occasion."
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
                content=data.get("content", f"Both are great options, but {product['name']} may better suit your needs."),
                confidence=float(data.get("confidence", 8.0)),
                metadata={"compared_to": compare_product['id']}
            )
            
        except Exception as e:
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content=f"Compared to {compare_product['name']}, this item offers a different material and fit profile.",
                confidence=5.0,
                metadata={"compared_to": compare_product['id']}
            )
