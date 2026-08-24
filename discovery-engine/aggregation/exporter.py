"""
Export Generator — produces three export formats from aggregation results:

1. JSON export  (aggregated_export.json)  — full dataset for the API/dashboard
2. CSV export   (opportunity_table.csv)   — ranked table for presentation slides
3. Review corpus (review_corpus.json)     — structured data for Part B MVP
"""

import csv
import json
import os
from datetime import datetime, timezone


def export_json(
    opportunity_scores: list[dict],
    cooccurrence: dict[str, dict[str, int]],
    example_paraphrases: dict[str, list[str]],
    classified_snippets: list[dict],
    output_dir: str,
) -> str:
    """
    Export the full aggregated dataset as JSON.
    Returns the path to the written file.
    """
    # Enrich opportunity scores with paraphrases
    enriched_drivers = []
    for row in opportunity_scores:
        enriched_drivers.append({
            **row,
            "example_paraphrases": example_paraphrases.get(row["driver_id"], []),
        })

    export_data = {
        "export_version": "1.0",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "total_snippets_classified": len(classified_snippets),
        "aggregated_drivers": enriched_drivers,
        "cooccurrence_matrix": cooccurrence,
    }

    path = os.path.join(output_dir, "aggregated_export.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    return path


def export_csv(
    opportunity_scores: list[dict],
    example_paraphrases: dict[str, list[str]],
    output_dir: str,
) -> str:
    """
    Export a ranked opportunity table as CSV for presentation slides.
    Returns the path to the written file.
    """
    path = os.path.join(output_dir, "opportunity_table.csv")

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Rank",
            "Driver",
            "Frequency",
            "Avg Intensity",
            "Weight",
            "Opportunity Score",
            "Example Snippets",
        ])

        for rank, row in enumerate(opportunity_scores, 1):
            paraphrases = example_paraphrases.get(row["driver_id"], [])
            snippets_str = " | ".join(paraphrases[:3]) if paraphrases else ""
            writer.writerow([
                rank,
                row["driver_label"],
                row["frequency"],
                row["avg_intensity"],
                row["weight"],
                row["opportunity_score"],
                snippets_str,
            ])

    return path


def export_review_corpus(
    classified_snippets: list[dict],
    opportunity_scores: list[dict],
    example_paraphrases: dict[str, list[str]],
    output_dir: str,
) -> str:
    """
    Export the review corpus JSON for Part B MVP consumption.
    Follows the data contract from architecture.md.
    Returns the path to the written file.
    """
    # Enrich drivers with paraphrases
    enriched_drivers = []
    for row in opportunity_scores:
        enriched_drivers.append({
            "driver_id": row["driver_id"],
            "driver_label": row["driver_label"],
            "frequency": row["frequency"],
            "avg_intensity": row["avg_intensity"],
            "opportunity_score": row["opportunity_score"],
            "example_paraphrases": example_paraphrases.get(row["driver_id"], []),
        })

    # Build snippet list (minimal fields for MVP)
    snippets = []
    for s in classified_snippets:
        snippets.append({
            "id": s.get("id", ""),
            "clean_id": s.get("clean_id", ""),
            "tags": s.get("tags", []),
            "paraphrase": s.get("paraphrase", ""),
            "intensity": s.get("intensity", 0),
            "segments": s.get("segments", []),
        })

    corpus = {
        "export_version": "1.0",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "total_snippets": len(snippets),
        "snippets": snippets,
        "aggregated_drivers": enriched_drivers,
    }

    path = os.path.join(output_dir, "review_corpus.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(corpus, f, indent=2, ensure_ascii=False)

    return path
