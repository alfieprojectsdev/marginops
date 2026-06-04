// Mock rows matching the Prisma schema shape (prisma/schema.prisma).
// In production these come from `prisma.adSpendDaily.findMany()` etc.
// Here we hardcode a representative 30-day slice so the dashboard renders
// with zero infra. Decimals are plain `number` for prototype simplicity.

export type AdPlatform = "META" | "GOOGLE" | "TIKTOK";

export interface AdSpendDailyRow {
  platform: AdPlatform;
  campaignId: string;
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

// --- Ad spend: ~30 days, 3 platforms -------------------------------------
// Daily spend roughly: Meta $620, Google $480, TikTok $300 => ~$1,400/day.
function buildAdSpend(): AdSpendDailyRow[] {
  const rows: AdSpendDailyRow[] = [];
  const base: Record<AdPlatform, { spend: number; cpm: number; ctr: number; cvr: number }> = {
    META:   { spend: 95, cpm: 11, ctr: 0.018, cvr: 0.031 },
    GOOGLE: { spend: 65, cpm: 14, ctr: 0.041, cvr: 0.045 },
    TIKTOK: { spend: 32, cpm: 7,  ctr: 0.012, cvr: 0.022 },
  };
  for (let d = 0; d < 30; d++) {
    const date = new Date(2026, 4, 1 + d).toISOString().slice(0, 10); // May 2026
    (Object.keys(base) as AdPlatform[]).forEach((platform) => {
      const cfg = base[platform];
      // mild day-to-day wobble
      const wobble = 0.85 + ((d * 7 + platform.length) % 10) / 33;
      const spend = Math.round(cfg.spend * wobble);
      const impressions = Math.round((spend / cfg.cpm) * 1000);
      const clicks = Math.round(impressions * cfg.ctr);
      const conversions = Math.round(clicks * cfg.cvr);
      rows.push({
        platform,
        campaignId: `${platform.toLowerCase()}-camp-1`,
        date,
        spend,
        impressions,
        clicks,
        conversions,
      });
    });
  }
  return rows;
}

// --- Shopify orders -------------------------------------------------------
// ~9 orders/day, ~55% first orders => new customers. AOV ~ $95, COGS ~40%.
function buildShopifyOrders(): ShopifyOrderRow[] {
  const rows: ShopifyOrderRow[] = [];
  let orderSeq = 0;
  let custSeq = 0;
  for (let d = 0; d < 30; d++) {
    const date = new Date(2026, 4, 1 + d).toISOString().slice(0, 10);
    const ordersToday = 8 + (d % 4); // 8..11
    for (let i = 0; i < ordersToday; i++) {
      const isFirstOrder = (orderSeq % 9) < 5; // ~55% new
      const aov = 80 + ((orderSeq * 13) % 45); // $80..$124
      // first orders map to a fresh customer; repeats reuse an earlier id
      const customerId = isFirstOrder
        ? `cust-${custSeq++}`
        : `cust-${Math.max(0, custSeq - 1 - (orderSeq % 7))}`;
      rows.push({
        id: `order-${orderSeq++}`,
        customerId,
        processedAt: date,
        totalPrice: aov,
        totalCost: Math.round(aov * 0.4 * 100) / 100,
        isFirstOrder,
      });
    }
  }
  return rows;
}

export const adSpendRows: AdSpendDailyRow[] = buildAdSpend();
export const shopifyOrders: ShopifyOrderRow[] = buildShopifyOrders();
