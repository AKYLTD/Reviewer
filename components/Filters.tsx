"use client";

import { ChannelBadge } from "./ChannelBadge";
import { FilterIcon } from "./icons";
import type { Channel } from "@/lib/types";

export interface FilterState {
  range: "7d" | "30d" | "90d" | "12m" | "all" | "custom";
  from: string | null;
  to: string | null;
  channels: Set<Channel>;
  minRating: number;
  query: string;
  sort: "recent" | "highest" | "lowest";
}

const RANGE_OPTIONS: { id: FilterState["range"]; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "12m", label: "12 months" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

export function Filters({
  state,
  setState,
  channelOptions,
  channelCounts,
}: {
  state: FilterState;
  setState: (next: FilterState) => void;
  channelOptions: Channel[];
  channelCounts: Partial<Record<Channel, number>>;
}) {
  const toggleChannel = (c: Channel) => {
    const next = new Set(state.channels);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setState({ ...state, channels: next });
  };

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card dark:border-white/10 dark:bg-ink-900 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <FilterIcon size={14} />
          Filters
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Search reviews..."
            value={state.query}
            onChange={(e) => setState({ ...state, query: e.target.value })}
            className="w-44 rounded-lg border border-black/10 bg-ink-50 px-3 py-1.5 text-sm outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-ink-800 dark:focus:bg-ink-950 sm:w-56"
          />
          <select
            value={state.sort}
            onChange={(e) => setState({ ...state, sort: e.target.value as FilterState["sort"] })}
            className="rounded-lg border border-black/10 bg-ink-50 px-3 py-1.5 text-sm outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-ink-800"
          >
            <option value="recent">Most recent</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-500">Period</span>
        {RANGE_OPTIONS.map((opt) => {
          const active = state.range === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setState({ ...state, range: opt.id })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-transparent bg-ink-900 text-white dark:bg-white dark:text-ink-900"
                  : "border-black/10 bg-white text-ink-700 hover:border-black/20 dark:border-white/10 dark:bg-ink-900 dark:text-ink-100"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {state.range === "custom" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-xs text-ink-500">From</label>
          <input
            type="date"
            value={state.from?.slice(0, 10) ?? ""}
            onChange={(e) =>
              setState({ ...state, from: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
            className="rounded-lg border border-black/10 bg-ink-50 px-2 py-1 text-sm dark:border-white/10 dark:bg-ink-800"
          />
          <label className="text-xs text-ink-500">To</label>
          <input
            type="date"
            value={state.to?.slice(0, 10) ?? ""}
            onChange={(e) =>
              setState({ ...state, to: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
            className="rounded-lg border border-black/10 bg-ink-50 px-2 py-1 text-sm dark:border-white/10 dark:bg-ink-800"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-500">Channels</span>
        {channelOptions.map((c) => (
          <ChannelBadge
            key={c}
            channel={c}
            count={channelCounts[c]}
            active={state.channels.has(c)}
            onClick={() => toggleChannel(c)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-500">Min rating</span>
        {[0, 2, 3, 4, 5].map((r) => {
          const active = state.minRating === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setState({ ...state, minRating: r })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-transparent bg-amber-500 text-white"
                  : "border-black/10 bg-white text-ink-700 hover:border-black/20 dark:border-white/10 dark:bg-ink-900 dark:text-ink-100"
              }`}
            >
              {r === 0 ? "Any" : `${r}+`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
