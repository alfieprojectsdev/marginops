// Optional: load the mock rows into a real Postgres via Prisma.
//   1. set DATABASE_URL in .env
//   2. npx prisma db push
//   3. npm run prisma:seed
// The dashboard itself does NOT need this — it reads lib/mockData.ts directly.

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
      campaignName: `${r.platform} Prospecting`,
      date: new Date(r.date),
      spend: r.spend,
      impressions: r.impressions,
      clicks: r.clicks,
      conversions: r.conversions,
    })),
  });

  // upsert customers first (orders FK them)
  const customerIds = Array.from(new Set(shopifyOrders.map((o) => o.customerId)));
  await prisma.shopifyCustomer.createMany({
    data: customerIds.map((id, i) => ({
      id,
      email: `customer${i}@example.com`,
      firstSeen: new Date(2026, 4, 1),
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

  console.log(
    `Seeded ${adSpendRows.length} ad rows, ${customerIds.length} customers, ${shopifyOrders.length} orders.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
