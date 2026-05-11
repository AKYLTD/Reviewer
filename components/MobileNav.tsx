"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/click-collect", label: "Order ahead" },
  { href: "/order-at-table", label: "Eat in" },
  { href: "/catering", label: "Catering" },
  { href: "/cakes", label: "Cakes" },
  { href: "/cakes/order", label: "Order a cake" },
  { href: "/story", label: "Story" },
  { href: "/visit", label: "Visit" },
];

/**
 * Mobile-only slide-in drawer triggered by a hamburger button. Uses body
 * scroll-lock while open and an aria-expanded toggle for screen readers.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Close drawer on route change. We watch popstate + a custom event from
  // the menu links; cheaper than wiring useRouter into a global component.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-pill bg-coffee text-cream transition active:scale-95"
      >
        <span className="relative block h-3 w-5">
          <span
            className={`absolute left-0 right-0 h-0.5 rounded-pill bg-cream transition-all ${
              open ? "top-1.5 rotate-45" : "top-0"
            }`}
          />
          <span
            className={`absolute left-0 right-0 h-0.5 rounded-pill bg-cream transition-all ${
              open ? "top-1.5 -rotate-45" : "top-3"
            }`}
          />
        </span>
      </button>

      {/* Drawer + scrim */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-coffee/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[88vw] max-w-sm bg-cream shadow-pop transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-5 border-b border-hairline">
            <span className="inline-flex items-center gap-2">
              <span className="font-display text-[1.2rem] font-700 text-coffee">
                Roni&rsquo;s
                <span className="text-brick">.</span>
              </span>
            </span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="text-coffee text-2xl leading-none px-2"
            >
              ×
            </button>
          </div>

          <nav className="p-5" aria-label="Mobile">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 font-display font-600 text-xl text-coffee hover:bg-ivory active:bg-saffron/40 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-hairline bg-ivory">
            <Link
              href="/click-collect"
              onClick={() => setOpen(false)}
              className="btn-primary w-full"
            >
              <span>Order ahead</span>
            </Link>
            <p className="mt-3 text-center font-sans text-sm text-muted">
              Four shops across north London
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
