"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Masthead } from "./Masthead";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/menu", label: "Menu" },
  { href: "/catering", label: "Catering" },
  { href: "/cakes", label: "Cakes" },
  { href: "/story", label: "Story" },
  { href: "/visit", label: "Visit" },
];

/**
 * Per UI/UX Pro Max Priority 9 (`nav-state-active`): the current location
 * must be visually highlighted in navigation. We compare the current
 * pathname against each link's href; a path is "active" if it matches
 * exactly OR is a sub-route (so /cakes/order highlights "Cakes").
 */
function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full bg-cream/85 backdrop-blur-md border-b border-hairline">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-page-x py-3">
        <Link href="/" aria-label="Roni's Bagel Bakery — home" className="rounded-md">
          <Masthead variant="compact" />
        </Link>

        <nav className="hidden md:block" aria-label="Primary">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex items-center min-h-11 px-3 font-display text-[0.95rem] font-500 rounded-md transition-colors ${
                      active
                        ? "text-brick"
                        : "text-coffee hover:text-brick"
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-3 right-3 -bottom-0.5 h-[3px] rounded-pill bg-brick"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="hidden sm:inline-flex items-center gap-2 rounded-pill bg-ivory border border-hairline px-4 py-2 font-display font-600 text-xs text-coffee hover:bg-saffron/40 transition min-h-11"
            aria-label="Your account"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" strokeLinecap="round" />
            </svg>
            Account
          </Link>
          <Link
            href="/shop"
            className="hidden sm:inline-flex btn-primary text-[0.85rem] px-5"
          >
            <span>Shop</span>
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
