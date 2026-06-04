// A single metric cell, designed to sit inside one divided panel (a "stat
// strip") rather than as a standalone boxed card. Avoids the identical-card
// grid + hero-metric template: the panel reads as one object, cells differ by
// content and the lead metric is emphasized by `size`, not by a box of its own.

export type Tone = "good" | "watch" | "bad" | "neutral";

const pillStyles: Record<Tone, string> = {
  good: "text-positive bg-positive/10 ring-positive/20",
  watch: "text-warn bg-warn/10 ring-warn/20",
  bad: "text-negative bg-negative/10 ring-negative/20",
  neutral: "text-muted bg-sunken ring-edge",
};

export function HealthPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${pillStyles[tone]}`}
    >
      {children}
    </span>
  );
}

interface StatProps {
  label: string;
  value: string;
  caption: string;
  size?: "lead" | "default";
  pill?: { tone: Tone; label: string };
}

export function Stat({ label, value, caption, size = "default", pill }: StatProps) {
  return (
    <div className="px-6 py-6 sm:px-7">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </span>
        {pill && <HealthPill tone={pill.tone}>{pill.label}</HealthPill>}
      </div>
      <div
        className={`nums mt-4 font-semibold tracking-tight text-ink ${
          size === "lead" ? "text-5xl" : "text-3xl"
        }`}
      >
        {value}
      </div>
      <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-muted">{caption}</p>
    </div>
  );
}
