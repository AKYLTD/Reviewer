import type { ChannelAdapter } from "./types";
import type { Review, Store } from "../types";
import { fetchReviewsForStore, searchStores } from "../scrapers/google-maps";

// Cache the discovered stores per brand for the lifetime of the process so a
// single dashboard render doesn't re-scrape the search page for every adapter
// call. In a real deployment this should be backed by a TTL store (Redis/SQLite).
const storeCache = new Map<string, { at: number; stores: Store[] }>();
const TTL_MS = 5 * 60 * 1000;

export function makeGoogleScraperAdapter(): ChannelAdapter {
  return {
    channel: "google",
    enabled: true,
    async findStores(brand: string) {
      const key = brand.toLowerCase().trim();
      const cached = storeCache.get(key);
      if (cached && Date.now() - cached.at < TTL_MS) return cached.stores;
      const stores = await searchStores(brand);
      storeCache.set(key, { at: Date.now(), stores });
      return stores;
    },
    async fetchReviews(store: Store): Promise<Review[]> {
      if (!store.id.startsWith("gms:")) return [];
      return fetchReviewsForStore(store);
    },
  };
}
