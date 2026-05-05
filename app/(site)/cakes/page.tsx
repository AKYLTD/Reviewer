import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { Magnetic } from "@/components/Magnetic";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Cakes & occasions",
  description:
    "Custom cakes, Shabbat challahs, and celebration trays from Roni's Belsize Village.",
};

const OCCASIONS = [
  { title: "Birthdays", body: "Layered sponges, naked or iced, with custom inscriptions." },
  { title: "Shabbat", body: "Plaited challahs reserved by Friday lunch. Plain, sweet, raisin, sesame-topped." },
  { title: "Holidays", body: "Honey cakes for Rosh Hashanah, hamantaschen for Purim, sufganiyot for Hanukkah." },
  { title: "Weddings", body: "Tiered cakes with sugarwork and edible-flower finishes." },
];

export default function CakesPage() {
  return (
    <main>
      <Section size="tall" panel="cream" className="relative overflow-hidden">
<div className="relative grid gap-10 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <span className="label">Cakes &amp; occasions</span>
            <h1 className="mt-5 font-display font-700 text-display-xl text-coffee leading-[0.95]">
              For the day
              <br />
              <span className="text-brick">that needs marking.</span>
            </h1>
            <p className="editorial mt-6 max-w-prose text-[1.15rem]">
              Birthday cakes, Shabbat challahs, holiday trays, and the
              kettle-boiled celebration boxes that started it all.
              Seventy-two hours is comfortable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Link href="/cakes/order" className="btn-primary">
                  <span>Build your cake</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/catering" className="btn-saffron">Catering instead?</Link>
              </Magnetic>
            </div>
          </div>
          <div className="md:col-span-5">
            <Photo mock="cake-buttercream-round" alt="A celebration cake at the pass" aspect="4 / 5" tone="brick" rounded="xl" />
          </div>
        </div>
      </Section>

      <Section panel="ivory">
        <header className="mb-10 grid gap-6 md:grid-cols-12 items-end">
          <div className="md:col-span-7">
            <span className="label">What we make</span>
            <h2 className="mt-3 font-display font-700 text-display-lg text-coffee">
              A short list, made well.
            </h2>
          </div>
          <p className="md:col-span-5 editorial">
            If you don&rsquo;t see it here, ask &mdash; we&rsquo;ve probably
            made it before.
          </p>
        </header>
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {OCCASIONS.map((o, i) => (
            <li key={o.title}>
              <Reveal delay={i * 80}>
                <article className="card h-full p-7 transition-all hover:-translate-y-1 hover:shadow-pop">
                  <h3 className="font-display font-700 text-2xl text-coffee">{o.title}</h3>
                  <p className="editorial mt-3 text-[0.98rem]">{o.body}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section panel="cream">
        <span className="label">Recent makes</span>
        <h2 className="mt-3 font-display font-700 text-display-md text-coffee">
          From the kitchen, lately.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Photo mock="cake-stack" alt="A buttercream layer cake" aspect="4 / 5" tone="saffron" rounded="xl" />
          <Photo mock="cake-decorating" alt="Plaited challah, sesame-topped" aspect="4 / 5" tone="cream" rounded="xl" />
          <Photo mock="cake-buttercream-round" alt="A tray of rugelach" aspect="4 / 5" tone="brick" rounded="xl" />
        </div>
      </Section>

      <Section panel="saffron">
        <div className="grid gap-8 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <span className="label-muted">Allergens &amp; dietary</span>
            <h2 className="mt-3 font-display font-700 text-display-md text-coffee leading-[1.0]">
              Nut-free production line.
            </h2>
            <p className="editorial mt-4 max-w-prose">
              Eggless, dairy-free, and gluten-friendly options for most
              occasion cakes &mdash; ask when you order. Every cake is
              labelled with allergen information at the till.
            </p>
          </div>
          <div className="md:col-span-5 flex md:justify-end">
            <Magnetic>
              <Link href="/cakes/order" className="btn-primary">
                <span>Build your cake</span>
              </Link>
            </Magnetic>
          </div>
        </div>
      </Section>
    </main>
  );
}
