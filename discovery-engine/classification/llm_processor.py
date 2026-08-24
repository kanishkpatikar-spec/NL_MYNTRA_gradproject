#!/usr/bin/env python3
"""
Classification Orchestrator — fetches clean snippets from Supabase, classifies
each one through the Groq LLM pipeline (prompt_builder → groq_client →
response_parser), and stores results in the classified_snippets table.

Features:
  • Pagination to handle large datasets
  • Batch resumption — skips already-classified snippet IDs
  • Progress tracking with ETA
  • Stats logging (success rate, failures, new category proposals)

Usage:
    # Test batch of 10
    python -m classification.llm_processor --limit 10

    # Full run (all unclassified snippets)
    python -m classification.llm_processor --all
"""

import os
import sys
import time
import argparse
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Bootstrap — ensure the package can be imported when run as a script
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from classification.groq_client import GroqClient
from classification import prompt_builder
from classification.response_parser import parse_and_validate, ValidationError

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in .env")
    sys.exit(1)

if not GROQ_API_KEY:
    logger.error("Missing GROQ_API_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
groq = GroqClient(api_key=GROQ_API_KEY)

# Pre-build the system prompt once (it never changes between snippets)
SYSTEM_PROMPT = prompt_builder.build_system_prompt()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fetch_all_clean_snippets() -> list[dict]:
    """Fetch all rows from clean_snippets using pagination."""
    all_rows: list[dict] = []
    page_size = 1000
    offset = 0
    while True:
        res = (
            supabase.table("clean_snippets")
            .select("*")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not res.data:
            break
        all_rows.extend(res.data)
        if len(res.data) < page_size:
            break
        offset += page_size
    return all_rows


def fetch_classified_ids() -> set[str]:
    """Return the set of clean_ids that have already been classified."""
    ids: set[str] = set()
    page_size = 1000
    offset = 0
    while True:
        res = (
            supabase.table("classified_snippets")
            .select("clean_id")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not res.data:
            break
        ids.update(row["clean_id"] for row in res.data)
        if len(res.data) < page_size:
            break
        offset += page_size
    return ids


def classify_one(snippet: dict) -> dict | None:
    """
    Classify a single snippet.  Returns a dict ready for Supabase insert,
    or None if classification failed after retry.
    """
    text = snippet["text"]
    source = snippet.get("source", "")

    user_prompt = prompt_builder.build_user_prompt(text, source)

    # --- First attempt ---
    try:
        raw = groq.classify(SYSTEM_PROMPT, user_prompt)
        result = parse_and_validate(raw)
        return {
            "clean_id": snippet["id"],
            "tags": result["tags"],
            "paraphrase": result["paraphrase"],
            "intensity": result["intensity"],
            "segments": result["segments"],
            "new_category": result.get("new_category"),
        }
    except ValidationError as e:
        logger.warning("Validation failed (attempt 1): %s — re-prompting", e)
    except RuntimeError as e:
        logger.error("Groq API error (attempt 1): %s", e)
        return None

    # --- Second attempt (re-prompt) ---
    try:
        raw = groq.classify(SYSTEM_PROMPT, user_prompt)
        result = parse_and_validate(raw)
        return {
            "clean_id": snippet["id"],
            "tags": result["tags"],
            "paraphrase": result["paraphrase"],
            "intensity": result["intensity"],
            "segments": result["segments"],
            "new_category": result.get("new_category"),
        }
    except (ValidationError, RuntimeError) as e:
        logger.error("Classification failed after 2 attempts: %s", e)
        return None


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def run(limit: int | None = None):
    """
    Run the classification pipeline.

    Args:
        limit: Max number of snippets to classify. None = all unclassified.
    """
    logger.info("=== Classification Pipeline Starting ===")

    # 1. Fetch data
    logger.info("Fetching clean snippets...")
    all_snippets = fetch_all_clean_snippets()
    logger.info("Total clean snippets: %d", len(all_snippets))

    logger.info("Fetching already-classified IDs...")
    classified_ids = fetch_classified_ids()
    logger.info("Already classified: %d", len(classified_ids))

    # 2. Filter to unclassified only
    to_process = [s for s in all_snippets if s["id"] not in classified_ids]
    if limit is not None:
        to_process = to_process[:limit]

    if not to_process:
        logger.info("Nothing to classify — all snippets are already processed!")
        return

    logger.info("Snippets to classify this run: %d", len(to_process))

    # 3. Classify
    successes = 0
    failures = 0
    new_categories: list[str] = []
    batch_buffer: list[dict] = []
    batch_size = 25  # Insert in batches of 25
    start_time = time.time()

    for i, snippet in enumerate(to_process, 1):
        elapsed = time.time() - start_time
        avg_time = elapsed / i if i > 1 else 4.0
        remaining = avg_time * (len(to_process) - i)
        eta_min = remaining / 60

        logger.info(
            "[%d/%d]  ETA %.1f min  |  %s...",
            i,
            len(to_process),
            eta_min,
            snippet["text"][:60],
        )

        result = classify_one(snippet)

        if result is None:
            failures += 1
            continue

        successes += 1
        batch_buffer.append(result)

        if result.get("new_category"):
            new_categories.append(result["new_category"])
            logger.info("  → NEW CATEGORY proposed: %s", result["new_category"])

        logger.info(
            "  → tags=%s  intensity=%d  segments=%s",
            result["tags"],
            result["intensity"],
            result["segments"],
        )

        # Flush batch to Supabase
        if len(batch_buffer) >= batch_size:
            _flush_batch(batch_buffer)
            batch_buffer = []

    # Flush remaining
    if batch_buffer:
        _flush_batch(batch_buffer)

    # 4. Summary
    total_time = time.time() - start_time
    logger.info("=== Classification Complete ===")
    logger.info("Processed:    %d", successes + failures)
    logger.info("Successes:    %d  (%.1f%%)", successes, 100 * successes / max(successes + failures, 1))
    logger.info("Failures:     %d", failures)
    logger.info("Total time:   %.1f min", total_time / 60)
    logger.info("Avg per item: %.1f sec", total_time / max(successes + failures, 1))

    if new_categories:
        logger.info("New category proposals (%d):", len(new_categories))
        for cat in set(new_categories):
            logger.info("  • %s  (×%d)", cat, new_categories.count(cat))


def _flush_batch(batch: list[dict]) -> None:
    """Insert a batch of classification results into Supabase."""
    try:
        supabase.table("classified_snippets").insert(batch).execute()
        logger.info("  ✓ Flushed batch of %d to Supabase", len(batch))
    except Exception as e:
        logger.error("  ✗ Supabase insert failed: %s", e)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Classify clean snippets using Groq LLM"
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--limit",
        type=int,
        default=350,
        help="Number of snippets to classify (default: 350 to respect 200k daily token limit)",
    )
    group.add_argument(
        "--all",
        action="store_true",
        help="Classify up to 350 snippets (safe daily limit)",
    )
    args = parser.parse_args()

    limit = 350 if args.all else args.limit
    run(limit=limit)


if __name__ == "__main__":
    main()
