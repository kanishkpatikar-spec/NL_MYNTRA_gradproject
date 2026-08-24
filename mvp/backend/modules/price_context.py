"""
Price Context Module

Analyzes 90-day price history and returns a verdict on whether the current price is a good deal.
Strictly avoids dark patterns / urgency language.
"""

from __future__ import annotations

import json
from backend.modules.base_module import BaseModule, ModuleResult
from backend.services.groq_client import GroqClient

class PriceContextModule(BaseModule):
    module_id = "price_context"
    display_name = "Price Context"
    
    def __init__(self):
        self.client = GroqClient()

    async def generate(
        self,
        product: dict,
        reviews: list[dict],
        price_history: list[dict] | None = None,
        similar_products: list[dict] | None = None,
    ) -> ModuleResult:
        
        if not price_history:
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content="Price history is not available.",
                confidence=0.0
            )

        prices = [entry["price"] for entry in price_history]
        lowest_price = min(prices)
        highest_price = max(prices)
        current_price = prices[-1]

        system_prompt = (
            "You are an objective shopping analyst. Your job is to analyze a 90-day price trend "
            "and provide a factual, 1-sentence verdict on whether the current price is a good deal.\n"
            "CRITICAL: NEVER use words like 'buy now', 'hurry', 'limited time', 'don't miss out'. "
            "Avoid any urgency or pressure (anti-dark-pattern guardrails).\n"
            "Output your analysis as a JSON object with this exact structure:\n"
            "{\n"
            "  \"content\": \"The 1-sentence verdict...\",\n"
            "  \"confidence\": 9.0\n"
            "}\n"
            "Do not include any other text outside the JSON."
        )

        user_prompt = (
            f"Analyze this 90-day price trend for '{product['name']}'.\n"
            f"Current price: {current_price}\n"
            f"Lowest price in 90 days: {lowest_price}\n"
            f"Highest price in 90 days: {highest_price}\n"
            f"Is the current price a good deal? Does it frequently go on sale? Provide a 1-sentence verdict."
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
                content=data.get("content", f"Current price is {current_price}, fluctuating between {lowest_price} and {highest_price} over the last 90 days."),
                confidence=float(data.get("confidence", 8.0)),
                metadata={
                    "lowest_price": lowest_price,
                    "highest_price": highest_price,
                    "current_price": current_price
                }
            )
            
        except Exception as e:
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content=f"Current price is {current_price}. It has ranged from {lowest_price} to {highest_price}.",
                confidence=5.0,
                metadata={
                    "lowest_price": lowest_price,
                    "highest_price": highest_price,
                    "current_price": current_price
                }
            )
