import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { BagelMark } from "@/components/BagelMark";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Visit",
  description:
    "Roni's Belsize Village — 37–39 Belsize Lane, London NW3 5AS. Hours, transport and parking.",
};

export const revalidate = 60;

const TRANSPORT = [
  { label: "Belsize Park", detail: "Northern line · 6 min walk along Belsize Park Gardens" },
  { label: "Swiss Cottage", detail: "Jubilee line · 9 min walk along Belsize Avenue" },
  { label: "Bus", detail: "46 · 268 · C11 · stops on Haverstock Hill" },
  { label: "Cycle", detail: "Santander dock at Belsize Lane / Belsize Park Gardens" },
];

export default async function VisitPage() {
  const { brand, address, hours: HOURS } = await getContent();
  const mapQuery = encodeURIComponent(`${address.line1}, ${address.line2}`);

  return (
    <main>
      <Section size="tall" panel="cream" className="relative overflow-hidden">
        <span aria-hidden className="absolute -top-12 -right-16 opacity-25 pointer-events-none">
          <BagelMark className="h-80 w-80" spin />
        </span>
        <div className="relative grid gap-10 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <span className="label">Visit</span>
            <h1 className="mt-5 font-display font-700 text-display-xl text-coffee leading-[0.95]">
              {brand.addressNumber}
              <br />
              <span className="text-brick">Belsize Lane.</span>
            </h1>
            <p className="editorial mt-6 max-w-prose text-[1.15rem]">
              Tucked into Belsize Village between Haverstock Hill and the
              cinema. Counter, dining room, and pavement seats when the weather
              behaves.
            </p>
            <p className="mt-6 inline-flex items-center gap-3 rounded-pill bg-coffee text-saffron px-4 py-2 font-display font-600 text-sm">
              {address.line2}
              <span className="text-cream/60">·</span>
              <a className="text-saffron hover:underline" href={`tel:${address.phone.replace(/\s+/g, "")}`}>
                {address.phone}
              </a>
            </p>
          </div>
          <div className="md:col-span-5">
            <Photo alt="The shopfront at 37–39 Belsize Lane" aspect="4 / 5" tone="brick" rounded="xl" />
          </div>
        </div>
      </Section>

      <Section panel="ivory">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="label">Hours</span>
            <h2 className="mt-3 font-display font-700 text-display-md text-coffee">
              When we&rsquo;re open.
            </h2>
            <ul className="mt-8 divide-y divide-hairline rounded-xl bg-cream shadow-soft overflow-hidden">
              {HOURS.map((row) => (
                <li key={row.day} className="flex items-center justify-between gap-6 py-5 px-6">
                  <span className="font-display font-600 text-lg text-coffee">{row.day}</span>
                  <span className="price-chip whitespace-nowrap">{row.hours}</span>
                </li>
              ))}
            </ul>
            <p className="editorial mt-6 text-muted text-[0.95rem]">
              Bank holidays vary &mdash; check Google or call ahead. Last
              orders thirty minutes before close.
            </p>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <span className="label">Getting there</span>
            <h2 className="mt-3 font-display font-700 text-display-md text-coffee">
              How to reach us.
            </h2>
            <ul className="mt-8 grid gap-4">
              {TRANSPORT.map((row) => (
                <li key={row.label} className="rounded-xl bg-cream p-5 shadow-soft">
                  <span className="font-display font-700 text-lg text-coffee">{row.label}</span>
                  <p className="editorial mt-1 text-[1rem]">{row.detail}</p>
                </li>
              ))}
            </ul>
            <p className="editorial mt-6 text-muted text-[0.95rem]">
              Pay-and-display on Belsize Lane and Belsize Park Gardens. The
              village has a residents-only zone weekday daytimes &mdash;
              evenings and Sundays are easier.
            </p>
          </div>
        </div>
      </Section>

      <Section panel="cream">
        <span className="label">On the map</span>
        <h2 className="mt-3 font-display font-700 text-display-md text-coffee">
          Find us.
        </h2>
        <div className="mt-8 rounded-xl overflow-hidden shadow-soft">
          <div className="aspect-[16/9] w-full bg-bone">
            <iframe
              title="Roni's Belsize Village on the map"
              src={`https://www.google.com/maps?q=${mapQuery}&z=16&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full"
            />
          </div>
        </div>
      </Section>
    </main>
  );
}
