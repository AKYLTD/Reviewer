import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = {
  title: "Cakes & occasions",
  description:
    "Custom cakes, Shabbat challahs, and celebration trays from Roni's Belsize Village. Seventy-two hours notice, allergen-aware.",
};

const OCCASIONS = [
  { title: "Birthdays", body: "Layered sponges, naked or iced, with custom inscriptions piped in dark or pale chocolate." },
  { title: "Shabbat", body: "Plaited challahs reserved by Friday lunch. Plain, sweet, raisin, or sesame-topped." },
  { title: "Holidays", body: "Honey cakes for Rosh Hashanah, hamantaschen for Purim, sufganiyot for Hanukkah." },
  { title: "Weddings & engagements", body: "Tiered cakes with sugarwork and edible-flower finishes. Tasting by appointment." },
];

export default function CakesPage() {
  return (
    <main>
      <Section size="tall">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label">Cakes &amp; occasions</p>
            <h1 className="mt-5 font-display text-display-lg leading-[0.96] text-ink">
              For the day
              <br />
              that needs marking.
            </h1>
            <p className="editorial mt-8 max-w-prose">
              Birthday cakes, Shabbat challahs, holiday trays, and the
              kettle-boiled celebration boxes that started it all. Seventy-two
              hours is comfortable; we&rsquo;ll always try shorter if the
              kitchen has room.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="mailto:cakes@ronisbelsize.com"
                className="inline-flex items-center justify-center border border-ink bg-ink px-6 py-3 font-sans text-[0.78rem] font-light uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink"
              >
                Order a cake
              </a>
              <Link
                href="/catering"
                className="anchor inline-flex items-center font-sans text-[0.78rem] font-light uppercase tracking-widest"
              >
                Catering instead?
              </Link>
            </div>
          </div>
          <div className="md:col-span-5">
            <Photo
              alt="A celebration cake at the pass"
              aspect="4 / 5"
            />
          </div>
        </div>
      </Section>

      {/* OCCASIONS GRID ----------------------------------------------------- */}
      <Section>
        <header className="mb-10 grid gap-6 md:grid-cols-12">
          <h2 className="md:col-span-6 font-display text-display-md text-ink">
            What we make.
          </h2>
          <p className="md:col-span-5 md:col-start-8 editorial">
            A short list, made well, rather than a long one made anywhere. If
            you don&rsquo;t see it here, ask &mdash; we&rsquo;ve probably made
            it before.
          </p>
        </header>
        <ul className="grid gap-px border-t border-hairline md:grid-cols-2">
          {OCCASIONS.map((occasion) => (
            <li key={occasion.title} className="border-b border-hairline px-1 py-10 md:px-6 md:py-12">
              <h3 className="font-display text-display-sm text-ink">{occasion.title}</h3>
              <p className="editorial mt-4">{occasion.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* GALLERY ------------------------------------------------------------ */}
      <Section>
        <p className="label">Recent makes</p>
        <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-6">
          <Photo alt="A buttercream layer cake" aspect="4 / 5" />
          <Photo alt="Plaited challah, sesame-topped" aspect="4 / 5" />
          <Photo alt="A tray of rugelach" aspect="4 / 5" />
        </div>
      </Section>

      {/* TRUST PROMISE ------------------------------------------------------ */}
      <Section>
        <div className="border border-hairline bg-bone p-page-x py-12 md:p-16">
          <p className="label">Allergens &amp; dietary</p>
          <p className="editorial mt-6 max-w-prose">
            Nut-free production line. Eggless, dairy-free, and gluten-friendly
            options for most occasion cakes &mdash; ask when you order. Every
            cake is labelled with allergen information at the till.
          </p>
        </div>
      </Section>
    </main>
  );
}
