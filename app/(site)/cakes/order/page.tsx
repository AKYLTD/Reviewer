import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { CakeBuilder } from "@/components/cake/CakeBuilder";
import { BagelMark } from "@/components/BagelMark";

export const metadata: Metadata = {
  title: "Order a cake",
  description:
    "Build your cake on the page — see it sketch out as you choose tiers, frosting, topper and inscription. Submit your order and the kitchen will come back the same morning.",
};

export default function CakeOrderPage() {
  return (
    <main>
      <Section size="tall" panel="cream" className="relative overflow-hidden">
        <span aria-hidden className="absolute -top-12 -left-16 opacity-20 pointer-events-none">
          <BagelMark className="h-72 w-72" spin />
        </span>
        <div className="relative max-w-3xl">
          <span className="label">Cake order</span>
          <h1 className="mt-5 font-display font-700 text-display-xl text-coffee leading-[0.95]">
            Build your cake.
            <br />
            <span className="text-brick">Watch it appear.</span>
          </h1>
          <p className="editorial mt-6 text-[1.15rem]">
            Pick the tiers, the frosting, the topper, the inscription. The
            sketch on the side updates as you go &mdash; what you see is what
            the kitchen will bake. Most orders need 72&nbsp;hours.
          </p>
        </div>
      </Section>

      <Section panel="ivory">
        <CakeBuilder />
      </Section>

      <Section panel="cream">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              t: "Same-morning quote",
              b: "We come back to your enquiry the same morning with a price and a confirmation of the design.",
            },
            {
              t: "Pay when you collect",
              b: "No payment until the cake leaves the kitchen. If something needs adjusting, we adjust.",
            },
            {
              t: "Allergen-aware",
              b: "Nut-free production line. Eggless, dairy-free, gluten-friendly, vegan options on most cakes.",
            },
          ].map((c) => (
            <article key={c.t} className="card p-7 h-full">
              <h3 className="font-display font-700 text-coffee text-xl">{c.t}</h3>
              <p className="editorial mt-3 text-[1rem]">{c.b}</p>
            </article>
          ))}
        </div>
      </Section>
    </main>
  );
}
