import { Stat, HealthPill } from "@/components/Stat";
import FilterBar from "@/components/FilterBar";
import { computeMetrics } from "@/lib/metrics";
import { getDashboardData } from "@/lib/db";
import { parseFilters, PLATFORM_DOT, PLATFORM_LABEL } from "@/lib/filters";

// Reads from Postgres at request time (ADR-2); filters live in the URL.
export const dynamic = "force-dynamic";

const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseFilters(searchParams);
  const { ads, orders, source } = await getDashboardData(filters);
  const m = computeMetrics(ads, orders);

  const hasPlatforms = filters.platforms.length > 0;
  const roasTone = m.blendedRoas >= 4 ? "good" : m.blendedRoas >= 2 ? "watch" : "bad";
  const ratioTone = m.ltvToCacRatio >= 3 ? "good" : m.ltvToCacRatio >= 1 ? "watch" : "bad";

  const channelList = hasPlatforms
    ? filters.platforms.map((p) => PLATFORM_LABEL[p]).join(", ")
    : "no ad platforms";

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      {/* Header — single left-aligned block; period revenue moved down to the
          ROAS card so it sits with the metrics it explains. */}
      <header className="border-b border-edge pb-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-accent">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          MarginOps
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          Marketing profitability
        </h1>
        <p className="mt-2 text-sm text-muted">
          Blended across {channelList} &amp; Shopify · Trailing {filters.range} days
        </p>
      </header>

      {/* Filters */}
      <div className="mt-7">
        <FilterBar filters={filters} />
      </div>

      {source === "sample" && (
        <p className="mt-5 rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn ring-1 ring-inset ring-warn/20">
          Showing sample data: the database is unreachable.
        </p>
      )}

      {!hasPlatforms ? (
        // Empty state that teaches the control rather than going blank.
        <section className="mt-10 rounded-2xl border border-dashed border-edge bg-surface px-7 py-12 text-center">
          <h2 className="text-lg font-semibold text-ink">No ad platforms selected</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Toggle Meta, Google, or TikTok above to blend ad spend into customer
            acquisition cost and return on ad spend. Shopify revenue is shown regardless.
          </p>
        </section>
      ) : (
        <>
          {/* The contradiction, in one frame: platform ROAS looks healthy while
              the blended LTV:CAC is underwater. Two co-equal headline metrics. */}
          <section className="mt-10 grid gap-8 rounded-2xl border border-edge bg-surface px-7 py-8 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-edge">
            <div className="sm:pr-8">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Blended ROAS
                </span>
                <HealthPill tone={roasTone}>
                  {roasTone === "good" ? "Healthy" : roasTone === "watch" ? "Watch" : "At risk"}
                </HealthPill>
              </div>
              <div className="nums mt-3 text-6xl font-semibold tracking-tight text-ink">
                {m.blendedRoas.toFixed(2)}×
              </div>
              <p className="mt-2 text-sm text-muted">
                {peso(m.totalRevenue)} returned on {peso(m.totalAdSpend)} of blended ad spend.
              </p>
            </div>
            <div className="sm:pl-8">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  LTV : CAC
                </span>
                <HealthPill tone={ratioTone}>
                  {m.ltvToCacRatio >= 1 ? "Healthy" : "At risk"}
                </HealthPill>
              </div>
              <div
                className={`nums mt-3 text-6xl font-semibold tracking-tight ${
                  m.ltvToCacRatio >= 1 ? "text-positive" : "text-negative"
                }`}
              >
                {m.ltvToCacRatio.toFixed(2)}×
              </div>
              <p className={`mt-2 text-sm ${m.ltvToCacRatio >= 1 ? "text-muted" : "text-negative"}`}>
                {m.ltvToCacRatio >= 1
                  ? "Healthy: each customer earns back more than they cost to acquire."
                  : "Below 1.0: losing money on every customer acquired."}
              </p>
            </div>
          </section>

          {/* Supporting metrics: one panel, cells divided — not separate cards. */}
          <section className="mt-6 grid divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Stat
              label="Blended CAC"
              value={peso(m.blendedCac)}
              caption={`${peso(m.totalAdSpend)} ad spend ÷ ${m.newCustomers} new customers.`}
            />
            <Stat
              label="LTV"
              value={peso(m.ltv)}
              caption="Gross-margin value per customer over their orders."
            />
            <Stat
              label="New customers"
              value={m.newCustomers.toLocaleString("en-PH")}
              caption={`${m.newCustomers.toLocaleString("en-PH")} of ${m.totalCustomers.toLocaleString("en-PH")} ordering customers were new this period.`}
            />
          </section>

          {/* Spend allocation */}
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Where the ad budget went
            </h2>
            <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-sunken">
              {m.spendByPlatform.map((p) => (
                <div
                  key={p.platform}
                  className="h-full"
                  style={{ width: `${p.share * 100}%`, backgroundColor: PLATFORM_DOT[p.platform] }}
                  title={`${PLATFORM_LABEL[p.platform]} · ${peso(p.spend)}`}
                />
              ))}
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              {m.spendByPlatform.map((p) => (
                <div key={p.platform} className="flex items-baseline justify-between gap-3 border-t border-edge pt-3">
                  <dt className="flex items-center gap-2 text-sm text-muted">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PLATFORM_DOT[p.platform] }}
                    />
                    {PLATFORM_LABEL[p.platform]}
                  </dt>
                  <dd className="nums text-sm text-ink">
                    <span className="font-semibold">{peso(p.spend)}</span>
                    <span className="ml-2 text-muted">{Math.round(p.share * 100)}%</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}

      <footer className="mt-16 border-t border-edge pt-6 text-xs text-muted">
        Prototype · rows read from PostgreSQL via{" "}
        <code className="text-accent">lib/db.ts</code>, blended in{" "}
        <code className="text-accent">lib/metrics.ts</code> · Meta / Google / TikTok / Shopify.
      </footer>
    </main>
  );
}
