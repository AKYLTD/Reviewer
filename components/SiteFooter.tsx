import Link from "next/link";
import { getContent, primaryLocation } from "@/lib/content";

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const content = await getContent();
  const { brand } = content;
  const primary = primaryLocation(content);

  return (
    <footer className="panel-coffee mt-24">
      <div className="mx-auto max-w-[1320px] px-page-x py-20 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-display-md font-700 leading-none text-cream">
            {brand.wordmark}
            <span className="text-saffron">.</span>
          </p>
          <p className="font-display text-saffron text-lg font-500 mt-1">
            {brand.subtitle}
          </p>
          <p className="editorial mt-6 max-w-prose">{brand.tagline}</p>
        </div>

        <div className="md:col-span-3">
          <p className="label">Visit</p>
          <ul className="editorial mt-4 space-y-2">
            {content.locations.map((loc) => (
              <li key={loc.id}>
                <Link href={`/visit#${loc.id}`} className="anchor">
                  {loc.shortName}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/visit" className="anchor mt-4 inline-block font-display font-500">
            All locations &amp; hours
          </Link>
        </div>

        <div className="md:col-span-2">
          <p className="label">Order</p>
          <ul className="space-y-2 editorial mt-4">
            <li><Link href="/menu" className="anchor">Menu</Link></li>
            <li><Link href="/click-collect" className="anchor">Click &amp; collect</Link></li>
            <li><Link href="/catering" className="anchor">Catering</Link></li>
            <li><Link href="/cakes/order" className="anchor">Cakes</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="label">Contact</p>
          <ul className="space-y-2 editorial mt-4">
            {primary.phone && (
              <li>
                <a href={`tel:${primary.phone.replace(/\s+/g, "")}`} className="anchor">
                  {primary.phone}
                </a>
              </li>
            )}
            {primary.email && (
              <li>
                <a href={`mailto:${primary.email}`} className="anchor">
                  {primary.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-[1320px] px-page-x py-6 flex flex-wrap items-center justify-between gap-3">
          <p className="label-muted">
            &copy; {year} {brand.wordmark} {brand.subtitle}
          </p>
          <p className="label-muted">{content.locations.length} shops · north London</p>
        </div>
      </div>
    </footer>
  );
}
