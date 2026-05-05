import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { CateringForm } from "@/components/CateringForm";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Catering",
  description:
    "Bagel and breakfast catering for offices, gatherings, and shiva — quoted from your guest count, prepared in our Belsize Lane kitchen.",
};

const PLATTERS = [
  {
    name: "The Counter Platter",
    detail: "Plain, sesame, poppy, and everything bagels — sliced and ready.",
    serves: "12 — 16",
    from: "from £64",
  },
  {
    name: "The Belsize Brunch",
    detail: "Smoked salmon, cream cheese, capers, dill, sliced cucumber, lemon.",
    serves: "10 — 12",
    from: "from £140",
  },
  {
    name: "The Office Long-Table",
    detail: "A hot-and-cold spread: bagels, salads, fritters, fruit, pastries.",
    serves: "20 — 30",
    from: "from £240",
  },
  {
    name: "The Shiva Tray",
    detail: "Quietly arranged. Bagels, smoked salmon, herring, salads, rugelach.",
    serves: "20+",
    from: "on request",
  },
];

export default function CateringPage() {
  return (
    <main>
      <Section size="tall" panel="cream" className="relative overflow-hidden">
<div className="relative grid gap-10 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <span className="label">Catering</span>
            <h1 className="mt-5 font-display font-700 text-display-xl text-coffee leading-[0.95]">
              Trays for offices,
              <br />
              <span className="text-brick">gatherings &amp; shiva.</span>
            </h1>
            <p className="editorial mt-6 max-w-prose text-[1.15rem]">
              Tell us how many people, when, and where. We&rsquo;ll come back the
              same morning with a quote, an allergen-marked platter list, and a
              delivery window.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="price-chip">From 48 hr notice</span>
              <span className="font-display text-coffee/70">
                Same-morning replies, no chasing
              </span>
            </div>
          </div>
          <div className="md:col-span-5">
            <Photo mock="platter" alt="An office catering platter" aspect="4 / 5" tone="brick" rounded="xl" />
          </div>
        </div>
      </Section>

      <Section panel="ivory">
        <header className="mb-12 grid gap-6 md:grid-cols-12 items-end">
          <div className="md:col-span-7">
            <span className="label">Sample platters</span>
            <h2 className="mt-3 font-display font-700 text-display-lg text-coffee">
              Starting points, not a menu.
            </h2>
          </div>
          <p className="md:col-span-5 editorial">
            Every catering order is built from your headcount, allergens, and
            service window.
          </p>
        </header>
        <ul className="grid gap-5 md:grid-cols-2">
          {PLATTERS.map((p, i) => (
            <li key={p.name}>
              <Reveal delay={i * 80}>
                <article className="card h-full p-7 transition-all hover:-translate-y-1 hover:shadow-pop">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display font-700 text-2xl text-coffee leading-tight">
                      {p.name}
                    </h3>
                    <span className="price-chip whitespace-nowrap">{p.from}</span>
                  </div>
                  <p className="editorial mt-4">{p.detail}</p>
                  <p className="label mt-6">Serves {p.serves}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section panel="cream">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="label">Start an enquiry</span>
            <h2 className="mt-3 font-display font-700 text-display-md text-coffee leading-[1.0]">
              We&rsquo;ll come back the same morning.
            </h2>
            <p className="editorial mt-6">
              Replies arrive from <span className="font-600">hello@ronisbelsize.com</span>.
              For urgent same-day catering, call the shop on{" "}
              <a className="anchor text-brick font-600" href="tel:+442077948133">
                020 7794 8133
              </a>
              .
            </p>
          </div>
          <div className="md:col-span-7">
            <div className="card p-8 md:p-10">
              <CateringForm />
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
