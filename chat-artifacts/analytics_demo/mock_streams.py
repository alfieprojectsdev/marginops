"""
mock_streams.py  —  Offline mock data generator for a DTC brand's data streams.

Produces FOUR CSVs, one per platform "silo" (this is the walled-garden problem
made literal — four separate files you have to stitch together yourself):

    data/meta_ads.csv
    data/google_ads.csv
    data/tiktok_ads.csv
    data/shopify_orders.csv

No network. No API keys. No accounts. Just:  python mock_streams.py

The numbers are rigged to reproduce the SAME story as the MarginOps deck:
each ad platform brags a healthy ROAS (~4x), but the blended unit economics are
underwater (LTV:CAC ~0.66x) because (a) margins are thin and (b) the platforms
double-count each other's conversions. Flip SCENARIO to "healthy" to invert it.
"""
from __future__ import annotations
import os
import numpy as np
import pandas as pd

# ----- knobs you can turn -------------------------------------------------
N_DAYS   = 30
SEED     = 42
SCENARIO = "bleeding"        # "bleeding" (the trap) | "healthy"
START    = "2026-05-01"
# Write next to this file, not the working directory (Streamlit Cloud / any cwd).
OUT_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

AOV          = 2750.0        # average order value, PHP
GROSS_MARGIN = 0.60          # 60% -> gross margin per order = 1650 (our LTV proxy)

# per-platform:  spend_share, self-reported_ROAS, CPM(php), CTR
PLATFORMS = {
    "Meta":   (0.45, 4.5, 150.0, 0.012),
    "Google": (0.35, 4.0, 120.0, 0.035),   # search = higher CTR, closes deals
    "TikTok": (0.20, 3.8,  90.0, 0.009),   # cheap reach, low intent
}
# --------------------------------------------------------------------------


def _daily_new_customers(rng: np.random.Generator, n: int) -> np.ndarray:
    """Poisson arrivals with a weekend bump and slight upward trend."""
    dow = np.arange(n) % 7
    weekend = np.isin(dow, [5, 6]).astype(float) * 1.6
    trend = np.linspace(0.0, 1.0, n)
    return rng.poisson(7.0 + weekend + trend).clip(min=1)


def _cac_curve(n: int, scenario: str) -> np.ndarray:
    """
    Cost to acquire one customer, per day.
    'bleeding' ramps 1900 -> 3300 (ad fatigue: you pay more for the same people),
    averaging ~2500 over 30d but ~3200+ in the most recent week. That ramp is what
    powers the deck's 'velocity of the bleed' slide.
    """
    if scenario == "healthy":
        return np.full(n, 1200.0)            # CAC 1200 < LTV 1650 -> profitable
    return np.linspace(1900.0, 3300.0, n)


def generate() -> None:
    rng = np.random.default_rng(SEED)
    dates = pd.date_range(START, periods=N_DAYS, freq="D")

    new_cust = _daily_new_customers(rng, N_DAYS)
    cac = _cac_curve(N_DAYS, SCENARIO)
    total_spend = cac * new_cust             # spend implied by the CAC target

    os.makedirs(OUT_DIR, exist_ok=True)

    # --- one ad stream per platform "silo" ---
    for name, (share, roas, cpm, ctr) in PLATFORMS.items():
        spend = total_spend * share * rng.normal(1.0, 0.05, N_DAYS).clip(0.8, 1.2)
        impressions = (spend / cpm * 1000).round()
        clicks = (impressions * ctr * rng.normal(1.0, 0.10, N_DAYS)).round().clip(min=0)
        # each platform CLAIMS revenue = its ROAS x its spend (these overlap -> double count)
        attr_rev = spend * roas * rng.normal(1.0, 0.06, N_DAYS).clip(0.85, 1.15)
        attr_conv = (attr_rev / AOV).round()

        pd.DataFrame({
            "date": dates,
            "impressions": impressions.astype(int),
            "clicks": clicks.astype(int),
            "spend_php": spend.round(2),
            "attributed_conversions": attr_conv.astype(int),
            "attributed_revenue_php": attr_rev.round(2),
        }).to_csv(f"{OUT_DIR}/{name.lower()}_ads.csv", index=False)

    # --- Shopify: the single source of TRUTH ---
    returning = rng.binomial(new_cust, 0.25)         # ~25% repeat orders
    orders = new_cust + returning
    gross_rev = orders * AOV * rng.normal(1.0, 0.03, N_DAYS).clip(0.9, 1.1)

    pd.DataFrame({
        "date": dates,
        "orders": orders.astype(int),
        "new_customers": new_cust.astype(int),
        "returning_customers": returning.astype(int),
        "gross_revenue_php": gross_rev.round(2),
        "aov_php": (gross_rev / orders).round(2),
    }).to_csv(f"{OUT_DIR}/shopify_orders.csv", index=False)

    print(f"Wrote 4 streams to ./{OUT_DIR}/  —  {N_DAYS} days, scenario='{SCENARIO}'")


if __name__ == "__main__":
    generate()
