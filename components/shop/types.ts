/** Shared types for the storefront. */

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePence: number;
  imageUrl?: string;
  /** Service mode this item belongs to (split from category prefix). */
  mode: "eat-in" | "takeaway";
}

export interface CartLine {
  itemId: string;
  name: string;
  unitPricePence: number;
  /** Per-line discount applied (pence) — populated by the active promo. */
  discountPence: number;
  quantity: number;
  imageUrl?: string;
  category: string;
}

export interface ShopMenu {
  source: "square" | "manual";
  items: ShopItem[];
  categories: string[];
}
