import type { ChannelAdapter } from "./types";
import type { Channel, Review, Store } from "../types";
import { buildDemoDataset } from "./demo-data";

const cache = new Map<string, { stores: Store[]; reviews: Review[] }>();

function dataset(brand: string) {
  const key = brand.toLowerCase().trim();
  let ds = cache.get(key);
  if (!ds) {
    ds = buildDemoDataset(brand);
    cache.set(key, ds);
  }
  return ds;
}

export function makeDemoAdapter(channel: Channel): ChannelAdapter {
  return {
    channel,
    enabled: true,
    async findStores(brand: string) {
      const ds = dataset(brand);
      return ds.stores.filter((s) => s.channels.includes(channel));
    },
    async fetchReviews(store: Store) {
      const ds = dataset(store.brand);
      return ds.reviews.filter((r) => r.storeId === store.id && r.channel === channel);
    },
  };
}
