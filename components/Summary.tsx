import type { BrandReport, Channel } from "@/lib/types";
import { CHANNEL_META } from "@/lib/types";
import { Stars } from "./Stars";

export function Summary({ report }: { report: BrandReport }) {
  const dist = aggregateDistribution(report);
  const max = Math.max(...Object.values(dist), 1);
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Stores" value={report.totals.stores.toLocaleString()} />
      <Stat label="Reviews" value={report.totals.reviews.toLocaleString()} />
      <Stat
        label="Avg rating"
        value={
          <span className="inline-flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {report.totals.averageRating.toFixed(2)}
            </span>
            <Stars value={report.totals.averageRating} />
          </span>
        }
      />
      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card dark:border-white/10 dark:bg-ink-900">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">By channel</p>
        <ul className="mt-2 space-y-1 text-sm">
          {(Object.keys(report.totals.byChannel) as Channel[]).map((c) => {
            const bc = report.totals.byChannel[c]!;
            return (
              <li key={c} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CHANNEL_META[c].color }}
                  />
                  {CHANNEL_META[c].label}
                </span>
                <span className="tabular-nums text-ink-500">
                  <span className="font-medium text-ink-900 dark:text-ink-50">
                    {bc.average.toFixed(1)}
                  </span>{" "}
                  · {bc.count.toLocaleString()}
                </span>
              </li>
            );
          })}
          {Object.keys(report.totals.byChannel).length === 0 && (
            <li className="text-ink-500">No reviews in this period.</li>
          )}
        </ul>
      </div>
      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card dark:border-white/10 dark:bg-ink-900 sm:col-span-2 lg:col-span-4">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Rating distribution</p>
        <ul className="mt-3 space-y-2">
          {([5, 4, 3, 2, 1] as const).map((r) => {
            const count = dist[r];
            const pct = (count / max) * 100;
            return (
              <li key={r} className="flex items-center gap-3 text-sm">
                <span className="w-6 tabular-nums text-ink-500">{r}★</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-right tabular-nums text-ink-500">
                  {count.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card dark:border-white/10 dark:bg-ink-900">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function aggregateDistribution(report: BrandReport) {
  const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const s of report.stores) {
    for (const k of [1, 2, 3, 4, 5] as const) dist[k] += s.ratingDistribution[k];
  }
  return dist;
}
