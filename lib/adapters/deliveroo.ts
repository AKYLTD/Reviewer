import type { ChannelAdapter } from "./types";
import type { Review, Store } from "../types";

// Deliveroo does not expose a public reviews API. Two practical options:
//   1. Plug a feed URL via DELIVEROO_FEED_URL that returns reviews in our shape.
//   2. Run a scraper service and point this adapter at it.
//
// Until a feed URL is configured, the adapter is a no-op so the orchestrator
// gracefully falls back to other channels.

interface FeedReview {
  storeId: string;
  storeName?: string;
  storeAddress?: string;
  city?: string;
  country?: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  url?: string;
  language?: string;
}

interface FeedResponse {
  stores?: Array<Pick<Store, "id" | "name" | "address" | "city" | "country">>;
  reviews: FeedReview[];
}

export function makeDeliverooAdapter(feedUrl: string | undefined): ChannelAdapter {
  return {
    channel: "deliveroo",
    enabled: Boolean(feedUrl),
    async findStores(brand: string) {
      if (!feedUrl) return [];
      try {
        const res = await fetch(`${feedUrl}?brand=${encodeURIComponent(brand)}`, {
          cache: "no-store",
        });
        if (!res.ok) return [];
        const json = (await res.json()) as FeedResponse;
        const stores = (json.stores ?? []).map<Store>((s) => ({
          id: s.id.startsWith("deliveroo:") ? s.id : `deliveroo:${s.id}`,
          brand,
          name: s.name,
          address: s.address,
          city: s.city,
          country: s.country,
          channels: ["deliveroo"],
        }));
        return stores;
      } catch {
        return [];
      }
    },
    async fetchReviews(store: Store) {
      if (!feedUrl) return [];
      try {
        const res = await fetch(
          `${feedUrl}?storeId=${encodeURIComponent(store.id)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return [];
        const json = (await res.json()) as FeedResponse;
        return json.reviews.map<Review>((r, i) => ({
          id: `${store.id}:deliveroo:${i}:${r.createdAt}`,
          storeId: store.id,
          channel: "deliveroo",
          author: r.author,
          rating: r.rating,
          text: r.text,
          createdAt: r.createdAt,
          url: r.url,
          language: r.language,
        }));
      } catch {
        return [];
      }
    },
  };
}
