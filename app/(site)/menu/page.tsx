import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { TableBanner } from "@/components/TableBanner";
import type { MenuData, MenuItemRecord } from "@/components/menu/types";
import { getLiveMenu, formatPrice, SquareNotConfiguredError } from "@/lib/square";
import { getMenu, priceFromPence, getContent } from "@/lib/content";
import { classify, titleCase } from "@/lib/menuClassify";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Today's menu at Roni's Bagel Bakery — browse, tap to add, choose eat-in or takeaway at order.",
};

export const revalidate = 60;
export const dynamic = "force-dynamic";

async function loadMenu(): Promise<MenuData> {
  if (process.env.SQUARE_ACCESS_TOKEN) {
    try {
      const sq = await getLiveMenu();
      const items: MenuItemRecord[] = [];
      const catLookup = new Map(sq.categories.map((c) => [c.id, c.name]));
      for (const it of sq.items) {
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
      const categories = sortedUniqueCats(items);
      return { source: "square", items, categories };
    } catch (err) {
      if (!(err instanceof SquareNotConfiguredError)) {
        // eslint-disable-next-line no-console
        console.warn("[menu] Square fetch failed, falling back to manual:", err);
      }
    }
  }
  const manual = await getMenu();
  const lookup = new Map(manual.categories.map((c) => [c.id, c.name]));
  const items: MenuItemRecord[] = manual.items.map((it) => {
    const raw = lookup.get(it.categoryId) ?? "Other";
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
  return { source: "manual", items, categories: sortedUniqueCats(items) };
}

function sortedUniqueCats(items: MenuItemRecord[]): string[] {
  const set = new Set<string>();
  for (const i of items) set.add(i.category);
  return Array.from(set).sort();
}

export default async function MenuPage() {
  const [menu, content] = await Promise.all([loadMenu(), getContent()]);
  const shopLites = content.locations.map((l) => ({
    id: l.id,
    name: l.name,
    shortName: l.shortName,
  }));

  return (
    <main>
      <Section size="slim" panel="cream">
        <div className="space-y-5">
          <TableBanner locations={shopLites} />
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label-rule">Menu</p>
              <h1 className="mt-4 font-display font-700 text-display-lg text-coffee">
                Today, on the counter.
              </h1>
              <p className="lede mt-4 max-w-prose">
                Tap any item to add it. We&rsquo;ll ask whether it&rsquo;s for
                eat-in or takeaway. Prices live from the till.
              </p>
            </div>
            <Link href="/shop/checkout" className="btn-ghost">
              View order
            </Link>
          </div>
        </div>
      </Section>

      <Section panel="cream">
        <MenuBrowser data={menu} />
      </Section>
    </main>
  );
}
