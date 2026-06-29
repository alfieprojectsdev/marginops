"""
analytics.py  —  Blend the four silos into one source of truth.

This is the "professional kitchen" from the deck's analogy: the raw platform
exports come in, and this module cleans, joins, and computes the only metrics
that matter — Blended CAC, LTV, Blended ROAS, and the LTV:CAC ratio.

Pure pandas. No network. Import these functions from dashboard.py (matplotlib)
or app.py (Streamlit) so the math lives in exactly one place.
"""
from __future__ import annotations
import os
import pandas as pd

AD_PLATFORMS = ["meta", "google", "tiktok"]
GROSS_MARGIN = 0.60
# Resolve relative to this file, not the working directory, so it loads whether
# run locally (cwd = this folder) or on Streamlit Cloud (cwd = repo root).
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")


def load_streams(data_dir: str = DATA):
    """Read the four CSVs and return (ads_long, shopify) DataFrames."""
    frames = []
    for p in AD_PLATFORMS:
        d = pd.read_csv(f"{data_dir}/{p}_ads.csv", parse_dates=["date"])
        d["platform"] = p.capitalize()
        frames.append(d)
    ads = pd.concat(frames, ignore_index=True)
    shop = pd.read_csv(f"{data_dir}/shopify_orders.csv", parse_dates=["date"])
    return ads, shop


def filter_window(ads, shop, days=None, platforms=None):
    """Slice by a trailing day-window and/or a subset of platforms."""
    if platforms:
        ads = ads[ads["platform"].isin(platforms)]
    if days:
        cutoff = shop["date"].max() - pd.Timedelta(days=days - 1)
        ads = ads[ads["date"] >= cutoff]
        shop = shop[shop["date"] >= cutoff]
    return ads, shop


def kpis(ads, shop) -> dict:
    """The headline numbers. reported vs true ROAS exposes the double-counting."""
    spend = ads["spend_php"].sum()
    attributed = ads["attributed_revenue_php"].sum()    # what the platforms CLAIM
    actual = shop["gross_revenue_php"].sum()            # the TRUTH (Shopify)
    new_cust = shop["new_customers"].sum()
    ltv = shop["aov_php"].mean() * GROSS_MARGIN
    cac = spend / new_cust if new_cust else float("nan")
    return {
        "spend": spend,
        "attributed_revenue": attributed,
        "actual_revenue": actual,
        "reported_roas": attributed / spend if spend else float("nan"),
        "true_roas": actual / spend if spend else float("nan"),
        "blended_cac": cac,
        "ltv": ltv,
        "ltv_cac": ltv / cac if cac else float("nan"),
        "new_customers": int(new_cust),
        "double_count_gap": attributed - actual,
    }


def by_platform(ads):
    g = ads.groupby("platform", as_index=False).agg(
        spend=("spend_php", "sum"),
        attributed_revenue=("attributed_revenue_php", "sum"),
    )
    g["reported_roas"] = g["attributed_revenue"] / g["spend"]
    return g


def daily(ads, shop):
    a = ads.groupby("date").agg(
        spend=("spend_php", "sum"),
        attributed_revenue=("attributed_revenue_php", "sum"),
    )
    s = shop.set_index("date")[["gross_revenue_php", "new_customers", "aov_php"]]
    d = a.join(s, how="inner")
    d["cac"] = d["spend"] / d["new_customers"]
    d["ltv"] = d["aov_php"] * GROSS_MARGIN
    d["ltv_cac"] = d["ltv"] / d["cac"]
    d["reported_roas"] = d["attributed_revenue"] / d["spend"]
    return d
