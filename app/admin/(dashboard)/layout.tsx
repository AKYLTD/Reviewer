import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/promotions", label: "Promos" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/site-images", label: "Site images" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/brand", label: "Brand" },
  { href: "/admin/images", label: "Uploads" },
  { href: "/admin/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-hairline bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-6 px-page-x py-3">
          <Link href="/admin" className="inline-flex items-center gap-2">
            <span className="font-display text-[1.2rem] font-700 text-coffee">
              Roni&rsquo;s
              <span className="text-brick">.</span>
            </span>
            <span className="rounded-pill bg-coffee text-saffron px-2.5 py-0.5 font-display font-600 text-xs">
              admin
            </span>
          </Link>
          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-display text-[0.95rem] font-500 text-coffee hover:text-brick transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-[0.85rem] font-500 text-coffee hover:text-brick">
              View site
            </Link>
            <Link href="/admin/logout" className="btn-ghost text-xs px-3 py-1.5">
              Sign out
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1320px] px-page-x py-12">{children}</div>
    </div>
  );
}
