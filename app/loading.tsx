// Shown while the server re-queries Postgres on a filter change.
// Skeleton, not a spinner, so the layout doesn't jump.
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14" aria-busy>
      <div className="animate-pulse">
        <div className="border-b border-edge pb-8">
          <div className="h-4 w-24 rounded bg-sunken" />
          <div className="mt-4 h-8 w-72 rounded bg-sunken" />
          <div className="mt-3 h-4 w-96 max-w-full rounded bg-sunken" />
        </div>
        <div className="mt-7 flex gap-4">
          <div className="h-9 w-48 rounded-lg bg-sunken" />
          <div className="h-9 w-64 rounded-lg bg-sunken" />
        </div>
        <div className="mt-10 h-40 rounded-2xl border border-edge bg-surface" />
        <div className="mt-6 h-32 rounded-2xl border border-edge bg-surface" />
      </div>
      <span className="sr-only">Loading metrics…</span>
    </main>
  );
}
