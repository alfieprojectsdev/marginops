# Maths Refresher — for the whole room

The math in this demo is genuinely simple: it's almost all **division**. What makes it *feel* hard is that business renames concepts you may already know under different labels. So this page does two jobs:

1. **Translate the jargon** — for anyone with a quantitative background, every metric here is just a ratio, a rate, or a per-unit cost you've seen before.
2. **Give the gut-level intuition** — for everyone else, the plain version that needs no formulas.

> **If business math feels like jargon despite a technical background:** that's a *vocabulary* gap, not a skill gap. Dimensional analysis and systematic-error thinking — the exact tools that cut through hand-wavy metrics — are things a physics/engineering brain already runs on reflex. You're not behind on this; you're over-equipped and under-translated.

---

## 1. The big realization: it's all just ratios

Every metric below is one quantity divided by another. The only trick is keeping track of **units** — which is the first thing you'd check anyway.

| Metric | Formula | Units | Dimensionless? |
|---|---|---|---|
| **AOV** (avg order value) | revenue ÷ orders | ₱ / order | no |
| **CAC** (cost to acquire) | ad spend ÷ new customers | ₱ / customer | no |
| **LTV** (customer value) | AOV × gross margin | ₱ / customer | no |
| **CPC** (cost per click) | spend ÷ clicks | ₱ / click | no |
| **CTR** (click-through) | clicks ÷ impressions | — | **yes** |
| **ROAS** (return on ad spend) | revenue ÷ ad spend | ₱ / ₱ | **yes** |
| **LTV : CAC** | LTV ÷ CAC | (₱/cust) ÷ (₱/cust) | **yes** |

**The pattern worth seeing:** the *dimensionless* ones (LTV:CAC, ROAS, CTR) are the **comparison numbers** — pure coefficients you read like efficiencies, comparable across any client or budget. The ones *with units* (CAC, LTV, AOV, CPC) are per-unit costs and values. You can only sensibly compare like-dimensioned quantities — so LTV and CAC are comparable (both ₱/customer), which is exactly why their ratio is *the* number.

**Plain version for the room:** every one of these is just "this divided by that." Don't let the acronyms scare anyone.

---

## 2. The one ratio that decides everything: LTV : CAC

```
LTV : CAC  =  LTV / CAC  =  (what a customer is worth) / (what they cost to get)
```

**CAC is the denominator**, so it moves the ratio *inversely* — same as any rate:

- **CAC ↓ → ratio ↑**  (cheaper acquisition = healthier).  Healthy demo: ₱1,200 cost vs ₱1,650 value → **1.38×**
- **CAC ↑ → ratio ↓**  (the bleed ramp: as CAC climbs ₱1,900 → ₱3,300 across the month, the ratio sinks)
- **LTV is the numerator** → moves the ratio *directly* (more margin per customer = higher ratio)

**Breakeven is 1.0** — pure algebra, the ratio crosses 1 exactly when LTV = CAC. Think of it as the critical threshold where net contribution flips sign:

| Ratio | Reading | State |
|---|---|---|
| **> 1.0** | worth more than they cost | gaining |
| **= 1.0** | spend = return | treading water |
| **< 1.0** | cost more than they're worth | **bleeding** |

Industry rule of thumb: you want **3:1 or better**, because 1:1 is already underwater once overhead is counted.

**The demo's 0.62×** reads literally as: *a customer is worth 62% of what we paid to acquire them.*

**Loss per customer is the gap, not the ratio:**
```
LTV − CAC  =  ₱1,640 − ₱2,632  ≈  −₱992  per customer
```
(The exact figures float with the random seed — quote them live off the dashboard, don't memorize.)

---

## 3. Why ROAS looks great while this is underwater

This is the crux, and the part someone might challenge. ROAS and LTV:CAC disagree because they have **different denominators measuring different things**:

```
ROAS      =  revenue        / ad spend
LTV:CAC   =  margin/customer / cost/customer
```

Two independent reasons ROAS overstates health:

**(a) Revenue ≠ margin** — gross margin is a *transmission coefficient*. Only 60% of revenue passes through as margin. A 4× return on *revenue* is ~2.4× on a *margin* basis — and that's still *before* subtracting acquisition cost. ROAS measures power at the input; profit lives at the output of a lossy stage.

**(b) Attributed revenue ≠ actual revenue** — this is a **systematic bias**, not random noise. Each platform claims credit for the same sale (last-click Meta *and* last-click Google *and* TikTok all count one conversion), so the **sum of "reported" revenue exceeds reality**. The dashboard's *double-count gap* is precisely that overlap. Reported blended ROAS ≈ 4.2×; true blended ROAS ≈ 1.3×.

So "high ROAS, sub-1.0 LTV:CAC" is not a contradiction — it's **thin margin plus double-counting** hiding inside a flattering top-line number. That one sentence is the whole pitch.

---

## 4. The sensor-fusion framing *(optional — if a quantitative analogy helps)*

For anyone who thinks in measurements and references, this is the cleanest mental model:

- Each ad platform is an **uncalibrated sensor** reporting on the same underlying event (a sale). Three platforms each claiming the same conversion is like **three GNSS receivers each reporting they nailed the same position fix** — sum their self-reports and you exceed what physically happened.
- **Shopify is the survey benchmark** — the ground-truth reference that actually knows how many orders occurred and how much money came in.
- **"Integrated analytics" is sensor fusion / calibration:** stop trusting each receiver's self-report; calibrate everything against the benchmark.
- Critically, the inflated ROAS is a **systematic** error (every platform reads high *by construction*), so you **can't average it away with more data** — you need a *reference*. That's exactly why the Shopify "truth" stream matters more than any platform export.

**Honest nuance worth saying out loud:** attribution is closer to *inference under a prior* than to measurement. "Which touchpoint gets credit" is a **modeling choice** — last-click, first-click, linear, time-decay, data-driven all give different answers. There is **no single ground truth for credit**, only for the *total* (Shopify). The integrity is in measuring the total honestly and being transparent that the per-channel split is a model, not a fact. Saying this elevates your credibility rather than undermining it.

---

## 5. The "feel it in your gut" checks

For a live demo you don't want to *calculate* — you want to *sense* whether a number is plausible so you're never caught flat-footed. These are just Fermi estimates and sign checks:

- **Ratio vs. 1:** is LTV bigger or smaller than CAC? Bigger = healthy, smaller = bleeding. Entire health check in one glance.
- **Denominator pushes opposite:** "we lowered CAC" → ratio went *up*. "CAC crept up" → ratio went *down*. Don't overthink direction; denominators always move the ratio the other way.
- **Margin is the silent killer:** whenever someone quotes a healthy ROAS, the reflex question is *"at what margin?"* A 4× at 25% margin is underwater; the same 4× at 70% margin is fine. Margin is what ROAS hides.
- **Order-of-magnitude sanity:** spend ~₱500K over ~190 new customers → CAC in the low thousands. If a calculation spits out ₱200 or ₱20,000, you fat-fingered it.

---

## 6. The caveats (so you never overclaim)

- **LTV here is a simplified proxy** — single-order gross margin (AOV × margin). Real LTV adds repeat-purchase frequency and often discounts future cash flow (net present value). Fine for the demo; name it as a simplification if a finance person is in the room. (It's also a natural consulting upsell — "we can build you a cohort-based LTV.")
- **The mock data is synthetic** and the attribution is deliberately simple. The demo shows *why integrated, deduplicated data changes the decision* — it does **not** claim true multi-touch attribution. Real cross-platform dedup is a genuine data-engineering scope (read: billable).
- **Gross margin is assumed at 60%** — every client's is different, and the whole picture swings with it. It's the single most important input to sanity-check against a real client's books.

---

## 7. Teaching this to the room in five minutes

The sales team doesn't need the formulas — they need **one line and one picture**:

1. **The line:** *"You want a customer to be worth more than they cost. That's the whole game."* (LTV vs CAC, breakeven at 1.0.)
2. **The picture:** the trap chart — green ROAS sailing along up top, red LTV:CAC drowning below the break-even line. The contradiction *is* the lesson; they don't need to compute it to feel it.
3. **The mic-drop:** *"The platforms grade their own homework and double-count each other. Only the blended view tells the truth."*

If they walk out able to ask a client *"sure, your ROAS looks great — but is each customer worth more than they cost you?"*, the math did its job.

---

**One-glance summary:** it's all division; LTV:CAC is the only dimensionless number that matters; 1.0 is breakeven; ROAS lies because of margin and double-counting; Shopify is the calibrated reference everything else gets checked against.
