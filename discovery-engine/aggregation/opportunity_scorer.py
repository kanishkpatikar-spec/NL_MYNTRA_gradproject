"""
Opportunity Scorer — computes the opportunity score for each driver
using the formula:

    Opportunity Score = Frequency × Avg Intensity × Business-Relevance Weight

Weights are loaded from weights_config.json and can be edited to reflect
strategic priorities.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from classification import taxonomy

_WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "weights_config.json")


def load_weights() -> dict[str, float]:
    """Load business-relevance weights from config file."""
    with open(_WEIGHTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_weights(weights: dict[str, float]) -> None:
    """Save updated weights back to config file."""
    with open(_WEIGHTS_PATH, "w", encoding="utf-8") as f:
        json.dump(weights, f, indent=2)


def compute_opportunity_scores(
    frequency: dict[str, int],
    avg_intensity: dict[str, float],
    weights: dict[str, float] | None = None,
) -> list[dict]:
    """
    Compute opportunity score for each driver and return a sorted list
    (descending by score).

    Returns: [
        {
            "driver_id": "...",
            "driver_label": "...",
            "frequency": N,
            "avg_intensity": X.XX,
            "weight": W.WW,
            "opportunity_score": S.SS
        },
        ...
    ]
    """
    if weights is None:
        weights = load_weights()

    drivers = taxonomy.get_drivers()

    results = []
    for driver in drivers:
        d_id = driver["id"]
        freq = frequency.get(d_id, 0)
        intensity = avg_intensity.get(d_id, 0.0)
        weight = weights.get(d_id, 1.0)

        score = round(freq * intensity * weight, 2)

        results.append({
            "driver_id": d_id,
            "driver_label": driver["label"],
            "frequency": freq,
            "avg_intensity": intensity,
            "weight": weight,
            "opportunity_score": score,
        })

    # Sort by opportunity score descending
    results.sort(key=lambda x: x["opportunity_score"], reverse=True)
    return results
