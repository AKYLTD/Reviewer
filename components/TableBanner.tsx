"use client";

import Link from "next/link";
import { useTableSession } from "./tableContext";

interface ShopLite {
  id: string;
  name: string;
  shortName: string;
}

interface Props {
  locations: ShopLite[];
}

/**
 * Shows "You are ordering for table N at Roni's X" when a table session
 * is active (URL params from the table QR or sessionStorage). Surfaces a
 * "Change table" button that clears the session.
 *
 * Renders nothing if there's no table session — safe to drop into any
 * page in the shop flow.
 */
export function TableBanner({ locations }: Props) {
  const { table, setTable } = useTableSession();
  if (!table) return null;
  const shop = locations.find((l) => l.id === table.locationId);
  return (
    <div className="rounded-xl bg-saffron text-coffee shadow-pop overflow-hidden">
      <div className="p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="inline-flex h-14 w-14 items-center justify-center rounded-pill bg-coffee text-saffron font-display font-700 text-2xl tabular-nums"
          >
            {table.table}
          </span>
          <div>
            <p className="font-sans text-[0.7rem] font-700 uppercase tracking-[0.22em] text-coffee/80">
              You&rsquo;re ordering for table
            </p>
            <p className="mt-1 font-display font-700 text-coffee text-xl md:text-2xl leading-tight">
              Table {table.table}
              <span className="font-500 text-coffee/85">
                {" · "}
                {table.zone === "outside" ? "Outside" : "Inside"}
                {shop ? ` · ${shop.name}` : ""}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTable(null)}
            className="btn-ghost text-xs px-4 py-2"
          >
            Change table
          </button>
          <Link href="/shop/checkout" className="btn-primary text-xs px-4 py-2">
            <span>View order</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
