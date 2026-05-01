export type Channel = "google" | "deliveroo" | "uber_eats" | "trustpilot" | "yelp";

export const CHANNEL_META: Record<Channel, { label: string; color: string }> = {
  google: { label: "Google", color: "#4285F4" },
  deliveroo: { label: "Deliveroo", color: "#00CCBC" },
  uber_eats: { label: "Uber Eats", color: "#06C167" },
  trustpilot: { label: "Trustpilot", color: "#00B67A" },
  yelp: { label: "Yelp", color: "#D32323" },
};

export interface Store {
  id: string;
  name: string;
  brand: string;
  address: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  channels: Channel[];
  /** External page (e.g. Google Maps) for this store. */
  url?: string;
  /** Logo / photo URL. May be a relative API route (e.g. /api/place-photo?ref=...). */
  photoUrl?: string;
}

export interface Review {
  id: string;
  storeId: string;
  channel: Channel;
  author: string;
  rating: number; // 1-5
  text: string;
  language?: string;
  createdAt: string; // ISO
  url?: string;
}

export interface StoreReviewSummary {
  store: Store;
  total: number;
  averageRating: number;
  byChannel: Partial<Record<Channel, { count: number; average: number }>>;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: Review[];
}

export interface BrandReport {
  brand: string;
  generatedAt: string;
  range: { from: string | null; to: string | null };
  totals: {
    stores: number;
    reviews: number;
    averageRating: number;
    byChannel: Partial<Record<Channel, { count: number; average: number }>>;
  };
  stores: StoreReviewSummary[];
}
