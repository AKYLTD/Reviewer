import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Photo } from "@/components/Photo";

export const metadata: Metadata = {
  title: "Click & collect",
  description:
    "Order ahead from the bagel counter at 37–39 Belsize Lane. Walk in, walk out.",
};

const STEPS = [
  {
    n: "i",
    title: "Choose",
    body:
      "Browse the menu. Bagels by the dozen, sandwiches by the half, sides by the gram. Allergens marked alongside.",
  },
  {
    n: "ii",
    title: "Time it",
    body:
      "Pick a collection slot. Most orders are ready in twelve minutes; sandwiches we make at the counter when you arrive.",
  },
  {
    n: "iii",
    title: "Walk in",
    body:
      "Your order prints in the kitchen as you place it. Bring the confirmation; the queue at the till is for the curious.",
  },
];

export default function ClickCollectPage() {
  return (
    <main>
      <Section size="tall">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label">Click &amp; collect</p>
            <h1 className="mt-5 font-display text-display-lg leading-[0.96] text-ink">
              Order ahead.
              <br />
              Walk in, walk out.
            </h1>
            <p className="editorial mt-8 max-w-prose">
              Every order placed online prints directly in the kitchen at
              37&ndash;39 Belsize Lane. Pick a slot, pay, and your bag is on the
              shelf when you arrive.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              {/* Square Online checkout will be embedded here in production
                  per square-setup-plan.md. For now, the link points at a
                  placeholder route that the integration will replace. */}
              <a
                href="https://order.ronisbelsize.com"
                className="inline-flex items-center justify-center border border-ink bg-ink px-6 py-3 font-sans text-[0.78rem] font-light uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink"
              >
                Open the menu
              </a>
              <Link
                href="/visit"
                className="anchor inline-flex items-center font-sans text-[0.78rem] font-light uppercase tracking-widest text-ink"
              >
                See opening hours
              </Link>
            </div>
          </div>
          <div className="md:col-span-5">
            <Photo
              alt="Bagels boxed for collection"
              aspect="4 / 5"
            />
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-px border-t border-hairline md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.n} className="border-b border-hairline px-1 py-12 md:px-6">
              <p className="font-editorial italic text-[1rem] text-muted">{step.n}.</p>
              <h2 className="mt-3 font-display text-display-sm text-ink">{step.title}</h2>
              <p className="editorial mt-4">{step.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-none border border-hairline bg-bone p-page-x py-12 md:p-16">
          <p className="label">Lead times &amp; cut-offs</p>
          <ul className="editorial mt-6 grid gap-4 md:grid-cols-2">
            <li>
              <strong className="font-editorial font-semibold">Bagels by the dozen</strong>
              <br />
              Twelve minutes from order. Cut-off thirty minutes before close.
            </li>
            <li>
              <strong className="font-editorial font-semibold">Sandwiches</strong>
              <br />
              Made when you arrive. Order any time during opening hours.
            </li>
            <li>
              <strong className="font-editorial font-semibold">Breakfast platters</strong>
              <br />
              Two hours notice. Available from 8:00 daily.
            </li>
            <li>
              <strong className="font-editorial font-semibold">Whole cakes</strong>
              <br />
              Seventy-two hours. See the{" "}
              <Link href="/cakes" className="anchor">
                cake order
              </Link>
              {" "}page.
            </li>
          </ul>
        </div>
      </Section>
    </main>
  );
}
