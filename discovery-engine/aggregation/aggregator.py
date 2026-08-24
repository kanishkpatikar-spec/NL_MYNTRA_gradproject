"""
Core aggregation engine — computes frequency counts, average intensity
scores, and a co-occurrence matrix from classified snippets.
"""

import sys
import os
from collections import defaultdict

# Allow importing taxonomy from sibling package
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from classification import taxonomy


def compute_frequency(classified_snippets: list[dict]) -> dict[str, int]:
    """
    Count how many times each driver appears across all classified snippets.
    Multi-label aware: each tag in a snippet's tag list increments that
    driver's count independently.

    Returns: { driver_id: count }
    """
    # Initialise all drivers to 0 so every driver appears in the output
    freq: dict[str, int] = {d_id: 0 for d_id in taxonomy.get_valid_ids()}

    for snippet in classified_snippets:
        tags = snippet.get("tags", [])
        if isinstance(tags, str):
            tags = [tags]
        for tag in tags:
            if tag in freq:
                freq[tag] += 1

    return freq


def compute_avg_intensity(classified_snippets: list[dict]) -> dict[str, float]:
    """
    For each driver, compute the mean intensity score across all snippets
    tagged with it.

    Returns: { driver_id: avg_intensity }
    """
    intensity_sums: dict[str, float] = defaultdict(float)
    intensity_counts: dict[str, int] = defaultdict(int)

    for snippet in classified_snippets:
        tags = snippet.get("tags", [])
        intensity = snippet.get("intensity")

        if intensity is None:
            continue
        try:
            intensity = float(intensity)
        except (ValueError, TypeError):
            continue

        if isinstance(tags, str):
            tags = [tags]
        for tag in tags:
            if tag in taxonomy.get_valid_ids():
                intensity_sums[tag] += intensity
                intensity_counts[tag] += 1

    # Build result with all drivers
    result: dict[str, float] = {}
    for d_id in taxonomy.get_valid_ids():
        if intensity_counts[d_id] > 0:
            result[d_id] = round(intensity_sums[d_id] / intensity_counts[d_id], 2)
        else:
            result[d_id] = 0.0

    return result


def compute_cooccurrence(classified_snippets: list[dict]) -> dict[str, dict[str, int]]:
    """
    Build a symmetric N×N co-occurrence matrix where
    matrix[i][j] = count of snippets that have BOTH driver i and driver j.

    Only multi-label snippets contribute to the matrix.

    Returns: { driver_i: { driver_j: count } }
    """
    valid_ids = taxonomy.get_valid_ids()

    # Initialise symmetric matrix with zeros
    matrix: dict[str, dict[str, int]] = {
        d_i: {d_j: 0 for d_j in valid_ids} for d_i in valid_ids
    }

    for snippet in classified_snippets:
        tags = snippet.get("tags", [])
        if isinstance(tags, str):
            tags = [tags]

        # Filter to valid taxonomy tags only
        valid_tags = [t for t in tags if t in valid_ids]

        # Only multi-label snippets contribute
        if len(valid_tags) < 2:
            continue

        # Increment all pairs
        for i, tag_a in enumerate(valid_tags):
            for tag_b in valid_tags[i + 1:]:
                matrix[tag_a][tag_b] += 1
                matrix[tag_b][tag_a] += 1

    return matrix


def select_example_paraphrases(
    classified_snippets: list[dict],
    max_per_driver: int = 3,
) -> dict[str, list[str]]:
    """
    For each driver, select the top N representative paraphrases by
    picking the highest-intensity snippets. Tries to diversify by source.

    Returns: { driver_id: [paraphrase_1, paraphrase_2, ...] }
    """
    # Group snippets by driver, sorted by intensity desc
    driver_snippets: dict[str, list[dict]] = defaultdict(list)

    for snippet in classified_snippets:
        tags = snippet.get("tags", [])
        paraphrase = snippet.get("paraphrase", "")
        intensity = snippet.get("intensity", 0)

        if not paraphrase:
            continue

        if isinstance(tags, str):
            tags = [tags]

        for tag in tags:
            if tag in taxonomy.get_valid_ids():
                driver_snippets[tag].append({
                    "paraphrase": paraphrase,
                    "intensity": intensity,
                    "source": snippet.get("source", "unknown"),
                })

    # For each driver, pick top N by intensity, preferring source diversity
    result: dict[str, list[str]] = {}
    for d_id in taxonomy.get_valid_ids():
        candidates = sorted(
            driver_snippets.get(d_id, []),
            key=lambda x: x.get("intensity", 0),
            reverse=True,
        )

        selected: list[str] = []
        seen_sources: set[str] = set()

        # First pass: pick top-intensity from diverse sources
        for c in candidates:
            if len(selected) >= max_per_driver:
                break
            if c["source"] not in seen_sources:
                selected.append(c["paraphrase"])
                seen_sources.add(c["source"])

        # Second pass: fill remaining from any source
        if len(selected) < max_per_driver:
            for c in candidates:
                if len(selected) >= max_per_driver:
                    break
                if c["paraphrase"] not in selected:
                    selected.append(c["paraphrase"])

        result[d_id] = selected

    return result
