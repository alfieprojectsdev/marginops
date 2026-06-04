// Data access. ADR-2: the dashboard reads its rows from PostgreSQL (via Prisma),
// not from the hardcoded mock arrays. The mock arrays remain as a graceful
// fallback so a missing/asleep database degrades to sample data instead of a
// crashed pitch. `source` tells the UI which one it got.
import { prisma } from "./prisma";
import {
  adSpendRows as mockAds,
  shopifyOrders as mockOrders,
  type AdSpendDailyRow,
  type ShopifyOrderRow,
} from "./mockData";
import { rangeWindow, type Filters } from "./filters";

export interface DashboardData {
  ads: AdSpendDailyRow[];
  orders: ShopifyOrderRow[];
  source: "db" | "sample";
}

function filterMock(filters: Filters): { ads: AdSpendDailyRow[]; orders: ShopifyOrderRow[] } {
  const { start, end } = rangeWindow(filters.range);
  const platforms = new Set(filters.platforms);
  return {
    ads: mockAds.filter(
      (r) => platforms.has(r.platform) && r.date >= start && r.date <= end,
    ),
    orders: mockOrders.filter((o) => o.processedAt >= start && o.processedAt <= end),
  };
}

export async function getDashboardData(filters: Filters): Promise<DashboardData> {
  const { start, end } = rangeWindow(filters.range);
  const startDate = new Date(start + "T00:00:00Z");
  const endDate = new Date(end + "T00:00:00Z");

  try {
    const [ads, orders] = await Promise.all([
      filters.platforms.length === 0
        ? Promise.resolve([])
        : prisma.adSpendDaily.findMany({
            where: {
              platform: { in: filters.platforms },
              date: { gte: startDate, lte: endDate },
            },
          }),
      prisma.shopifyOrder.findMany({
        where: { processedAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    return {
      source: "db",
      ads: ads.map((r) => ({
        platform: r.platform,
        campaignId: r.campaignId,
        date: r.date.toISOString().slice(0, 10),
        spend: Number(r.spend),
        impressions: r.impressions,
        clicks: r.clicks,
        conversions: r.conversions,
      })),
      orders: orders.map((o) => ({
        id: o.id,
        customerId: o.customerId,
        processedAt: o.processedAt.toISOString().slice(0, 10),
        totalPrice: Number(o.totalPrice),
        totalCost: Number(o.totalCost),
        isFirstOrder: o.isFirstOrder,
      })),
    };
  } catch {
    // DB unreachable — fall back to the in-memory mock slice.
    return { source: "sample", ...filterMock(filters) };
  }
}
