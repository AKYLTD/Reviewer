import type { ChannelAdapter } from "./types";
import type { Review, Store } from "../types";

// Google Places API integration.
// - Text Search to discover candidate stores for a brand.
// - Place Details (with `reviews` field) to fetch reviews.
//
// Notes:
// - The Places Details endpoint only returns up to 5 reviews per place.
//   For production-grade aggregation you'd persist them and merge new ones over time.
// - We tag returned reviews with the store id, so the orchestrator can reconcile.

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  url?: string;
  photos?: Array<{ photo_reference: string; width?: number; height?: number }>;
}

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number; // unix seconds
  language?: string;
  author_url?: string;
}

const BASE = "https://maps.googleapis.com/maps/api/place";

async function textSearch(query: string, key: string): Promise<GooglePlace[]> {
  const url = `${BASE}/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Google text search failed: ${res.status}`);
  const json = (await res.json()) as { results?: GooglePlace[]; status?: string };
  if (json.status && json.status !== "OK" && json.status !== "ZERO_RESULTS") {
    throw new Error(`Google text search status: ${json.status}`);
  }
  return json.results ?? [];
}

async function placeDetails(
  placeId: string,
  key: string,
): Promise<{ place: GooglePlace; reviews: GoogleReview[] } | null> {
  const fields = "place_id,name,formatted_address,geometry,reviews,url,photos";
  const url = `${BASE}/details/json?place_id=${placeId}&fields=${fields}&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    result?: GooglePlace & { reviews?: GoogleReview[] };
    status?: string;
  };
  if (!json.result) return null;
  const { reviews = [], ...place } = json.result;
  return { place, reviews };
}

export function makeGoogleAdapter(apiKey: string | undefined): ChannelAdapter {
  return {
    channel: "google",
    enabled: Boolean(apiKey),
    async findStores(brand: string) {
      if (!apiKey) return [];
      const places = await textSearch(brand, apiKey);
      return places.map<Store>((p) => {
        const ref = p.photos?.[0]?.photo_reference;
        return {
          id: `google:${p.place_id}`,
          brand,
          name: p.name,
          address: p.formatted_address ?? "",
          lat: p.geometry?.location?.lat,
          lng: p.geometry?.location?.lng,
          channels: ["google"],
          url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
          photoUrl: ref ? `/api/place-photo?ref=${encodeURIComponent(ref)}&w=160` : undefined,
        };
      });
    },
    async fetchReviews(store: Store) {
      if (!apiKey) return [];
      const placeId = store.id.startsWith("google:") ? store.id.slice("google:".length) : null;
      if (!placeId) return [];
      const detail = await placeDetails(placeId, apiKey);
      if (!detail) return [];
      return detail.reviews.map<Review>((r, i) => ({
        id: `${store.id}:${r.time}:${i}`,
        storeId: store.id,
        channel: "google",
        author: r.author_name,
        rating: r.rating,
        text: r.text ?? "",
        language: r.language,
        createdAt: new Date(r.time * 1000).toISOString(),
        url: r.author_url,
      }));
    },
  };
}
