import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Shop } from "@/components/shop/Shop";
import { TableBanner } from "@/components/TableBanner";
import type { ShopItem, ShopMenu } from "@/components/shop/types";
import { getLiveMenu, formatPrice, SquareNotConfiguredError } from "@/lib/square";
import { getMenu, getContent } from "@/lib/content";
import { activePromotions } from "@/lib/promotionsStore";
import { getCurrentCustomerSession } from "@/lib/customerAuth";
import { getCustomer } from "@/lib/customers";
import { classify, titleCase, classifyItemName } from "@/lib/menuClassify";

export const metadata: Metadata = {
  title: "Shop",
  description: "Order bagels, breakfast, sandwiches and cakes from Roni's Bagel Bakery.",
};

export const revalidate = 60;
export const dynamic = "force-dynamic";


async function loadMenu(): Promise<ShopMenu> {
  if (process.env.SQUARE_ACCESS_TOKEN) {
    try {
      const square = await getLiveMenu();
      const items: ShopItem[] = [];
      const catLookup = new Map(square.categories.map((c) => [c.id, c.name]));
      for (const it of square.items) {
        if (!it.isAvailable) continue;
        const rawCat = it.categoryIds[0] ? catLookup.get(it.categoryIds[0]) ?? "Other" : "Other";
        const { mode: catMode, cleanName } = classify(rawCat);
        const itemFlag = classifyItemName(it.name);
        const mode = itemFlag.takeaway ? "takeaway" : catMode;
        const v = it.variations[0];
        if (!v?.price) continue;
        items.push({
          id: it.id,
          name: itemFlag.cleanName,
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
    const { mode: catMode, cleanName } = classify(raw);
    const itemFlag = classifyItemName(it.name);
    const mode = itemFlag.takeaway ? "takeaway" : catMode;
    return {
      id: it.id,
      name: itemFlag.cleanName,
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
  const content = await getContent();
  const shopLites = content.locations.map((l) => ({ id: l.id, name: l.name, shortName: l.shortName }));

  return (
    <main>
      <Section size="slim" panel="cream">
        <TableBanner locations={shopLites} />
        <header className="mb-6 mt-6">
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
            className={`promo-banner mt-6 relative overflow-hidden rounded-xl p-6 md:p-8 shadow-pop ${
              promoBanner.accent === "saffron"
                ? "promo-saffron text-coffee"
                : promoBanner.accent === "dusk"
                  ? "promo-dusk text-cream"
                  : promoBanner.accent === "ember"
                    ? "promo-ember text-cream"
                    : "promo-brick text-cream"
            }`}
          >
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <p className="font-display font-700 text-xs uppercase tracking-[0.22em] opacity-80">
                  Limited offer
                </p>
                <p className="mt-2 font-display font-700 text-2xl md:text-3xl leading-tight">
                  {promoBanner.title}
                </p>
                {promoBanner.description && (
                  <p className="font-sans text-sm md:text-base mt-2 opacity-90 max-w-prose">
                    {promoBanner.description}
                  </p>
                )}
              </div>
              {promoBanner.code && (
                <span className="inline-flex flex-col items-end">
                  <span className="font-sans text-[0.7rem] uppercase tracking-widest opacity-80">
                    Use code
                  </span>
                  <span className="font-display font-700 text-2xl md:text-3xl rounded-md bg-cream/15 backdrop-blur-sm px-5 py-2 mt-1 tracking-widest">
                    {promoBanner.code}
                  </span>
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
