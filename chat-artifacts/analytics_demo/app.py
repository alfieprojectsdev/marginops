"""
app.py  —  OPTIONAL Level-2 upgrade: an interactive dashboard with live filters.

This is the "wow" version for the live demo — clickable platform toggles and a
date-window slider, exactly like MarginOps. Still 100% offline (runs on
localhost, no internet once Streamlit is installed).

Install once (WITH internet, before the session):
    pip install streamlit
Run (offline thereafter):
    streamlit run app.py

It reuses analytics.py, so the math is identical to the matplotlib version.
"""
from __future__ import annotations
import streamlit as st
import analytics as A

st.set_page_config(page_title="MarginOps — Python", layout="wide")

INDIGO = "#4F46E5"; RED = "#DC2626"; GREEN = "#059669"


def peso(x: float) -> str:
    return f"\u20b1{x:,.0f}"


st.title("MarginOps — Marketing Profitability")
st.caption("Blended across Meta, Google, TikTok & Shopify · built in Python, fully offline")

ads_all, shop_all = A.load_streams()

# ---- filters (the slicing the deck talks about) ----
left, right = st.columns([1, 3])
with left:
    days = st.select_slider("Window", options=[7, 14, 30], value=30)
    chosen = st.multiselect("Platforms", ["Meta", "Google", "TikTok"],
                            default=["Meta", "Google", "TikTok"])

ads, shop = A.filter_window(ads_all, shop_all, days=days, platforms=chosen or None)
k = A.kpis(ads, shop)
ratio = k["ltv_cac"]

# ---- KPI row ----
c1, c2, c3, c4 = st.columns(4)
c1.metric("Blended ROAS", f"{k['reported_roas']:.2f}\u00d7", help="platform-reported")
c2.metric("Blended CAC", peso(k["blended_cac"]))
c3.metric("LTV", peso(k["ltv"]), help="gross margin per customer")
c4.metric("LTV : CAC", f"{ratio:.2f}\u00d7",
          delta="losing money" if ratio < 1 else "healthy",
          delta_color="inverse" if ratio < 1 else "normal")

if ratio < 1:
    st.error(f"Unit economics are underwater: you lose "
             f"{peso(k['blended_cac'] - k['ltv'])} on every new customer — "
             f"even though platforms report a {k['reported_roas']:.1f}\u00d7 ROAS.")

# ---- the trap chart ----
d = A.daily(ads, shop)
st.subheader("The trap: platforms look great, unit economics are underwater")
st.line_chart(d[["reported_roas", "ltv_cac"]], color=[GREEN, RED])

# ---- platform breakdown ----
b1, b2 = st.columns(2)
plat = A.by_platform(ads).set_index("platform")
with b1:
    st.subheader("Where the ad budget went")
    st.bar_chart(plat["spend"], color=INDIGO)
with b2:
    st.subheader("Reported ROAS by platform")
    st.bar_chart(plat["reported_roas"], color=GREEN)
    st.caption(f"…but the true blended ROAS is only {k['true_roas']:.2f}\u00d7 "
               f"(double-count gap {peso(k['double_count_gap'])}).")
