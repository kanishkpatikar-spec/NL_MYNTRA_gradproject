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
            name = product.get('name', '').lower()
            category = product.get('category', 'item').lower()
            color = product.get('attributes', {}).get('color', 'neutral').lower()
            
            # Smart Category Matching
            if "sneaker" in name or "shoe" in name:
                responses = [
                    f"**Streetwear:**\n- Tops: Pair with an oversized graphic hoodie or vintage tee.\n- Bottoms: Style with baggy cargo pants or relaxed-fit jeans.\n- Accessories: Add a simple chain and a crossbody bag.",
                    f"**Elevated Casual:**\n- Tops: Layer a knit polo under a sleek bomber jacket.\n- Bottoms: Wear with tailored chinos or straight-leg denim.\n- Socks: Show off some premium ribbed crew socks.",
                ]
            elif "hoodie" in name or "sweatshirt" in name:
                responses = [
                    f"**Cozy & Clean:**\n- Bottoms: Pair with matching sweatpants or heavyweight joggers.\n- Footwear: Complete the look with chunky retro sneakers.\n- Extras: Layer a crisp white tee underneath so the collar peeks out.",
                    f"**Smart Layering:**\n- Outerwear: Throw a structured overcoat or trench coat on top.\n- Bottoms: Style with relaxed straight jeans.\n- Footwear: Chelsea boots or sleek minimal sneakers.",
                ]
            elif "jeans" in name or "denim" in category:
                responses = [
                    f"**Everyday Essentials:**\n- Tops: Tuck in a clean white heavyweight t-shirt.\n- Footwear: Classic canvas sneakers or leather loafers.\n- Accessories: A premium leather belt and a vintage watch.",
                    f"**Night Out:**\n- Tops: Pair with a silky camp-collar shirt or fitted black turtleneck.\n- Footwear: Suede Chelsea boots or sleek derbies.\n- Outerwear: Add a leather biker jacket for edge.",
                ]
            elif "kurta" in name or "kurta" in category:
                responses = [
                    f"**Festive Elegance:**\n- Bottoms: Pair with tailored churidar or wide-leg palazzos.\n- Footwear: Complete with traditional mojris or embroidered juttis.\n- Accessories: Statement oxidized silver earrings or a layered necklace.",
                    f"**Modern Fusion:**\n- Bottoms: Wear casually over distressed light-wash denim.\n- Footwear: Pair with clean white sneakers for a high-low mix.\n- Accessories: Keep it minimal with a sleek metallic watch.",
                ]
            elif "watch" in name or "watch" in category:
                responses = [
                    f"**Corporate Ready:**\n- Apparel: The perfect finish for a tailored suit or blazer combo.\n- Pairing: Keep other accessories minimal; let the timepiece stand out.\n- Occasion: Boardroom meetings and formal dinners.",
                    f"**Weekend Casual:**\n- Apparel: Elevates a simple polo shirt and chinos combination.\n- Pairing: Mix with subtle leather bracelets or beaded cuffs.\n- Occasion: Sunday brunches and relaxed evening outings.",
                ]
            elif "bag" in name or "backpack" in name:
                responses = [
                    f"**Urban Commuter:**\n- Styling: Complements a tech-wear aesthetic perfectly.\n- Outerwear: Wear over a sleek windbreaker or utilitarian jacket.\n- Practicality: Keeps your silhouette sharp while carrying essentials.",
                ]
            elif "shirt" in name or "shirt" in category:
                responses = [
                    f"**Office to Evening:**\n- Bottoms: Tuck into tailored trousers with a sleek belt.\n- Layering: Throw a lightweight knit sweater over the shoulders.\n- Footwear: Suede loafers or crisp white leather sneakers.",
                    f"**Relaxed Weekend:**\n- Styling: Wear it unbuttoned over a ribbed tank top.\n- Bottoms: Pair with relaxed linen pants or vintage denim shorts.\n- Accessories: Add some classic aviator sunglasses.",
                ]
            elif "saree" in name or "saree" in category:
                responses = [
                    f"**Traditional Glamour:**\n- Blouse: Pair with a deeply scooped, heavily embroidered blouse.\n- Jewelry: Adorn with a classic choker and matching jhumkas.\n- Footwear: Classic gold or silver strappy heels.",
                ]
            else:
                responses = [
                    f"**Effortless Style:**\n- Styling: Let this piece be the focal point of a minimalist outfit.\n- Colors: Stick to monochromatic tones for the rest of your look.\n- Accessories: Keep it simple with a sleek watch or delicate chain.",
                ]
                
            hash_val = sum(ord(c) for c in str(product.get('id', '1')))
            idx = hash_val % len(responses)
            
            return ModuleResult(
                module_id=self.module_id,
                display_name=self.display_name,
                content=responses[idx],
                confidence=8.5
            )
