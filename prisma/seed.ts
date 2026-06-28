// Loads the demo scenario from lib/mockData.ts into Postgres via Prisma.
//   npm run prisma:push   # sync schema first
//   npm run prisma:seed
// The dashboard reads the DB at request time; lib/mockData.ts is also the
// offline fallback. Seeding from the SAME module is what keeps the live view
// and the DB-asleep fallback telling the identical story (the demo may run on
// either). See lib/mockData.ts for the scenario itself.

import { PrismaClient } from "@prisma/client";
import { adSpendRows, shopifyOrders } from "../lib/mockData";

const prisma = new PrismaClient();

async function main() {
  await prisma.adSpendDaily.deleteMany();
  await prisma.shopifyOrder.deleteMany();
  await prisma.shopifyCustomer.deleteMany();

  await prisma.adSpendDaily.createMany({
    data: adSpendRows.map((r) => ({
      platform: r.platform,
      campaignId: r.campaignId,
      campaignName: r.campaignName ?? `${r.platform} Prospecting`,
      date: new Date(r.date),
      spend: r.spend,
      impressions: r.impressions,
      clicks: r.clicks,
      conversions: r.conversions,
    })),
  });

  // Customers are the distinct ids referenced by orders; firstSeen = earliest order.
  const firstSeen = new Map<string, string>();
  for (const o of shopifyOrders) {
    const prev = firstSeen.get(o.customerId);
    if (!prev || o.processedAt < prev) firstSeen.set(o.customerId, o.processedAt);
  }
  await prisma.shopifyCustomer.createMany({
    data: Array.from(firstSeen.entries()).map(([id, seen], i) => ({
      id,
      email: `buyer${i}@example.ph`,
      firstSeen: new Date(seen),
    })),
  });

  await prisma.shopifyOrder.createMany({
    data: shopifyOrders.map((o) => ({
      id: o.id,
      customerId: o.customerId,
      processedAt: new Date(o.processedAt),
      totalPrice: o.totalPrice,
      totalCost: o.totalCost,
      isFirstOrder: o.isFirstOrder,
    })),
  });

  const totalSpend = adSpendRows.reduce((a, r) => a + r.spend, 0);
  const revenue = shopifyOrders.reduce((a, o) => a + o.totalPrice, 0);
  const grossProfit = shopifyOrders.reduce((a, o) => a + (o.totalPrice - o.totalCost), 0);
  const newCustomers = shopifyOrders.filter((o) => o.isFirstOrder).length;
  console.log(
    `Seeded ${adSpendRows.length} ad rows (₱${totalSpend.toLocaleString("en-PH")} spend), ` +
      `${firstSeen.size} customers, ${shopifyOrders.length} orders.\n` +
      `  Blended ROAS ${(revenue / totalSpend).toFixed(2)}x · ` +
      `CAC ₱${Math.round(totalSpend / newCustomers).toLocaleString("en-PH")} · ` +
      `LTV ₱${Math.round(grossProfit / firstSeen.size).toLocaleString("en-PH")} · ` +
      `LTV:CAC ${(grossProfit / firstSeen.size / (totalSpend / newCustomers)).toFixed(2)}x`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
