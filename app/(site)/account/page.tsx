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

  function tierLabel(points: number): string {
    if (points >= 1000) return "Everything · tier IV";
    if (points >= 500)  return "Poppy · tier III";
    if (points >= 200)  return "Sesame · tier II";
    return "Crust · tier I";
  }

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
          {/* LOYALTY CARD — circular progress + tier ribbon. Tier ladder:
              Crust (0), Sesame (200), Poppy (500), Everything (1000). */}
          <article className="lg:col-span-1 rounded-xl panel-coffee p-7 shadow-pop relative overflow-hidden">
            <div aria-hidden className="absolute -top-12 -right-12 h-48 w-48 rounded-pill bg-saffron/12 blur-3xl" />
            <div aria-hidden className="absolute -bottom-16 -left-12 h-56 w-56 rounded-pill bg-brick/15 blur-3xl" />

            <div className="relative">
              <p className="label">Loyalty balance</p>
              <p className="mt-1 font-display font-600 text-saffron text-sm uppercase tracking-widest">
                {tierLabel(customer.points)}
              </p>

              <div className="mt-6 flex items-center gap-6">
                {/* CIRCULAR PROGRESS */}
                <svg
                  viewBox="0 0 100 100"
                  className="h-32 w-32 -rotate-90 shrink-0"
                  role="progressbar"
                  aria-valuenow={Math.round(progressPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progress to next reward"
                >
                  <circle cx="50" cy="50" r="44" stroke="rgba(240,228,208,0.15)" strokeWidth="8" fill="none" />
                  <circle
                    cx="50" cy="50" r="44"
                    stroke="#F5A623"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${(progressPct / 100) * (2 * Math.PI * 44)} ${2 * Math.PI * 44}`}
                    style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                  />
                </svg>

                <div className="min-w-0">
                  <p className="font-display font-700 text-display-md text-cream leading-none tabular-nums">
                    {customer.points}
                  </p>
                  <p className="mt-1 font-display text-saffron text-sm">points</p>
                </div>
              </div>

              <div className="mt-6">
                {rewardsAvailable > 0 ? (
                  <p className="font-display font-700 text-saffron text-lg">
                    {rewardsAvailable} reward{rewardsAvailable === 1 ? "" : "s"} ready to redeem.
                  </p>
                ) : (
                  <p className="font-sans text-cream/85">
                    <span className="font-display font-700 text-saffron tabular-nums text-lg">
                      {nextReward}
                    </span>{" "}
                    pts to your next £{(REWARD_VALUE_PENCE / 100).toFixed(0)} reward
                  </p>
                )}
                <p className="mt-4 font-sans text-xs text-cream/65 leading-relaxed">
                  Earn 1 point per £ spent. Each tier unlocks a small perk —
                  Sesame: 5% off bagels. Poppy: a free coffee. Everything:
                  a free Shabbat challah every month.
                </p>
              </div>
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
