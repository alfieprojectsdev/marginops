import MetricCard from "@/components/MetricCard";
import { computeMetrics } from "@/lib/metrics";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const platformLabel: Record<string, string> = {
  META: "Meta Ads",
  GOOGLE: "Google Ads",
  TIKTOK: "TikTok Ads",
};

export default function Home() {
  const m = computeMetrics();

  // simple health heuristics for the calm-web signal chips
  const roasTone = m.blendedRoas >= 4 ? "good" : m.blendedRoas >= 2 ? "watch" : "bad";
  const ratioTone = m.ltvToCacRatio >= 3 ? "good" : m.ltvToCacRatio >= 1 ? "watch" : "bad";

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <header className="flex items-baseline justify-between border-b border-edge pb-8">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-accent">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            MarginOps
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Marketing Profitability
          </h1>
          <p className="mt-2 text-sm text-muted">
            Blended view across Meta, Google, TikTok &amp; Shopify · Trailing 30 days
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <div className="text-sm text-muted">Period revenue</div>
          <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
            {usd(m.totalRevenue)}
          </div>
        </div>
      </header>

      {/* Three headline metrics */}
      <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Blended CAC"
          value={usd(m.blendedCac)}
          caption={`${usd(m.totalAdSpend)} ad spend across all channels ÷ ${m.newCustomers} new customers.`}
          tone="neutral"
        />
        <MetricCard
          label="LTV"
          value={usd(m.ltv)}
          caption={`Gross-margin value per customer · ${Math.round(m.grossMargin * 100)}% margin on ${usd(m.totalRevenue)} revenue.`}
          tone={ratioTone}
          toneLabel={`LTV:CAC ${m.ltvToCacRatio.toFixed(1)}×`}
        />
        <MetricCard
          label="Blended ROAS"
          value={`${m.blendedRoas.toFixed(2)}×`}
          caption={`${usd(m.totalRevenue)} revenue returned per ${usd(m.totalAdSpend)} of blended ad spend.`}
          tone={roasTone}
          toneLabel={roasTone === "good" ? "Healthy" : roasTone === "watch" ? "Watch" : "At risk"}
        />
      </section>

      {/* Spend allocation strip */}
      <section className="mt-12">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Where the ad budget went
        </h2>
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full border border-edge">
          {m.spendByPlatform.map((p) => (
            <div
              key={p.platform}
              className="h-full"
              style={{
                width: `${p.share * 100}%`,
                backgroundColor:
                  p.platform === "META"
                    ? "#7c9cff"
                    : p.platform === "GOOGLE"
                    ? "#5ad19a"
                    : "#ff7a85",
              }}
              title={`${platformLabel[p.platform]} · ${usd(p.spend)}`}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {m.spendByPlatform.map((p) => (
            <div
              key={p.platform}
              className="rounded-xl border border-edge bg-surface/60 px-4 py-3"
            >
              <div className="text-sm text-muted">{platformLabel[p.platform]}</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-white tabular-nums">
                  {usd(p.spend)}
                </span>
                <span className="text-sm text-muted tabular-nums">
                  {Math.round(p.share * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t border-edge pt-6 text-xs text-muted">
        Prototype · metrics merged in <code className="text-accent">lib/metrics.ts</code> from
        mock Meta / Google / TikTok / Shopify rows defined by{" "}
        <code className="text-accent">prisma/schema.prisma</code>.
      </footer>
    </main>
  );
}
