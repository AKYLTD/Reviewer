"use client";

import { useState } from "react";
import type { StoreReviewSummary, Channel } from "@/lib/types";
import { CHANNEL_META } from "@/lib/types";
import { Stars } from "./Stars";
import { ChannelBadge } from "./ChannelBadge";
import { ReviewItem } from "./ReviewItem";
import { ChevronDownIcon, StoreIcon } from "./icons";

export function StoreCard({
  summary,
  query,
  minRating,
  channelFilter,
  sort,
}: {
  summary: StoreReviewSummary;
  query: string;
  minRating: number;
  channelFilter: Set<Channel>;
  sort: "recent" | "highest" | "lowest";
}) {
  const [expanded, setExpanded] = useState(false);
  const [shown, setShown] = useState(5);

  let reviews = summary.reviews
    .filter((r) => r.rating >= minRating)
    .filter((r) => channelFilter.size === 0 || channelFilter.has(r.channel));
  if (query.trim()) {
    const q = query.toLowerCase();
    reviews = reviews.filter(
      (r) => r.text.toLowerCase().includes(q) || r.author.toLowerCase().includes(q),
    );
  }
  if (sort === "highest") reviews = [...reviews].sort((a, b) => b.rating - a.rating);
  else if (sort === "lowest") reviews = [...reviews].sort((a, b) => a.rating - b.rating);

  const visible = reviews.slice(0, shown);
  const total = reviews.length;
  const max = Math.max(...Object.values(summary.ratingDistribution), 1);

  return (
    <article className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-card transition hover:shadow-pop dark:border-white/10 dark:bg-ink-900">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
      >
        <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
          <StoreIcon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="truncate text-base font-semibold sm:text-lg">{summary.store.name}</h3>
            <span className="text-xs text-ink-500">{summary.store.address}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Stars value={summary.averageRating} />
              <span className="font-semibold tabular-nums">{summary.averageRating.toFixed(1)}</span>
              <span className="text-ink-500">· {summary.total.toLocaleString()} reviews</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(summary.byChannel) as Channel[]).map((c) => (
                <ChannelBadge key={c} channel={c} count={summary.byChannel[c]?.count} />
              ))}
            </div>
          </div>
        </div>
        <ChevronDownIcon
          className={`mt-2 flex-none text-ink-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-black/5 dark:border-white/10">
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Rating breakdown
              </h4>
              <ul className="space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((r) => {
                  const count = summary.ratingDistribution[r];
                  const pct = (count / max) * 100;
                  return (
                    <li key={r} className="flex items-center gap-2 text-xs">
                      <span className="w-4 tabular-nums text-ink-500">{r}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right tabular-nums text-ink-500">
                        {count.toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Per channel
              </h4>
              <ul className="space-y-1.5 text-sm">
                {(Object.keys(summary.byChannel) as Channel[]).map((c) => {
                  const bc = summary.byChannel[c]!;
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
              </ul>
            </div>
          </div>

          <div className="border-t border-black/5 px-4 pb-4 dark:border-white/10 sm:px-5 sm:pb-5">
            <h4 className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Reviews · {total.toLocaleString()}
            </h4>
            {visible.length === 0 ? (
              <p className="text-sm text-ink-500">No reviews match these filters.</p>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/10">
                {visible.map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))}
              </ul>
            )}
            {visible.length < total && (
              <button
                type="button"
                onClick={() => setShown((n) => n + 10)}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium hover:bg-ink-50 dark:border-white/10 dark:bg-ink-900 dark:hover:bg-ink-800"
              >
                Show more
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
