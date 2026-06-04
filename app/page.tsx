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
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-edge pb-8">
        <div>
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
        </div>
        <div className="text-right">
          <div className="text-sm text-muted">Revenue this period</div>
          <div className="nums mt-1 text-2xl font-semibold text-ink">{peso(m.totalRevenue)}</div>
        </div>
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
          {/* Lead verdict: ROAS is the one emphasized metric, with plain-language context. */}
          <section className="mt-10 grid items-center gap-6 rounded-2xl border border-edge bg-surface px-7 py-8 sm:grid-cols-[auto_1fr]">
            <div>
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
            </div>
            <p className="text-base leading-relaxed text-muted sm:border-l sm:border-edge sm:pl-6">
              Every <span className="font-medium text-ink">{peso(1)}</span> of blended ad
              spend returns <span className="font-medium text-ink">{peso(m.blendedRoas)}</span> in
              revenue. You acquire a customer for{" "}
              <span className="font-medium text-ink">{peso(m.blendedCac)}</span> and earn{" "}
              <span className="font-medium text-ink">{peso(m.ltv)}</span> in gross margin over their
              lifetime, an LTV:CAC of{" "}
              <span className="font-medium text-ink">{m.ltvToCacRatio.toFixed(1)}×</span>.
            </p>
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
              caption={`${Math.round(m.grossMargin * 100)}% gross margin per customer.`}
              pill={{ tone: ratioTone, label: `LTV:CAC ${m.ltvToCacRatio.toFixed(1)}×` }}
            />
            <Stat
              label="New customers"
              value={m.newCustomers.toLocaleString("en-PH")}
              caption={`${m.totalCustomers} total ordering customers this period.`}
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
