export interface MenuItemRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePence: number;
  imageUrl?: string;
  mode: "eat-in" | "takeaway";
}

export interface MenuData {
  source: "square" | "manual";
  items: MenuItemRecord[];
  /** Ordered list of categories that have items (across both modes). */
  categories: string[];
}
