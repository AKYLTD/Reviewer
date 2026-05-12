import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  deleteOrder,
  getOrder,
  priceFromPence,
  STATUS_LABEL,
  STATUS_TONE,
  updateOrder,
  type OrderStatus,
} from "@/lib/orders";

export const dynamic = "force-dynamic";

const STATUS_FLOW: OrderStatus[] = [
  "new", "confirmed", "in-progress", "ready", "completed",
];

async function setStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  await updateOrder(id, { status });
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?saved=1`);
}

async function saveNotes(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const internalNotes = String(formData.get("internalNotes") ?? "");
  await updateOrder(id, { internalNotes });
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?notes=1`);
}

async function removeOrder(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await deleteOrder(id);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  redirect("/admin/orders?deleted=1");
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { saved?: string; notes?: string };
}) {
  const order = await getOrder(params.id);
  if (!order) notFound();

  return (
    <div className="space-y-10">
      {/* HEAD */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="anchor font-display font-600 text-sm text-coffee/70"
          >
            &larr; All orders
          </Link>
          <p className="label mt-3 capitalize">{order.channel}</p>
          <h1 className="mt-2 font-display font-700 text-display-md text-coffee">
            {order.summary}
          </h1>
          <p className="font-sans text-sm text-coffee/60 mt-2">
            {order.id} &middot; received{" "}
            {new Date(order.createdAt).toLocaleString("en-GB")}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-pill px-4 py-2 font-display font-700 uppercase tracking-wide text-xs ${STATUS_TONE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      {(searchParams.saved || searchParams.notes) && (
        <p className="font-display italic text-brick animate-rise">
          {searchParams.saved && "Status updated."}
          {searchParams.notes && "Notes saved."}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* MAIN COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          {/* CUSTOMER */}
          <section className="rounded-xl bg-ivory p-6 shadow-soft">
            <h2 className="font-display font-700 text-coffee text-xl">Customer</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Name" value={order.customer.name} />
              <Field
                label="Email"
                value={
                  <a className="anchor" href={`mailto:${order.customer.email}`}>
                    {order.customer.email}
                  </a>
                }
              />
              <Field
                label="Phone"
                value={
                  order.customer.phone ? (
                    <a
                      className="anchor"
                      href={`tel:${order.customer.phone.replace(/\s+/g, "")}`}
                    >
                      {order.customer.phone}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              {order.scheduledFor && (
                <Field
                  label="Wanted for"
                  value={new Date(order.scheduledFor).toLocaleString("en-GB")}
                />
              )}
            </dl>
          </section>

          {/* DETAILS — channel-specific JSON */}
          <section className="rounded-xl bg-ivory p-6 shadow-soft">
            <h2 className="font-display font-700 text-coffee text-xl">Order details</h2>
            <pre className="mt-4 max-w-full overflow-auto rounded-md bg-cream p-4 font-sans text-xs text-coffee whitespace-pre-wrap">
              {JSON.stringify(order.details, null, 2)}
            </pre>
            {order.attachments.length > 0 && (
              <div className="mt-6">
                <p className="label">Attachments</p>
                <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                  {order.attachments.map((a) => (
                    <li key={a}>
                      <a href={a} target="_blank" rel="noopener noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a} alt={a} className="aspect-square w-full rounded-md object-cover border border-hairline" />
                        <p className="mt-2 font-sans text-xs text-coffee/60 truncate">{a}</p>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* INTERNAL NOTES */}
          <section className="rounded-xl bg-ivory p-6 shadow-soft">
            <h2 className="font-display font-700 text-coffee text-xl">Internal notes</h2>
            <p className="font-sans text-sm text-muted mt-1">
              For your team. Not visible to the customer.
            </p>
            <form action={saveNotes} className="mt-4 space-y-4">
              <input type="hidden" name="id" value={order.id} />
              <textarea
                name="internalNotes"
                rows={5}
                defaultValue={order.internalNotes}
                placeholder="e.g. Called Sara, confirmed pickup at 4pm…"
                className="w-full rounded-md bg-cream border border-hairline px-4 py-3 font-sans text-sm text-coffee focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 transition resize-y"
              />
              <button type="submit" className="btn-primary text-sm">
                <span>Save notes</span>
              </button>
            </form>
          </section>
        </div>

        {/* SIDE COLUMN */}
        <aside className="space-y-6">
          {/* STATUS */}
          <section className="rounded-xl bg-ivory p-6 shadow-soft">
            <h2 className="font-display font-700 text-coffee text-xl">Status</h2>
            <p className="font-sans text-sm text-muted mt-1">
              Move the order through the kitchen flow.
            </p>
            <form action={setStatus} className="mt-4 grid gap-2">
              <input type="hidden" name="id" value={order.id} />
              {STATUS_FLOW.map((s) => {
                const active = order.status === s;
                return (
                  <button
                    key={s}
                    type="submit"
                    name="status"
                    value={s}
                    aria-pressed={active}
                    className={`inline-flex items-center justify-between rounded-md px-4 py-3 font-display font-600 text-sm transition ${
                      active
                        ? "bg-brick text-cream"
                        : "bg-cream text-coffee hover:bg-saffron/40"
                    }`}
                  >
                    <span>{STATUS_LABEL[s]}</span>
                    {active && <span aria-hidden>✓</span>}
                  </button>
                );
              })}
              <button
                type="submit"
                name="status"
                value="cancelled"
                className={`mt-3 inline-flex items-center justify-center rounded-md px-4 py-3 font-display font-600 text-sm border transition ${
                  order.status === "cancelled"
                    ? "border-cocoa bg-cocoa/10 text-cocoa"
                    : "border-cocoa/30 text-cocoa hover:bg-cocoa/10"
                }`}
              >
                {order.status === "cancelled" ? "Cancelled" : "Cancel order"}
              </button>
            </form>
          </section>

          {/* SQUARE */}
          <section className="rounded-xl bg-ivory p-6 shadow-soft">
            <h2 className="font-display font-700 text-coffee text-xl">Till</h2>
            {order.squareOrderId ? (
              <>
                <p className="font-sans text-sm text-coffee mt-2">
                  Pushed to Square — should be on the kitchen printer.
                </p>
                <p className="mt-3 font-sans text-xs text-coffee/60 break-all">
                  {order.squareOrderId}
                </p>
                <a
                  href="https://squareup.com/dashboard/orders/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="anchor mt-4 inline-block font-display font-600 text-sm"
                >
                  Open in Square &rarr;
                </a>
              </>
            ) : order.squareError ? (
              <>
                <p className="font-sans text-sm text-coffee mt-2">
                  Not on the till — Square push failed.
                </p>
                <code className="mt-2 inline-block rounded bg-cream px-2 py-1 font-sans text-xs text-cocoa">
                  {order.squareError}
                </code>
                <p className="font-sans text-xs text-muted mt-3">
                  Check the location&rsquo;s Square ID in{" "}
                  <Link href="/admin/locations" className="anchor">Locations</Link>
                  .
                </p>
              </>
            ) : (
              <p className="font-sans text-sm text-muted mt-2">
                This channel doesn&rsquo;t push to Square — handle manually.
              </p>
            )}
          </section>

          {/* TOTAL */}
          <section className="rounded-xl bg-saffron p-6 shadow-soft text-center">
            <p className="font-sans font-600 text-xs uppercase tracking-wide text-coffee/80">
              Quoted total
            </p>
            <p className="mt-1 font-display font-700 text-3xl tabular-nums text-coffee">
              {order.total === null ? "P.O.A." : priceFromPence(order.total)}
            </p>
          </section>

          {/* DANGER ZONE */}
          <section className="rounded-xl border border-hairlineStrong p-5">
            <p className="label-muted">Danger zone</p>
            <form action={removeOrder} className="mt-3">
              <input type="hidden" name="id" value={order.id} />
              <button
                type="submit"
                className="font-sans text-xs font-600 uppercase tracking-widest text-cocoa hover:underline"
              >
                Delete this order record
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-sans text-xs uppercase tracking-wide font-600 text-coffee/70">
        {label}
      </dt>
      <dd className="font-display font-600 text-coffee mt-1">{value}</dd>
    </div>
  );
}
