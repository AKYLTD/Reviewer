import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { OrderingPaths } from "@/components/OrderingPaths";
import { Reveal } from "@/components/Reveal";
import { Magnetic } from "@/components/Magnetic";
import { MorningTicker } from "@/components/MorningTicker";
import {
  KettleIllustration,
  BenchIllustration,
  CounterIllustration,
} from "@/components/Illustrations";
import { getContent } from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const content = await getContent();
  const { brand, hero, openingNote, process, hours, address } = content;

  return (
    <main>
      {/* MASTHEAD ----------------------------------------------------------- */}
      <Section size="tall">
        <Masthead
          artwork={brand.logoSrc || undefined}
          wordmark={brand.wordmark}
          subtitle={brand.subtitle}
          descriptor={brand.descriptor}
          addressNumber={brand.addressNumber}
          className="mx-auto max-w-[68rem]"
        />

        <div className="mx-auto mt-12 max-w-[28rem] text-center">
          <p className="editorial">{hero.subhead}</p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <Link href={hero.primaryCta.href} className="btn-ink">
              <span>{hero.primaryCta.label}</span>
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href={hero.secondaryCta.href} className="btn-ghost">
              {hero.secondaryCta.label}
            </Link>
          </Magnetic>
        </div>

        <div className="mt-14 flex justify-center">
          <MorningTicker />
        </div>
      </Section>

      {/* HERO PHOTOGRAPHY — full-bleed reveal -------------------------------- */}
      <div className="px-page-x">
        <Reveal as="photo" className="mx-auto max-w-[1440px]">
          <Photo
            alt="A morning bake of bagels, still warm"
            aspect="21 / 9"
            tone="ink"
          />
        </Reveal>
      </div>

      {/* OPENING NOTE — magazine-style, ember pull-quote underline ----------- */}
      <Section>
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <Reveal className="md:col-span-5">
            <p className="font-display text-display-md text-ink">
              {openingNote.title.split(",").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="text-ember">,</span>
                  )}
                </span>
              ))}
            </p>
          </Reveal>
          <div className="md:col-span-6 md:col-start-7">
            {openingNote.body.map((para, i) => (
              <Reveal key={i} delay={120 * (i + 1)}>
                <p className="editorial mt-5 first:mt-0">{para}</p>
              </Reveal>
            ))}
            <Reveal delay={400}>
              <Link
                href="/story"
                className="anchor mt-8 inline-block font-sans text-[0.78rem] font-light uppercase tracking-widest"
              >
                Read the story
              </Link>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* PROCESS STRIP — illustrations, not photographs ---------------------- */}
      <Section size="slim">
        <header className="mb-10 flex items-end justify-between gap-6">
          <p className="label">The bake</p>
          <span className="hidden md:block label text-muted">i — iii</span>
        </header>
        <div className="grid gap-6 md:grid-cols-3 md:gap-12">
          <Reveal delay={0}>
            <ProcessCard
              n={process[0]?.n ?? "i"}
              label={process[0]?.label ?? "Kettled"}
              illustration={
                <KettleIllustration title="Kettle" className="mx-auto h-44 w-44 text-ink" />
              }
            />
          </Reveal>
          <Reveal delay={140}>
            <ProcessCard
              n={process[1]?.n ?? "ii"}
              label={process[1]?.label ?? "Hand-rolled"}
              illustration={
                <BenchIllustration title="Bench" className="mx-auto h-44 w-44 text-ink" />
              }
            />
          </Reveal>
          <Reveal delay={280}>
            <ProcessCard
              n={process[2]?.n ?? "iii"}
              label={process[2]?.label ?? "Counter"}
              illustration={
                <CounterIllustration title="Counter" className="mx-auto h-44 w-44 text-ink" />
              }
            />
          </Reveal>
        </div>
      </Section>

      {/* ORDERING PATHS ----------------------------------------------------- */}
      <Section>
        <header className="mb-12 grid gap-6 md:grid-cols-12">
          <h2 className="md:col-span-6 font-display text-display-md text-ink">
            Four ways to order.
          </h2>
          <p className="md:col-span-5 md:col-start-8 editorial">
            Every path lands in the same kitchen, on the same printer, with
            the same baker. Choose by occasion.
          </p>
        </header>
        <OrderingPaths />
      </Section>

      {/* MENU TEASER — ember-emphasised price chip --------------------------- */}
      <section className="mt-12">
        <div className="grid gap-0 md:grid-cols-12">
          <Reveal as="photo" className="md:col-span-7">
            <Photo
              alt="Bagels on the counter, still warm"
              aspect="5 / 4"
              tone="warm"
              className="h-full"
            />
          </Reveal>
          <div className="flex flex-col justify-center bg-bone p-page-x py-16 md:col-span-5 md:py-24 md:pl-12 md:pr-page-x">
            <p className="label">From the till</p>
            <h3 className="mt-4 font-display text-display-md text-ink">
              Today&rsquo;s menu, live from the counter.
            </h3>
            <p className="editorial mt-5">
              Eat-in and takeaway, drawn directly from our till. Prices and
              availability update with the kitchen.
            </p>
            <p className="mt-6">
              <span className="price-chip">from £2.50</span>
              <span className="ml-2 font-editorial italic text-muted">
                a plain bagel, boiled this morning
              </span>
            </p>
            <Magnetic>
              <Link
                href="/menu"
                className="btn-ghost mt-8 self-start"
              >
                See the menu
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>

      {/* CATERING TEASER --------------------------------------------------- */}
      <section className="mt-px">
        <div className="grid gap-0 md:grid-cols-12">
          <div className="flex flex-col justify-center bg-ink text-paper p-page-x py-16 md:col-span-5 md:py-24 md:pl-page-x md:pr-12">
            <p className="label text-paper/70">For the office, the gathering, the shiva</p>
            <h3 className="mt-4 font-display text-display-md text-paper">
              Catering, quietly handled.
            </h3>
            <p className="editorial mt-5 text-paper/85">
              Tell us how many people, when, and where. We&rsquo;ll send back a
              quote with a platter list, allergens marked, and a delivery
              window. Most enquiries are answered the same morning.
            </p>
            <Magnetic>
              <Link
                href="/catering"
                className="mt-8 inline-flex items-center justify-center self-start border border-paper px-5 py-3 font-sans text-[0.72rem] font-light uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink"
              >
                Start a catering enquiry
              </Link>
            </Magnetic>
          </div>
          <Reveal as="photo" className="md:col-span-7">
            <Photo
              alt="A catering platter for an office of forty"
              aspect="5 / 4"
              tone="ink"
              className="h-full"
            />
          </Reveal>
        </div>
      </section>

      {/* VISIT --------------------------------------------------------------- */}
      <Section>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label">Visit</p>
            <p className="mt-4 font-display text-display-md text-ink leading-tight">
              {brand.addressNumber}
              <br />
              <span className="font-editorial italic font-semibold">Belsize Lane</span>
            </p>
            <p className="editorial mt-4">{address.line2}</p>
          </div>
          <div className="md:col-span-3">
            <p className="label">Hours</p>
            <ul className="editorial mt-4 space-y-1">
              {hours.map((row) => (
                <li key={row.day}>
                  {row.day} <span className="text-muted">·</span> {row.hours}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <p className="label">Nearest</p>
            <ul className="editorial mt-4 space-y-1">
              <li>Belsize Park · Northern line, 6 min walk</li>
              <li>Swiss Cottage · Jubilee line, 9 min walk</li>
              <li>Bus · 46 · 268 · C11</li>
            </ul>
            <Link
              href="/visit"
              className="anchor mt-6 inline-block font-sans text-[0.78rem] font-light uppercase tracking-widest"
            >
              Find us
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}

function ProcessCard({
  n,
  label,
  illustration,
}: {
  n: string;
  label: string;
  illustration: React.ReactNode;
}) {
  return (
    <article className="group flex flex-col items-center text-center">
      <div className="grid h-56 w-full place-items-center border border-hairline bg-bone/60 transition-colors group-hover:bg-bone">
        {illustration}
      </div>
      <p className="font-editorial italic text-muted mt-5">{n}.</p>
      <p className="font-display text-display-sm text-ink mt-2 max-w-[20ch]">
        {label}
      </p>
    </article>
  );
}
