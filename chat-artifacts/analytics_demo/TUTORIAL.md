# Python Analytics Dashboard — Offline Tutorial & Live-Demo Guide

A tight, runnable project for Albet's *"1-hour live demo — creating an analytics dashboard via Python"* expectation. It mocks the four data streams Katapult actually deals with (Meta, Google, TikTok, Shopify) and turns them into a dashboard that tells the **same** CAC/LTV/ROAS story as your MarginOps deck — so the Python segment reinforces your pitch instead of competing with it.

You already know Python, so this skips the basics and focuses on two things: **the build** (so you're comfortable) and **the delivery** (so the live hour lands with a sales audience).

---

## What's in the box

```
analytics_demo/
├── mock_streams.py   ← generates 4 CSVs, one per platform "silo"  (the data mocker)
├── analytics.py      ← blends the silos, computes the metrics       (the "kitchen")
├── dashboard.py      ← matplotlib → one dashboard PNG               (Level 1, runs anywhere)
├── app.py            ← Streamlit → interactive, clickable filters   (Level 2, optional)
└── data/             ← the 4 generated CSVs land here
```

Two levels on purpose:
- **Level 1 (matplotlib)** is bulletproof — no server, no extra moving parts, renders a PNG on any machine. This is your safe demo.
- **Level 2 (Streamlit)** is the crowd-pleaser — live filters like MarginOps — but needs one more install. Use it only if you've rehearsed it.

---

## Setup — do this WITH internet, then you're offline-safe

The whole point is offline operation at the venue. But you install the packages *once*, beforehand, while you have a connection. After that, zero network needed.

```bash
# 1. make an isolated environment (keeps your system Python clean)
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. install — REQUIRED for Level 1
pip install pandas numpy matplotlib

# 3. install — OPTIONAL, only if you'll do the Streamlit version
pip install streamlit
```

> **Offline-safety check (do this the night before):** turn your Wi-Fi OFF, then run `python mock_streams.py` and `python dashboard.py`. If `dashboard.png` appears, you're fully self-contained. Nothing here ever phones home.

---

## The build, in four chunks

Each chunk produces visible output — run it, see the result, move on. This is also the exact order you'll demo it live.

### Chunk 1 — Mock the streams *(the data problem, made literal)*

```bash
python mock_streams.py
```

Open `data/` and you'll see **four separate CSVs**. That separation *is* the walled-garden problem from your deck — four files nobody has stitched together. Peek at one:

```bash
head data/meta_ads.csv
head data/shopify_orders.csv
```

The ad files carry what each platform *claims* (impressions, clicks, spend, attributed revenue). `shopify_orders.csv` carries the *truth* (actual orders, new customers, real revenue). The generator is rigged so the platforms collectively over-claim — that overlap is the double-counting you talk about.

**Tunable knobs** (top of `mock_streams.py`): `N_DAYS`, `SCENARIO` (`"bleeding"` for the trap, `"healthy"` to invert), `AOV`, `GROSS_MARGIN`, and per-platform spend share / reported ROAS. Change `SCENARIO` and re-run to flip the whole story — handy for showing "here's a bleeding client vs. a healthy one."

### Chunk 2 — Blend into one source of truth *(the "kitchen")*

`analytics.py` is the pipeline. It reads all four CSVs, joins them on date, and computes the four metrics that matter. Sanity-check it in one line:

```bash
python -c "import analytics as A; ads,shop=A.load_streams(); print(A.kpis(*A.filter_window(ads,shop,days=30)))"
```

You'll see `blended_cac`, `ltv`, `reported_roas`, `true_roas`, and `ltv_cac`. Note the two ROAS numbers — `reported_roas` (~4.2×, what platforms brag) vs `true_roas` (~1.3×, reality). That gap is the entire pitch in two numbers.

The metric definitions match your deck exactly: **Blended CAC** = total spend ÷ new customers; **LTV** = AOV × gross margin; **LTV:CAC** = the ratio that decides whether you scale or kill.

### Chunk 3 — Render the dashboard *(the "plated meal")*

```bash
python dashboard.py
```

`dashboard.png` is a single figure with four KPI tiles, the trap line-chart (green ROAS sailing along up top, red LTV:CAC drowning below the break-even line), spend-by-platform, and the "everyone brags, truth is lower" bars. It's styled in the MarginOps palette so it looks like the same product family.

Demo the **filters** by editing the last line, or from the shell:

```bash
# the "velocity of the bleed" — last 7 days, CAC spikes, ratio tanks further
python -c "import dashboard; dashboard.build(days=7, out='dashboard_7d.png')"

# a single platform
python -c "import dashboard; dashboard.build(platforms=['Meta'], out='meta_only.png')"
```

### Chunk 4 *(optional)* — Make it interactive

```bash
streamlit run app.py
```

A browser tab opens on `localhost` with a date slider and platform toggles. Click them and every number updates live — the same "slice the question" idea from slide 9. This is the version that feels most like a real product. **Rehearse it** before using it live; if anything's shaky, fall back to the matplotlib PNGs.

---

## Delivering the live hour to a sales audience

Here's the trap to avoid: **watching someone write Python for an hour is death for a non-technical sales team.** The magic they need to see is *raw data becoming a decision* — not your syntax. So frame it exactly like your Claude Code segment: fast, visual, "look what's possible," not a coding lesson.

Mirror the kitchen analogy beat-for-beat:

| Time | Beat | What you show | What you say |
|---|---|---|---|
| 0–10 min | **Raw ingredients** | Open the 4 CSVs side by side | "This is what lands on a client's desk — four separate exports that don't talk to each other. Looks like noise." |
| 10–25 min | **The kitchen** | Run `mock_streams.py` then the `analytics` one-liner | "A few lines of Python clean and blend all four into one honest table. This is the part agencies skip." |
| 25–45 min | **The plated meal** | Run `dashboard.py`, walk the figure | "And it becomes a dashboard. Notice the same trap: every platform reports a great ROAS, but blended LTV:CAC is 0.62 — they're losing money on every customer." |
| 45–55 min | **Slice it live** | `days=7` rerun, or Streamlit toggles | "Watch what happens in just the last 7 days — the bleed accelerates. That's the difference between a report and a decision tool." |
| 55–60 min | **The point** | Back to faces | "We don't sell dashboards. We sell decision-support infrastructure. And we can build one for any client, fast." |

Keep the code on screen only long enough to convey "it's just a few readable steps." Spend your energy on the **numbers and the story**, which is what sells.

**One honesty note for yourself:** if anyone technical asks, the mock data is synthetic and the attribution/dedup here is simplified — real cross-platform deduplication is a genuine data-engineering problem (and a real billable scope). Don't claim the demo does true multi-touch attribution; claim it shows *why integrated, deduplicated data changes the decision*. That's both true and a stronger pitch.

---

## How this connects to everything else

- **Same story as MarginOps.** Both show good-ROAS / bad-LTV:CAC. The Python version is just a second way to plate the same meal — which makes you look fluent across tools, not scattered.
- **Same numbers as the deck.** 30-day ≈ CAC ₱2,600 / LTV:CAC 0.62×; 7-day ≈ CAC ₱3,170 / 0.52×. These line up with your slides 13–14, so the live demo and the slides agree.
- **A bridge to the "other topics."** When Albet circles back to PySpark / DAX / Power Query, the honest framing is: *this pandas pipeline is the same idea at small scale; PySpark is what you reach for when the CSVs become billions of rows.* You're not behind — you're already doing the concept; the enterprise tools are just the scaled-up version. Worth saying out loud.

---

## If you want to go further (after June 30)

- **Real data later:** swap `mock_streams.py` for actual platform CSV exports — the column names are the only contract. `analytics.py` and `dashboard.py` don't change.
- **Repeat-purchase LTV:** the current LTV is single-order gross margin. Add a purchase-frequency term per cohort for a more defensible number — and a natural consulting upsell.
- **PDF export:** `fig.savefig("dashboard.pdf")` gives a leave-behind deliverable, which pairs with the "Sales Enablement Package" pricing idea.

You've got a working, offline, on-brand Python dashboard that says the same thing your deck says. Run it once tonight with Wi-Fi off, and you're ready.
