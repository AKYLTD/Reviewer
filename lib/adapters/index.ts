import type { ChannelAdapter } from "./types";
import type { Review, Store } from "../types";
import { makeGoogleAdapter } from "./google";
import { makeDeliverooAdapter } from "./deliveroo";
import { makeDemoAdapter } from "./demo";

export type DataMode = "live" | "demo" | "scrape";

function liveAdapters(): ChannelAdapter[] {
  return [
    makeGoogleAdapter(process.env.GOOGLE_PLACES_API_KEY),
    makeDeliverooAdapter(process.env.DELIVEROO_FEED_URL),
  ].filter((a) => a.enabled);
}

function demoAdapters(): ChannelAdapter[] {
  return [
    makeDemoAdapter("google"),
    makeDemoAdapter("deliveroo"),
    makeDemoAdapter("uber_eats"),
    makeDemoAdapter("trustpilot"),
  ];
}

async function scrapeAdapters(): Promise<ChannelAdapter[]> {
  // Lazy-load the scraper so a missing/uninstalled Playwright doesn't break
  // demo or live mode. Falls back gracefully if the import fails.
  try {
    const mod = await import("./google-scrape");
    return [mod.makeGoogleScraperAdapter()];
  } catch (err) {
    console.warn(
      "[reviewer] scrape mode requested but Playwright is unavailable. Run `npm install` and `npx playwright install chromium`. Falling back to demo data.",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

async function activeAdapters(): Promise<{ adapters: ChannelAdapter[]; mode: DataMode }> {
  const mode = (process.env.DATA_MODE ?? "demo").toLowerCase() as DataMode;
  if (mode === "live") {
    const live = liveAdapters();
    if (live.length > 0) return { adapters: live, mode: "live" };
  }
  if (mode === "scrape") {
    const scrape = await scrapeAdapters();
    if (scrape.length > 0) return { adapters: scrape, mode: "scrape" };
  }
  return { adapters: demoAdapters(), mode: "demo" };
}

function mergeStores(lists: Store[][]): Store[] {
  // Deduplicate by case-insensitive name + first 6 chars of address.
  const map = new Map<string, Store>();
  for (const list of lists) {
    for (const s of list) {
      const key = `${s.name.toLowerCase()}|${(s.address ?? "").toLowerCase().slice(0, 8)}`;
      const existing = map.get(key);
      if (existing) {
        const channels = Array.from(new Set([...existing.channels, ...s.channels]));
        map.set(key, { ...existing, channels });
      } else {
        map.set(key, s);
      }
    }
  }
  return Array.from(map.values());
}

export async function gatherForBrand(brand: string): Promise<{
  stores: Store[];
  reviews: Review[];
  mode: DataMode;
  channels: string[];
}> {
  const { adapters, mode } = await activeAdapters();
  const storeLists = await Promise.all(adapters.map((a) => a.findStores(brand).catch(() => [])));
  const stores = mergeStores(storeLists);

  const reviews = (
    await Promise.all(
      stores.flatMap((store) =>
        adapters
          .filter((a) => store.channels.includes(a.channel))
          .map((a) => a.fetchReviews(store).catch(() => [])),
      ),
    )
  ).flat();

  return {
    stores,
    reviews,
    mode,
    channels: adapters.map((a) => a.channel),
  };
}
