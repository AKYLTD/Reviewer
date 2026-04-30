"use client";

import { useState } from "react";
import { SearchIcon, ArrowRightIcon } from "./icons";

export function SearchBar({
  initial = "",
  onSearch,
  loading,
}: {
  initial?: string;
  onSearch: (brand: string) => void;
  loading?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (v) onSearch(v);
      }}
      className="group relative"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-card transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15 dark:border-white/10 dark:bg-ink-900">
        <span className="ml-2 text-ink-400">
          <SearchIcon size={20} />
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a brand · e.g. Pizza Pilgrims, Honest Burgers"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base outline-none placeholder:text-ink-400 sm:text-lg"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
        >
          {loading ? "Loading…" : "Aggregate"}
          {!loading && <ArrowRightIcon size={16} />}
        </button>
      </div>
    </form>
  );
}
