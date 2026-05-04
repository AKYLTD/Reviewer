import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Magnetic } from "@/components/Magnetic";
import { BagelMark } from "@/components/BagelMark";
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

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function MenuPage() {
  const menu = await loadMenu();

  return (
    <main>
      {/* HEAD ---------------------------------------------------------------- */}
      <Section size="tall" panel="cream" className="relative overflow-hidden">
        <span aria-hidden className="absolute -top-16 -right-16 opacity-25 pointer-events-none">
          <BagelMark className="h-80 w-80" spin />
        </span>
        <div className="relative grid gap-10 md:grid-cols-12 items-end">
          <div className="md:col-span-7">
            <span className="label">Menu</span>
            <h1 className="mt-5 font-display font-700 text-display-xl text-coffee leading-[0.95]">
              Today, on the counter.
            </h1>
            <p className="editorial mt-6 max-w-prose text-[1.15rem]">
              Drawn from the till. What&rsquo;s on this page is what we&rsquo;ve
              got, at the prices we&rsquo;re charging right now. When the rack
              runs out, the item disappears.
            </p>
            <p className="mt-6 inline-flex items-center gap-3 rounded-pill bg-coffee text-saffron px-4 py-2 font-display font-600 text-sm">
              <span className="h-2 w-2 rounded-pill bg-saffron animate-pulse" />
              {menu.source === "square" ? "Live from Square — refreshed every minute" : "Manual menu"}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Link href="/click-collect" className="btn-primary">
                  <span>Order ahead</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/visit" className="btn-saffron">
                  Eat in
                </Link>
              </Magnetic>
            </div>
          </div>
          {/* Category jump-list --- big rounded chips */}
          <div className="md:col-span-4 md:col-start-9">
            <span className="label-muted">Jump to</span>
            <ul className="mt-4 flex flex-wrap gap-2">
              {menu.categories.map((c) => (
                <li key={c.name}>
                  <a
                    href={`#${slug(c.name)}`}
                    className="inline-flex items-center gap-2 rounded-pill bg-ivory px-4 py-2 font-display font-600 text-coffee shadow-soft transition-colors hover:bg-saffron"
                  >
                    {c.name}
                    <span className="text-brick text-sm">{c.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* CATEGORIES ---------------------------------------------------------- */}
      {menu.categories.length === 0 ? (
        <Section panel="cream">
          <p className="editorial">
            Nothing on the rack right now. Call us on{" "}
            <a className="anchor" href="tel:+442077948133">020 7794 8133</a>.
          </p>
        </Section>
      ) : (
        menu.categories.map((cat, ci) => (
          <Section
            key={cat.name}
            panel={ci % 2 === 0 ? "cream" : "ivory"}
            id={slug(cat.name)}
          >
            <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="label">{String(ci + 1).padStart(2, "0")}</span>
                <h2 className="mt-3 font-display font-700 text-display-lg text-coffee">
                  {cat.name}
                </h2>
              </div>
              <span className="label-muted">{cat.items.length} items</span>
            </header>
            <ul className="grid gap-5 md:grid-cols-2">
              {cat.items.map((item, i) => (
                <li key={item.id}>
                  <Reveal delay={Math.min(i, 6) * 50}>
                    <article className="card p-6 h-full transition-all hover:-translate-y-1 hover:shadow-pop">
                      <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                          <h3 className="font-display font-700 text-xl text-coffee leading-tight">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="editorial mt-2 text-[1rem]">{item.description}</p>
                          )}
                        </div>
                        <span className="price-chip whitespace-nowrap shrink-0">
                          {item.price || "—"}
                        </span>
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          </Section>
        ))
      )}

      {/* CTA STRIP ----------------------------------------------------------- */}
      <Section panel="brick">
        <div className="grid gap-8 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <h2 className="font-display font-700 text-display-lg leading-[1.0]">
              Hungry? Order ahead.
            </h2>
            <p className="editorial mt-4">
              Most orders are ready twelve minutes after you tap pay.
            </p>
          </div>
          <div className="md:col-span-5 flex flex-wrap gap-3 md:justify-end">
            <Magnetic>
              <Link href="/click-collect" className="btn-saffron">
                Click &amp; collect
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/catering" className="btn-ghost border-cream text-cream hover:bg-cream hover:text-coffee">
                Catering
              </Link>
            </Magnetic>
          </div>
        </div>
      </Section>
    </main>
  );
}
