"""
dashboard.py  —  The "plated meal": a one-figure analytics dashboard, offline.

Run:  python dashboard.py
Writes dashboard.png and (if you have a screen) shows it.

Optional args via env-free edits at the bottom: change `days` or `platforms`
to demo the filters live (e.g. days=7 for the 'velocity of the bleed').
"""
from __future__ import annotations
import matplotlib
matplotlib.use("Agg")           # headless-safe; comment out to pop a window locally
import matplotlib.pyplot as plt
from matplotlib import gridspec
import analytics as A

# ---- deck palette (keeps the Python dashboard on-brand with MarginOps) ----
INK = "#1E2433"; INDIGO = "#4F46E5"; RED = "#DC2626"; GREEN = "#059669"
MUTED = "#64748B"; SURFACE = "#F1F5F9"; CARD = "#FFFFFF"; GRID = "#E2E8F0"


def peso(x: float) -> str:
    return f"\u20b1{x:,.0f}"


def _tile(ax, label, value, color=INK, sub=None):
    ax.axis("off")
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax.transAxes,
                               facecolor=CARD, edgecolor=GRID, lw=1, zorder=0))
    ax.text(0.07, 0.72, label, transform=ax.transAxes, fontsize=10.5, color=MUTED, weight="bold")
    ax.text(0.07, 0.30, value, transform=ax.transAxes, fontsize=23, color=color, weight="bold")
    if sub:
        ax.text(0.07, 0.10, sub, transform=ax.transAxes, fontsize=8.5, color=MUTED)


def _style(ax, axis="both"):
    ax.grid(True, axis=axis, color=GRID, lw=0.7)
    ax.set_axisbelow(True)
    for sp in ax.spines.values():
        sp.set_color(GRID)
    ax.tick_params(colors=MUTED, labelsize=8)


def build(days: int = 30, platforms=None, out: str = "dashboard.png"):
    ads, shop = A.load_streams()
    ads, shop = A.filter_window(ads, shop, days=days, platforms=platforms)
    k = A.kpis(ads, shop)
    plat = A.by_platform(ads)
    d = A.daily(ads, shop)

    plt.rcParams.update({"font.family": "DejaVu Sans"})
    fig = plt.figure(figsize=(14, 8), dpi=110)
    fig.patch.set_facecolor(SURFACE)
    gs = gridspec.GridSpec(3, 4, figure=fig, height_ratios=[0.85, 1.5, 1.3],
                           hspace=0.5, wspace=0.28,
                           left=0.05, right=0.97, top=0.88, bottom=0.08)

    fig.text(0.05, 0.945, "MarginOps  —  Marketing Profitability", fontsize=18, weight="bold", color=INK)
    fig.text(0.05, 0.913, f"Blended across Meta, Google, TikTok & Shopify  ·  last {days} days",
             fontsize=10.5, color=MUTED)

    # ---- KPI tiles ----
    ratio = k["ltv_cac"]
    rc = RED if ratio < 1 else GREEN
    _tile(fig.add_subplot(gs[0, 0]), "BLENDED ROAS", f"{k['reported_roas']:.2f}\u00d7", GREEN, "platform-reported")
    _tile(fig.add_subplot(gs[0, 1]), "BLENDED CAC", peso(k["blended_cac"]), INK, "true cost per new customer")
    _tile(fig.add_subplot(gs[0, 2]), "LTV", peso(k["ltv"]), INK, "gross margin per customer")
    _tile(fig.add_subplot(gs[0, 3]), "LTV : CAC", f"{ratio:.2f}\u00d7", rc,
          "below 1.0 = losing money" if ratio < 1 else "healthy")

    # ---- Row 2: the trap ----
    ax = fig.add_subplot(gs[1, :])
    ax.plot(d.index, d["reported_roas"], color=GREEN, lw=2, label="Reported ROAS (platforms)")
    ax.plot(d.index, d["ltv_cac"], color=RED, lw=2.4, label="LTV:CAC (reality)")
    ax.axhline(1.0, color=MUTED, ls="--", lw=1)
    ax.fill_between(d.index, d["ltv_cac"], 1.0, where=(d["ltv_cac"] < 1.0), color=RED, alpha=0.10)
    ax.text(d.index[1], 1.07, "break-even", color=MUTED, fontsize=8)
    ax.set_title("The trap: platforms look great, unit economics are underwater",
                 fontsize=11.5, color=INK, loc="left", weight="bold")
    _style(ax)
    ax.legend(loc="upper right", fontsize=8, framealpha=0.9)

    # ---- Row 3a: spend by platform ----
    ax2 = fig.add_subplot(gs[2, :2])
    ax2.bar(plat["platform"], plat["spend"], color=INDIGO, width=0.6)
    ax2.set_title("Where the ad budget went", fontsize=11.5, color=INK, loc="left", weight="bold")
    ax2.yaxis.set_major_formatter(lambda v, _: peso(v))
    _style(ax2, axis="y")

    # ---- Row 3b: each platform brags, truth is lower ----
    ax3 = fig.add_subplot(gs[2, 2:])
    ax3.bar(plat["platform"], plat["reported_roas"], color=GREEN, width=0.6)
    ax3.axhline(k["true_roas"], color=RED, ls="--", lw=1.5)
    ax3.set_ylim(0, max(plat["reported_roas"]) * 1.28)
    ax3.annotate(f"true blended ROAS  {k['true_roas']:.2f}\u00d7",
                 xy=(0.99, k["true_roas"]), xycoords=("axes fraction", "data"),
                 xytext=(0, 6), textcoords="offset points",
                 ha="right", va="bottom", color=RED, fontsize=8.5, weight="bold")
    ax3.set_title("Each platform brags — the blended truth is lower",
                  fontsize=11.5, color=INK, loc="left", weight="bold")
    _style(ax3, axis="y")

    fig.savefig(out, facecolor=SURFACE, bbox_inches="tight")
    print(f"Saved {out}  |  ROAS {k['reported_roas']:.2f}x  CAC {peso(k['blended_cac'])}  "
          f"LTV {peso(k['ltv'])}  LTV:CAC {ratio:.2f}x  "
          f"(double-count gap {peso(k['double_count_gap'])})")
    return fig


if __name__ == "__main__":
    build(days=30)                       # try: build(days=7) or build(platforms=["Meta"])
