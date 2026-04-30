"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, DownloadIcon } from "./icons";

export function ExportMenu({
  brand,
  from,
  to,
  disabled,
}: {
  brand: string;
  from: string | null;
  to: string | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const buildHref = (format: "csv" | "json") => {
    const params = new URLSearchParams({ brand, format });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/export?${params.toString()}`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-ink-900 dark:hover:bg-ink-800"
      >
        <DownloadIcon size={16} />
        Export
        <ChevronDownIcon size={14} className="opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-black/10 bg-white shadow-pop dark:border-white/10 dark:bg-ink-900">
          <a
            href={buildHref("csv")}
            className="block px-3 py-2 text-sm hover:bg-ink-50 dark:hover:bg-ink-800"
          >
            CSV (.csv)
          </a>
          <a
            href={buildHref("json")}
            className="block px-3 py-2 text-sm hover:bg-ink-50 dark:hover:bg-ink-800"
          >
            JSON (.json)
          </a>
        </div>
      )}
    </div>
  );
}
