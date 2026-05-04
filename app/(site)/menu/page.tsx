import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Magnetic } from "@/components/Magnetic";
import { BagelMark } from "@/components/BagelMark";
import {
  getLiveMenu,
  formatPrice,
  type Menu,
  SquareNotConfiguredError,
} from "@/lib/square";
import { getMenu, priceFromPence } from "@/lib/content";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Today's menu at Roni's Belsize Village — eat-in and takeaway, drawn live from the till.",
};

export const revalidate = 60;

type ServiceMode = "eat-in" | "takeaway";

interface DisplayItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  imageUrl?: string;
}

interface DisplayCategory {
  name: string;
  mode: ServiceMode;
  items: DisplayItem[];
}

interface DisplayMenu {
  source: "square" | "manual";
  fetchedAt?: string;
  categoriesByMode: Record<ServiceMode, DisplayCategory[]>;
}

/**
 * Title-case a category name pulled from Square. Square category names
 * arrive in inconsistent casing across shops — some all-caps, some
 * sentence-case. We pick a single house style: Title Case, with small
 * connecting words ("of", "and", etc) kept lowercase mid-string.
 */
const SMALL_WORDS = new Set([
  "and", "or", "of", "the", "a", "an", "to", "in", "on", "for", "with", "&",
]);
function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i, arr) => {
      if (i > 0 && i < arr.length - 1 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Infer service mode from a Square category name. We look for explicit
 * prefixes/keywords first and strip them from the displayed name. If no
 * keyword is found we default to takeaway, which matches our regulars'
 * behaviour and is also what the brief calls the "rest" of the items.
 */
function classify(rawName: string): { mode: ServiceMode; cleanName: string } {
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

async function loadMenu(): Promise<DisplayMenu> {
  const empty: Record<ServiceMode, DisplayCategory[]> = { "eat-in": [], "takeaway": [] };

  if (process.env.SQUARE_ACCESS_TOKEN) {
    try {
      const square: Menu = await getLiveMenu();
      const groups = new Map<string, { mode: ServiceMode; cleanName: string; items: DisplayItem[] }>();
      const catLookup = new Map(square.categories.map((c) => [c.id, c.name]));

      for (const item of square.items) {
        if (!item.isAvailable) continue;
        const rawCat = item.categoryIds[0]
          ? catLookup.get(item.categoryIds[0]) ?? "Other"
          : "Other";
        const { mode, cleanName } = classify(rawCat);
        const key = `${mode}::${cleanName}`;
        if (!groups.has(key)) groups.set(key, { mode, cleanName, items: [] });
        const v = item.variations[0];
        groups.get(key)!.items.push({
          id: item.id,
          name: titleCase(item.name),
          description: item.description ?? "",
          category: cleanName,
          price: v?.price ? formatPrice(v.price) : "",
          imageUrl: item.imageUrl,
        });
      }

      const byMode: Record<ServiceMode, DisplayCategory[]> = { "eat-in": [], "takeaway": [] };
      for (const [, g] of groups) {
        byMode[g.mode].push({
          name: g.cleanName,
          mode: g.mode,
          items: g.items.sort((a, b) => a.name.localeCompare(b.name)),
        });
      }
      byMode["eat-in"].sort((a, b) => a.name.localeCompare(b.name));
      byMode["takeaway"].sort((a, b) => a.name.localeCompare(b.name));

      return {
        source: "square",
        fetchedAt: square.fetchedAt,
        categoriesByMode: byMode,
      };
    } catch (err) {
      if (!(err instanceof SquareNotConfiguredError)) {
        // eslint-disable-next-line no-console
        console.warn("[menu] Square fetch failed, falling back to manual menu:", err);
      }
    }
  }

  // Manual menu fallback. We treat manual menu as takeaway by default.
  const manual = await getMenu();
  const catLookup = new Map(manual.categories.map((c) => [c.id, c.name]));
  const groups = new Map<string, { mode: ServiceMode; cleanName: string; items: DisplayItem[] }>();
  for (const item of manual.items) {
    const rawCat = catLookup.get(item.categoryId) ?? "Other";
    const { mode, cleanName } = classify(rawCat);
    const key = `${mode}::${cleanName}`;
    if (!groups.has(key)) groups.set(key, { mode, cleanName, items: [] });
    groups.get(key)!.items.push({
      id: item.id,
      name: titleCase(item.name),
      description: item.description,
      category: cleanName,
      price: priceFromPence(item.price),
      imageUrl: item.imageSrc || undefined,
    });
  }
  const byMode: Record<ServiceMode, DisplayCategory[]> = { "eat-in": [], "takeaway": [] };
  for (const [, g] of groups) {
    byMode[g.mode].push({ name: g.cleanName, mode: g.mode, items: g.items });
  }
  return { source: "manual", categoriesByMode: byMode };
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const menu = await loadMenu();
  const eatInCount = menu.categoriesByMode["eat-in"].reduce((n, c) => n + c.items.length, 0);
  const takeawayCount = menu.categoriesByMode["takeaway"].reduce((n, c) => n + c.items.length, 0);

  // Default mode: whichever has items; takeaway if both have items.
  const requested =
    searchParams.mode === "eat-in" || searchParams.mode === "takeaway"
      ? (searchParams.mode as ServiceMode)
      : null;
  const mode: ServiceMode =
    requested ?? (takeawayCount > 0 ? "takeaway" : "eat-in");

  const visibleCategories = menu.categoriesByMode[mode];
  const isTakeaway = mode === "takeaway";

  return (
    <main>
      {/* HEAD ----------------------------------------------------------- */}
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
              got, at the prices we&rsquo;re charging right now. Different
              prices apply for eat-in &mdash; switch tabs below.
            </p>
            <p className="mt-6 inline-flex items-center gap-3 rounded-pill bg-coffee text-saffron px-4 py-2 font-display font-600 text-sm">
              <span className="h-2 w-2 rounded-pill bg-saffron animate-pulse" />
              {menu.source === "square"
                ? "Live from Square — refreshed every minute"
                : "Manual menu"}
            </p>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <span className="label-muted">Quick</span>
            <div className="mt-3 flex flex-wrap gap-2">
              <Magnetic>
                <Link href="/click-collect" className="btn-primary text-[0.8rem] px-5 py-2.5">
                  <span>Order ahead</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/order-at-table" className="btn-saffron text-[0.8rem] px-5 py-2.5">
                  Order at table
                </Link>
              </Magnetic>
            </div>
          </div>
        </div>
      </Section>

      {/* MODE TABS — sticky toggle ------------------------------------- */}
      <div className="sticky top-[72px] z-30 bg-cream/95 backdrop-blur border-b border-hairline">
        <div className="mx-auto max-w-[1320px] px-page-x py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-pill bg-ivory shadow-soft p-1.5 gap-1">
            <Link
              href="/menu?mode=takeaway"
              scroll={false}
              className={`inline-flex items-center gap-2 rounded-pill px-5 py-2 font-display font-700 text-sm transition ${
                mode === "takeaway"
                  ? "bg-brick text-cream shadow-chip"
                  : "text-coffee hover:bg-saffron/30"
              }`}
            >
              Takeaway
              <span className={`text-xs ${mode === "takeaway" ? "text-saffron" : "text-coffee/60"}`}>
                {takeawayCount}
              </span>
            </Link>
            <Link
              href="/menu?mode=eat-in"
              scroll={false}
              className={`inline-flex items-center gap-2 rounded-pill px-5 py-2 font-display font-700 text-sm transition ${
                mode === "eat-in"
                  ? "bg-saffron text-coffee shadow-chip"
                  : "text-coffee hover:bg-saffron/30"
              }`}
            >
              Eat in
              <span className={`text-xs ${mode === "eat-in" ? "text-coffee/70" : "text-coffee/60"}`}>
                {eatInCount}
              </span>
            </Link>
          </div>

          {/* Category jump-pills (visible categories only) */}
          {visibleCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleCategories.map((c) => (
                <a
                  key={c.name}
                  href={`#${slug(c.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-pill bg-ivory hover:bg-saffron px-3.5 py-1.5 font-display font-600 text-xs text-coffee transition-colors"
                >
                  {c.name}
                  <span className="text-coffee/50">{c.items.length}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        <div
          className={`h-1 w-full ${isTakeaway ? "bg-brick" : "bg-saffron"} transition-colors`}
        />
      </div>

      {/* MODE INTRO STRIP --------------------------------------------- */}
      <section
        className={`${
          isTakeaway ? "bg-brick text-cream" : "bg-saffron text-coffee"
        } py-7`}
      >
        <div className="mx-auto max-w-[1320px] px-page-x flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display font-700 text-2xl">
              {isTakeaway ? "Takeaway menu" : "Eat-in menu"}
            </p>
            <p
              className={`font-sans text-sm mt-1 ${
                isTakeaway ? "text-cream/85" : "text-coffee/80"
              }`}
            >
              {isTakeaway
                ? "Walk in or order ahead. Boxed and ready in twelve minutes."
                : "For tables in the dining room. Service charge added at the till."}
            </p>
          </div>
          <Magnetic>
            <Link
              href={isTakeaway ? "/click-collect" : "/order-at-table"}
              className={
                isTakeaway
                  ? "inline-flex items-center justify-center rounded-pill bg-saffron text-coffee px-6 py-3 font-display font-700 text-sm shadow-chip hover:shadow-pop transition-shadow"
                  : "inline-flex items-center justify-center rounded-pill bg-coffee text-cream px-6 py-3 font-display font-700 text-sm shadow-chip hover:shadow-pop transition-shadow"
              }
            >
              {isTakeaway ? "Order ahead" : "Open dine-in flow"}
            </Link>
          </Magnetic>
        </div>
      </section>

      {/* CATEGORIES --------------------------------------------------- */}
      {visibleCategories.length === 0 ? (
        <Section panel="cream">
          <div className="mx-auto max-w-prose text-center">
            <p className="editorial">
              Nothing on the {isTakeaway ? "takeaway" : "eat-in"} list right
              now. Try the other tab, or call us on{" "}
              <a className="anchor font-600" href="tel:+442077948133">
                020 7794 8133
              </a>
              .
            </p>
          </div>
        </Section>
      ) : (
        visibleCategories.map((cat, ci) => (
          <Section
            key={cat.name}
            panel={ci % 2 === 0 ? "cream" : "ivory"}
            id={slug(cat.name)}
          >
            <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <span
                  className={`label ${isTakeaway ? "text-brick" : "text-coffee"}`}
                >
                  {String(ci + 1).padStart(2, "0")} ·{" "}
                  {isTakeaway ? "Takeaway" : "Eat in"}
                </span>
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
                            <p className="editorial mt-2 text-[1rem]">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`whitespace-nowrap shrink-0 rounded-pill px-3.5 py-1.5 font-display font-700 text-sm shadow-chip ${
                            isTakeaway
                              ? "bg-brick text-cream"
                              : "bg-saffron text-coffee"
                          }`}
                        >
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

      {/* CTA STRIP ----------------------------------------------------- */}
      <Section panel={isTakeaway ? "brick" : "coffee"}>
        <div className="grid gap-8 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <h2 className="font-display font-700 text-display-lg leading-[1.0]">
              {isTakeaway ? "Hungry? Order ahead." : "Ready to order at your table?"}
            </h2>
            <p className="editorial mt-4">
              {isTakeaway
                ? "Most orders are ready twelve minutes after you tap pay."
                : "Scan the QR on your table and tap your way through this menu."}
            </p>
          </div>
          <div className="md:col-span-5 flex flex-wrap gap-3 md:justify-end">
            <Magnetic>
              <Link
                href={isTakeaway ? "/click-collect" : "/order-at-table"}
                className="btn-saffron"
              >
                {isTakeaway ? "Click & collect" : "Order at table"}
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/catering"
                className="btn-ghost border-cream text-cream hover:bg-cream hover:text-coffee"
              >
                Catering
              </Link>
            </Magnetic>
          </div>
        </div>
      </Section>
    </main>
  );
}
