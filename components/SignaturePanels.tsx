"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Item {
  key: string;
  label: string;
  description: string;
  src: string;
}

const ITEMS: Item[] = [
  {
    key: "bagels",
    label: "Bagels",
    description:
      "Boiled in barley-malt water, hand-rolled, baked through to a chestnut top.",
    src: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1200&h=1500&fit=crop&auto=format&q=80",
  },
  {
    key: "challah",
    label: "Challah",
    description:
      "Plaited by hand and reserved by Friday lunch. Plain, sweet, raisin, sesame-topped.",
    src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=1500&fit=crop&auto=format&q=80",
  },
  {
    key: "rugelach",
    label: "Rugelach",
    description:
      "Buttery, flaky, addictive. Chocolate, cinnamon, raspberry — the kitchen's call each morning.",
    src: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&h=1500&fit=crop&auto=format&q=80",
  },
];

const AUTO_ADVANCE_MS = 5500;

/**
 * Editorial split-panel showcase. Three product panels share the hero
 * frame; the "active" one expands to take 3.5× the width of the others
 * while CSS smoothly transitions the grid columns. Hover/focus on a panel
 * promotes it; otherwise the active panel auto-advances every 5.5s.
 *
 * Why this rather than a 3D tableau: the split-panel pattern is in heavy
 * use by editorial-grade food/lifestyle brands (Aesop, Le Labo, Cereal,
 * The Modernist) precisely because it lets a single hero block carry
 * multiple full-bleed photographs without crowding. Less gimmicky than
 * 3D parallax, more "magazine".
 */
export function SignaturePanels() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  // Auto-advance unless the user is interacting with the panels.
  useEffect(() => {
    if (hovering || reduceMotion.current) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % ITEMS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [hovering]);

  const cols = ITEMS.map((_, i) => (i === activeIdx ? "3.5fr" : "1fr")).join(" ");

  return (
    <div
      className="relative h-[460px] sm:h-[520px] md:h-[600px]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        role="tablist"
        aria-label="Signature products"
        className="grid h-full gap-1 rounded-xl overflow-hidden shadow-e2"
        style={{
          gridTemplateColumns: cols,
          transition: "grid-template-columns 700ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {ITEMS.map((item, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              onMouseEnter={() => setActiveIdx(i)}
              onFocus={() => setActiveIdx(i)}
              onClick={() => setActiveIdx(i)}
              className="relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-inset"
            >
              {/* Photograph — Ken-Burns style scale on the active panel */}
              <Image
                src={item.src}
                alt=""
                aria-hidden
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 33vw"
                className={`object-cover transition-transform ease-out ${
                  isActive
                    ? "scale-110 duration-[6000ms]"
                    : "scale-100 duration-[700ms]"
                }`}
              />

              {/* Bottom-up cocoa gradient for legibility */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(42,24,16,0.82) 0%, rgba(42,24,16,0.35) 40%, rgba(42,24,16,0.05) 75%, transparent 100%)",
                }}
              />

              {/* Inactive: rotated vertical label sitting at the bottom */}
              {!isActive && (
                <div className="absolute inset-0 flex items-end justify-center pb-5">
                  <p
                    className="font-display font-700 text-cream text-base md:text-lg uppercase tracking-[0.2em] drop-shadow"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                  >
                    {item.label}
                  </p>
                </div>
              )}

              {/* Active: full reveal with name + description, fades up */}
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
                  <p
                    key={`label-${item.key}`}
                    className="font-display font-700 text-cream text-3xl md:text-5xl leading-[1.0] animate-rise"
                  >
                    {item.label}
                  </p>
                  <p
                    key={`desc-${item.key}`}
                    className="font-sans text-cream/95 text-sm md:text-base mt-3 max-w-[36ch] leading-relaxed animate-rise"
                    style={{ animationDelay: "120ms" }}
                  >
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Pagination — horizontal pill bar at the bottom. Click to jump. */}
      <div
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2"
        role="tablist"
        aria-label="Active panel"
      >
        {ITEMS.map((it, i) => (
          <button
            key={it.key}
            type="button"
            aria-label={`Show ${it.label}`}
            aria-pressed={i === activeIdx}
            onClick={() => setActiveIdx(i)}
            className={`h-2 rounded-pill transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-2 ${
              i === activeIdx ? "w-10 bg-brick" : "w-2 bg-cocoa/30 hover:bg-cocoa/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
