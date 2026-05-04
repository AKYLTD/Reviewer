import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-32 border-t border-hairline">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-page-x py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-display-sm leading-tight text-ink">
            Roni&rsquo;s
            <span className="block font-editorial italic font-semibold text-[0.6em] leading-none mt-1">
              Belsize Village
            </span>
          </p>
          <p className="editorial mt-6 max-w-prose">
            A bagel bakery and caf&eacute; on Belsize Lane. Open daily &mdash;
            morning bake at sunrise, last orders into the evening.
          </p>
        </div>

        <div className="md:col-span-3">
          <p className="label mb-4">Visit</p>
          <address className="not-italic editorial">
            37&ndash;39 Belsize Lane
            <br />
            London NW3 5AS
          </address>
          <Link href="/visit" className="anchor mt-4 inline-block font-sans text-[0.78rem] font-light tracking-widest uppercase">
            Hours &amp; transport
          </Link>
        </div>

        <div className="md:col-span-2">
          <p className="label mb-4">Order</p>
          <ul className="space-y-2 editorial">
            <li>
              <Link href="/click-collect" className="anchor">
                Click &amp; collect
              </Link>
            </li>
            <li>
              <Link href="/catering" className="anchor">
                Catering
              </Link>
            </li>
            <li>
              <Link href="/cakes" className="anchor">
                Cakes
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="label mb-4">Contact</p>
          <ul className="space-y-2 editorial">
            <li>
              <a href="tel:+442077948133" className="anchor">
                020 7794 8133
              </a>
            </li>
            <li>
              <a href="mailto:hello@ronisbelsize.com" className="anchor">
                hello@ronisbelsize.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-page-x py-6">
          <p className="label">&copy; {year} Roni&rsquo;s Belsize Village</p>
          <p className="label">Belsize Park &middot; London NW3</p>
        </div>
      </div>
    </footer>
  );
}
