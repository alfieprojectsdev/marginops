// Mock rows matching the Prisma schema shape (prisma/schema.prisma).
// This is the SINGLE source of the demo scenario: it is both the offline
// fallback (lib/db.ts) and the DB seed source (prisma/seed.ts imports it), so
// the two can never drift. Decimals are plain `number` for prototype simplicity.
//
// THE SCENARIO ("the trap", mirrors chat-artifacts/analytics_demo/mock_streams.py):
// each platform looks healthy on ROAS (~4.2x blended, green) but the blended
// unit economics are underwater (LTV:CAC ~0.63x, red) because acquisition cost
// ramps with ad fatigue past the gross-margin value of a customer.
//
//   CAC ramps ₱1,900 -> ₱3,300 over 30 days  => recent windows bleed faster
//   Spend shares: Meta 0.45 / Google 0.35 / TikTok 0.20  (matches the deck)
//   Revenue pinned so the 30-day blended ROAS = 4.2x; thin margin keeps the
//   per-customer LTV (~₱1,650) below the ~₱2,600 blended CAC.
// Single-ROAS dashboard, so the "looks healthy / actually bleeding" split is
// carried by a thin margin rather than a reported-vs-true ROAS gap (see ADR /
// the handover: reported-vs-true is a deferred P2).

export type AdPlatform = "META" | "GOOGLE" | "TIKTOK";

export interface AdSpendDailyRow {
  platform: AdPlatform;
  campaignId: string;
  campaignName?: string;
  date: string; // ISO date
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface ShopifyOrderRow {
  id: string;
  customerId: string;
  processedAt: string;
  totalPrice: number;
  totalCost: number;
  isFirstOrder: boolean;
}

// Deterministic RNG (mulberry32, seed 42 like the Python mock) so every build
// and reseed produces the identical scenario.
function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N_DAYS = 30;
const ROAS_TARGET = 4.2; // 30-day blended ROAS the headline must show (green)

const PLATFORMS: Record<
  AdPlatform,
  { share: number; campaignId: string; campaignName: string; cpm: number; ctr: number }
> = {
  META: { share: 0.45, campaignId: "meta-q3-scaling", campaignName: "Q3 Scaling - FB Prospecting", cpm: 150, ctr: 0.012 },
  GOOGLE: { share: 0.35, campaignId: "google-always-on", campaignName: "Always-On Search", cpm: 120, ctr: 0.035 },
  TIKTOK: { share: 0.2, campaignId: "tiktok-retargeting", campaignName: "Retargeting Pool", cpm: 90, ctr: 0.009 },
};

function isoDate(d: number): string {
  return new Date(2026, 4, 1 + d).toISOString().slice(0, 10); // May 2026
}

function buildScenario(): { ads: AdSpendDailyRow[]; orders: ShopifyOrderRow[] } {
  const rand = mulberry32(42);

  // 1. Daily new-customer arrivals: base + weekend bump + slight upward trend.
  const newPerDay: number[] = [];
  for (let d = 0; d < N_DAYS; d++) {
    const dow = new Date(2026, 4, 1 + d).getDay(); // 0 Sun .. 6 Sat
    const weekend = dow === 0 || dow === 6 ? 1.6 : 0;
    const trend = d / (N_DAYS - 1); // 0..1
    const noise = (rand() - 0.5) * 2;
    newPerDay.push(Math.max(1, Math.round(7 + weekend + trend + noise)));
  }

  // 2. CAC ramp (ad fatigue) drives spend: spend_day = cac_day * new_day.
  const ads: AdSpendDailyRow[] = [];
  for (let d = 0; d < N_DAYS; d++) {
    const cac = 1900 + (3300 - 1900) * (d / (N_DAYS - 1));
    const totalSpend = cac * newPerDay[d];
    const date = isoDate(d);
    (Object.keys(PLATFORMS) as AdPlatform[]).forEach((platform) => {
      const cfg = PLATFORMS[platform];
      const spend = Math.round(totalSpend * cfg.share * (0.95 + rand() * 0.1));
      const impressions = Math.round((spend / cfg.cpm) * 1000);
      const clicks = Math.round(impressions * cfg.ctr);
      ads.push({
        platform,
        campaignId: cfg.campaignId,
        campaignName: cfg.campaignName,
        date,
        spend,
        impressions,
        clicks,
        conversions: Math.round(clicks * 0.03),
      });
    });
  }

  // 3. Orders: every new customer places a first order; ~25% buy again later in
  //    the window (returning buyers reuse their id, so distinct customers ==
  //    new customers). Organic AOV + margin spread; thin margins are the point.
  const orders: ShopifyOrderRow[] = [];
  let custSeq = 0;
  let orderSeq = 0;
  const drawOrder = (returning: boolean) => {
    const price = (returning ? 1.2 : 1) * (6000 + rand() * 5000);
    const margin = 0.12 + rand() * 0.06; // 12%..18%
    return { totalPrice: price, totalCost: price * (1 - margin) };
  };

  for (let d = 0; d < N_DAYS; d++) {
    const date = isoDate(d);
    for (let i = 0; i < newPerDay[d]; i++) {
      const id = `cust-${custSeq++}`;
      const o = drawOrder(false);
      orders.push({ id: `order-${orderSeq++}`, customerId: id, processedAt: date, ...o, isFirstOrder: true });

      if (rand() < 0.25 && d < N_DAYS - 2) {
        const laterDay = Math.min(d + 3 + Math.floor(rand() * 12), N_DAYS - 1);
        const o2 = drawOrder(true);
        orders.push({
          id: `order-${orderSeq++}`,
          customerId: id,
          processedAt: isoDate(laterDay),
          ...o2,
          isFirstOrder: false,
        });
      }
    }
  }

  // 4. Pin the 30-day blended ROAS to the headline by scaling every order's
  //    price and cost by one factor. Scaling preserves each order's margin and
  //    the cross-order / cross-window variance; it only sets the mean.
  const totalSpend = ads.reduce((a, r) => a + r.spend, 0);
  const rawRevenue = orders.reduce((a, o) => a + o.totalPrice, 0);
  const k = (ROAS_TARGET * totalSpend) / rawRevenue;
  for (const o of orders) {
    o.totalPrice = Math.round(o.totalPrice * k);
    o.totalCost = Math.round(o.totalCost * k);
  }

  return { ads, orders };
}

const scenario = buildScenario();

export const adSpendRows: AdSpendDailyRow[] = scenario.ads;
export const shopifyOrders: ShopifyOrderRow[] = scenario.orders;
