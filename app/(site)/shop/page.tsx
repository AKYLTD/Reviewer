import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Shop } from "@/components/shop/Shop";
import type { ShopItem, ShopMenu } from "@/components/shop/types";
import { getLiveMenu, formatPrice, SquareNotConfiguredError } from "@/lib/square";
import { getMenu } from "@/lib/content";
import { activePromotions } from "@/lib/promotionsStore";
import { getCurrentCustomerSession } from "@/lib/customerAuth";
import { getCustomer } from "@/lib/customers";

export const metadata: Metadata = {
  title: "Shop",
  description: "Order bagels, breakfast, sandwiches and cakes from Roni's Bagel Bakery.",
};

export const revalidate = 60;
export const dynamic = "force-dynamic";

const SMALL_WORDS = new Set(["and", "or", "of", "the", "a", "an", "to", "in", "on", "for", "with", "&"]);
function titleCase(s: string): string {
  return s.toLowerCase().split(/\s+/).filter(Boolean).map((w, i, arr) =>
    i > 0 && i < arr.length - 1 && SMALL_WORDS.has(w) ? w : w[0].toUpperCase() + w.slice(1),
  ).join(" ");
}
function classify(rawName: string): { mode: "eat-in" | "takeaway"; cleanName: string } {
  const upper = rawName.toUpperCase();
  if (/^(EAT[\s-]?IN|DINE[\s-]?IN|IN[\s-]?STORE|RESTAURANT|TABLE)\b/.test(upper)) {
    const cleanName = rawName.replace(/^(EAT[\s-]?IN|DINE[\s-]?IN|IN[\s-]?STORE|RESTAURANT|TABLE)[\s\-:|–]+/i, "").trim();
    return { mode: "eat-in", cleanName: titleCase(cleanName || rawName) };
  }
  if (/^(TAKE[\s-]?AWAY|TAKE[\s-]?OUT|TO[\s-]?GO|GRAB[\s-]?AND[\s-]?GO)\b/.test(upper)) {
    const cleanName = rawName.replace(/^(TAKE[\s-]?AWAY|TAKE[\s-]?OUT|TO[\s-]?GO|GRAB[\s-]?AND[\s-]?GO)[\s\-:|–]+/i, "").trim();
    return { mode: "takeaway", cleanName: titleCase(cleanName || rawName) };
  }
  return { mode: "takeaway", cleanName: titleCase(rawName) };
}

async function loadMenu(): Promise<ShopMenu> {
  if (process.env.SQUARE_ACCESS_TOKEN) {
    try {
      const square = await getLiveMenu();
      const items: ShopItem[] = [];
      const catLookup = new Map(square.categories.map((c) => [c.id, c.name]));
      for (const it of square.items) {
        if (!it.isAvailable) continue;
        const rawCat = it.categoryIds[0] ? catLookup.get(it.categoryIds[0]) ?? "Other" : "Other";
        const { mode, cleanName } = classify(rawCat);
        const v = it.variations[0];
        if (!v?.price) continue;
        items.push({
          id: it.id,
          name: titleCase(it.name),
          description: it.description ?? "",
          category: cleanName,
          pricePence: v.price.amount,
          imageUrl: it.imageUrl,
          mode,
        });
      }
      const categories = Array.from(new Set(items.map((i) => i.category))).sort();
      return { source: "square", items, categories };
    } catch (err) {
      if (!(err instanceof SquareNotConfiguredError)) {
        // eslint-disable-next-line no-console
        console.warn("[shop] Square fetch failed, falling back to manual menu:", err);
      }
    }
  }
  // Manual fallback
  const manual = await getMenu();
  const catLookup = new Map(manual.categories.map((c) => [c.id, c.name]));
  const items: ShopItem[] = manual.items.map((it) => {
    const raw = catLookup.get(it.categoryId) ?? "Other";
    const { mode, cleanName } = classify(raw);
    return {
      id: it.id,
      name: titleCase(it.name),
      description: it.description,
      category: cleanName,
      pricePence: it.price,
      imageUrl: it.imageSrc || undefined,
      mode,
    };
  });
  const categories = Array.from(new Set(items.map((i) => i.category))).sort();
  return { source: "manual", items, categories };
}

export default async function ShopPage() {
  const [menu, promotions, customerSession] = await Promise.all([
    loadMenu(),
    activePromotions(),
    getCurrentCustomerSession(),
  ]);
  const customer = customerSession ? await getCustomer(customerSession.sub) : null;
  const promoBanner = promotions.find((p) => p.kind === "banner");

  return (
    <main>
      <Section size="slim" panel="cream">
        <header className="mb-6">
          <p className="label-rule">Shop</p>
          <h1 className="mt-4 font-display font-700 text-display-lg text-coffee">
            Order ahead.
          </h1>
          <p className="lede mt-3">
            Browse the counter, build your bag, pay when you collect.
            {menu.source === "square" && " Prices live from the till."}
          </p>
        </header>

        {promoBanner && (
          <div
            className={`mt-6 rounded-xl p-5 shadow-soft ${
              promoBanner.accent === "saffron"
                ? "bg-saffron text-coffee"
                : promoBanner.accent === "dusk"
                  ? "bg-dusk text-cream"
                  : "bg-brick text-cream"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display font-700 text-xl leading-tight">{promoBanner.title}</p>
                {promoBanner.description && (
                  <p className="font-sans text-sm mt-1 opacity-90">{promoBanner.description}</p>
                )}
              </div>
              {promoBanner.code && (
                <span className="font-display font-700 text-sm uppercase tracking-widest rounded-pill bg-cream/20 px-4 py-2">
                  Code: <span className="ml-1 tabular-nums">{promoBanner.code}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section size="default" panel="cream">
        <Shop
          menu={menu}
          promotions={promotions}
          customer={customer ? { name: customer.name, points: customer.points } : null}
        />
      </Section>
    </main>
  );
}
