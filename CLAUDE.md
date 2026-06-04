# CLAUDE.md — MarginOps

Sales-enablement dashboard prototype. Blends Meta/Google/TikTok ad spend with
Shopify revenue into Blended CAC, LTV, and Blended ROAS. Philippine market, so
all money is **Philippine Pesos (₱)**. Read [ADR.md](./ADR.md) for the binding
decisions and [README.md](./README.md) for setup.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind 3 · Prisma 5
· PostgreSQL.

## Data flow

The dashboard reads from Postgres at request time; filters live in the URL.

```
app/page.tsx (server, force-dynamic)
  parseFilters(searchParams)        lib/filters.ts
  → getDashboardData(filters)       lib/db.ts   (Prisma query; mock fallback)
  → computeMetrics(ads, orders)     lib/metrics.ts
  → render
components/FilterBar.tsx (client)   writes range/platforms to the URL only
app/loading.tsx                     skeleton while the server re-queries
```

- `computeMetrics` is **pure** and takes rows as arguments. Same merge logic for
  the live DB and the mock fallback. Don't read globals inside it.
- `lib/filters.ts` is the single source of truth for the filter vocabulary
  (`ALL_PLATFORMS`, `RANGES`, `DATA_END`, `PLATFORM_DOT`). Shared by server and
  client; keep `PLATFORM_DOT` in sync with the `meta`/`google`/`tiktok` tokens
  in `tailwind.config.ts`.
- `lib/db.ts` falls back to a filtered `lib/mockData` slice on any Prisma error
  and sets `source: "sample"` (UI shows a banner). Don't remove the fallback;
  it keeps a pitch alive when the DB is asleep.
- `lib/mockData.ts` holds PHP-scaled magnitudes (AOV ~₱2,000–3,099, daily blended
  spend ~₱4,850). It is both the fallback and the seed source. Re-run
  `npm run prisma:seed` after changing it so the DB matches.

## Conventions

- Currency: `Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })`.
  Never hardcode `$` or `USD`.
- Use the `@/` path alias (maps to repo root, see `tsconfig.json`).
- Data readouts get the `.nums` class (tabular + lining figures).
- TypeScript strict; no `any`. Prisma `Decimal` → `Number(...)` at the db.ts boundary.

## Design system (impeccable, product register)

The dashboard SERVES the task, so familiarity beats novelty. Tokens are OKLCH in
`tailwind.config.ts`; the theme is light and Restrained (one accent: indigo, for
selection/state only). Hard rules when touching UI:

- **No identical card grids, no hero-metric template.** Metrics live in one
  divided stat strip (`components/Stat.tsx`) with a single emphasized lead, not
  N equal boxes. This was the original prototype's main defect; don't reintroduce it.
- Body/label text must clear **4.5:1** contrast on its background (`ink` ≈12:1,
  `muted` ≈5:1 on `canvas`; `faint` only on ≥18px).
- One sans family (system stack), fixed rem scale, `text-wrap: balance` on headings.
- Every interactive control needs default/hover/focus/active/selected states.
- Loading = skeleton (`loading.tsx`), never a spinner. Empty states teach.
- Transitions 150ms, color/opacity only; no decorative motion.
- Copy: **no em dashes** (use commas/colons/periods/parentheses), no marketing
  buzzwords, button labels are verb + object.

ADR-3 boundary: no agentic workflows, no LangGraph, no ad-platform automation.

## Local database

`.env` (git-ignored) holds `DATABASE_URL`. Local dev uses PostgreSQL on :5432,
database `marginops`. Two gotchas:

- **Prisma connects over TCP, which needs password auth** (psql over the unix
  socket uses peer auth and won't tell you this). If `prisma db push` returns
  `P1000 Authentication failed`, set a password on the role:
  `ALTER ROLE <user> WITH PASSWORD '<pw>'` and put it in the URL.
- An inline `DATABASE_URL=... npx prisma ...` **overrides** `.env` (dotenv does
  not clobber an already-set process env var). Useful for one-off targets.

## Running

```bash
npm run dev                 # :3000, HMR
npm run build && npm start  # production; build also type-checks + lints
npm run prisma:push         # after editing prisma/schema.prisma
npm run prisma:seed         # after editing lib/mockData.ts
```

- The route is `force-dynamic`; `next build` shows it as `ƒ` (server-rendered on
  demand), not `○` (static). That is correct — it must hit the DB per request.
- **Kill stale servers before restarting.** A lingering `npm run start` keeps
  :3000 bound and you'll test an old build silently:
  `lsof -ti:3000 | xargs -r kill -9`.

## Verifying a change

Build is the type/lint gate. For behavior, curl the running server:

```bash
curl -s "http://localhost:3000/?range=7&platforms=META"   # filtered slice
curl -s "http://localhost:3000/?platforms="                # empty state
```

Note: query-param navigations return an RSC (Flight) payload, not plain HTML —
the rendered values are in it, just not as clean tags. Grep for the value text.
```
