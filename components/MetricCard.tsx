interface MetricCardProps {
  label: string;
  value: string;
  caption: string;
  // optional health signal: "good" | "watch" | "bad"
  tone?: "good" | "watch" | "bad" | "neutral";
  toneLabel?: string;
}

const toneStyles: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  good: "text-positive border-positive/30 bg-positive/10",
  watch: "text-accent border-accent/30 bg-accent/10",
  bad: "text-negative border-negative/30 bg-negative/10",
  neutral: "text-muted border-edge bg-white/5",
};

export default function MetricCard({
  label,
  value,
  caption,
  tone = "neutral",
  toneLabel,
}: MetricCardProps) {
  return (
    <div className="group rounded-2xl border border-edge bg-surface/80 p-7 backdrop-blur transition-colors hover:border-edge/80">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium uppercase tracking-wide text-muted">
          {label}
        </span>
        {toneLabel && (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneStyles[tone]}`}
          >
            {toneLabel}
          </span>
        )}
      </div>
      <div className="mt-6 text-5xl font-semibold tracking-tight text-white tabular-nums">
        {value}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{caption}</p>
    </div>
  );
}
