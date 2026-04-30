import type { Review, Store, StoreReviewSummary, BrandReport, Channel } from "./types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function withinRange(iso: string, from: string | null, to: string | null) {
  const t = new Date(iso).getTime();
  if (from && t < new Date(from).getTime()) return false;
  if (to && t > new Date(to).getTime()) return false;
  return true;
}

export function summariseStore(store: Store, reviews: Review[]): StoreReviewSummary {
  const filtered = reviews.filter((r) => r.storeId === store.id);
  const byChannel: StoreReviewSummary["byChannel"] = {};
  const dist: StoreReviewSummary["ratingDistribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of filtered) {
    sum += r.rating;
    const key = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    dist[key]++;
    const bc = byChannel[r.channel] ?? { count: 0, average: 0 };
    const newCount = bc.count + 1;
    bc.average = (bc.average * bc.count + r.rating) / newCount;
    bc.count = newCount;
    byChannel[r.channel] = bc;
  }
  return {
    store,
    total: filtered.length,
    averageRating: filtered.length ? sum / filtered.length : 0,
    byChannel,
    ratingDistribution: dist,
    reviews: filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  };
}

export function buildReport(
  brand: string,
  stores: Store[],
  reviews: Review[],
  range: { from: string | null; to: string | null },
): BrandReport {
  const filtered = reviews.filter((r) => withinRange(r.createdAt, range.from, range.to));
  const summaries = stores
    .map((s) => summariseStore(s, filtered))
    .sort((a, b) => b.total - a.total);

  const totalsByChannel: BrandReport["totals"]["byChannel"] = {};
  let total = 0;
  let sum = 0;
  for (const r of filtered) {
    total++;
    sum += r.rating;
    const bc = totalsByChannel[r.channel] ?? { count: 0, average: 0 };
    const newCount = bc.count + 1;
    bc.average = (bc.average * bc.count + r.rating) / newCount;
    bc.count = newCount;
    totalsByChannel[r.channel] = bc;
  }

  return {
    brand,
    generatedAt: new Date().toISOString(),
    range,
    totals: {
      stores: summaries.length,
      reviews: total,
      averageRating: total ? sum / total : 0,
      byChannel: totalsByChannel,
    },
    stores: summaries,
  };
}

export function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function reportToCsv(report: BrandReport): string {
  const headers = [
    "brand",
    "store_id",
    "store_name",
    "store_address",
    "store_city",
    "store_country",
    "channel",
    "rating",
    "author",
    "created_at",
    "language",
    "url",
    "text",
  ];
  const rows: string[] = [headers.join(",")];
  for (const s of report.stores) {
    for (const r of s.reviews) {
      rows.push(
        [
          report.brand,
          s.store.id,
          s.store.name,
          s.store.address,
          s.store.city ?? "",
          s.store.country ?? "",
          r.channel,
          String(r.rating),
          r.author,
          r.createdAt,
          r.language ?? "",
          r.url ?? "",
          r.text.replace(/\s+/g, " ").trim(),
        ]
          .map((v) => csvEscape(String(v)))
          .join(","),
      );
    }
  }
  return rows.join("\n");
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.round(mo / 12);
  return `${yr}y ago`;
}

export function rangeFromPreset(preset: string): { from: string | null; to: string | null } {
  const now = new Date();
  const to = now.toISOString();
  const back = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };
  switch (preset) {
    case "7d":
      return { from: back(7), to };
    case "30d":
      return { from: back(30), to };
    case "90d":
      return { from: back(90), to };
    case "12m":
      return { from: back(365), to };
    case "all":
    default:
      return { from: null, to: null };
  }
}

export function uniqueChannels(reviews: Review[]): Channel[] {
  const set = new Set<Channel>();
  for (const r of reviews) set.add(r.channel);
  return Array.from(set);
}
