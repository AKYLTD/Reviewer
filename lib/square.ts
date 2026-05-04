/**
 * Minimal Square Catalog API client.
 *
 * We only consume the read endpoints needed to render a menu — items, item
 * variations (which carry the price), and categories. The full SDK is too
 * heavy for what's a few REST calls; raw fetch keeps the bundle lean and
 * leaves auditing trivially easy.
 *
 * All calls are server-only. The token must never reach the browser.
 */

const ENV = (process.env.SQUARE_ENVIRONMENT ?? "sandbox").toLowerCase();
const BASE =
  ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

const TOKEN = process.env.SQUARE_ACCESS_TOKEN ?? "";
const API_VERSION = "2025-01-23";

export class SquareNotConfiguredError extends Error {
  constructor() {
    super("SQUARE_ACCESS_TOKEN is not set");
    this.name = "SquareNotConfiguredError";
  }
}

export interface MoneyAmount {
  amount: number; // minor units (pence)
  currency: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  // A Square item can have multiple variations (size/option). The first
  // variation is the default; others are listed for context.
  variations: { id: string; name: string; price?: MoneyAmount }[];
  categoryIds: string[];
  /** Square's "absent_at_location" lets you ring up an item but hide it from
   *  online ordering. We exclude items absent at every location. */
  isAvailable: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface Menu {
  categories: MenuCategory[];
  items: MenuItem[];
  fetchedAt: string;
}

interface SquareCatalogObject {
  type: string;
  id: string;
  is_deleted?: boolean;
  present_at_all_locations?: boolean;
  category_data?: { name: string };
  item_data?: {
    name: string;
    description?: string;
    description_plaintext?: string;
    image_ids?: string[];
    category_id?: string; // legacy single-category field
    categories?: { id: string }[];
    variations?: { id: string; item_variation_data?: { name: string; price_money?: MoneyAmount; pricing_type?: string } }[];
  };
  image_data?: { url: string };
}

interface SquareSearchResponse {
  objects?: SquareCatalogObject[];
  cursor?: string;
  errors?: { code: string; detail?: string }[];
}

async function squareFetch<T>(path: string, init?: RequestInit & { next?: { revalidate?: number } }): Promise<T> {
  if (!TOKEN) throw new SquareNotConfiguredError();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Square-Version": API_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    // Cache aggressively at the edge; revalidate every 60s.
    next: init?.next ?? { revalidate: 60 },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Square ${res.status} ${res.statusText} — ${body.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

async function searchCatalog(types: string[]): Promise<SquareCatalogObject[]> {
  const objects: SquareCatalogObject[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = {
      object_types: types,
      include_deleted_objects: false,
      include_related_objects: true,
      limit: 200,
    };
    if (cursor) body.cursor = cursor;
    const res = await squareFetch<SquareSearchResponse>("/v2/catalog/search", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (res.errors?.length) {
      throw new Error(`Square errors: ${res.errors.map((e) => e.code).join(", ")}`);
    }
    for (const obj of res.objects ?? []) {
      if (!obj.is_deleted) objects.push(obj);
    }
    cursor = res.cursor;
  } while (cursor);
  return objects;
}

/**
 * Pull the live menu from Square. Returns categories + items with prices
 * resolved. Items with no variations or all-deleted variations are dropped.
 */
export async function getLiveMenu(): Promise<Menu> {
  const objects = await searchCatalog(["ITEM", "CATEGORY", "IMAGE"]);

  const categories: MenuCategory[] = objects
    .filter((o) => o.type === "CATEGORY" && o.category_data?.name)
    .map((o) => ({ id: o.id, name: o.category_data!.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const images = new Map<string, string>();
  for (const o of objects) {
    if (o.type === "IMAGE" && o.image_data?.url) images.set(o.id, o.image_data.url);
  }

  const items: MenuItem[] = [];
  for (const o of objects) {
    if (o.type !== "ITEM" || !o.item_data) continue;
    const data = o.item_data;
    const variations = (data.variations ?? [])
      .map((v) => {
        const vd = v.item_variation_data;
        if (!vd) return null;
        // Skip variable-price entries — they have no fixed amount to display.
        if (vd.pricing_type && vd.pricing_type !== "FIXED_PRICING") return null;
        return {
          id: v.id,
          name: vd.name ?? "Default",
          price: vd.price_money,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    if (variations.length === 0) continue;

    const catIds: string[] = [];
    if (data.category_id) catIds.push(data.category_id);
    for (const c of data.categories ?? []) if (c.id) catIds.push(c.id);

    const imageId = data.image_ids?.[0];
    items.push({
      id: o.id,
      name: data.name,
      description: data.description ?? data.description_plaintext,
      imageUrl: imageId ? images.get(imageId) : undefined,
      variations,
      categoryIds: Array.from(new Set(catIds)),
      isAvailable: o.present_at_all_locations !== false,
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories,
    items,
    fetchedAt: new Date().toISOString(),
  };
}

export function formatPrice(money?: MoneyAmount): string {
  if (!money) return "";
  const amount = money.amount / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: money.currency || "GBP",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}
