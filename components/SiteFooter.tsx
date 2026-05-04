import Link from "next/link";
import { BagelMark } from "./BagelMark";
import { getContent } from "@/lib/content";

export async function SiteFooter() {
  const year = new Date().getFullYear();
  const { brand, address, hours } = await getContent();

  return (
    <footer className="panel-coffee mt-24">
      <div className="mx-auto max-w-[1320px] px-page-x py-20 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-4">
            <BagelMark className="h-14 w-14" />
            <span>
              <p className="font-display text-display-md font-700 leading-none">
                {brand.wordmark}
                <span className="text-saffron">.</span>
              </p>
              <p className="font-display text-saffron text-lg font-500 mt-1">
                {brand.subtitle}
              </p>
            </span>
          </div>
          <p className="editorial mt-6 max-w-prose">{brand.tagline}</p>
        </div>

        <div className="md:col-span-3">
          <p className="label">Visit</p>
          <address className="not-italic editorial mt-4">
            {address.line1}
            <br />
            {address.line2}
          </address>
          <Link href="/visit" className="anchor mt-4 inline-block font-display font-500">
            Hours &amp; transport
          </Link>
        </div>

        <div className="md:col-span-2">
          <p className="label">Order</p>
          <ul className="space-y-2 editorial mt-4">
            <li><Link href="/menu" className="anchor">Menu</Link></li>
            <li><Link href="/click-collect" className="anchor">Click &amp; collect</Link></li>
            <li><Link href="/catering" className="anchor">Catering</Link></li>
            <li><Link href="/cakes" className="anchor">Cakes</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="label">Contact</p>
          <ul className="space-y-2 editorial mt-4">
            <li>
              <a href={`tel:${address.phone.replace(/\s+/g, "")}`} className="anchor">
                {address.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${address.email}`} className="anchor">
                {address.email}
              </a>
            </li>
          </ul>
          <p className="label mt-6">Today</p>
          <p className="editorial mt-2 text-[0.95rem]">
            {hours[0]?.day} · {hours[0]?.hours}
          </p>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-[1320px] px-page-x py-6 flex flex-wrap items-center justify-between gap-3">
          <p className="label-muted text-cream/60">
            &copy; {year} {brand.wordmark} {brand.subtitle}
          </p>
          <p className="label-muted text-cream/60">Belsize Park · London NW3</p>
        </div>
      </div>
    </footer>
  );
}
