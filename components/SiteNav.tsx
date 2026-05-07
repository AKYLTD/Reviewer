"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Masthead } from "./Masthead";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/click-collect", label: "Order" },
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
        <Link href="/" aria-label="Roni's Belsize Village — home" className="rounded-md">
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
            href="/click-collect"
            className="hidden sm:inline-flex btn-primary text-[0.85rem] px-5"
          >
            <span>Order ahead</span>
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
