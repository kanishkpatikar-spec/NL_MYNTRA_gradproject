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
            "You are an expert AI fashion stylist for Myntra. Provide a short, versatile styling guide "
            "for the given product. "
            "IMPORTANT GENDER RULES: "
            "If the item is clearly for women (e.g., saree, kurta, dress), provide female-specific styling. "
            "If the item is clearly for men, provide male-specific styling. "
            "If the item is unisex (e.g., shirts, jackets, hoodies, jeans, sneakers), you MUST provide TWO sections: "
            "'**For Men:**' and '**For Women:**'. "
            "Output your analysis as a JSON object with this exact structure:\n"
            "{\n"
            "  \"content\": \"Styling tips following the gender rules...\",\n"
            "  \"confidence\": 8.5\n"
            "}\n"
            "The 'confidence' should be a float from 1.0 to 10.0. "
            "Do not include any other text outside the JSON."
        )

        user_prompt = (
            f"Provide styling suggestions for '{product['name']}' (Category: {product.get('category', 'unknown')}, "
            f"Color: {product.get('attributes', {}).get('color', 'unknown')})."
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
                content=data.get("content", "Pair this item with complementary colors and minimal accessories."),
                confidence=float(data.get("confidence", 7.0))
            )
            
        except Exception as e:
            hash_val = sum(ord(c) for c in str(product.get('id', '1')))
            category = product.get('category', 'item').lower()
            color = product.get('attributes', {}).get('color', 'neutral').lower()
            
            female_only = ["kurta", "dress", "saree", "skirt", "heels"]
            male_only = ["blazer", "suit"] # Assuming blazer is male in this context
            
            if category in female_only:
                responses = [
                    f"- Casual: Pair this {category} with flats and delicate jewelry.\n- Dressy: Add statement earrings and a clutch.",
                    f"- Day out: Style with a stylish tote bag.\n- Evening: Pair with heels and bold lipstick.",
                ]
            elif category in male_only:
                responses = [
                    f"- Smart Casual: Layer over a crisp t-shirt.\n- Formal: Pair with trousers and leather dress shoes.",
                    f"- Office: Wear with tailored chinos.\n- Evening: Complete the look with a luxury watch.",
                ]
            else:
                # Unisex
                responses = [
                    f"**For Men:**\n- Casual: Pair with jeans and sneakers.\n- Smart: Layer under a tailored jacket.\n\n**For Women:**\n- Casual: Style with a skirt or high-waisted denim.\n- Dressy: Pair with heels and bold lipstick.",
                    f"**For Men:**\n- Everyday: Effortless pairing with your favorite basic tee.\n- Trend: Mix with contrasting textures.\n\n**For Women:**\n- Everyday: Pair with comfortable flats.\n- Trend: Add a chunky belt and statement necklace."
                ]
                
            idx = hash_val % len(responses)
            
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content=responses[idx],
                confidence=7.5
            )
