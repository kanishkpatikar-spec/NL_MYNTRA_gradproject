#!/usr/bin/env python3
"""
Generate 90-day mock price histories for every SKU in catalog.json.

Each SKU gets a realistic Myntra-style pricing pattern:
  - Base price with occasional sale dips (10-30% off)
  - A couple of "flash sale" events
  - Stable stretches in between
"""

import json
import random
from datetime import date, timedelta
from pathlib import Path

MOCK_DIR = Path(__file__).resolve().parent.parent / "mvp" / "mock-data"
CATALOG_PATH = MOCK_DIR / "catalog.json"
OUTPUT_PATH = MOCK_DIR / "price_history.json"

random.seed(42)  # Reproducible


def generate_history(base_price: int, days: int = 90) -> list[dict]:
    """Return a list of {date, price} dicts spanning `days` days."""
    today = date.today()
    start = today - timedelta(days=days - 1)

    history = []
    current_price = base_price

    # Plan sale events: 2-3 random sale windows
    sale_windows = []
    for _ in range(random.randint(2, 3)):
        sale_start = random.randint(5, days - 10)
        sale_len = random.randint(3, 7)
        discount = random.choice([0.10, 0.15, 0.20, 0.25, 0.30])
        sale_windows.append((sale_start, sale_start + sale_len, discount))

    for day_offset in range(days):
        d = start + timedelta(days=day_offset)
        price = base_price

        # Check if this day falls in any sale window
        for s_start, s_end, disc in sale_windows:
            if s_start <= day_offset <= s_end:
                price = int(base_price * (1 - disc))
                # Round to nearest 9 for realism
                price = (price // 10) * 10 + 9 if price > 100 else price
                break

        # Small random jitter on non-sale days (Myntra doesn't do this, but
        # it makes the chart look more realistic for demo purposes)
        if price == base_price and random.random() < 0.05:
            bump = random.choice([-50, -100, 50, 100])
            price = max(base_price + bump, int(base_price * 0.9))

        history.append({"date": d.isoformat(), "price": price})

    return history


def main():
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    price_histories = {}
    for product in catalog:
        sku_id = product["id"]
        base = product["price"]
        price_histories[sku_id] = generate_history(base)
        print(f"  Generated 90-day history for {sku_id} ({product['name']}) — base {base}")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(price_histories, f, indent=2)

    print(f"\n[DONE] Wrote price histories for {len(price_histories)} SKUs to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
