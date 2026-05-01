"use client";

import { useMemo, useState } from "react";
import type { Store } from "@/lib/types";
import { StoreLogo } from "./StoreLogo";
import { ChevronDownIcon } from "./icons";

export function StorePicker({
  brand,
  stores,
  excluded,
  setExcluded,
  strict,
  setStrict,
}: {
  brand: string;
  stores: Store[];
  excluded: Set<string>;
  setExcluded: (next: Set<string>) => void;
  strict: boolean;
  setStrict: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const matchesBrand = (s: Store) =>
    s.name.toLowerCase().includes(brand.toLowerCase().trim());

  // When strict mode is toggled on, auto-exclude non-matching stores.
  const onToggleStrict = (v: boolean) => {
    setStrict(v);
    if (v) {
      const next = new Set(excluded);
      for (const s of stores) if (!matchesBrand(s)) next.add(s.id);
      setExcluded(next);
    }
  };

  const list = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return stores
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          (s.city ?? "").toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stores, filter]);

  const includedCount = stores.filter((s) => !excluded.has(s.id)).length;
  const allOn = excluded.size === 0;

  const toggle = (id: string) => {
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExcluded(next);
  };

  const setAll = (include: boolean) => {
    if (include) setExcluded(new Set());
    else setExcluded(new Set(stores.map((s) => s.id)));
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-white shadow-card dark:border-white/10 dark:bg-ink-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">
            Stores included{" "}
            <span className="text-ink-500">
              {includedCount} of {stores.length}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Search can return places that don't actually belong to your brand. Pick the real ones.
          </p>
        </div>
        <ChevronDownIcon
          className={`flex-none text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-black/5 p-4 dark:border-white/10 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium dark:border-white/10 dark:bg-ink-950">
              <input
                type="checkbox"
                checked={strict}
                onChange={(e) => onToggleStrict(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand-500"
              />
              Strict name match (contains "{brand}")
            </label>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, city, address..."
              className="w-44 rounded-lg border border-black/10 bg-ink-50 px-3 py-1.5 text-xs outline-none focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-ink-800 dark:focus:bg-ink-950 sm:w-64"
            />
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setAll(true)}
                disabled={allOn}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-medium hover:bg-ink-50 disabled:opacity-40 dark:border-white/10 dark:bg-ink-900 dark:hover:bg-ink-800"
              >
                Include all
              </button>
              <button
                type="button"
                onClick={() => setAll(false)}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-medium hover:bg-ink-50 dark:border-white/10 dark:bg-ink-900 dark:hover:bg-ink-800"
              >
                Exclude all
              </button>
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {list.map((s) => {
              const checked = !excluded.has(s.id);
              const dim = !matchesBrand(s);
              return (
                <li key={s.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition ${
                      checked
                        ? "border-brand-500/40 bg-brand-50/50 dark:border-brand-400/30 dark:bg-brand-900/20"
                        : "border-black/10 bg-white hover:bg-ink-50 dark:border-white/10 dark:bg-ink-900 dark:hover:bg-ink-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      className="mt-1 h-4 w-4 flex-none accent-brand-500"
                    />
                    <StoreLogo name={s.name} src={s.photoUrl} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${dim ? "text-ink-500" : ""}`}>
                        {s.name}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {[s.city, s.address].filter(Boolean).join(" · ")}
                      </p>
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-brand-600 hover:underline dark:text-brand-300"
                        >
                          Open on Google ↗
                        </a>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
