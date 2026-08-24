"""
Groq API client wrapper with rate limiting, exponential backoff retry,
and structured error handling.
"""

import os
import time
import logging
from groq import Groq

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_MODEL = "openai/gpt-oss-20b"
DEFAULT_TEMPERATURE = 0.1
DEFAULT_MAX_TOKENS = 512
REQUEST_DELAY_SECONDS = 6        # Respect Groq free-tier RPM limits
MAX_RETRIES = 3
INITIAL_BACKOFF_SECONDS = 1      # Exponential: 1s → 2s → 4s


class GroqClient:
    """Thin wrapper around the Groq SDK with retry + rate-limit logic."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ):
        self._api_key = api_key or os.environ.get("GROQ_API_KEY")
        if not self._api_key:
            raise ValueError("GROQ_API_KEY is required")

        self._client = Groq(api_key=self._api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._last_request_time: float = 0.0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def classify(self, system_prompt: str, user_prompt: str) -> str:
        """
        Send a classification request to Groq and return the raw response
        text.  Handles rate limiting and retries automatically.

        Returns the raw string content from the LLM (expected to be JSON).
        Raises RuntimeError after all retries are exhausted.
        """
        self._rate_limit()

        last_error: Exception | None = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                completion = self._client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    response_format={"type": "json_object"},
                )
                return completion.choices[0].message.content

            except Exception as e:
                last_error = e
                backoff = INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1))
                logger.warning(
                    "Groq request failed (attempt %d/%d): %s  — retrying in %ds",
                    attempt,
                    MAX_RETRIES,
                    e,
                    backoff,
                )
                time.sleep(backoff)

        raise RuntimeError(
            f"Groq API failed after {MAX_RETRIES} retries: {last_error}"
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _rate_limit(self) -> None:
        """Enforce minimum delay between consecutive requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)
        self._last_request_time = time.time()
