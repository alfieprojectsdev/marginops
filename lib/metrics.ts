// Merge logic — the heart of MarginOps.
// Takes raw rows from 4 sources (Meta/Google/TikTok ad spend + Shopify orders)
// and blends them into the three executive metrics.
//
//   Blended CAC  = total ad spend (all platforms) / new customers acquired
//   LTV          = avg gross-margin revenue per customer over their full order history
//   Blended ROAS = total revenue / total ad spend
//
// "Blended" = across every channel, not per-platform. That is the calm-web view:
// one number an exec trusts, not a per-channel spreadsheet.

import {
  adSpendRows,
  shopifyOrders,
  type AdPlatform,
  type AdSpendDailyRow,
  type ShopifyOrderRow,
} from "./mockData";

export interface PlatformSpend {
  platform: AdPlatform;
  spend: number;
  share: number; // fraction of total blended spend
}

export interface MarginMetrics {
  blendedCac: number;
  ltv: number;
  blendedRoas: number;
  ltvToCacRatio: number;
  // supporting figures for the cards / drilldown
  totalAdSpend: number;
  totalRevenue: number;
  grossMargin: number; // 0..1
  newCustomers: number;
  totalCustomers: number;
  spendByPlatform: PlatformSpend[];
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

export function computeMetrics(
  ads: AdSpendDailyRow[] = adSpendRows,
  orders: ShopifyOrderRow[] = shopifyOrders,
): MarginMetrics {
  // 1. Blend ad spend across all 3 platforms.
  const totalAdSpend = sum(ads.map((r) => r.spend));

  const byPlatform = new Map<AdPlatform, number>();
  for (const r of ads) {
    byPlatform.set(r.platform, (byPlatform.get(r.platform) ?? 0) + r.spend);
  }
  const spendByPlatform: PlatformSpend[] = Array.from(byPlatform.entries())
    .map(([platform, spend]) => ({
      platform,
      spend,
      share: totalAdSpend ? spend / totalAdSpend : 0,
    }))
    .sort((a, b) => b.spend - a.spend);

  // 2. Roll up Shopify revenue + margin.
  const totalRevenue = sum(orders.map((o) => o.totalPrice));
  const totalCost = sum(orders.map((o) => o.totalCost));
  const grossMargin = totalRevenue ? (totalRevenue - totalCost) / totalRevenue : 0;

  // 3. Customer counts. A first order == an acquisition.
  const newCustomers = orders.filter((o) => o.isFirstOrder).length;
  const totalCustomers = new Set(orders.map((o) => o.customerId)).size;

  // 4. Blended CAC: every ad dollar / every newly acquired customer.
  const blendedCac = newCustomers ? totalAdSpend / newCustomers : 0;

  // 5. LTV: gross-margin revenue spread across the full customer base.
  //    (margin-adjusted lifetime value per customer over the window's order history)
  const grossProfit = totalRevenue - totalCost;
  const ltv = totalCustomers ? grossProfit / totalCustomers : 0;

  // 6. Blended ROAS: revenue returned per ad dollar.
  const blendedRoas = totalAdSpend ? totalRevenue / totalAdSpend : 0;

  return {
    blendedCac,
    ltv,
    blendedRoas,
    ltvToCacRatio: blendedCac ? ltv / blendedCac : 0,
    totalAdSpend,
    totalRevenue,
    grossMargin,
    newCustomers,
    totalCustomers,
    spendByPlatform,
  };
}
