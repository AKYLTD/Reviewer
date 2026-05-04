import Link from "next/link";
import {
  SandwichIllustration,
  PlatterIllustration,
  CakeIllustration,
  CoffeeIllustration,
} from "./FoodIllustrations";

const ACTIONS = [
  {
    href: "/click-collect",
    label: "Order ahead",
    sub: "Walk in, walk out · 12 min",
    icon: <SandwichIllustration title="Bagel sandwich" className="h-16 w-16 text-coffee" />,
    bg: "bg-saffron",
  },
  {
    href: "/order-at-table",
    label: "Eat in",
    sub: "Sitting down · scan QR at your table",
    icon: <CoffeeIllustration title="Coffee" className="h-16 w-16 text-coffee" />,
    bg: "bg-cream",
  },
  {
    href: "/catering",
    label: "Cater an event",
    sub: "10 to 200 people · 48 hr notice",
    icon: <PlatterIllustration title="Catering platter" className="h-16 w-16 text-coffee" />,
    bg: "bg-bone",
  },
  {
    href: "/cakes/order",
    label: "Order a cake",
    sub: "Build it on screen · 72 hr notice",
    icon: <CakeIllustration title="Layered cake" className="h-16 w-16 text-coffee" />,
    bg: "bg-saffronSoft",
  },
];

/**
 * "I want to…" strip placed near the top of the homepage so a first-time
 * visitor sees the four primary tasks at a glance. Each tile carries a
 * sketch food illustration so the strip feels appetising, not utilitarian.
 */
export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <header className="mb-6 flex items-end justify-between gap-4">
        <h2 id="quick-actions-heading" className="font-display font-700 text-coffee text-2xl md:text-3xl">
          I want to&hellip;
        </h2>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((a) => (
          <li key={a.href}>
            <Link
              href={a.href}
              className={`group block h-full ${a.bg} rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-pop focus:-translate-y-1 focus:shadow-pop`}
            >
              <div className="flex items-center gap-4">
                {a.icon}
                <div className="min-w-0">
                  <p className="font-display font-700 text-xl text-coffee leading-tight">
                    {a.label}
                  </p>
                  <p className="font-sans text-sm text-coffee/75 mt-1">
                    {a.sub}
                  </p>
                </div>
                <span aria-hidden className="ml-auto font-display font-700 text-coffee text-2xl transition-transform group-hover:translate-x-1">
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
