import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { CakeBuilder } from "@/components/cake/CakeBuilder";
import { CakePhoto } from "@/components/cake/CakePhoto";
import { getContent, primaryLocation } from "@/lib/content";
import type { CakeConfig } from "@/components/cake/types";

export const metadata: Metadata = {
  title: "Order a cake",
  description:
    "Build your cake on the page — pick the size, shape, filling and cover, watch the sketch redraw, and submit the order straight to our kitchen.",
};

export const revalidate = 60;

const POPULAR: { config: CakeConfig; name: string; sub: string }[] = [
  {
    name: "The Birthday Brick",
    sub: "10 inch · round · buttercream · vanilla sponge",
    config: {
      size: "10",
      shape: "round",
      cover: "buttercream",
      base: "vanilla",
      fillings: ["vanilla"],
      message: "Happy Birthday",
    },
  },
  {
    name: "The Chocolate Drip",
    sub: "12 inch · round · ganache · chocolate sponge",
    config: {
      size: "12",
      shape: "round",
      cover: "ganache",
      base: "chocolate",
      fillings: ["chocolate"],
      message: "",
    },
  },
  {
    name: "The Berry Square",
    sub: "10 inch · square · icing · vanilla with fruit",
    config: {
      size: "10",
      shape: "square",
      cover: "icing",
      base: "vanilla",
      fillings: ["vanilla", "fruits"],
      message: "",
    },
  },
];

const STEPS = [
  {
    n: "01",
    t: "You design",
    b: "Build it on this page. The sketch updates as you go and the running total tells you what you'll pay.",
  },
  {
    n: "02",
    t: "We confirm",
    b: "We come back the same morning by email or phone. Special shapes get a quote; everything else gets a yes.",
  },
  {
    n: "03",
    t: "We bake",
    b: "Your order rings up directly on our till and prints in the kitchen. Bakers see exactly what you ordered.",
  },
  {
    n: "04",
    t: "You collect",
    b: "Pick up at the shop you chose. Payment when you collect — no money up front.",
  },
];

export default async function CakeOrderPage() {
  const content = await getContent();
  const primary = primaryLocation(content);
  const pickupLocations = content.locations.map((l) => ({ id: l.id, label: l.name }));

  return (
    <main>
      {/* HEAD ----------------------------------------------------------- */}
      <Section size="tall" panel="cream" className="relative overflow-hidden">
<div className="relative grid gap-10 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <p className="label-rule">Cake order</p>
            <h1 className="mt-6 font-display font-700 text-display-xl text-coffee">
              Build your cake.
              <br />
              <span className="text-brick">Watch it appear.</span>
            </h1>
            <p className="lede mt-8">
              Pick the size, the shape, what&rsquo;s inside, what goes on top.
              The preview on the side updates as you go &mdash; what you see is
              what the kitchen will bake.
            </p>
          </div>

          {/* Trust strip — what makes this safe to do online --------------- */}
          <ul className="md:col-span-5 grid gap-3">
            {[
              { t: "Pay on collection", b: "No card details taken online — we charge you when the cake leaves the kitchen." },
              { t: "Straight to the till", b: "Your order rings up on our till and prints for the kitchen team automatically." },
              { t: "Same-morning reply", b: "We confirm by email the same morning, often within an hour." },
              { t: "Open since 1989", b: "Family bakery across four London shops. Hundreds of cakes a year." },
            ].map((c) => (
              <li key={c.t} className="rounded-md bg-ivory px-5 py-4 shadow-soft flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-saffron text-coffee font-display font-700 text-sm">
                  ✓
                </span>
                <div>
                  <p className="font-display font-700 text-coffee">{c.t}</p>
                  <p className="font-sans text-sm text-coffee/80 mt-1">{c.b}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* POPULAR PRESETS --- live sketches ------------------------------- */}
      <Section panel="ivory">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="label">Most ordered</span>
            <h2 className="mt-3 font-display font-700 text-display-md text-coffee">
              Start from one of these.
            </h2>
          </div>
          <p className="font-sans text-sm text-muted max-w-md">
            Pick the closest, then change anything. The form below is fully
            customisable.
          </p>
        </header>
        <ul className="grid gap-5 md:grid-cols-3">
          {POPULAR.map((p) => (
            <li
              key={p.name}
              className="rounded-xl bg-cream p-6 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop"
            >
              <CakePhoto config={p.config} compact className="mx-auto w-40" />
              <p className="mt-4 font-display font-700 text-coffee text-lg">{p.name}</p>
              <p className="mt-1 font-sans text-xs text-coffee/70">{p.sub}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* HOW IT WORKS --- 4-step timeline -------------------------------- */}
      <Section panel="cream">
        <header className="mb-10 text-center">
          <span className="label">How it works</span>
          <h2 className="mt-3 font-display font-700 text-display-md text-coffee">
            Four steps. No surprises.
          </h2>
        </header>
        <ol className="grid gap-4 md:grid-cols-4 relative">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-xl bg-ivory p-6 shadow-soft">
              <span className="font-display font-700 text-brick text-2xl">{s.n}</span>
              <h3 className="mt-3 font-display font-700 text-coffee text-xl">{s.t}</h3>
              <p className="font-sans text-sm text-coffee/80 mt-3 leading-relaxed">
                {s.b}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* THE BUILDER ----------------------------------------------------- */}
      <Section panel="ivory" id="build">
        <CakeBuilder
          locations={pickupLocations}
          defaultLocationId={primary?.id ?? pickupLocations[0]?.id ?? "other"}
        />
      </Section>

      {/* CONTACT FOOT ---------------------------------------------------- */}
      <Section panel="brick">
        <div className="grid gap-6 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <span className="label text-saffron">Need help?</span>
            <h2 className="mt-3 font-display font-700 text-display-md leading-[1.0]">
              Talk to us before you submit.
            </h2>
            <p className="editorial mt-4">
              Special shapes, big numbers, or something that isn&rsquo;t on
              the form? Email{" "}
              <a className="anchor font-600 text-saffron" href="mailto:info@ronisonline.com">
                info@ronisonline.com
              </a>{" "}
              and we&rsquo;ll work it out.
            </p>
          </div>
          <div className="md:col-span-5 flex md:justify-end">
            <a href="mailto:info@ronisonline.com" className="btn-saffron">
              <span>Email the kitchen</span>
            </a>
          </div>
        </div>
      </Section>
    </main>
  );
}
