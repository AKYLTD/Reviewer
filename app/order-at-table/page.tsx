import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Order at table",
  description:
    "QR-driven dine-in ordering for guests at Roni's Belsize Village. Powered by Square.",
};

/**
 * Holding page for the dine-in ordering flow. The production version is a
 * QR-anchored route — `/order-at-table?t=12` — that opens the matching Square
 * Online dine-in menu for that table. Until that integration is wired up,
 * this page serves as a polished placeholder.
 */
export default function OrderAtTablePage() {
  return (
    <main>
      <Section size="tall">
        <p className="label">Order at table</p>
        <h1 className="mt-6 max-w-[18ch] font-display text-display-lg leading-[0.96] text-ink">
          The QR on your table opens here.
        </h1>
        <p className="editorial mt-8 max-w-prose">
          Sitting in? Each table has a small marker with a code. Scan it to
          open the dine-in menu, order another flat white or a slice of babka,
          and pay without flagging anyone down. Your order prints in the
          kitchen the moment you confirm.
        </p>
        <p className="editorial mt-6 max-w-prose text-muted">
          The dine-in flow is being plumbed into Square Online&rsquo;s menu so
          a single till runs the room. Until then, our team will happily take
          your order at the counter.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/click-collect"
            className="inline-flex items-center justify-center border border-ink px-6 py-3 font-sans text-[0.78rem] font-light uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Order ahead instead
          </Link>
          <Link
            href="/visit"
            className="anchor inline-flex items-center font-sans text-[0.78rem] font-light uppercase tracking-widest"
          >
            See opening hours
          </Link>
        </div>
      </Section>
    </main>
  );
}
