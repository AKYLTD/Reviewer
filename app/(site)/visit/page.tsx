import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { getContent, primaryLocation, type Location } from "@/lib/content";

export const metadata: Metadata = {
  title: "Visit",
  description:
    "Find Roni's. Belsize Village, Swain's Lane, West Hampstead and Muswell Hill — hours, transport, parking.",
};

export const revalidate = 60;

export default async function VisitPage() {
  const content = await getContent();
  const primary = primaryLocation(content);

  return (
    <main>
      <Section size="tall" panel="cream" className="relative overflow-hidden">
<div className="relative grid gap-10 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <p className="label-rule">Visit</p>
            <h1 className="mt-6 font-display font-700 text-display-xl text-coffee">
              Four shops,
              <br />
              <span className="text-brick">one bake.</span>
            </h1>
            <p className="lede mt-8">
              Belsize Village, Swain&rsquo;s Lane, West Hampstead and Muswell
              Hill. Same dough, same kettle, same baker. Pick the one that&rsquo;s
              easiest to reach.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {content.locations.map((loc) => (
                <a
                  key={loc.id}
                  href={`#${loc.id}`}
                  className="inline-flex items-center justify-center min-h-11 rounded-pill bg-ivory px-4 py-2 font-display font-600 text-coffee shadow-soft hover:bg-saffron transition-colors text-sm"
                >
                  {loc.shortName}
                </a>
              ))}
            </div>
          </div>
          <div className="md:col-span-5">
            <Photo mock="shopfront" alt={`Shopfront at ${primary.name}`} aspect="4 / 5" tone="brick" rounded="xl" />
          </div>
        </div>
      </Section>

      {content.locations.map((loc, i) => (
        <LocationBlock
          key={loc.id}
          loc={loc}
          panel={i % 2 === 0 ? "ivory" : "cream"}
        />
      ))}
    </main>
  );
}

function LocationBlock({ loc, panel }: { loc: Location; panel: "ivory" | "cream" }) {
  const mapQuery = encodeURIComponent(`${loc.addressLine1}, ${loc.addressLine2}`);
  return (
    <Section panel={panel} id={loc.id}>
      <div className="grid gap-10 md:grid-cols-12 items-start">
        <div className="md:col-span-5">
          <span className="label">{loc.shortName}</span>
          <h2 className="mt-3 font-display font-700 text-display-lg text-coffee leading-[1.0]">
            {loc.name}
          </h2>
          <address className="not-italic editorial mt-4 text-[1.05rem]">
            {loc.addressLine1}
            <br />
            {loc.addressLine2}
          </address>
          <div className="mt-4 flex flex-wrap gap-3">
            {loc.phone && (
              <a
                href={`tel:${loc.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center min-h-11 rounded-pill bg-rose text-cocoa px-4 py-2 font-display font-600 text-sm hover:bg-roseDeep hover:text-cream transition-colors"
              >
                {loc.phone}
              </a>
            )}
            <a
              href={`https://www.google.com/maps?q=${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-11 rounded-pill bg-saffron text-coffee px-4 py-2 font-display font-600 text-sm shadow-chip hover:shadow-pop transition-shadow"
            >
              Open in Maps
            </a>
          </div>

          {loc.hours.length > 0 && (
            <div className="mt-8">
              <p className="label">Hours</p>
              <ul className="mt-3 divide-y divide-hairline rounded-md bg-cream shadow-soft overflow-hidden">
                {loc.hours.map((row, j) => (
                  <li key={j} className="flex items-center justify-between gap-6 px-5 py-3.5">
                    <span className="font-display font-600 text-coffee">{row.day}</span>
                    <span className="font-sans text-coffee">{row.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loc.transport.length > 0 && (
            <div className="mt-6">
              <p className="label">Getting there</p>
              <ul className="mt-3 space-y-2">
                {loc.transport.map((t, j) => (
                  <li key={j} className="flex items-baseline gap-3">
                    <span className="font-display font-700 text-coffee min-w-[7rem]">{t.label}</span>
                    <span className="editorial text-[1rem]">{t.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="md:col-span-7">
          <div className="rounded-xl overflow-hidden shadow-soft">
            <div className="aspect-[4/3] w-full bg-bone">
              <iframe
                title={`${loc.name} on the map`}
                src={`https://www.google.com/maps?q=${mapQuery}&z=16&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
