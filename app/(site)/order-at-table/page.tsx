import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Magnetic } from "@/components/Magnetic";

export const metadata: Metadata = {
  title: "Order at table",
  description:
    "QR-driven dine-in ordering for guests at Roni's Bagel Bakery.",
};

export default function OrderAtTablePage() {
  return (
    <main>
      <Section size="tall" panel="cream" className="relative overflow-hidden">
<div className="relative max-w-2xl">
          <p className="label-rule">Order at table</p>
          <h1 className="mt-6 font-display font-700 text-display-xl text-coffee">
            The QR on your table
            <br />
            <span className="text-brick">opens here.</span>
          </h1>
          <p className="lede mt-8">
            Sitting in? Each table has a small marker with a code. Scan it to
            open the dine-in menu, order another flat white or a slice of
            babka, and pay without flagging anyone down. Your order prints in
            the kitchen the moment you confirm.
          </p>
          <p className="editorial mt-4 text-muted">
            The dine-in flow is being plumbed into Square Online&rsquo;s menu
            so a single till runs the room. Until then, our team will happily
            take your order at the counter.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Magnetic>
              <Link href="/click-collect" className="btn-primary">
                <span>Order ahead instead</span>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/visit" className="btn-saffron">
                Opening hours
              </Link>
            </Magnetic>
          </div>
        </div>
      </Section>
    </main>
  );
}
