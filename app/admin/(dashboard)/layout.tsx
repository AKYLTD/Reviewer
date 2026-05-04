import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/brand", label: "Brand" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/images", label: "Images" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-hairline bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-page-x py-3">
          <Link href="/admin" className="anchor inline-flex items-baseline gap-2">
            <span className="font-display text-[1.05rem] tracking-[0.02em]">RONI&rsquo;S</span>
            <span className="label text-muted">Admin</span>
          </Link>
          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="anchor font-sans text-[0.78rem] font-light tracking-widest uppercase">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/" className="anchor font-sans text-[0.72rem] font-light tracking-widest uppercase">
              View site
            </Link>
            <Link href="/admin/logout" className="btn-ghost px-3 py-1.5 text-[0.7rem]">
              Sign out
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1280px] px-page-x py-12">{children}</div>
    </div>
  );
}
