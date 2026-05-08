"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Item {
  key: string;
  label: string;
  src: string;
}

const ITEMS: Item[] = [
  {
    key: "bagels",
    label: "Bagels",
    // Known-good Unsplash bagel photo (kept as reference; will be replaced
    // by /admin/images once the real shoot is delivered).
    src: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=720&h=720&fit=crop&auto=format&q=80",
  },
  {
    key: "challah",
    label: "Challah",
    src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=720&h=720&fit=crop&auto=format&q=80",
  },
  {
    key: "rugelach",
    label: "Rugelach",
    src: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=720&h=720&fit=crop&auto=format&q=80",
  },
];

/**
 * 3D welcome tableau — three signature products floating in 3D space:
 * bagels, challah, rugelach. Built with CSS 3D transforms (no Three.js
 * dependency); a parent perspective + per-item translateZ creates the
 * depth illusion. Each item bobs up and down on its own offset cycle,
 * and the whole tableau tilts on mouse-tracked parallax for desktop
 * pointer users. Touch / reduced-motion users get the static composition.
 */
export function WelcomeTableau() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / rect.height) * -8; // tilt up/down
      const ry = ((e.clientX - cx) / rect.width) * 8;   // tilt left/right
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTilt({ x: rx, y: ry }));
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Position offsets in pixels relative to the centre. Triangular
  // composition with the centre item brought forward (positive Z) and
  // the side items receding.
  const POSITIONS = [
    { x: -150, y:  40, z:  -30, rot: -10, scale: 0.9,  floatDelay: 0 },
    { x:    0, y: -50, z:   90, rot:   0, scale: 1.0,  floatDelay: 1.2 },
    { x:  150, y:  60, z:  -10, rot:  10, scale: 0.85, floatDelay: 2.4 },
  ];

  return (
    <div className="relative h-[440px] sm:h-[500px] md:h-[560px]">
      <div
        ref={ref}
        className="absolute inset-0 transition-transform duration-200 ease-out"
        style={{
          perspective: "1400px",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 280ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {ITEMS.map((item, i) => {
            const p = POSITIONS[i];
            return (
              <div
                key={item.key}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `translate3d(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px), ${p.z}px) rotateY(${p.rot}deg) scale(${p.scale})`,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="welcome-float group cursor-default"
                  style={{ animationDelay: `${p.floatDelay}s` }}
                >
                  {/* Soft saffron glow underneath */}
                  <div
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2 bottom-[-28px] h-8 w-44 rounded-pill bg-saffron/40 blur-2xl opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  {/* Photo circle with branded ring */}
                  <div className="relative h-44 w-44 sm:h-52 sm:w-52 md:h-60 md:w-60 rounded-pill overflow-hidden shadow-e3 ring-4 ring-cream/80 ring-offset-4 ring-offset-saffron/20 transition-transform duration-500 group-hover:scale-[1.06]">
                    <Image
                      src={item.src}
                      alt={item.label}
                      width={600}
                      height={600}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                    {/* Warm wash so the trio reads as one set */}
                    <div
                      aria-hidden
                      className="absolute inset-0 mix-blend-multiply pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(ellipse at 30% 25%, rgba(255,246,224,0.25) 0%, rgba(74,31,8,0.18) 100%)",
                      }}
                    />
                  </div>
                  {/* Label */}
                  <p className="mt-5 text-center font-display font-700 text-coffee text-base md:text-lg">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
