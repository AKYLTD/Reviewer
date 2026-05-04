import Link from "next/link";

const TILES = [
  {
    href: "/admin/brand",
    title: "Brand",
    body: "Wordmark, subtitle, descriptor, address numerals, tagline, logo source.",
  },
  {
    href: "/admin/content",
    title: "Content",
    body: "Hero copy, opening note, story milestones, footer.",
  },
  {
    href: "/admin/locations",
    title: "Locations",
    body: "Add, edit, remove shops. Each carries its own hours, address, transport and Square ID for till routing.",
  },
  {
    href: "/admin/menu",
    title: "Menu",
    body: "Add, edit, remove dishes & prices in the manual menu. (Square pulls automatically.)",
  },
  {
    href: "/admin/images",
    title: "Images",
    body: "Upload photographs and the shopfront sign artwork.",
  },
];

export default function AdminHome() {
  return (
    <div>
      <p className="label">Overview</p>
      <h1 className="mt-3 font-display text-display-lg leading-[0.96] text-ink">
        What would you like to change?
      </h1>
      <p className="editorial mt-6 max-w-prose">
        Edits saved here update the live site. Square pulls the menu
        automatically; the manual menu only renders if Square is unavailable
        or not configured.
      </p>

      <ul className="mt-12 grid gap-px border-t border-hairline md:grid-cols-2">
        {TILES.map((tile) => (
          <li key={tile.href} className="border-b border-hairline">
            <Link href={tile.href} className="group block px-1 py-10 transition-colors hover:bg-bone md:px-6 md:py-12">
              <div className="flex items-baseline justify-between gap-6">
                <h2 className="font-display text-display-sm text-ink">{tile.title}</h2>
                <span className="font-sans text-[0.72rem] font-light uppercase tracking-widest text-muted transition-transform group-hover:translate-x-1">
                  Edit &rarr;
                </span>
              </div>
              <p className="editorial mt-4 max-w-[36rem]">{tile.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
