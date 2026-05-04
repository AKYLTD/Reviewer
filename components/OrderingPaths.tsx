import Link from "next/link";

const PATHS = [
  {
    href: "/click-collect",
    label: "Order ahead",
    description: "Walk in, walk out. Boxed in twelve minutes.",
    lead: "12 min",
    accent: "saffron",
  },
  {
    href: "/order-at-table",
    label: "Eat in",
    description: "Sitting down? Scan the QR on your table.",
    lead: "Daily",
    accent: "cream",
  },
  {
    href: "/catering",
    label: "Catering",
    description: "Office trays, gatherings, shiva. Same-morning quotes.",
    lead: "From 48 hr",
    accent: "brick",
  },
  {
    href: "/cakes",
    label: "Cakes",
    description: "Birthdays, Shabbat, holidays.",
    lead: "From 72 hr",
    accent: "coffee",
  },
];

const ACCENTS: Record<string, { card: string; pill: string; arrow: string }> = {
  saffron: { card: "bg-saffron text-coffee", pill: "bg-coffee text-saffron", arrow: "text-coffee" },
  cream:   { card: "bg-ivory text-coffee",   pill: "bg-saffron text-coffee", arrow: "text-brick" },
  brick:   { card: "bg-brick text-cream",    pill: "bg-saffron text-coffee", arrow: "text-cream" },
  coffee:  { card: "bg-coffee text-cream",   pill: "bg-saffron text-coffee", arrow: "text-cream" },
};

export function OrderingPaths() {
  return (
    <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {PATHS.map((p) => {
        const a = ACCENTS[p.accent];
        return (
          <li key={p.href}>
            <Link
              href={p.href}
              className={`group relative block h-full ${a.card} rounded-xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-pop`}
            >
              <span className={`inline-flex items-center rounded-pill ${a.pill} px-3 py-1 font-display text-[0.78rem] font-600`}>
                {p.lead}
              </span>
              <h3 className="mt-7 font-display text-[1.65rem] font-700 leading-tight">
                {p.label}
              </h3>
              <p className="mt-3 text-[0.98rem] leading-relaxed opacity-90">
                {p.description}
              </p>
              <span className={`mt-8 inline-flex items-center gap-2 font-display font-600 ${a.arrow}`}>
                Begin
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
