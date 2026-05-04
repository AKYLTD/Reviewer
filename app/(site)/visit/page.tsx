import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
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
      <Section size="tall">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label">Visit</p>
            <h1 className="mt-6 font-display text-display-lg leading-[0.96] text-ink">
              {brand.addressNumber}
              <br />
              Belsize Lane.
            </h1>
            <p className="editorial mt-8 max-w-prose">
              Tucked into Belsize Village between Haverstock Hill and the
              cinema. Counter, dining room, and pavement seats when the weather
              behaves.
            </p>
            <p className="editorial mt-4">
              {address.line2} &middot;{" "}
              <a className="anchor" href={`tel:${address.phone.replace(/\s+/g, "")}`}>
                {address.phone}
              </a>
            </p>
          </div>
          <div className="md:col-span-5">
            <Photo
              alt="The shopfront at 37–39 Belsize Lane"
              aspect="4 / 5"
            />
          </div>
        </div>
      </Section>

      {/* HOURS -------------------------------------------------------------- */}
      <Section>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label">Hours</p>
            <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
              {HOURS.map((row) => (
                <li key={row.day} className="flex items-baseline justify-between gap-6 py-5">
                  <span className="font-editorial text-[1.1rem] text-ink">{row.day}</span>
                  <span className="font-sans text-[0.85rem] font-light tracking-wide text-ink">
                    {row.hours}
                  </span>
                </li>
              ))}
            </ul>
            <p className="editorial mt-6 text-muted text-[0.95rem]">
              Bank holidays vary &mdash; check the till on Google or call
              ahead. Last orders thirty minutes before close.
            </p>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <p className="label">Getting there</p>
            <ul className="mt-6 divide-y divide-hairline border-y border-hairline">
              {TRANSPORT.map((row) => (
                <li key={row.label} className="grid grid-cols-[8rem_1fr] items-baseline gap-6 py-5">
                  <span className="font-editorial italic text-[1rem] text-ink">{row.label}</span>
                  <span className="editorial text-[1rem]">{row.detail}</span>
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

      {/* MAP --------------------------------------------------------------- */}
      <Section>
        <p className="label mb-6">On the map</p>
        <div className="border border-hairline">
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
