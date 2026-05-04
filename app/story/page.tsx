import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = {
  title: "Story",
  description:
    "From West Hampstead in 1989 to Belsize Village in 2011 — the long version.",
};

export default function StoryPage() {
  return (
    <main>
      <Section size="tall">
        <p className="label">Story</p>
        <h1 className="mt-6 max-w-[18ch] font-display text-display-lg leading-[0.96] text-ink">
          A small London bakery, twice over.
        </h1>
        <p className="editorial mt-8 max-w-prose">
          Roni&rsquo;s opened in West Hampstead in 1989. A second shop arrived
          in Belsize Village in 2011. In 2025 we re-cut the sign and started
          again on the building. This is the long version.
        </p>
      </Section>

      {/* 1989 --------------------------------------------------------------- */}
      <Section size="slim">
        <article className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-display text-display-md text-ink leading-none">1989</p>
            <p className="font-editorial italic text-[1rem] text-muted mt-3">
              West Hampstead
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="editorial">
              Roni Avital opened the first shop on West End Lane with a small
              kettle, a stone deck oven, and an unfashionable stubbornness about
              boiling bagels. The neighbourhood, then quieter than it is now,
              came for the bake. The shop never advertised; the ovens did the
              advertising.
            </p>
            <p className="editorial mt-6">
              The recipe wasn&rsquo;t handed down. It was written, weighed, and
              corrected over years &mdash; a slow dough, malted water, an
              honest crust. Two of those decisions are still in the book.
            </p>
          </div>
        </article>
      </Section>

      <div className="mx-auto max-w-[1280px] px-page-x">
        <Photo
          alt="The original West Hampstead shop, late 80s"
          aspect="3 / 2"
          caption="The first shop. West End Lane, NW6."
        />
      </div>

      {/* 2011 --------------------------------------------------------------- */}
      <Section size="slim">
        <article className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-display text-display-md text-ink leading-none">2011</p>
            <p className="font-editorial italic text-[1rem] text-muted mt-3">
              Belsize Village
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="editorial">
              The second shop opened on Belsize Lane. Same recipe, longer
              counter, a small dining room that became a Saturday-morning
              fixture. Alon Kubi joined as co-owner, and the kitchen widened
              its remit: breakfast platters, weekday sandwiches, weekend
              brunches, occasion cakes.
            </p>
            <p className="editorial mt-6">
              The shop became a village shop in a village street &mdash;
              prams in the morning, dog leads at lunch, regulars by name.
            </p>
          </div>
        </article>
      </Section>

      <div className="mx-auto max-w-[1280px] px-page-x">
        <div className="grid gap-3 md:grid-cols-2 md:gap-6">
          <Photo alt="Belsize Lane in the morning" aspect="4 / 5" />
          <Photo alt="The kitchen counter on a Saturday" aspect="4 / 5" />
        </div>
      </div>

      {/* 2025 --------------------------------------------------------------- */}
      <Section size="slim">
        <article className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-display text-display-md text-ink leading-none">2025</p>
            <p className="font-editorial italic text-[1rem] text-muted mt-3">
              The new sign
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <p className="editorial">
              We took the building back to its bones, kept the bake exactly as
              it was, and re-cut the shopfront sign &mdash; a tall Didone
              capital, an italic descriptor, and a wide-tracked address. The
              point of the redesign was not to look new; it was to look like
              the shop has always looked, only properly.
            </p>
            <p className="editorial mt-6">
              The till now talks to the kitchen printer, which means orders
              placed online, at a table, or for collection all flow through the
              same queue. The dough still rests overnight.
            </p>
          </div>
        </article>
      </Section>

      <Section>
        <blockquote className="mx-auto max-w-[40rem] border-l-2 border-ink pl-6">
          <p className="font-editorial italic text-[clamp(1.25rem,2.5vw,1.75rem)] leading-snug text-ink">
            &ldquo;You sell what you bake. When the rack is empty, you stop.
            That is the only rule we&rsquo;ve kept since 1989.&rdquo;
          </p>
          <footer className="label mt-6">Roni Avital</footer>
        </blockquote>
      </Section>
    </main>
  );
}
