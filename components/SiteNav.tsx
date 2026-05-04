import Link from "next/link";
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

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 w-full bg-cream/85 backdrop-blur-md border-b border-hairline">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-page-x py-3">
        <Link href="/" aria-label="Roni's Belsize Village — home">
          <Masthead variant="compact" />
        </Link>

        <nav className="hidden md:block" aria-label="Primary">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-display text-[0.95rem] font-500 text-coffee hover:text-brick transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/click-collect"
            className="hidden sm:inline-flex btn-primary text-[0.85rem] px-5 py-2.5"
          >
            <span>Order ahead</span>
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
