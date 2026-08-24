"""
Response parser & validator — takes raw JSON text from the Groq LLM,
parses it, and validates against the taxonomy schema.  Returns a
normalised dict ready for Supabase insertion.
"""

import json
import logging
from . import taxonomy

logger = logging.getLogger(__name__)

VALID_IDS = taxonomy.get_valid_ids()


class ValidationError(Exception):
    """Raised when the LLM response fails schema validation."""
    pass


def parse_and_validate(raw_response: str) -> dict:
    """
    Parse raw JSON text from the LLM and validate it against the expected
    schema.

    Returns a normalised dict:
        {
            "tags": [...],
            "paraphrase": "...",
            "intensity": N,
            "segments": [...],
            "new_category": "..." | None
        }

    Raises ValidationError if the response is structurally invalid.
    """
    # --- Step 1: Parse JSON ---
    try:
        data = json.loads(raw_response)
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON from LLM: {e}")

    if not isinstance(data, dict):
        raise ValidationError(f"Expected JSON object, got {type(data).__name__}")

    # --- Step 2: Validate & normalise 'tags' ---
    tags = data.get("tags", [])
    if isinstance(tags, str):
        tags = [tags]  # LLM sometimes returns a single string instead of array
    if not isinstance(tags, list) or len(tags) == 0:
        raise ValidationError(f"'tags' must be a non-empty list, got: {tags}")

    # Filter to only valid taxonomy IDs; keep track of invalid ones
    valid_tags = [t for t in tags if t in VALID_IDS]
    invalid_tags = [t for t in tags if t not in VALID_IDS]
    if invalid_tags:
        logger.warning("Stripped invalid taxonomy tags: %s", invalid_tags)

    # If all tags were invalid, fall back to a general bucket
    if not valid_tags:
        logger.warning("No valid tags found; defaulting to 'wishlist_as_bookmark'")
        valid_tags = ["wishlist_as_bookmark"]

    # --- Step 3: Validate 'paraphrase' ---
    paraphrase = data.get("paraphrase", "")
    if not isinstance(paraphrase, str) or len(paraphrase.strip()) < 5:
        raise ValidationError(
            f"'paraphrase' must be a non-trivial string, got: {repr(paraphrase)}"
        )
    paraphrase = paraphrase.strip()

    # --- Step 4: Validate 'intensity' ---
    intensity = data.get("intensity")
    if intensity is None:
        raise ValidationError("'intensity' is missing")
    try:
        intensity = int(intensity)
    except (ValueError, TypeError):
        raise ValidationError(f"'intensity' must be an integer, got: {intensity}")
    intensity = max(1, min(5, intensity))  # Clamp to 1-5

    # --- Step 5: Validate 'segments' ---
    segments = data.get("segments", [])
    if isinstance(segments, str):
        segments = [segments]
    if not isinstance(segments, list):
        segments = []
    # Normalise: lowercase, strip whitespace, remove empty strings
    segments = [s.strip().lower() for s in segments if isinstance(s, str) and s.strip()]

    # --- Step 6: Validate 'new_category' ---
    new_category = data.get("new_category")
    if new_category is not None:
        if not isinstance(new_category, str) or len(new_category.strip()) < 3:
            new_category = None
        else:
            new_category = new_category.strip()

    return {
        "tags": valid_tags,
        "paraphrase": paraphrase,
        "intensity": intensity,
        "segments": segments,
        "new_category": new_category,
    }
