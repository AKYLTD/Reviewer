import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";
import { Magnetic } from "@/components/Magnetic";
import { BagelMark } from "@/components/BagelMark";

export const metadata: Metadata = {
  title: "Click & collect",
  description:
    "Order ahead from the bagel counter at 37–39 Belsize Lane. Walk in, walk out.",
};

const STEPS = [
  { n: 1, title: "Choose", body: "Browse the menu. Bagels by the dozen, sandwiches by the half, sides by the gram." },
  { n: 2, title: "Time it", body: "Pick a slot. Most orders are ready in twelve minutes; sandwiches we make at the counter." },
  { n: 3, title: "Walk in", body: "Your order prints in the kitchen as you place it. The queue is for the curious." },
];

const LEAD = [
  { what: "Bagels by the dozen", time: "12 min" },
  { what: "Sandwiches", time: "On arrival" },
  { what: "Breakfast platters", time: "2 hr" },
  { what: "Whole cakes", time: "72 hr" },
];

export default function ClickCollectPage() {
  return (
    <main>
      <Section size="tall" panel="cream" className="relative overflow-hidden">
        <span aria-hidden className="absolute -top-16 right-12 opacity-25 pointer-events-none">
          <BagelMark className="h-72 w-72" spin />
        </span>
        <div className="relative grid gap-10 md:grid-cols-12 items-center">
          <div className="md:col-span-7">
            <span className="label">Click &amp; collect</span>
            <h1 className="mt-5 font-display font-700 text-display-xl text-coffee leading-[0.95]">
              Order ahead.
              <br />
              <span className="text-brick">Walk in, walk out.</span>
            </h1>
            <p className="editorial mt-6 max-w-prose text-[1.15rem]">
              Every order placed online prints directly in the kitchen at
              37&ndash;39 Belsize Lane. Pick a slot, pay, and your bag is on the
              shelf when you arrive.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <a
                  href="https://order.ronisbelsize.com"
                  className="btn-primary"
                >
                  <span>Open the menu</span>
                </a>
              </Magnetic>
              <Magnetic>
                <Link href="/visit" className="btn-saffron">
                  See opening hours
                </Link>
              </Magnetic>
            </div>
          </div>
          <div className="md:col-span-5">
            <Photo
              mock="bagel-counter"
              alt="Bagels boxed for collection"
              aspect="4 / 5"
              tone="brick"
              rounded="xl"
            />
          </div>
        </div>
      </Section>

      <Section panel="ivory">
        <header className="mb-12 text-center">
          <span className="label">How it works</span>
          <h2 className="mt-4 font-display font-700 text-display-lg text-coffee">
            Three steps to a warm bag.
          </h2>
        </header>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="card p-8 h-full text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-pill bg-saffron text-coffee font-display font-700 text-xl">
                {s.n}
              </span>
              <h3 className="mt-5 font-display font-700 text-2xl text-coffee">{s.title}</h3>
              <p className="editorial mt-3">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section panel="cream">
        <header className="mb-10">
          <span className="label">Lead times</span>
          <h2 className="mt-3 font-display font-700 text-display-md text-coffee">
            How early to order.
          </h2>
        </header>
        <ul className="grid gap-4 md:grid-cols-2">
          {LEAD.map((row) => (
            <li
              key={row.what}
              className="flex items-center justify-between gap-5 rounded-xl bg-ivory p-6 shadow-soft"
            >
              <span className="font-display font-700 text-lg text-coffee">{row.what}</span>
              <span className="price-chip whitespace-nowrap">{row.time}</span>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
