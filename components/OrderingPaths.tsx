import Link from "next/link";

const PATHS = [
  {
    href: "/click-collect",
    label: "Click & collect",
    description:
      "Order ahead, walk in, walk out. Bagels boxed in twelve minutes; sandwiches when you arrive.",
    lead: "12 min",
    leadLabel: "Lead time",
  },
  {
    href: "/order-at-table",
    label: "Order at table",
    description:
      "Sitting in? Scan the marker on your table to order another flat white or a babka without flagging anyone down.",
    lead: "Daily",
    leadLabel: "Dine-in",
  },
  {
    href: "/catering",
    label: "Catering",
    description:
      "Trays for offices, gatherings, and shiva. Quoted from your guest count; routed to the kitchen the moment you confirm.",
    lead: "48 hr",
    leadLabel: "From",
  },
  {
    href: "/cakes",
    label: "Cakes & occasions",
    description:
      "Birthday cakes, Shabbat challahs, and the kettle-boiled celebration trays. Custom inscriptions welcome.",
    lead: "72 hr",
    leadLabel: "From",
  },
];

export function OrderingPaths() {
  return (
    <ul className="grid gap-px border-t border-hairline md:grid-cols-2">
      {PATHS.map((path) => (
        <li key={path.href} className="border-b border-hairline">
          <Link
            href={path.href}
            className="group relative block h-full px-1 py-10 transition-colors hover:bg-bone md:px-6 md:py-14"
          >
            <div className="flex items-baseline justify-between gap-6">
              <span className="font-display text-display-sm leading-none text-ink">
                {path.label}
              </span>
              <span className="hidden text-right md:block">
                <span className="block label">{path.leadLabel}</span>
                <span className="font-editorial italic text-[1.1rem] text-ink">
                  {path.lead}
                </span>
              </span>
            </div>
            <p className="editorial mt-5 max-w-[34rem]">{path.description}</p>
            <span
              aria-hidden
              className="mt-8 inline-flex items-center gap-2 font-sans text-[0.72rem] font-light uppercase tracking-widest text-ink"
            >
              <span className="anchor">Begin</span>
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
