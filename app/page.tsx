import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { OrderingPaths } from "@/components/OrderingPaths";

export default function HomePage() {
  return (
    <main>
      {/* MASTHEAD ----------------------------------------------------------- */}
      <Section size="tall">
        <Masthead artwork={undefined} className="mx-auto max-w-[68rem]" />
        <p className="mx-auto mt-10 max-w-[28rem] text-center editorial">
          A bagel bakery and caf&eacute; on Belsize Lane. Boiled, baked, and
          handed across the counter since 2011.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/click-collect"
            className="inline-flex items-center justify-center border border-ink bg-ink px-6 py-3 font-sans text-[0.78rem] font-light uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Order ahead
          </Link>
          <Link
            href="/catering"
            className="inline-flex items-center justify-center border border-ink px-6 py-3 font-sans text-[0.78rem] font-light uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Catering enquiry
          </Link>
        </div>
      </Section>

      {/* HERO PHOTOGRAPHY --------------------------------------------------- */}
      {/* Drop the morning-bake photograph at /public/images/hero-bagels.jpg
          and add `src="/images/hero-bagels.jpg"` to the Photo below. The
          intentional placeholder plate is what renders until then. */}
      <div className="relative">
        <div className="px-page-x">
          <Photo
            alt="A morning bake of bagels, still warm"
            aspect="16 / 9"
            priority
            className="mx-auto max-w-[1440px]"
          />
        </div>
      </div>

      {/* OPENING NOTE — magazine-style two column ---------------------------- */}
      <Section>
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <p className="font-display text-display-md text-ink">
              Boiled in the morning, eaten before the lunch rush.
            </p>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="editorial">
              Our dough is mixed the night before and rested cold so the crust
              cracks rather than tears. Each bagel is hand-rolled, kettled in
              barley malt, and baked through to a chestnut top. We sell what we
              bake; when the rack runs out, we stop.
            </p>
            <p className="editorial mt-5">
              Behind the counter is a kitchen that turns those bagels into
              breakfast platters, weekday sandwiches, weekend brunches, and
              celebration trays. The till sends every order straight to the
              kitchen printer &mdash; the queue you see on the screen is the
              queue we&rsquo;re working through.
            </p>
            <Link
              href="/story"
              className="anchor mt-8 inline-block font-sans text-[0.78rem] font-light uppercase tracking-widest"
            >
              Read the story
            </Link>
          </div>
        </div>
      </Section>

      {/* PROCESS STRIP — three slim photographs -------------------------------- */}
      <Section size="slim">
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          <Photo
            alt="Bagels in the kettle"
            aspect="4 / 5"
            caption="i. Kettled in barley-malt water"
          />
          <Photo
            alt="Hand-rolled dough at the bench"
            aspect="4 / 5"
            caption="ii. Hand-rolled, rested cold"
          />
          <Photo
            alt="Breakfast platter on the pass"
            aspect="4 / 5"
            caption="iii. Across the counter"
          />
        </div>
      </Section>

      {/* ORDERING PATHS ----------------------------------------------------- */}
      <Section>
        <header className="mb-12 grid gap-6 md:grid-cols-12">
          <h2 className="md:col-span-6 font-display text-display-md text-ink">
            Four ways to order.
          </h2>
          <p className="md:col-span-5 md:col-start-8 editorial">
            Every path lands in the same kitchen, on the same printer, with the
            same baker. Choose by occasion.
          </p>
        </header>
        <OrderingPaths />
      </Section>

      {/* CATERING TEASER — full-bleed editorial ------------------------------ */}
      <section className="mt-12">
        <div className="grid gap-0 md:grid-cols-12">
          <div className="md:col-span-7">
            <Photo
              alt="A catering platter for an office of forty"
              aspect="5 / 4"
              className="h-full"
            />
          </div>
          <div className="flex flex-col justify-center bg-bone p-page-x py-16 md:col-span-5 md:py-24 md:pl-12 md:pr-page-x">
            <p className="label">For the office, the gathering, the shiva</p>
            <h3 className="mt-4 font-display text-display-md text-ink">
              Catering, quietly handled.
            </h3>
            <p className="editorial mt-5">
              Tell us how many people, when, and where. We&rsquo;ll send back a
              quote with a platter list, allergens marked, and a delivery
              window. Most enquiries are answered the same morning.
            </p>
            <Link
              href="/catering"
              className="mt-8 inline-flex items-center justify-center self-start border border-ink px-5 py-3 font-sans text-[0.72rem] font-light uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Start a catering enquiry
            </Link>
          </div>
        </div>
      </section>

      {/* VISIT --------------------------------------------------------------- */}
      <Section>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label">Visit</p>
            <p className="mt-4 font-display text-display-md text-ink leading-tight">
              37&ndash;39
              <br />
              Belsize Lane
            </p>
            <p className="editorial mt-4">London NW3 5AS</p>
          </div>
          <div className="md:col-span-3">
            <p className="label">Hours</p>
            <ul className="editorial mt-4 space-y-1">
              <li>Mon &ndash; Fri &middot; 7:00 &ndash; 20:00</li>
              <li>Saturday &middot; 8:00 &ndash; 20:00</li>
              <li>Sunday &middot; 8:00 &ndash; 18:00</li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <p className="label">Nearest</p>
            <ul className="editorial mt-4 space-y-1">
              <li>Belsize Park &middot; Northern line, 6 min walk</li>
              <li>Swiss Cottage &middot; Jubilee line, 9 min walk</li>
              <li>Bus &middot; 46 &middot; 268 &middot; C11</li>
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
