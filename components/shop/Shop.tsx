"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CartLine, ShopItem, ShopMenu } from "./types";
import { discountForItem, describeDiscount, type Promotion } from "@/lib/promotions";

interface ShopProps {
  menu: ShopMenu;
  promotions: Promotion[];
  /** Optional customer summary for the cart sidebar. */
  customer?: { name: string; points: number } | null;
}

const STORAGE_KEY = "ronis-cart-v1";

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
  }).format(pence / 100);
}

export function Shop({ menu, promotions, customer }: ShopProps) {
  const [mode, setMode] = useState<"eat-in" | "takeaway">("takeaway");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Restore cart from localStorage on first paint.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw) as CartLine[]);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch {}
  }, [cart]);

  // Filter visible items
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.items
      .filter((i) => i.mode === mode)
      .filter((i) => !activeCategory || i.category === activeCategory)
      .filter((i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
      );
  }, [menu.items, mode, activeCategory, query]);

  const visibleCategories = useMemo(() => {
    const set = new Set<string>();
    for (const i of menu.items) {
      if (i.mode === mode) set.add(i.category);
    }
    return Array.from(set).sort();
  }, [menu.items, mode]);

  // Cart math
  const cartLines = useMemo<CartLine[]>(() => {
    return cart.map((line) => {
      const item = menu.items.find((i) => i.id === line.itemId);
      if (!item) return line;
      const { pence } = discountForItem(item.id, item.category, item.pricePence, promotions);
      return {
        ...line,
        unitPricePence: item.pricePence,
        discountPence: pence,
        name: item.name,
        imageUrl: item.imageUrl,
        category: item.category,
      };
    });
  }, [cart, menu.items, promotions]);

  const subtotal = cartLines.reduce((s, l) => s + l.unitPricePence * l.quantity, 0);
  const discount = cartLines.reduce((s, l) => s + l.discountPence * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = cartLines.reduce((n, l) => n + l.quantity, 0);
  const earnedPoints = Math.floor(total / 100); // 1 pt / £

  const add = (item: ShopItem) => {
    setCart((c) => {
      const idx = c.findIndex((l) => l.itemId === item.id);
      if (idx === -1) {
        return [...c, {
          itemId: item.id,
          name: item.name,
          unitPricePence: item.pricePence,
          discountPence: 0,
          quantity: 1,
          imageUrl: item.imageUrl,
          category: item.category,
        }];
      }
      return c.map((l, i) => (i === idx ? { ...l, quantity: l.quantity + 1 } : l));
    });
  };
  const remove = (itemId: string) =>
    setCart((c) =>
      c
        .map((l) => (l.itemId === itemId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  const drop = (itemId: string) => setCart((c) => c.filter((l) => l.itemId !== itemId));
  const clear = () => setCart([]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      {/* ============================================ MAIN COLUMN */}
      <div>
        {/* Mode + search bar */}
        <div className="sticky top-[68px] z-30 -mx-page-x px-page-x py-4 bg-cream/95 backdrop-blur border-b border-hairline">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-pill bg-ivory shadow-soft p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setMode("takeaway")}
                aria-pressed={mode === "takeaway"}
                className={`inline-flex items-center justify-center min-h-11 rounded-pill px-5 py-2 font-display font-700 text-sm transition ${
                  mode === "takeaway"
                    ? "bg-brick text-cream shadow-chip"
                    : "text-coffee hover:bg-saffron/30"
                }`}
              >
                Takeaway
              </button>
              <button
                type="button"
                onClick={() => setMode("eat-in")}
                aria-pressed={mode === "eat-in"}
                className={`inline-flex items-center justify-center min-h-11 rounded-pill px-5 py-2 font-display font-700 text-sm transition ${
                  mode === "eat-in"
                    ? "bg-saffron text-coffee shadow-chip"
                    : "text-coffee hover:bg-saffron/30"
                }`}
              >
                Eat in
              </button>
            </div>
            <div className="flex-1 min-w-[14rem] max-w-md">
              <label htmlFor="shop-search" className="sr-only">Search the menu</label>
              <input
                id="shop-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bagels, salads, drinks…"
                className="w-full rounded-pill bg-ivory border border-hairline px-5 py-2.5 font-sans text-sm text-coffee placeholder:text-muted focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20"
              />
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden btn-primary text-xs px-5"
            >
              <span>Cart · {itemCount}</span>
            </button>
          </div>
          {/* Category chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <CategoryPill
              active={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            >
              All
            </CategoryPill>
            {visibleCategories.map((c) => (
              <CategoryPill
                key={c}
                active={activeCategory === c}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </CategoryPill>
            ))}
          </div>
        </div>

        {/* Item grid */}
        <div className="pt-6">
          {filtered.length === 0 ? (
            <p className="editorial text-muted py-12 text-center">
              Nothing matches that. Try a different category or clear the search.
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <li key={item.id}>
                  <ItemCard
                    item={item}
                    discount={discountForItem(item.id, item.category, item.pricePence, promotions)}
                    inCart={cart.find((l) => l.itemId === item.id)?.quantity ?? 0}
                    onAdd={() => add(item)}
                    onRemove={() => remove(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ============================================ CART SIDEBAR (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-[88px]">
          <CartPanel
            lines={cartLines}
            subtotal={subtotal}
            discount={discount}
            total={total}
            earnedPoints={earnedPoints}
            customer={customer ?? null}
            onIncrement={(id) => {
              const item = menu.items.find((i) => i.id === id);
              if (item) add(item);
            }}
            onDecrement={remove}
            onDrop={drop}
            onClear={clear}
          />
        </div>
      </aside>

      {/* ============================================ CART DRAWER (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-cocoa/60" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-[92vw] max-w-md bg-cream shadow-pop overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-hairline">
              <p className="font-display font-700 text-coffee text-xl">Your cart</p>
              <button
                type="button"
                aria-label="Close cart"
                onClick={() => setDrawerOpen(false)}
                className="text-coffee text-2xl px-2"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <CartPanel
                lines={cartLines}
                subtotal={subtotal}
                discount={discount}
                total={total}
                earnedPoints={earnedPoints}
                customer={customer ?? null}
                onIncrement={(id) => {
                  const item = menu.items.find((i) => i.id === id);
                  if (item) add(item);
                }}
                onDecrement={remove}
                onDrop={drop}
                onClear={clear}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center min-h-9 rounded-pill px-3.5 py-1.5 font-display font-600 text-xs transition ${
        active ? "bg-coffee text-saffron shadow-chip" : "bg-ivory text-coffee hover:bg-saffron/30"
      }`}
    >
      {children}
    </button>
  );
}

function ItemCard({
  item,
  discount,
  inCart,
  onAdd,
  onRemove,
}: {
  item: ShopItem;
  discount: ReturnType<typeof discountForItem>;
  inCart: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const finalPrice = Math.max(0, item.pricePence - discount.pence);
  return (
    <article className="group card card-interactive overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-bone overflow-hidden">
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
        {/* Subtle bottom gradient for legibility if the photo is busy */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: "linear-gradient(to top, rgba(38,21,24,0.55), transparent)" }}
        />
        {discount.promo && (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-pill bg-brick text-cream px-3 py-1.5 font-display font-700 text-xs tracking-widest uppercase shadow-chip">
            {describeDiscount(discount.promo.discount)}
          </span>
        )}
        {inCart > 0 && (
          <span className="absolute top-3 right-3 inline-flex h-8 min-w-8 items-center justify-center rounded-pill bg-saffron text-coffee font-display font-700 text-sm tabular-nums shadow-chip px-2">
            {inCart}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="label-muted text-[0.65rem]">{item.category}</p>
        <h3 className="mt-1 font-display font-700 text-coffee text-lg leading-tight">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-2 font-sans text-sm text-coffee/75 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <div>
            {discount.pence > 0 && (
              <p className="font-sans text-xs text-muted line-through tabular-nums">
                {formatGBP(item.pricePence)}
              </p>
            )}
            <p className="font-display font-700 text-coffee text-lg tabular-nums">
              {formatGBP(finalPrice)}
            </p>
          </div>
          {inCart === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="btn-primary text-xs px-5"
              aria-label={`Add ${item.name}`}
            >
              <span>Add</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-pill bg-brick text-cream shadow-chip">
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove one ${item.name}`}
                className="h-11 w-11 inline-flex items-center justify-center font-display font-700 text-lg"
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
                className="h-11 w-11 inline-flex items-center justify-center font-display font-700 text-lg"
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

function CartPanel({
  lines,
  subtotal,
  discount,
  total,
  earnedPoints,
  customer,
  onIncrement,
  onDecrement,
  onDrop,
  onClear,
}: {
  lines: CartLine[];
  subtotal: number;
  discount: number;
  total: number;
  earnedPoints: number;
  customer: { name: string; points: number } | null;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onDrop: (id: string) => void;
  onClear: () => void;
}) {
  if (lines.length === 0) {
    return (
      <div className="rounded-xl bg-ivory p-8 shadow-soft text-center">
        <p className="font-display font-700 text-coffee text-xl">Your cart is empty</p>
        <p className="editorial mt-3 text-muted text-[0.95rem]">
          Add a bagel or two — the cart fills here as you go.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-ivory shadow-soft overflow-hidden">
      <div className="p-5 border-b border-hairline flex items-center justify-between">
        <p className="font-display font-700 text-coffee text-lg">Your cart</p>
        <button
          type="button"
          onClick={onClear}
          className="font-sans text-xs font-600 uppercase tracking-widest text-brick hover:underline"
        >
          Clear
        </button>
      </div>
      <ul className="divide-y divide-hairline max-h-[40vh] overflow-y-auto">
        {lines.map((l) => (
          <li key={l.itemId} className="p-4 flex gap-3">
            <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-bone">
              {l.imageUrl ? (
                <Image src={l.imageUrl} alt="" fill unoptimized className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-rose to-saffronSoft" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-700 text-coffee text-sm leading-tight truncate">
                {l.name}
              </p>
              <p className="font-sans text-xs text-muted tabular-nums mt-0.5">
                {formatGBP(l.unitPricePence)}
                {l.discountPence > 0 && (
                  <span className="text-brick ml-2">
                    − {formatGBP(l.discountPence)}
                  </span>
                )}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 rounded-pill bg-cream">
                <button
                  type="button"
                  onClick={() => onDecrement(l.itemId)}
                  aria-label={`Remove one ${l.name}`}
                  className="h-8 w-8 inline-flex items-center justify-center font-display font-700"
                >
                  −
                </button>
                <span className="font-display font-700 text-sm tabular-nums min-w-[1.5rem] text-center">
                  {l.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onIncrement(l.itemId)}
                  aria-label={`Add another ${l.name}`}
                  className="h-8 w-8 inline-flex items-center justify-center font-display font-700"
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDrop(l.itemId)}
              aria-label={`Remove ${l.name} from cart`}
              className="text-cocoa/40 hover:text-brick text-lg self-start"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="p-5 space-y-2 border-t border-hairline">
        <Row label="Subtotal" value={formatGBP(subtotal)} />
        {discount > 0 && (
          <Row label="Discount" value={`− ${formatGBP(discount)}`} accent="text-brick" />
        )}
        <div className="border-t border-hairline pt-3 flex items-baseline justify-between">
          <span className="font-display font-700 text-coffee">Total</span>
          <span className="font-display font-700 text-coffee text-2xl tabular-nums">
            {formatGBP(total)}
          </span>
        </div>
        {customer ? (
          <p className="text-sm text-coffee/80 mt-2">
            Hi {customer.name.split(" ")[0]} — you&rsquo;ll earn{" "}
            <strong className="text-brick">{earnedPoints} points</strong> on this order.
            Balance: {customer.points} pts.
          </p>
        ) : (
          <p className="text-sm text-coffee/80 mt-2">
            <Link href="/signup" className="anchor font-600">Create an account</Link>{" "}
            to earn {earnedPoints} loyalty points on this order.
          </p>
        )}
      </div>
      <div className="p-5 pt-0">
        <Link href="/shop/checkout" className="btn-primary w-full">
          <span>Continue to checkout</span>
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-sans text-sm text-coffee/80">{label}</span>
      <span className={`font-display font-600 text-coffee tabular-nums ${accent ?? ""}`}>
        {value}
      </span>
    </div>
  );
}
