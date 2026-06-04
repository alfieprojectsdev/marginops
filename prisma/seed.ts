// Seeds a hardcoded sales-demo scenario into Postgres (the dashboard's live
// source). Run after `npm run prisma:push`:  npm run prisma:seed
//
// THE STORY (told entirely through the existing blended dashboard — no new UI):
// A Meta campaign, "Q3 Scaling - FB Prospecting", looks like a runaway success
// on surface ROAS, but the blended Shopify truth shows it loses money on every
// customer. Toggle to Meta-only to see the dominant spend; the LTV:CAC pill
// turns red while the ROAS pill stays green.
//
// All values are Philippine Pesos and land on the 30-day window ending
// 2026-05-30 (matches lib/filters.ts DATA_END + the 30-day range).
//
// Blended math the dashboard computes from these rows (lib/metrics.ts):
//   total ad spend = 500,000 (Meta) + 150,000 (Google) + 80,000 (TikTok) = 730,000
//   292 new customers  ->  Blended CAC = 730,000 / 292 = 2,500 (exact)
//   Orders carry an organic AOV + gross-margin spread, plus a slice of repeat
//   buyers, so revenue and LTV are real averages, not a flat constant. Tuned so
//   the 30-day window lands at ~4.2x ROAS (green) and a mean LTV near ₱1,650,
//   keeping LTV:CAC firmly red (~0.66-0.7x). Those averages drift a little when
//   you switch the 7 / 14 / 30-day filters, like production data.
// The high ROAS headline still hides a per-customer loss (LTV < CAC).

import { PrismaClient, AdPlatform } from "@prisma/client";

const prisma = new PrismaClient();

// Deterministic RNG (mulberry32) so the demo is identical on every reseed.
function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260530);

const DAYS = 30;
const WINDOW_START = Date.UTC(2026, 4, 1); // 2026-05-01 (May 2026)

function dayDate(d: number): Date {
  const x = new Date(WINDOW_START);
  x.setUTCDate(x.getUTCDate() + d);
  return x;
}

// Spread a monthly total across the 30 days following a trend shape, summing
// EXACTLY to `total` (rounding drift absorbed by the last day). The trend keeps
// the spend mix shifting by date range (recent windows skew further to Meta).
function distribute(total: number, shape: (t: number) => number): number[] {
  const raw = Array.from({ length: DAYS }, (_, d) => shape(d / (DAYS - 1)));
  const sum = raw.reduce((a, b) => a + b, 0);
  const daily = raw.map((r) => Math.round((r / sum) * total));
  daily[DAYS - 1] += total - daily.reduce((a, b) => a + b, 0);
  return daily;
}

// One campaign per platform. Meta dominates (the trap); the others are stable
// baseline spend so Meta stands out.
const AD_PLAN: {
  platform: AdPlatform;
  campaignId: string;
  campaignName: string;
  monthlyTotal: number;
  cpm: number;
  ctr: number;
  shape: (t: number) => number;
}[] = [
  {
    platform: "META",
    campaignId: "meta-q3-scaling",
    campaignName: "Q3 Scaling - FB Prospecting",
    monthlyTotal: 500_000,
    cpm: 280,
    ctr: 0.018,
    shape: (t) => 0.55 + 0.9 * t, // ramps up as it scales
  },
  {
    platform: "GOOGLE",
    campaignId: "google-always-on",
    campaignName: "Always-On Search",
    monthlyTotal: 150_000,
    cpm: 350,
    ctr: 0.041,
    shape: () => 1, // steady baseline
  },
  {
    platform: "TIKTOK",
    campaignId: "tiktok-retargeting",
    campaignName: "Retargeting Pool",
    monthlyTotal: 80_000,
    cpm: 180,
    ctr: 0.012,
    shape: (t) => 1.5 - 1.0 * t, // winds down after an early push
  },
];

// The "single source of truth": 292 newly acquired customers. Thin, variable
// margins plus weak retention (only a small share buy again) keep the real
// per-customer value well below the ₱2,500 it cost to acquire them.
const NEW_CUSTOMERS = 292;
const REPEAT_RATE = 0.12; // share of customers who place a 2nd order
const THIRD_ORDER_RATE = 0.25; // share of repeat buyers who place a 3rd

// Draw one order's economics. AOV and gross margin both vary; returning buyers
// spend a bit more. Mean AOV ~₱9.4k, mean margin ~15.7% -> ~₱1,480 profit/order.
function drawOrder(returning: boolean): { totalPrice: number; totalCost: number } {
  const aov = returning ? 8_500 + rand() * 7_500 : 6_000 + rand() * 7_000;
  const margin = 0.107 + rand() * 0.1; // 10.7%..20.7%, mean ~15.7%
  const totalPrice = Math.round(aov);
  const totalCost = Math.round(totalPrice * (1 - margin));
  return { totalPrice, totalCost };
}

async function main() {
  const adRows = AD_PLAN.flatMap((plan) => {
    const daily = distribute(plan.monthlyTotal, plan.shape);
    return daily.map((spend, d) => {
      const impressions = Math.round((spend / plan.cpm) * 1000);
      const clicks = Math.round(impressions * plan.ctr);
      return {
        platform: plan.platform,
        campaignId: plan.campaignId,
        campaignName: plan.campaignName,
        date: dayDate(d),
        spend,
        impressions,
        clicks,
        conversions: Math.round(clicks * 0.03),
      };
    });
  });

  const customers: { id: string; email: string; firstSeen: Date }[] = [];
  const orders: {
    id: string;
    customerId: string;
    processedAt: Date;
    totalPrice: number;
    totalCost: number;
    isFirstOrder: boolean;
  }[] = [];
  let orderSeq = 0;

  for (let i = 0; i < NEW_CUSTOMERS; i++) {
    const firstDay = i % DAYS; // even acquisition across the window
    const id = `cust-q3-${i}`;
    customers.push({ id, email: `buyer${i}@example.ph`, firstSeen: dayDate(firstDay) });

    orders.push({
      id: `order-q3-${orderSeq++}`,
      customerId: id,
      processedAt: dayDate(firstDay),
      ...drawOrder(false),
      isFirstOrder: true,
    });

    // Weak retention: a small share return later in the window.
    if (rand() < REPEAT_RATE) {
      const secondDay = Math.min(firstDay + 5 + Math.floor(rand() * 15), DAYS - 1);
      orders.push({
        id: `order-q3-${orderSeq++}`,
        customerId: id,
        processedAt: dayDate(secondDay),
        ...drawOrder(true),
        isFirstOrder: false,
      });
      if (rand() < THIRD_ORDER_RATE) {
        const thirdDay = Math.min(secondDay + 3 + Math.floor(rand() * 10), DAYS - 1);
        orders.push({
          id: `order-q3-${orderSeq++}`,
          customerId: id,
          processedAt: dayDate(thirdDay),
          ...drawOrder(true),
          isFirstOrder: false,
        });
      }
    }
  }

  // Pin the 30-day blend to the narrative headline: scale every order's price
  // and cost by one factor so total revenue = 4.2x ad spend. Scaling keeps each
  // order's margin and the cross-order/-window variance intact; it only sets the
  // mean. Result: ROAS ~4.2x (green) and mean LTV ~₱1,650 (LTV:CAC ~0.66x, red).
  const TARGET_REVENUE = 4.2 * 730_000; // 3,066,000
  const rawRevenue = orders.reduce((a, o) => a + o.totalPrice, 0);
  const k = TARGET_REVENUE / rawRevenue;
  for (const o of orders) {
    o.totalPrice = Math.round(o.totalPrice * k);
    o.totalCost = Math.round(o.totalCost * k);
  }

  await prisma.adSpendDaily.deleteMany();
  await prisma.shopifyOrder.deleteMany();
  await prisma.shopifyCustomer.deleteMany();

  await prisma.adSpendDaily.createMany({ data: adRows });
  await prisma.shopifyCustomer.createMany({ data: customers });
  await prisma.shopifyOrder.createMany({ data: orders });

  const totalSpend = adRows.reduce((a, r) => a + r.spend, 0);
  const revenue = orders.reduce((a, o) => a + o.totalPrice, 0);
  const grossProfit = orders.reduce((a, o) => a + (o.totalPrice - o.totalCost), 0);
  const newCustomers = orders.filter((o) => o.isFirstOrder).length;
  console.log(
    `Seeded ${adRows.length} ad rows (₱${totalSpend.toLocaleString("en-PH")} spend), ` +
      `${customers.length} customers, ${orders.length} orders (₱${revenue.toLocaleString("en-PH")} revenue).\n` +
      `  Blended ROAS ${(revenue / totalSpend).toFixed(2)}x · ` +
      `CAC ₱${Math.round(totalSpend / newCustomers).toLocaleString("en-PH")} · ` +
      `LTV ₱${Math.round(grossProfit / customers.length).toLocaleString("en-PH")} · ` +
      `LTV:CAC ${(grossProfit / customers.length / (totalSpend / newCustomers)).toFixed(2)}x`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
