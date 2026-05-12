import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { getContent } from "@/lib/content";
import { getCurrentCustomerSession } from "@/lib/customerAuth";
import { getCustomer } from "@/lib/customers";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Roni's Bagel Bakery order.",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [content, session] = await Promise.all([
    getContent(),
    getCurrentCustomerSession(),
  ]);
  const customer = session ? await getCustomer(session.sub) : null;
  const locations = content.locations.map((l) => ({ id: l.id, label: l.name }));

  return (
    <main>
      <Section size="slim" panel="cream">
        <p className="label-rule">Checkout</p>
        <h1 className="mt-4 font-display font-700 text-display-md text-coffee">
          Where and when?
        </h1>
      </Section>
      <Section panel="ivory">
        <CheckoutForm
          locations={locations}
          customer={customer ? {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone ?? "",
            points: customer.points,
          } : null}
        />
      </Section>
    </main>
  );
}
