import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";
import { BagelMark } from "@/components/BagelMark";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Story",
  description:
    "From West Hampstead in 1989 to Belsize Village in 2011 — the long version.",
};

export const revalidate = 60;

export default async function StoryPage() {
  const { story } = await getContent();

  return (
    <main>
      <Section size="tall" panel="cream" className="relative overflow-hidden">
        <span aria-hidden className="absolute -bottom-20 -right-20 opacity-25 pointer-events-none">
          <BagelMark className="h-96 w-96" spin />
        </span>
        <div className="relative max-w-3xl">
          <span className="label">Story</span>
          <h1 className="mt-5 font-display font-700 text-display-xl text-coffee leading-[0.95]">
            A small London bakery,
            <br />
            <span className="text-brick">twice over.</span>
          </h1>
          <p className="editorial mt-6 text-[1.15rem]">{story.intro}</p>
        </div>
      </Section>

      {story.milestones.map((m, i) => (
        <Section
          key={m.year}
          panel={i % 2 === 0 ? "ivory" : "cream"}
          size="slim"
        >
          <Reveal>
            <article className="grid gap-12 md:grid-cols-12 items-start">
              <div className="md:col-span-4">
                <p className="font-display font-700 text-display-xl text-brick leading-none">
                  {m.year}
                </p>
                <p className="font-display text-coffee text-2xl mt-3">{m.place}</p>
              </div>
              <div className="md:col-span-7 md:col-start-6">
                <p className="editorial text-[1.1rem]">{m.body}</p>
              </div>
            </article>
          </Reveal>
        </Section>
      ))}

      <Section panel="brick">
        <blockquote className="mx-auto max-w-3xl text-center">
          <p className="font-display font-500 text-display-md leading-[1.15] text-cream italic">
            &ldquo;You sell what you bake. When the rack is empty, you stop.
            That is the only rule we&rsquo;ve kept since 1989.&rdquo;
          </p>
          <footer className="label mt-6 text-saffron">Roni Avital</footer>
        </blockquote>
      </Section>

      <Section panel="cream">
        <div className="grid gap-5 md:grid-cols-3">
          <Photo mock="shopfront" alt="The original West Hampstead shop, late 80s" aspect="4 / 5" tone="coffee" rounded="xl" />
          <Photo mock="bakery-interior" alt="Belsize Lane in the morning" aspect="4 / 5" tone="saffron" rounded="xl" />
          <Photo mock="bagel-counter" alt="The kitchen counter on a Saturday" aspect="4 / 5" tone="brick" rounded="xl" />
        </div>
      </Section>
    </main>
  );
}
