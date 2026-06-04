# MarginOps

A sales-enablement dashboard prototype for the Philippine market. Blends ad
spend across **Meta, Google, and TikTok** with **Shopify** revenue into three
executive metrics a business owner can read in five seconds:

- **Blended CAC** — total ad spend ÷ new customers acquired
- **LTV** — gross-margin value per customer
- **Blended ROAS** — revenue returned per peso of ad spend

All money is in Philippine Pesos (₱). Design follows a "Calm Web" philosophy:
light, restrained, high-clarity, no flashing dials. See [ADR.md](./ADR.md) for
the architecture decisions and prototype spec.

## Stack

| Concern   | Choice                                  |
|-----------|-----------------------------------------|
| Framework | Next.js 14 (App Router) + React 18      |
| Language  | TypeScript (strict)                     |
| Styling   | Tailwind CSS 3, OKLCH design tokens     |
| Data      | PostgreSQL via Prisma 5                  |

## Quick start

```bash
npm install

# 1. Point DATABASE_URL at a local Postgres (see "Database" below)
#    .env already holds a local dev URL.

# 2. Create the schema and load mock data
npm run prisma:push     # sync prisma/schema.prisma -> database
npm run prisma:seed     # load the 30-day mock slice (90 ad rows, 283 orders)

# 3. Run
npm run dev             # http://localhost:3000
```

The dashboard reads its rows from Postgres at request time. If the database is
unreachable it degrades to an in-memory mock slice and shows a "sample data"
banner instead of crashing.

## Database

Local development uses a PostgreSQL instance. The connection string lives in
`.env`:

```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/marginops"
```

To provision a fresh local database (PostgreSQL 16/18):

```bash
psql -U <user> -d postgres -c "CREATE DATABASE marginops;"
# Prisma connects over TCP, which needs password auth:
psql -U <user> -d postgres -c "ALTER ROLE <user> WITH PASSWORD '<password>';"
npm run prisma:push
npm run prisma:seed
```

`.env` is git-ignored; the password is local-only, never commit it.

## Scripts

| Script                   | Does                                    |
|--------------------------|-----------------------------------------|
| `npm run dev`            | Dev server (HMR) on :3000               |
| `npm run build`          | Production build (type-checks + lints)  |
| `npm run start`          | Serve the production build              |
| `npm run lint`           | ESLint                                  |
| `npm run prisma:generate`| Regenerate the Prisma client            |
| `npm run prisma:push`    | Push schema to the database             |
| `npm run prisma:seed`    | Load mock data (`prisma/seed.ts`)       |

## Filters

State lives in the URL, so views are shareable and the server is the single
source of truth:

- `?range=7|14|30` — trailing window (counts back from the last day of data)
- `?platforms=META,GOOGLE,TIKTOK` — comma list; omit for all, empty for none

Changing a filter re-queries Postgres and recomputes the blended metrics.

## Architecture

Request → server page → Postgres → metrics → render. The filter bar only writes
to the URL; the page reads it back.

```
app/page.tsx            Server component. Parses filters, fetches, computes, renders.
  └ components/FilterBar Client component. Date-range + platform toggles -> URL.
app/loading.tsx          Skeleton shown while the server re-queries on a filter change.

lib/filters.ts           Filter vocabulary + URL parsing (shared server/client).
lib/db.ts                getDashboardData(): Prisma query, mock fallback.
lib/prisma.ts            PrismaClient singleton.
lib/metrics.ts           computeMetrics(): blends ad + order rows into CAC/LTV/ROAS.
lib/mockData.ts          30-day mock slice + row types (fallback + seed source).

prisma/schema.prisma     AdSpendDaily, ShopifyOrder, ShopifyCustomer.
prisma/seed.ts           Loads lib/mockData into the database.

components/Stat.tsx       Metric cell + health pill for the divided stat strip.
tailwind.config.ts        OKLCH design tokens (canvas/surface/ink/accent/…).
```

`computeMetrics` is pure and takes its rows as arguments, so the same merge
logic serves the live database and the mock fallback unchanged.

## Status

This is a prototype for sales pitches, not production. Per ADR-3 it deliberately
avoids agentic workflows and ad-platform automation. The data integrations are
simulated; swapping the mock for live platform connectors that write to the same
tables is the intended next step.
