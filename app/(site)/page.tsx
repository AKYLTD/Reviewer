import Link from "next/link";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { OrderingPaths } from "@/components/OrderingPaths";
import { Reveal } from "@/components/Reveal";
import { Magnetic } from "@/components/Magnetic";
import { MorningTicker } from "@/components/MorningTicker";
import { Marquee } from "@/components/Marquee";
import { QuickActions } from "@/components/QuickActions";
import { SignaturePanels } from "@/components/SignaturePanels";
import { getContent, primaryLocation } from "@/lib/content";

export const revalidate = 60;

const STEPS = [
  { title: "Choose", body: "Browse the menu, by the dozen or by the half." },
  { title: "Time it", body: "Pick a slot. Most orders are ready in twelve minutes." },
  { title: "Walk in", body: "Your order prints in the kitchen the moment you place it." },
];

export default async function HomePage() {
  const content = await getContent();
  const { brand, hero, openingNote } = content;
  const primary = primaryLocation(content);
  const { hours } = primary;
  const address = { line1: primary.addressLine1, line2: primary.addressLine2 };

  return (
    <main>
      {/* HERO ---------------------------------------------------------------- */}
      <Section size="tall" panel="cream" className="relative overflow-hidden">
        <div className="relative grid gap-x-12 gap-y-10 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <p className="label-rule">{brand.descriptor} · est. 1989</p>
            <h1 className="mt-6 font-display font-700 text-display-xl text-coffee">
              Fresh bagels,
              <br />
              <span className="text-brick">boiled this morning.</span>
            </h1>
            <p className="lede mt-8">
              {hero.subhead}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link href={hero.primaryCta.href} className="btn-primary">
                  <span>{hero.primaryCta.label}</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href={hero.secondaryCta.href} className="btn-ghost">
                  {hero.secondaryCta.label}
                </Link>
              </Magnetic>
            </div>
            <div className="mt-10 pt-6 border-t border-hairline">
              <MorningTicker />
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <SignaturePanels />
            <p className="mt-10 text-center label-muted">
              Three signatures from the kitchen — hover to explore
            </p>
          </div>
        </div>
      </Section>

      {/* MARQUEE BELT ------------------------------------------------------ */}
      <section className="bg-roseDeep py-6 overflow-hidden">
        <Marquee>
          {[
            "Bagels boiled at 5:30",
            "★",
            "Hand-rolled, rested cold",
            "★",
            "Smoked salmon · cream cheese · capers",
            "★",
            "Catering for 10 to 200",
            "★",
            "Open daily until 8pm",
            "★",
            "Four shops across north London",
            "★",
          ].map((t, i) => (
            <span
              key={i}
              className="font-display text-[1.35rem] font-500 text-cream whitespace-nowrap"
            >
              {t}
            </span>
          ))}
        </Marquee>
      </section>

      {/* QUICK ACTIONS — primary task strip ---------------------------------- */}
      <Section panel="cream" size="slim">
        <QuickActions />
      </Section>

      {/* WHAT WE MAKE — sketch grid ------------------------------------------ */}
      <Section panel="ivory">
        <header className="mb-10 grid gap-6 md:grid-cols-12 items-end">
          <div className="md:col-span-7">
            <span className="label">What we make</span>
            <h2 className="mt-3 font-display font-700 text-display-lg text-coffee">
              Bagels, brunch, brews &amp; cakes.
            </h2>
          </div>
          <p className="md:col-span-5 editorial">
            Boiled bagels are the backbone. Around them, a counter that turns
            into breakfast, into lunch, into a cake on a saffron stand.
          </p>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {[
            { mock: "icon-bagels"   as const, t: "Bagels" },
            { mock: "icon-coffee"   as const, t: "Coffee" },
            { mock: "icon-pastries" as const, t: "Pastries" },
            { mock: "icon-salads"   as const, t: "Salads" },
            { mock: "icon-catering" as const, t: "Catering" },
            { mock: "icon-cakes"    as const, t: "Cakes" },
          ].map((c) => (
            <li
              key={c.t}
              className="group rounded-xl bg-cream overflow-hidden shadow-soft transition-all hover:-translate-y-1 hover:shadow-pop"
            >
              <Photo
                mock={c.mock}
                alt={c.t}
                aspect="1 / 1"
                rounded="sm"
                className="!shadow-none [&>div]:rounded-none"
              />
              <p className="font-display font-700 text-coffee text-center py-4">
                {c.t}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* OPENING NOTE ------------------------------------------------------ */}
      <Section panel="cream">
        <div className="grid gap-10 md:grid-cols-12 items-center">
          <div className="md:col-span-5">
            <Reveal as="photo">
              <Photo mock="bagel-bench" alt="Bagels on the bench, hand-rolled" aspect="4 / 5" tone="saffron" rounded="xl" />
            </Reveal>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <span className="label">Our way</span>
            <h2 className="mt-4 font-display font-700 text-display-lg text-coffee leading-[1.0]">
              {openingNote.title}
            </h2>
            <div className="mt-6 space-y-5">
              {openingNote.body.map((p, i) => (
                <p key={i} className="editorial">{p}</p>
              ))}
            </div>
            <Magnetic>
              <Link href="/story" className="btn-ghost mt-8">
                Read the story
              </Link>
            </Magnetic>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS — three steps ---------------------------------------- */}
      <Section panel="ivory">
        <header className="mb-12 text-center">
          <span className="label">How it works</span>
          <h2 className="mt-4 font-display font-700 text-display-lg text-coffee">
            Three steps to a warm bag.
          </h2>
        </header>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <li className="card p-8 h-full text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-pill bg-saffron text-coffee font-display font-700 text-xl">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display font-700 text-2xl text-coffee">
                  {s.title}
                </h3>
                <p className="editorial mt-3">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <Magnetic>
            <Link href="/click-collect" className="btn-primary">
              <span>Order ahead now</span>
            </Link>
          </Magnetic>
        </div>
      </Section>

      {/* PROCESS — photos on saffron --------------------------------------- */}
      <Section panel="saffron">
        <header className="mb-12">
          <span className="label-muted">i — iii</span>
          <h2 className="mt-3 font-display font-700 text-display-lg text-coffee">
            From the kettle to the counter.
          </h2>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { mock: "process-kettle"  as const, n: "i",   t: "Kettled",      b: "Boiled in barley-malt water before they ever hit the oven." },
            { mock: "process-bench"   as const, n: "ii",  t: "Hand-rolled",  b: "Each ring shaped at the bench, rested cold overnight." },
            { mock: "process-counter" as const, n: "iii", t: "On the counter", b: "Across the counter while the crust is still warm." },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <article className="rounded-xl bg-cream overflow-hidden shadow-soft">
                <Photo
                  mock={s.mock}
                  alt={s.t}
                  aspect="4 / 3"
                  rounded="sm"
                  className="!shadow-none [&>div]:rounded-none"
                />
                <div className="p-6 text-center">
                  <p className="font-sans font-600 text-brick text-sm uppercase tracking-wide">
                    {s.n}.
                  </p>
                  <p className="mt-1 font-display font-700 text-2xl text-coffee">
                    {s.t}
                  </p>
                  <p className="mt-2 font-sans text-sm text-coffee/75">
                    {s.b}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FOUR ORDERING PATHS ------------------------------------------------ */}
      <Section panel="cream">
        <header className="mb-12 grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <span className="label">Order</span>
            <h2 className="mt-4 font-display font-700 text-display-lg text-coffee">
              Four ways to get your bagels.
            </h2>
          </div>
          <p className="md:col-span-5 editorial">
            Every path lands on the same kitchen printer, with the same baker.
            Choose by occasion.
          </p>
        </header>
        <OrderingPaths />
      </Section>

      {/* CATERING TEASER --- big brick block --------------------------------- */}
      <section className="panel-brick">
        <div className="mx-auto max-w-[1320px] px-page-x py-20 md:py-28 grid gap-12 md:grid-cols-12 items-center">
          <div className="md:col-span-5">
            <span className="label">Catering</span>
            <h2 className="mt-4 font-display font-700 text-display-lg leading-[1.0]">
              Trays for the office,
              <br />
              <span className="text-saffron">quietly handled.</span>
            </h2>
            <p className="editorial mt-6">
              Tell us how many people, when, and where. We&rsquo;ll come back
              the same morning with a quote, an allergen-marked platter list,
              and a delivery window.
            </p>
            <Magnetic>
              <Link href="/catering" className="btn-saffron mt-8">
                Start an enquiry
              </Link>
            </Magnetic>
          </div>
          <div className="md:col-span-7">
            <Reveal as="photo">
              <Photo
                mock="platter"
                alt="A catering platter for an office"
                aspect="5 / 4"
                tone="coffee"
                rounded="xl"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* MENU TEASER --- ivory ---------------------------------------------- */}
      <Section panel="ivory">
        <div className="grid gap-12 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <Reveal as="photo">
              <Photo mock="bakery-interior" alt="Today's menu on the counter" aspect="3 / 2" tone="cream" rounded="xl" />
            </Reveal>
          </div>
          <div className="md:col-span-5">
            <span className="label">Today&rsquo;s menu</span>
            <h2 className="mt-4 font-display font-700 text-display-lg text-coffee leading-[1.0]">
              Live from the till.
            </h2>
            <p className="editorial mt-6">
              The menu page is wired straight to our Square till. Prices and
              availability update with the kitchen. When the rack runs out,
              the item disappears.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <span className="price-chip">from £2.50</span>
              <span className="font-display text-coffee/70">a plain bagel, boiled this morning</span>
            </div>
            <Magnetic>
              <Link href="/menu" className="btn-primary mt-8">
                <span>See the menu</span>
              </Link>
            </Magnetic>
          </div>
        </div>
      </Section>

      {/* VISIT --------------------------------------------------------------- */}
      <Section panel="cream">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label">Visit</p>
            <h2 className="mt-4 font-display font-700 text-display-lg text-coffee leading-[1.0]">
              Four shops,
              <br />
              <span className="text-brick">one bake.</span>
            </h2>
            <p className="editorial mt-4">
              Belsize Village, Swain&rsquo;s Lane, West Hampstead and
              Muswell Hill.
            </p>
            <Magnetic>
              <Link href="/visit" className="btn-ghost mt-6">
                Find all four
              </Link>
            </Magnetic>
          </div>
          <div className="md:col-span-3">
            <p className="label">{primary.shortName} today</p>
            <ul className="editorial mt-4 space-y-1">
              {hours.map((row) => (
                <li key={row.day}>
                  <strong className="font-600 text-coffee">{row.day}</strong>
                  <br />
                  {row.hours}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <span className="label">Nearest</span>
            <ul className="editorial mt-4 space-y-1">
              <li><strong className="font-600 text-coffee">Belsize Park</strong> · Northern line, 6 min walk</li>
              <li><strong className="font-600 text-coffee">Swiss Cottage</strong> · Jubilee line, 9 min walk</li>
              <li><strong className="font-600 text-coffee">Bus</strong> · 46 · 268 · C11</li>
            </ul>
          </div>
        </div>
      </Section>
    </main>
  );
}
