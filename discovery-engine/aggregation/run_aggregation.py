#!/usr/bin/env python3
"""
Aggregation Pipeline Orchestrator — fetches classified snippets from Supabase,
runs all aggregation computations, exports results to files, and pushes
aggregation results back to Supabase.

Usage:
    python -m aggregation.run_aggregation
"""

import os
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from aggregation.aggregator import (
    compute_frequency,
    compute_avg_intensity,
    compute_cooccurrence,
    select_example_paraphrases,
)
from aggregation.opportunity_scorer import compute_opportunity_scores, load_weights
from aggregation.exporter import export_json, export_csv, export_review_corpus

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

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Output directory for exports
EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fetch_all_classified_snippets() -> list[dict]:
    """Fetch all rows from classified_snippets with pagination."""
    all_rows: list[dict] = []
    page_size = 1000
    offset = 0
    while True:
        res = (
            supabase.table("classified_snippets")
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


def push_to_supabase(opportunity_scores: list[dict], paraphrases: dict[str, list[str]]) -> None:
    """
    Upsert aggregation results into the aggregation_results Supabase table.
    Clears old data first to ensure a clean state.
    """
    # Delete existing rows
    try:
        supabase.table("aggregation_results").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        logger.info("Cleared existing aggregation_results rows")
    except Exception as e:
        logger.warning("Could not clear old aggregation_results: %s", e)

    # Insert fresh results
    rows = []
    for row in opportunity_scores:
        rows.append({
            "driver_id": row["driver_id"],
            "driver_label": row["driver_label"],
            "frequency": row["frequency"],
            "avg_intensity": row["avg_intensity"],
            "opportunity_score": row["opportunity_score"],
            "weight": row["weight"],
            "example_paraphrases": paraphrases.get(row["driver_id"], []),
        })

    res = supabase.table("aggregation_results").insert(rows).execute()
    logger.info("Pushed %d rows to aggregation_results", len(res.data))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run():
    logger.info("=== Aggregation Pipeline Starting ===")

    # 1. Fetch classified data
    logger.info("Fetching classified snippets from Supabase...")
    snippets = fetch_all_classified_snippets()
    logger.info("Total classified snippets: %d", len(snippets))

    if not snippets:
        logger.warning("No classified snippets found. Run the classification pipeline first!")
        return

    # 2. Compute aggregations
    logger.info("Computing frequency counts...")
    frequency = compute_frequency(snippets)
    for d_id, count in sorted(frequency.items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            logger.info("  %s: %d", d_id, count)

    logger.info("Computing average intensity...")
    avg_intensity = compute_avg_intensity(snippets)

    logger.info("Computing co-occurrence matrix...")
    cooccurrence = compute_cooccurrence(snippets)

    # Count co-occurrence pairs
    pair_count = sum(
        1 for d_i in cooccurrence for d_j in cooccurrence[d_i]
        if cooccurrence[d_i][d_j] > 0 and d_i < d_j
    )
    logger.info("  Found %d co-occurrence pairs", pair_count)

    logger.info("Selecting example paraphrases...")
    paraphrases = select_example_paraphrases(snippets)

    # 3. Compute opportunity scores
    logger.info("Computing opportunity scores...")
    weights = load_weights()
    scores = compute_opportunity_scores(frequency, avg_intensity, weights)

    logger.info("\n=== Ranked Opportunity Table ===")
    logger.info("%-4s %-35s %8s %12s %8s %10s", "Rank", "Driver", "Freq", "Avg Int.", "Weight", "Score")
    logger.info("-" * 85)
    for rank, row in enumerate(scores, 1):
        logger.info(
            "%-4d %-35s %8d %12.2f %8.2f %10.2f",
            rank,
            row["driver_label"],
            row["frequency"],
            row["avg_intensity"],
            row["weight"],
            row["opportunity_score"],
        )

    # 4. Export files
    logger.info("\nExporting files to %s...", EXPORT_DIR)

    json_path = export_json(scores, cooccurrence, paraphrases, snippets, EXPORT_DIR)
    logger.info("  ✓ JSON export: %s", json_path)

    csv_path = export_csv(scores, paraphrases, EXPORT_DIR)
    logger.info("  ✓ CSV export:  %s", csv_path)

    corpus_path = export_review_corpus(snippets, scores, paraphrases, EXPORT_DIR)
    logger.info("  ✓ Review corpus: %s", corpus_path)

    # 5. Push to Supabase
    logger.info("Pushing results to Supabase...")
    push_to_supabase(scores, paraphrases)

    logger.info("\n=== Aggregation Pipeline Complete ===")


if __name__ == "__main__":
    run()
