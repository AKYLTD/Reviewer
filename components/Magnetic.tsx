"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

interface MagneticProps {
  children: ReactNode;
  /** How strongly the element follows the cursor. 0.25 ≈ subtle. */
  strength?: number;
  /** Max travel in px. Caps the effect on tiny buttons / huge cursors. */
  max?: number;
}

/**
 * Wrap a focusable element to give it a subtle magnetic pull on hover.
 * Disabled on touch / coarse pointers and under prefers-reduced-motion.
 */
export function Magnetic({ children, strength = 0.22, max = 12 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let raf = 0;
    const setT = (x: number, y: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      const tx = Math.max(-max, Math.min(max, dx));
      const ty = Math.max(-max, Math.min(max, dy));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setT(tx, ty));
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setT(0, 0));
    };

    el.style.transition = "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    el.style.willChange = "transform";
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength, max]);

  // We render a passthrough wrapper so consumers don't need to worry about
  // adding a ref or style; the first child receives the magnetism.
  return <div ref={ref} className="contents">{children}</div>;
}

/**
 * Convenience: `<MagneticLink href=...>`. For when you don't want to think
 * about the wrapper. Renders an <a> that obeys the magnetic effect.
 */
export function MagneticLink({
  href,
  children,
  className = "",
  external = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const target = external ? "_blank" : undefined;
  const rel = external ? "noopener noreferrer" : undefined;
  return (
    <Magnetic>
      <a href={href} target={target} rel={rel} className={className}>
        {children}
      </a>
    </Magnetic>
  );
}
