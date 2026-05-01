"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BrandReport, Channel, Review } from "@/lib/types";
import { CHANNEL_META } from "@/lib/types";
import { rangeFromPreset } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { Filters, type FilterState } from "@/components/Filters";
import { Summary } from "@/components/Summary";
import { StoreCard } from "@/components/StoreCard";
import { Skeleton } from "@/components/Skeleton";
import { ExportMenu } from "@/components/ExportMenu";
import { StorePicker } from "@/components/StorePicker";
import { InfoIcon, SparkIcon } from "@/components/icons";

interface ApiResponse {
  ok: boolean;
  mode: "live" | "demo" | "scrape";
  channels: string[];
  report: BrandReport;
}

const BRAND_SUGGESTIONS = [
  "Pizza Pilgrims",
  "Honest Burgers",
  "Dishoom",
  "Crosstown",
  "Franco Manca",
];

export default function Home() {
  const [brand, setBrand] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const [filters, setFilters] = useState<FilterState>({
    range: "90d",
    from: null,
    to: null,
    channels: new Set<Channel>(),
    minRating: 0,
    query: "",
    sort: "recent",
  });
  const [excludedStores, setExcludedStores] = useState<Set<string>>(new Set());
  const [strictMatch, setStrictMatch] = useState(false);

  // Resolve preset → from/to
  const resolvedRange = useMemo(() => {
    if (filters.range === "custom") return { from: filters.from, to: filters.to };
    return rangeFromPreset(filters.range);
  }, [filters.range, filters.from, filters.to]);

  const search = async (q: string) => {
    if (q !== brand) {
      setExcludedStores(new Set());
      setStrictMatch(false);
    }
    setBrand(q);
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    try {
      const params = new URLSearchParams({ brand: q });
      if (resolvedRange.from) params.set("from", resolvedRange.from);
      if (resolvedRange.to) params.set("to", resolvedRange.to);
      const res = await fetch(`/api/report?${params.toString()}`);
      const json = (await res.json()) as ApiResponse | { error: string };
      if (id !== reqId.current) return;
      if (!res.ok || "error" in json) {
        setError("error" in json ? json.error : `Request failed: ${res.status}`);
        setData(null);
      } else {
        setData(json);
      }
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  // Refetch when range changes for an existing brand.
  useEffect(() => {
    if (brand) search(brand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.range, filters.from, filters.to]);

  const filteredReport = useMemo(() => {
    if (!data) return null;
    const stores = data.report.stores.filter((s) => !excludedStores.has(s.store.id));
    let total = 0;
    let sum = 0;
    const byChannel: BrandReport["totals"]["byChannel"] = {};
    for (const s of stores) {
      for (const r of s.reviews) {
        total++;
        sum += r.rating;
        const bc = byChannel[r.channel] ?? { count: 0, average: 0 };
        const newCount = bc.count + 1;
        bc.average = (bc.average * bc.count + r.rating) / newCount;
        bc.count = newCount;
        byChannel[r.channel] = bc;
      }
    }
    return {
      ...data.report,
      stores,
      totals: {
        stores: stores.length,
        reviews: total,
        averageRating: total ? sum / total : 0,
        byChannel,
      },
    };
  }, [data, excludedStores]);

  const allReviews: Review[] = useMemo(() => {
    if (!filteredReport) return [];
    return filteredReport.stores.flatMap((s) => s.reviews);
  }, [filteredReport]);

  const channelOptions = useMemo<Channel[]>(() => {
    const set = new Set<Channel>();
    for (const r of allReviews) set.add(r.channel);
    return Array.from(set).sort();
  }, [allReviews]);

  const channelCounts = useMemo<Partial<Record<Channel, number>>>(() => {
    const counts: Partial<Record<Channel, number>> = {};
    for (const r of allReviews) counts[r.channel] = (counts[r.channel] ?? 0) + 1;
    return counts;
  }, [allReviews]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink-900 text-white dark:bg-white dark:text-ink-900">
            <SparkIcon size={18} />
          </span>
          Reviewer
        </a>
        <span className="text-xs text-ink-500">
          {data ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-2.5 py-1 dark:border-white/10 dark:bg-ink-900">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  data.mode === "live"
                    ? "bg-emerald-500"
                    : data.mode === "scrape"
                      ? "bg-sky-500"
                      : "bg-amber-500"
                }`}
              />
              {data.mode === "live"
                ? "Live API"
                : data.mode === "scrape"
                  ? "Scraped data"
                  : "Demo data"}
            </span>
          ) : null}
        </span>
      </header>

      {!data && !loading && !error && <Hero />}

      <div className="space-y-4">
        <SearchBar initial={brand} onSearch={search} loading={loading} />
        {!brand && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span>Try</span>
            {BRAND_SUGGESTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => search(b)}
                className="rounded-full border border-black/10 bg-white px-2.5 py-1 font-medium text-ink-700 transition hover:border-black/20 dark:border-white/10 dark:bg-ink-900 dark:text-ink-100"
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          <InfoIcon size={16} />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <Skeleton />
        </div>
      )}

      {data && filteredReport && !loading && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {filteredReport.brand}
              </h1>
              <p className="text-xs text-ink-500">
                {summarisePeriod(filteredReport.range)} ·{" "}
                {filteredReport.totals.reviews.toLocaleString()} reviews across{" "}
                {filteredReport.totals.stores.toLocaleString()} stores
              </p>
            </div>
            <ExportMenu
              brand={filteredReport.brand}
              from={resolvedRange.from}
              to={resolvedRange.to}
              excludedStoreIds={Array.from(excludedStores)}
              disabled={filteredReport.totals.reviews === 0}
            />
          </div>

          <StorePicker
            brand={filteredReport.brand}
            stores={data.report.stores.map((s) => s.store)}
            excluded={excludedStores}
            setExcluded={setExcludedStores}
            strict={strictMatch}
            setStrict={setStrictMatch}
          />

          <Summary report={filteredReport} />

          <Filters
            state={filters}
            setState={setFilters}
            channelOptions={channelOptions}
            channelCounts={channelCounts}
          />

          <div className="space-y-3">
            {filteredReport.stores.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-ink-500 shadow-card dark:border-white/10 dark:bg-ink-900">
                No stores selected. Use "Stores included" above to add some.
              </div>
            ) : (
              filteredReport.stores.map((s) => (
                <StoreCard
                  key={s.store.id}
                  summary={s}
                  query={filters.query}
                  minRating={filters.minRating}
                  channelFilter={filters.channels}
                  sort={filters.sort}
                />
              ))
            )}
          </div>

          <ChannelLegend channels={(Object.keys(filteredReport.totals.byChannel) as Channel[])} />
        </div>
      )}
    </main>
  );
}

function summarisePeriod(range: BrandReport["range"]) {
  if (!range.from && !range.to) return "All time";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  if (range.from && range.to) return `${fmt(range.from)} → ${fmt(range.to)}`;
  if (range.from) return `From ${fmt(range.from)}`;
  return `Until ${fmt(range.to!)}`;
}

function ChannelLegend({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) return null;
  return (
    <p className="pt-2 text-center text-xs text-ink-500">
      Sources:{" "}
      {channels.map((c, i) => (
        <span key={c}>
          <span
            className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ background: CHANNEL_META[c].color }}
          />
          <span className="align-middle">{CHANNEL_META[c].label}</span>
          {i < channels.length - 1 ? " · " : ""}
        </span>
      ))}
    </p>
  );
}

function Hero() {
  return (
    <section className="mb-6 rounded-3xl border border-black/5 bg-gradient-to-br from-white to-ink-50 p-6 shadow-card dark:border-white/10 dark:from-ink-900 dark:to-ink-950 sm:p-10">
      <h1 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
        Every review for your brand, in one place.
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-600 dark:text-ink-300 sm:text-base">
        Type a brand name and pull together reviews from Google, Deliveroo, Uber Eats, Trustpilot
        and more — broken down per store, filtered by timeline, ready to export as CSV or JSON.
      </p>
    </section>
  );
}
