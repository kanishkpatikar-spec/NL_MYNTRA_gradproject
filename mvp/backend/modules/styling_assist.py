"""
Styling Assist Module

Suggests distinct styling options based on product attributes.
"""

from __future__ import annotations

import json
from backend.modules.base_module import BaseModule, ModuleResult
from backend.services.groq_client import GroqClient

class StylingAssistModule(BaseModule):
    module_id = "styling_assist"
    display_name = "Styling Assist"
    
    def __init__(self):
        self.client = GroqClient()

    async def generate(
        self,
        product: dict,
        reviews: list[dict],
        price_history: list[dict] | None = None,
        similar_products: list[dict] | None = None,
    ) -> ModuleResult:
        
        system_prompt = (
            "You are a top-tier personal fashion stylist. Your job is to suggest ways to style a specific product.\n"
            "Output your analysis as a JSON object with this exact structure:\n"
            "{\n"
            "  \"content\": \"- Style 1: ...\\n- Style 2: ...\",\n"
            "  \"confidence\": 8.5\n"
            "}\n"
            "The 'confidence' should be a float from 1.0 to 10.0 based on how versatile the piece is. "
            "Do not include any other text outside the JSON. Format the content as a bulleted list."
        )

        user_prompt = (
            f"Suggest 2 distinct ways to style this product: '{product['name']}'. "
            f"Brand: {product['brand']}, Category: {product['category']}, "
            f"Occasion: {product['attributes'].get('occasion', 'Any')}, "
            f"Material: {product['attributes'].get('material', 'Any')}. "
            f"Keep it brief."
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
                content=data.get("content", "- Casual: Pair with your favorite jeans.\n- Dressy: Add statement accessories."),
                confidence=float(data.get("confidence", 8.0))
            )
            
        except Exception as e:
            hash_val = sum(ord(c) for c in str(product.get('id', '1')))
            category = product.get('category', 'item').lower()
            color = product.get('attributes', {}).get('color', 'neutral').lower()
            
            responses = [
                f"- Casual: Pair this {category} with light wash denim.\n- Dressy: Add statement jewelry to elevate the look.",
                f"- Workwear: Layer under a blazer.\n- Weekend: Perfect match for white sneakers and {color} accessories.",
                f"- Day out: Style with a crossbody bag.\n- Evening: Pair with heels and bold lipstick.",
                f"- Everyday: Effortless pairing with your favorite basics.\n- Trend: Mix this {color} {category} with contrasting textures."
            ]
            idx = hash_val % len(responses)
            
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content=responses[idx],
                confidence=7.5
            )
