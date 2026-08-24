"""
Taxonomy loader — reads the driver taxonomy from taxonomy.json and provides
helper functions for prompt building and response validation.
"""

import json
import os

_TAXONOMY_PATH = os.path.join(os.path.dirname(__file__), "taxonomy.json")
_taxonomy_cache = None


def _load_taxonomy() -> dict:
    """Load and cache the taxonomy from disk."""
    global _taxonomy_cache
    if _taxonomy_cache is None:
        with open(_TAXONOMY_PATH, "r", encoding="utf-8") as f:
            _taxonomy_cache = json.load(f)
    return _taxonomy_cache


def get_drivers() -> list[dict]:
    """Return the full list of driver objects."""
    return _load_taxonomy()["drivers"]


def get_valid_ids() -> set[str]:
    """Return a set of all valid driver IDs for validation."""
    return {d["id"] for d in get_drivers()}


def get_taxonomy_for_prompt() -> str:
    """
    Format the taxonomy as a numbered list suitable for injection
    into an LLM system prompt.
    """
    lines = []
    for i, driver in enumerate(get_drivers(), 1):
        lines.append(
            f'{i}. **{driver["id"]}** — {driver["label"]}: {driver["description"]}'
        )
    return "\n".join(lines)


def get_version() -> str:
    """Return the taxonomy version string."""
    return _load_taxonomy()["version"]
