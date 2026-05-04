"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Animation to apply once in view: "rise" or "photo". */
  as?: "rise" | "photo";
  delay?: number;
  threshold?: number;
  className?: string;
  /** Override animation for reduced-motion clients. */
  rootMargin?: string;
}

/**
 * Reveals children when scrolled into view. Cheap and dependency-free —
 * IntersectionObserver, single boolean state. Honours prefers-reduced-motion
 * by short-circuiting to visible immediately.
 */
export function Reveal({
  children,
  as = "rise",
  delay = 0,
  threshold = 0.18,
  className = "",
  rootMargin = "0px 0px -10% 0px",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  const animation = as === "photo" ? "animate-photo-reveal" : "animate-rise";
  return (
    <div
      ref={ref}
      className={`${className} ${shown ? animation : "opacity-0"}`}
      style={{ animationDelay: shown ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
