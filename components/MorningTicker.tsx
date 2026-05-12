"use client";

import { useEffect, useState } from "react";

/**
 * "Boiled this morning · 1,284" — a tiny piece of theatre on the homepage
 * that ticks up at a believable rate (≈400 bagels/hr during the morning
 * bake). It restarts each day from a deterministic seed so the number is
 * stable per session and grows convincingly.
 *
 * Not real production data; the rate is a rough mid-point of what the bakery
 * actually puts out. If we ever wire this to Square Sales API, this is the
 * component to swap.
 */
export function MorningTicker() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const open = new Date(now);
      open.setHours(5, 30, 0, 0); // first kettle goes on at 5:30
      const minutesSinceOpen = Math.max(0, (now.getTime() - open.getTime()) / 60000);
      // ≈400/hr for the first three hours, ≈90/hr afterwards.
      const peak = Math.min(minutesSinceOpen, 180);
      const tail = Math.max(0, minutesSinceOpen - 180);
      const baked = Math.floor((peak * 400) / 60 + (tail * 90) / 60);
      return baked;
    };
    setCount(compute());
    const id = setInterval(() => setCount(compute()), 9_000);
    return () => clearInterval(id);
  }, []);

  if (count === null) {
    return (
      <span className="font-editorial italic text-[1rem] text-muted">
        Boiling…
      </span>
    );
  }

  return (
    <span className="inline-flex items-baseline gap-3 animate-ticker-rise">
      <span className="label text-muted">Boiled this morning</span>
      <span className="font-display text-[clamp(1.2rem,1.6vw,1.6rem)] text-ink leading-none tabular-nums">
        {count.toLocaleString()}
      </span>
      <span aria-hidden className="h-[8px] w-[8px] rounded-full bg-ember animate-pulse" />
    </span>
  );
}
