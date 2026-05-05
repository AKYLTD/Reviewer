import Link from "next/link";
import Image from "next/image";
import { mockupUrl, type Mockup } from "@/lib/mockups";

interface Action {
  href: string;
  label: string;
  sub: string;
  mock: Mockup;
  bg: string;
}

const ACTIONS: Action[] = [
  {
    href: "/click-collect",
    label: "Order ahead",
    sub: "Walk in, walk out · 12 min",
    mock: "icon-bagels",
    bg: "bg-saffron",
  },
  {
    href: "/order-at-table",
    label: "Eat in",
    sub: "Sitting down · scan QR at your table",
    mock: "icon-coffee",
    bg: "bg-cream",
  },
  {
    href: "/catering",
    label: "Cater an event",
    sub: "10 to 200 people · 48 hr notice",
    mock: "icon-catering",
    bg: "bg-bone",
  },
  {
    href: "/cakes/order",
    label: "Order a cake",
    sub: "Build it on screen · 72 hr notice",
    mock: "icon-cakes",
    bg: "bg-saffronSoft",
  },
];

/**
 * "I want to…" strip placed near the top of the homepage. Each tile pairs
 * a tightly cropped food photograph with the headline action and its
 * lead-time so a first-time visitor can pick a path in two seconds.
 */
export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <header className="mb-6 flex items-end justify-between gap-4">
        <h2
          id="quick-actions-heading"
          className="font-display font-700 text-coffee text-2xl md:text-3xl"
        >
          I want to&hellip;
        </h2>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className={`group relative block h-full ${a.bg} rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-pop focus:-translate-y-1 focus:shadow-pop`}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <Image
                  src={mockupUrl(a.mock)}
                  alt={a.label}
                  width={800}
                  height={500}
                  unoptimized
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 flex items-center gap-3">
                <div className="min-w-0">
                  <p className="font-display font-700 text-lg text-coffee leading-tight">
                    {a.label}
                  </p>
                  <p className="font-sans text-sm text-coffee/75 mt-0.5">
                    {a.sub}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="ml-auto font-display font-700 text-coffee text-2xl transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
