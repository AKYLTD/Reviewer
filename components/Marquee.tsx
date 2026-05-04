/**
 * Endless horizontal marquee. Pure CSS, no JS — duplicated children + a
 * 50% translate keyframe gives a seamless loop.
 *
 * Used on the homepage as the bagel-belt under the hero. The brief warned
 * against marquees as decoration; we use a single one here as a deliberate
 * food-photography belt that reads "what we make today".
 */
import type { ReactNode } from "react";
import { Children } from "react";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
}

export function Marquee({ children, className = "" }: MarqueeProps) {
  const items = Children.toArray(children);
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee gap-6">
        {items.map((c, i) => (
          <div key={`a-${i}`} className="shrink-0">{c}</div>
        ))}
        {items.map((c, i) => (
          <div key={`b-${i}`} aria-hidden className="shrink-0">{c}</div>
        ))}
      </div>
    </div>
  );
}
