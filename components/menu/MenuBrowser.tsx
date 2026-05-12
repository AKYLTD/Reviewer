"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MenuItemRecord, MenuData } from "./types";

const STORAGE_KEY = "ronis-cart-v1";
const MODE_KEY = "ronis-cart-mode-v1";

interface CartLine {
  itemId: string;
  name: string;
  unitPricePence: number;
  discountPence: number;
  quantity: number;
  imageUrl?: string;
  category: string;
}

interface Props {
  data: MenuData;
}

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

/**
 * The /menu surface — purpose-built for browsing AND ordering.
 *
 * Layout:
 *  - Desktop: sticky left rail with category list; main column has
 *    item cards. The rail tracks scroll position and highlights the
 *    current category via IntersectionObserver.
 *  - Mobile: horizontal-scroll category chips beneath the main hero
 *    (sticky under the site nav). No floating overlay over content.
 *
 * Add-to-cart:
 *  - Click an item → modal asks "Eat in" or "Takeaway".
 *  - The chosen mode is remembered for subsequent adds; the cart
 *    badge is shared with /shop via the same localStorage key.
 *  - Toast bottom-right confirms each add.
 */
export function MenuBrowser({ data }: Props) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartMode, setCartMode] = useState<"eat-in" | "takeaway" | null>(null);
  const [pickingFor, setPickingFor] = useState<MenuItemRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Load cart + remembered mode
  useEffect(() => {
    try {
      const c = localStorage.getItem(STORAGE_KEY);
      if (c) setCart(JSON.parse(c) as CartLine[]);
      const m = localStorage.getItem(MODE_KEY);
      if (m === "eat-in" || m === "takeaway") setCartMode(m);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);
  useEffect(() => {
    if (cartMode) try { localStorage.setItem(MODE_KEY, cartMode); } catch {}
  }, [cartMode]);

  // Scroll-spy: pick the category whose section is closest to the top.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const name = visible[0].target.getAttribute("data-category");
          if (name) setActiveCategory(name);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    categoryRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data.categories]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // Group items by category, preserving the categories list order
  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemRecord[]>();
    for (const c of data.categories) map.set(c, []);
    for (const it of data.items) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    // Drop empty categories
    return Array.from(map.entries()).filter(([, items]) => items.length > 0);
  }, [data]);

  const itemCount = cart.reduce((n, l) => n + l.quantity, 0);

  const handlePick = (mode: "eat-in" | "takeaway") => {
    if (!pickingFor) return;
    addToCart(pickingFor, mode);
    setCartMode(mode);
    const remember = `Adding ${mode === "eat-in" ? "eat-in" : "takeaway"} items to this order. Clear cart to switch.`;
    setToast(remember);
    setPickingFor(null);
  };

  const handleAddClick = (item: MenuItemRecord) => {
    // If we already have a mode locked in, just add.
    if (cartMode) {
      addToCart(item, cartMode);
      setToast(`${item.name} added — ${cartMode === "eat-in" ? "eat in" : "takeaway"}`);
      return;
    }
    setPickingFor(item);
  };

  const addToCart = (item: MenuItemRecord, mode: "eat-in" | "takeaway") => {
    setCart((c) => {
      const idx = c.findIndex((l) => l.itemId === item.id);
      if (idx === -1) {
        return [
          ...c,
          {
            itemId: item.id,
            name: item.name,
            unitPricePence: item.pricePence,
            discountPence: 0,
            quantity: 1,
            imageUrl: item.imageUrl,
            category: item.category,
          },
        ];
      }
      return c.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + 1 } : l));
    });
  };

  // Quantity helpers
  const inCart = (id: string) =>
    cart.find((l) => l.itemId === id)?.quantity ?? 0;
  const dec = (id: string) =>
    setCart((c) => c.map((l) => (l.itemId === id ? { ...l, quantity: l.quantity - 1 } : l)).filter((l) => l.quantity > 0));

  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr] xl:grid-cols-[18rem_1fr]">
      {/* ============================================ MOBILE CATEGORY BAR */}
      <nav
        aria-label="Categories"
        className="lg:hidden -mx-page-x px-page-x sticky top-[68px] z-30 bg-cream/95 backdrop-blur border-b border-hairline py-3"
      >
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
          {grouped.map(([c]) => {
            const active = activeCategory === c;
            return (
              <a
                key={c}
                href={`#${slug(c)}`}
                className={`inline-flex items-center min-h-9 rounded-pill px-4 py-1.5 font-display font-600 text-xs whitespace-nowrap transition ${
                  active ? "bg-brick text-cream shadow-chip" : "bg-ivory text-coffee"
                }`}
              >
                {c}
              </a>
            );
          })}
        </div>
      </nav>

      {/* ============================================ DESKTOP SIDE RAIL */}
      <aside className="hidden lg:block">
        <div className="sticky top-[88px] space-y-1">
          <p className="label mb-3">Browse</p>
          <ul className="space-y-1">
            {grouped.map(([c]) => {
              const active = activeCategory === c;
              return (
                <li key={c}>
                  <a
                    href={`#${slug(c)}`}
                    className={`block rounded-md px-4 py-2.5 font-display font-600 text-sm transition ${
                      active
                        ? "bg-brick text-cream shadow-chip"
                        : "text-coffee hover:bg-saffron/30"
                    }`}
                  >
                    {c}
                  </a>
                </li>
              );
            })}
          </ul>
          {cart.length > 0 && (
            <div className="mt-8 rounded-xl bg-ivory p-4 shadow-soft">
              <p className="label">In your bag</p>
              <p className="mt-2 font-display font-700 text-coffee text-2xl tabular-nums">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
              <p className="font-sans text-xs text-coffee/70 mt-1">
                Mode: {cartMode === "eat-in" ? "Eat in" : cartMode === "takeaway" ? "Takeaway" : "—"}
              </p>
              <Link
                href="/shop/checkout"
                className="btn-primary mt-3 text-xs w-full"
              >
                <span>To checkout</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================ MAIN COLUMN */}
      <div>
        {grouped.length === 0 ? (
          <p className="editorial text-muted py-12 text-center">
            No items right now. Pop back in a moment.
          </p>
        ) : (
          grouped.map(([cat, items]) => (
            <section
              key={cat}
              id={slug(cat)}
              data-category={cat}
              ref={(el) => {
                if (el) categoryRefs.current.set(cat, el);
              }}
              className="scroll-mt-[140px] mb-14"
            >
              <header className="mb-6 flex items-baseline justify-between gap-3">
                <h2 className="font-display font-700 text-coffee text-2xl md:text-3xl">
                  {cat}
                </h2>
                <span className="label-muted">
                  {items.length} item{items.length === 1 ? "" : "s"} · {items[0]?.mode === "eat-in" ? "Eat-in" : "Takeaway"}
                </span>
              </header>
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <li key={item.id}>
                    <ItemCard
                      item={item}
                      inCart={inCart(item.id)}
                      onAdd={() => handleAddClick(item)}
                      onRemove={() => dec(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* ============================================ ADD-TO-CART MODAL */}
      {pickingFor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-cocoa/65 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-cream shadow-pop overflow-hidden animate-rise">
            {pickingFor.imageUrl && (
              <div className="relative aspect-[16/9] bg-bone">
                <Image src={pickingFor.imageUrl} alt="" fill unoptimized className="object-cover" />
              </div>
            )}
            <div className="p-6">
              <p className="label">{pickingFor.category}</p>
              <h3 className="mt-2 font-display font-700 text-coffee text-2xl leading-tight">
                {pickingFor.name}
              </h3>
              <p className="mt-2 font-display font-700 text-brick text-xl tabular-nums">
                {formatGBP(pickingFor.pricePence)}
              </p>
              {pickingFor.description && (
                <p className="mt-3 font-sans text-sm text-coffee/80 leading-relaxed">
                  {pickingFor.description}
                </p>
              )}
              <p className="mt-6 font-display font-700 text-coffee">
                How are you having this?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePick("takeaway")}
                  className="btn-primary"
                >
                  <span>Takeaway</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePick("eat-in")}
                  className="btn-saffron"
                >
                  Eat in
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPickingFor(null)}
                className="mt-4 w-full font-sans text-sm font-600 uppercase tracking-widest text-coffee/60 hover:text-coffee"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ FLOATING CART BUTTON (mobile) */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 right-4 z-40 lg:hidden">
          <Link
            href="/shop/checkout"
            className="inline-flex items-center gap-3 rounded-pill bg-brick text-cream px-5 py-3 font-display font-700 shadow-pop"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-pill bg-cream/20 text-sm tabular-nums">
              {itemCount}
            </span>
            <span>View order</span>
          </Link>
        </div>
      )}

      {/* ============================================ TOAST */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:right-4 lg:translate-x-0 z-40 max-w-sm rounded-pill bg-coffee text-cream px-5 py-3 font-display font-600 text-sm shadow-pop animate-rise">
          {toast}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  inCart,
  onAdd,
  onRemove,
}: {
  item: MenuItemRecord;
  inCart: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="card card-interactive overflow-hidden flex flex-col group">
      <button
        type="button"
        onClick={onAdd}
        className="relative aspect-square bg-bone overflow-hidden text-left w-full"
        aria-label={`Add ${item.name}`}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose to-saffronSoft flex items-center justify-center">
            <span className="font-display font-700 text-coffee/30 text-5xl">
              {item.name[0]}
            </span>
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(38,21,24,0.6), transparent)" }}
        />
        {inCart > 0 && (
          <span className="absolute top-3 right-3 inline-flex h-8 min-w-8 items-center justify-center rounded-pill bg-saffron text-coffee font-display font-700 text-sm tabular-nums shadow-chip px-2">
            {inCart}
          </span>
        )}
      </button>
      <div className="p-5 flex flex-col flex-1">
        <button type="button" onClick={onAdd} className="text-left">
          <h3 className="font-display font-700 text-coffee text-lg leading-tight hover:text-brick transition-colors">
            {item.name}
          </h3>
        </button>
        {item.description && (
          <p className="mt-2 font-sans text-sm text-coffee/75 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <p className="font-display font-700 text-coffee text-lg tabular-nums">
            {new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: item.pricePence % 100 === 0 ? 0 : 2 }).format(item.pricePence / 100)}
          </p>
          {inCart === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="btn-primary text-xs px-5"
            >
              <span>Add</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-pill bg-brick text-cream shadow-chip">
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove one ${item.name}`}
                className="h-11 w-11 inline-flex items-center justify-center font-display font-700"
              >
                −
              </button>
              <span className="font-display font-700 text-sm tabular-nums min-w-[1.5rem] text-center">
                {inCart}
              </span>
              <button
                type="button"
                onClick={onAdd}
                aria-label={`Add another ${item.name}`}
                className="h-11 w-11 inline-flex items-center justify-center font-display font-700"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
