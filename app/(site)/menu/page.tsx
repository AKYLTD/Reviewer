import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Magnetic } from "@/components/Magnetic";
import { getLiveMenu, formatPrice, type Menu, SquareNotConfiguredError } from "@/lib/square";
import { getMenu, priceFromPence } from "@/lib/content";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Today's menu at Roni's Belsize Village — eat-in and takeaway, drawn live from the till.",
};

export const revalidate = 60;

interface DisplayItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  imageUrl?: string;
}

interface DisplayMenu {
  source: "square" | "manual";
  fetchedAt?: string;
  categories: { name: string; items: DisplayItem[] }[];
}

async function loadMenu(): Promise<DisplayMenu> {
  if (process.env.SQUARE_ACCESS_TOKEN) {
    try {
      const square: Menu = await getLiveMenu();
      const catName = (id: string | undefined) =>
        square.categories.find((c) => c.id === id)?.name ?? "Other";
      const groups = new Map<string, DisplayItem[]>();
      for (const item of square.items) {
        if (!item.isAvailable) continue;
        const catId = item.categoryIds[0];
        const category = catName(catId);
        const v = item.variations[0];
        const arr = groups.get(category) ?? [];
        arr.push({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
          category,
          price: v?.price ? formatPrice(v.price) : "",
          imageUrl: item.imageUrl,
        });
        groups.set(category, arr);
      }
      return {
        source: "square",
        fetchedAt: square.fetchedAt,
        categories: Array.from(groups.entries())
          .map(([name, items]) => ({ name, items: items.sort((a, b) => a.name.localeCompare(b.name)) }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    } catch (err) {
      if (!(err instanceof SquareNotConfiguredError)) {
        // eslint-disable-next-line no-console
        console.warn("[menu] Square fetch failed, falling back to manual menu:", err);
      }
    }
  }

  const manual = await getMenu();
  const catName = (id: string) => manual.categories.find((c) => c.id === id)?.name ?? "Other";
  const groups = new Map<string, DisplayItem[]>();
  for (const item of manual.items) {
    const category = catName(item.categoryId);
    const arr = groups.get(category) ?? [];
    arr.push({
      id: item.id,
      name: item.name,
      description: item.description,
      category,
      price: priceFromPence(item.price),
      imageUrl: item.imageSrc || undefined,
    });
    groups.set(category, arr);
  }
  return {
    source: "manual",
    categories: manual.categories
      .map((c) => ({ name: c.name, items: groups.get(c.name) ?? [] }))
      .filter((c) => c.items.length > 0),
  };
}

export default async function MenuPage() {
  const menu = await loadMenu();

  return (
    <main>
      <Section size="tall">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label">Menu</p>
            <h1 className="mt-5 font-display text-display-lg leading-[0.96] text-ink">
              Today, on the counter.
            </h1>
            <p className="editorial mt-8 max-w-prose">
              Drawn from the till. What&rsquo;s on this page is what we&rsquo;ve
              got, at the prices we&rsquo;re charging today. When the rack runs
              out, the item disappears.
            </p>
            <p className="mt-6">
              <span className="label">Source</span>{" "}
              <span className="font-editorial italic text-muted ml-2">
                {menu.source === "square"
                  ? "Live from Square · refreshed every minute"
                  : "Manual menu · edit at /admin/menu"}
              </span>
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Magnetic>
                <Link href="/click-collect" className="btn-ink">
                  <span>Order ahead</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/visit" className="btn-ghost">
                  Eat in
                </Link>
              </Magnetic>
            </div>
          </div>
          <div className="md:col-span-4 md:col-start-9 md:sticky md:top-24 md:self-start">
            <p className="label">Categories</p>
            <ul className="mt-4 space-y-2">
              {menu.categories.map((c) => (
                <li key={c.name}>
                  <a
                    href={`#${slug(c.name)}`}
                    className="anchor font-editorial text-[1.05rem] text-ink"
                  >
                    {c.name}{" "}
                    <span className="text-muted text-[0.85rem]">({c.items.length})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {menu.categories.length === 0 ? (
        <Section>
          <p className="editorial">
            No items available right now. Please call the shop on{" "}
            <a className="anchor" href="tel:+442077948133">020 7794 8133</a>.
          </p>
        </Section>
      ) : (
        menu.categories.map((cat) => (
          <Section key={cat.name} size="default">
            <article id={slug(cat.name)} className="scroll-mt-24">
              <header className="mb-10 flex items-end justify-between gap-6 border-b border-hairline pb-4">
                <h2 className="font-display text-display-md text-ink">{cat.name}</h2>
                <span className="label text-muted">{cat.items.length} items</span>
              </header>
              <ul className="grid gap-px md:grid-cols-2">
                {cat.items.map((item, i) => (
                  <li key={item.id} className="border-b border-hairline">
                    <Reveal delay={Math.min(i, 6) * 60}>
                      <article className="flex h-full items-baseline justify-between gap-6 px-1 py-7 md:px-6">
                        <div className="min-w-0">
                          <h3 className="font-editorial text-[1.25rem] text-ink leading-tight">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="editorial mt-2 text-[1rem] text-muted">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="price-chip whitespace-nowrap pt-1">
                          {item.price || "—"}
                        </span>
                      </article>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </article>
          </Section>
        ))
      )}
    </main>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
