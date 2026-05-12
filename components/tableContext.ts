"use client";

import { useEffect, useState } from "react";

/**
 * Eat-in table state, shared across /menu, /shop, /shop/checkout via
 * sessionStorage. Set automatically when a QR-scan URL like
 * /shop?location=belsize&table=12&zone=inside lands; cleared by the
 * "Change table" button or when the session ends.
 */

const TABLE_KEY = "ronis-table-v1";

export interface TableSession {
  locationId: string;
  table: number;
  zone: "inside" | "outside";
  setAt: number;
}

function read(): TableSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TABLE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TableSession;
  } catch {
    return null;
  }
}

function write(s: TableSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (s) sessionStorage.setItem(TABLE_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(TABLE_KEY);
  } catch {}
  // Broadcast to other listeners on this tab.
  window.dispatchEvent(new CustomEvent("ronis-table-change"));
}

export function useTableSession(): {
  table: TableSession | null;
  setTable: (t: TableSession | null) => void;
} {
  const [table, _set] = useState<TableSession | null>(null);

  useEffect(() => {
    _set(read());

    // Listen for URL params and same-tab + storage events.
    const onChange = () => _set(read());

    const url = new URL(window.location.href);
    const locationId = url.searchParams.get("location");
    const tableStr = url.searchParams.get("table");
    const zone = url.searchParams.get("zone");
    if (locationId && tableStr) {
      const t = parseInt(tableStr, 10);
      if (!Number.isNaN(t) && t > 0) {
        const session: TableSession = {
          locationId,
          table: t,
          zone: zone === "outside" ? "outside" : "inside",
          setAt: Date.now(),
        };
        write(session);
      }
    }

    window.addEventListener("ronis-table-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("ronis-table-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setTable = (t: TableSession | null) => {
    write(t);
    _set(t);
  };

  return { table, setTable };
}

export const TABLE_STORAGE_KEY = TABLE_KEY;
