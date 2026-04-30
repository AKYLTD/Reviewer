import type { Review, Store, Channel } from "../types";

export interface ChannelAdapter {
  channel: Channel;
  enabled: boolean;
  /** Find candidate stores for a brand. Adapters that can't discover stores
   *  return []; the orchestrator merges results across adapters. */
  findStores(brand: string): Promise<Store[]>;
  /** Fetch reviews for a known store. */
  fetchReviews(store: Store): Promise<Review[]>;
}
