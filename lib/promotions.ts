/**
 * Promotion types + pure helpers. **No fs imports here** — this file is
 * imported by both server components and client components (the cart
 * needs the discount math). The file-backed store lives in
 * lib/promotionsStore.ts.
 */

export type PromoKind = "banner" | "item" | "category";
export type PromoDiscount =
  | { type: "percent"; value: number }
  | { type: "amount"; value: number }
  | { type: "freebie"; value: string };

export interface Promotion {
  id: string;
  kind: PromoKind;
  enabled: boolean;
  title: string;
  description: string;
  discount?: PromoDiscount;
  itemIds?: string[];
  categoryNames?: string[];
  code?: string;
  accent: "saffron" | "brick" | "ember" | "dusk";
  imageSrc?: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function discountForItem(
  itemId: string,
  category: string,
  pricePence: number,
  promotions: Promotion[],
): { pence: number; promo: Promotion | null } {
  let pence = 0;
  let promo: Promotion | null = null;
  for (const p of promotions) {
    if (p.kind === "item" && p.itemIds?.includes(itemId)) {
      const v = applyDiscount(p.discount, pricePence);
      if (v > pence) {
        pence = v;
        promo = p;
      }
    } else if (p.kind === "category" && p.categoryNames?.includes(category)) {
      const v = applyDiscount(p.discount, pricePence);
      if (v > pence) {
        pence = v;
        promo = p;
      }
    }
  }
  return { pence, promo };
}

function applyDiscount(d: PromoDiscount | undefined, pricePence: number): number {
  if (!d) return 0;
  if (d.type === "percent") return Math.round((pricePence * d.value) / 100);
  if (d.type === "amount") return Math.min(d.value, pricePence);
  return 0;
}

export function describeDiscount(d?: PromoDiscount): string {
  if (!d) return "";
  if (d.type === "percent") return `${d.value}% off`;
  if (d.type === "amount") return `£${(d.value / 100).toFixed(2)} off`;
  return `Free: ${d.value}`;
}
