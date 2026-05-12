export interface MenuItemRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePence: number;
  imageUrl?: string;
  mode: "eat-in" | "takeaway";
}

/**
 * After dedup: a single visible row that may carry both an eat-in and a
 * takeaway version of "the same" item. The view shows the takeaway
 * price primary and the eat-in price as a small secondary marker; when
 * the customer chooses a mode in the add-to-cart modal we route to the
 * matching underlying record.
 */
export interface MenuDisplayRecord {
  /** Lower-cased clean name used as the dedupe key. */
  key: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  takeaway?: { id: string; pricePence: number };
  eatIn?: { id: string; pricePence: number };
}

export interface MenuData {
  source: "square" | "manual";
  items: MenuItemRecord[];
  /** Ordered list of categories that have items (across both modes). */
  categories: string[];
}
