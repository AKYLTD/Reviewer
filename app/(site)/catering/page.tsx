import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { CateringForm } from "@/components/CateringForm";

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
      <Section size="tall">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label">Catering</p>
            <h1 className="mt-5 font-display text-display-lg leading-[0.96] text-ink">
              Trays for offices,
              <br />
              gatherings, and shiva.
            </h1>
            <p className="editorial mt-8 max-w-prose">
              Tell us how many people, when, and where. We&rsquo;ll send back a
              quote with a platter list, allergens marked, and a delivery
              window. Most enquiries are answered the same morning;
              forty-eight hours notice is plenty for orders under fifty.
            </p>
          </div>
          <div className="md:col-span-5">
            <Photo
              alt="An office catering platter"
              aspect="4 / 5"
            />
          </div>
        </div>
      </Section>

      {/* PLATTER LIST ------------------------------------------------------- */}
      <Section>
        <header className="mb-12 grid gap-6 md:grid-cols-12">
          <h2 className="md:col-span-6 font-display text-display-md text-ink">
            Sample platters.
          </h2>
          <p className="md:col-span-5 md:col-start-8 editorial">
            Starting points, not a fixed menu. Every catering order is built
            from your headcount, allergens, and service window.
          </p>
        </header>

        <ul className="grid gap-px border-t border-hairline md:grid-cols-2">
          {PLATTERS.map((p) => (
            <li key={p.name} className="border-b border-hairline px-1 py-10 md:px-6 md:py-12">
              <div className="flex items-baseline justify-between gap-6">
                <h3 className="font-display text-display-sm text-ink">{p.name}</h3>
                <span className="font-editorial italic text-[1rem] text-muted whitespace-nowrap">
                  {p.from}
                </span>
              </div>
              <p className="editorial mt-4">{p.detail}</p>
              <p className="label mt-6">Serves {p.serves}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ENQUIRY FORM ------------------------------------------------------- */}
      <Section>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label">Start an enquiry</p>
            <h2 className="mt-4 font-display text-display-md text-ink">
              We&rsquo;ll come back to you the same morning.
            </h2>
            <p className="editorial mt-6">
              Replies arrive from <span className="font-editorial italic">hello@ronisbelsize.com</span>.
              For urgent same-day catering, call the shop directly on{" "}
              <a className="anchor" href="tel:+442077948133">
                020 7794 8133
              </a>
              .
            </p>
          </div>
          <div className="md:col-span-7">
            <CateringForm />
          </div>
        </div>
      </Section>
    </main>
  );
}
