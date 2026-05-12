import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Section } from "@/components/Section";
import { getCurrentCustomerSession } from "@/lib/customerAuth";
import { getCustomer, updateCustomer, POINTS_PER_REWARD, REWARD_VALUE_PENCE } from "@/lib/customers";
import { listOrders, priceFromPence } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account" };

async function saveProfile(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await updateCustomer(id, {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  revalidatePath("/account");
  redirect("/account?saved=1");
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const session = await getCurrentCustomerSession();
  if (!session) redirect("/login?next=/account");
  const customer = await getCustomer(session.sub);
  if (!customer) redirect("/login?next=/account");

  const allOrders = await listOrders();
  const myOrders = allOrders.filter((o) => customer.orderIds.includes(o.id));

  const rewardsAvailable = Math.floor(customer.points / POINTS_PER_REWARD);
  const nextReward = POINTS_PER_REWARD - (customer.points % POINTS_PER_REWARD);
  const progressPct = Math.min(
    100,
    ((customer.points % POINTS_PER_REWARD) / POINTS_PER_REWARD) * 100,
  );

  return (
    <main>
      <Section size="slim" panel="cream">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-rule">Your account</p>
            <h1 className="mt-4 font-display font-700 text-display-md text-coffee">
              Hi {customer.name.split(" ")[0]}.
            </h1>
            <p className="font-sans text-coffee/70 mt-2">{customer.email}</p>
          </div>
          <Link href="/logout" className="btn-ghost text-xs px-5">
            Sign out
          </Link>
        </header>
      </Section>

      <Section panel="cream">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LOYALTY CARD — saffron with progress */}
          <article className="lg:col-span-1 rounded-xl bg-saffron p-7 shadow-soft relative overflow-hidden">
            <p className="font-sans font-600 text-xs uppercase tracking-wide text-coffee/80">
              Loyalty balance
            </p>
            <p className="mt-2 font-display font-700 text-display-lg leading-none text-coffee tabular-nums">
              {customer.points}
            </p>
            <p className="font-display text-coffee/80 mt-1">points</p>

            <div className="mt-6">
              {rewardsAvailable > 0 ? (
                <p className="font-display font-700 text-coffee">
                  {rewardsAvailable} reward{rewardsAvailable === 1 ? "" : "s"} ready to redeem.
                </p>
              ) : (
                <p className="font-sans text-sm text-coffee">
                  {nextReward} pts to your next £{(REWARD_VALUE_PENCE / 100).toFixed(0)} reward.
                </p>
              )}
              <div
                className="mt-3 h-2 rounded-pill bg-coffee/15 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(progressPct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-coffee transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-3 font-sans text-xs text-coffee/70">
                Earn 1 point per £ spent. 100 pts = £5 off your next order.
              </p>
            </div>
          </article>

          {/* PROFILE */}
          <article className="lg:col-span-2 rounded-xl bg-ivory p-7 shadow-soft">
            <h2 className="font-display font-700 text-coffee text-xl">Profile</h2>
            <form action={saveProfile} className="mt-5 grid gap-5 sm:grid-cols-2">
              <input type="hidden" name="id" value={customer.id} />
              <Field label="Name">
                <Input name="name" defaultValue={customer.name} />
              </Field>
              <Field label="Phone">
                <Input name="phone" type="tel" defaultValue={customer.phone ?? ""} />
              </Field>
              <Field label="Email" className="sm:col-span-2">
                <Input name="email" type="email" defaultValue={customer.email} disabled />
              </Field>
              <div className="sm:col-span-2 flex items-center gap-4">
                <button type="submit" className="btn-primary text-sm">
                  <span>Save profile</span>
                </button>
                {searchParams.saved && (
                  <span className="font-display italic text-brick animate-rise">Saved.</span>
                )}
              </div>
            </form>
          </article>
        </div>
      </Section>

      <Section panel="ivory">
        <header className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display font-700 text-coffee text-2xl">Your orders</h2>
          <Link href="/shop" className="anchor font-display font-600 text-sm">
            New order →
          </Link>
        </header>
        {myOrders.length === 0 ? (
          <p className="editorial text-muted">
            Nothing here yet. Your first order will appear after checkout.
          </p>
        ) : (
          <ul className="divide-y divide-hairline rounded-xl bg-cream shadow-soft overflow-hidden">
            {myOrders.map((o) => (
              <li key={o.id} className="px-5 py-4 flex flex-wrap items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display font-700 text-coffee truncate">{o.summary}</p>
                  <p className="font-sans text-sm text-muted">
                    {new Date(o.createdAt).toLocaleString("en-GB")} · {o.status}
                  </p>
                </div>
                <span className="font-display font-700 tabular-nums text-coffee whitespace-nowrap">
                  {o.total === null ? "P.O.A." : priceFromPence(o.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section panel="cream">
        <div className="rounded-xl bg-rose p-7 shadow-soft">
          <p className="label-rule">Payment methods</p>
          <h2 className="mt-3 font-display font-700 text-coffee text-xl">
            Saved cards
          </h2>
          <p className="editorial mt-3 text-[1rem] max-w-prose">
            You currently pay on collection. Once we wire up Stripe Customer
            Portal, you&rsquo;ll be able to save a card for one-tap checkout.
            Until then, no card details are stored anywhere.
          </p>
        </div>
      </Section>
    </main>
  );
}

function Field({
  label, children, className = "",
}: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
function Input({
  name, type = "text", defaultValue, disabled,
}: { name: string; type?: string; defaultValue?: string; disabled?: boolean }) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      disabled={disabled}
      className="w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11 disabled:bg-bone disabled:text-muted"
    />
  );
}
