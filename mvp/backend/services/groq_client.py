"""
Groq API Client for the MVP Backend.

Provides a simple wrapper for making chat completion requests to Groq.
"""

from __future__ import annotations

import httpx
import logging
import asyncio
from typing import Optional

from backend.config import GROQ_API_KEY, GROQ_MODEL, GROQ_TEMPERATURE, GROQ_MAX_TOKENS

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqClient:
    def __init__(
        self,
        api_key: str = GROQ_API_KEY,
        model: str = GROQ_MODEL,
        temperature: float = GROQ_TEMPERATURE,
        max_tokens: int = GROQ_MAX_TOKENS,
    ):
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set. API calls will fail.")

    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 3,
        json_mode: bool = False,
    ) -> str:
        """
        Send a prompt to Groq and return the content.
        Includes exponential backoff for rate limits.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        GROQ_API_URL, headers=headers, json=payload
                    )
                    
                    if response.status_code == 429:
                        wait_time = 2 ** attempt
                        logger.warning(f"Groq rate limit hit. Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                        
                    response.raise_for_status()
                    data = response.json()
                    
                    if "choices" in data and len(data["choices"]) > 0:
                        return data["choices"][0]["message"]["content"]
                    else:
                        raise RuntimeError(f"Unexpected response format: {data}")
                        
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error {e.response.status_code}: {e.response.text}")
                if attempt == max_retries:
                    raise RuntimeError(f"Failed to generate after {max_retries} attempts.")
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
                if attempt == max_retries:
                    raise RuntimeError(f"Failed to generate after {max_retries} attempts: {str(e)}")
                    
            await asyncio.sleep(1)
            
        return ""
