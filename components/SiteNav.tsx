import Link from "next/link";
import { Masthead } from "./Masthead";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/click-collect", label: "Order ahead" },
  { href: "/catering", label: "Catering" },
  { href: "/cakes", label: "Cakes" },
  { href: "/story", label: "Story" },
  { href: "/visit", label: "Visit" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-page-x py-3">
        <Link href="/" className="anchor inline-flex items-center" aria-label="Roni's Belsize Village — home">
          <Masthead variant="compact" />
        </Link>
        <nav className="hidden md:block" aria-label="Primary">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="anchor font-sans text-[0.78rem] font-light tracking-widest uppercase text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/click-collect"
          className="hidden md:inline-flex items-center justify-center border border-ink px-4 py-2 font-sans text-[0.7rem] font-light uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          Order
        </Link>
        {/* Mobile: a single emphasised CTA replaces the menu — the brief
            prioritises frictionless ordering for regulars on the go. */}
        <Link
          href="/click-collect"
          className="md:hidden inline-flex items-center justify-center border border-ink px-3 py-1.5 font-sans text-[0.65rem] font-light uppercase tracking-widest text-ink"
        >
          Order
        </Link>
      </div>
    </header>
  );
}
