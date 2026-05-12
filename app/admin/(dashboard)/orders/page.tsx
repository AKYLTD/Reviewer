import Link from "next/link";
import {
  listOrders,
  STATUS_LABEL,
  STATUS_TONE,
  priceFromPence,
  type OrderChannel,
  type OrderStatus,
} from "@/lib/orders";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const CHANNELS: { id: OrderChannel | "all"; label: string }[] = [
  { id: "all", label: "All channels" },
  { id: "cake", label: "Cake" },
  { id: "catering", label: "Catering" },
];

const STATUSES: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "Any status" },
  { id: "new", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in-progress", label: "In progress" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function isChannel(s: string | undefined): s is OrderChannel {
  return s === "cake" || s === "catering";
}
function isStatus(s: string | undefined): s is OrderStatus {
  return ["new", "confirmed", "in-progress", "ready", "completed", "cancelled"].includes(s ?? "");
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { channel?: string; status?: string; q?: string };
}) {
  const all = await listOrders();
  const channelF = isChannel(searchParams.channel) ? searchParams.channel : null;
  const statusF = isStatus(searchParams.status) ? searchParams.status : null;
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const orders = all.filter((o) => {
    if (channelF && o.channel !== channelF) return false;
    if (statusF && o.status !== statusF) return false;
    if (q) {
      const haystack = [
        o.id, o.summary, o.customer.name, o.customer.email, o.customer.phone ?? "",
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const buildHref = (next: { channel?: string; status?: string }) => {
    const params = new URLSearchParams();
    const channel = next.channel ?? searchParams.channel;
    const status = next.status ?? searchParams.status;
    if (channel && channel !== "all") params.set("channel", channel);
    if (status && status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="label">Orders</p>
          <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
            {orders.length === all.length
              ? `${all.length} order${all.length === 1 ? "" : "s"}`
              : `${orders.length} of ${all.length} orders`}
          </h1>
        </div>
        <form action="/admin/orders" className="flex items-center gap-2">
          {channelF && <input type="hidden" name="channel" value={channelF} />}
          {statusF && <input type="hidden" name="status" value={statusF} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, email, id…"
            className="rounded-md bg-ivory border border-hairline px-4 py-2 font-sans text-sm text-coffee min-h-11 min-w-[14rem] focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20"
          />
          <button type="submit" className="btn-primary text-xs px-4 py-2">
            <span>Search</span>
          </button>
        </form>
      </header>

      {/* CHANNEL FILTER */}
      <nav aria-label="Channel filter" className="mb-3">
        <p className="label-muted mb-2">Channel</p>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => {
            const active =
              c.id === "all" ? !channelF : channelF === c.id;
            return (
              <Link
                key={c.id}
                href={buildHref({ channel: c.id })}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center justify-center min-h-11 rounded-pill px-4 py-2 font-display font-600 text-sm transition ${
                  active
                    ? "bg-brick text-cream shadow-chip"
                    : "bg-ivory text-coffee hover:bg-saffron/40"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* STATUS FILTER */}
      <nav aria-label="Status filter" className="mb-8">
        <p className="label-muted mb-2">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const active = s.id === "all" ? !statusF : statusF === s.id;
            return (
              <Link
                key={s.id}
                href={buildHref({ status: s.id })}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center justify-center min-h-11 rounded-pill px-4 py-2 font-display font-600 text-sm transition ${
                  active
                    ? "bg-coffee text-saffron shadow-chip"
                    : "bg-ivory text-coffee hover:bg-saffron/40"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* RESULTS */}
      {orders.length === 0 ? (
        <div className="rounded-xl bg-ivory p-12 text-center shadow-soft">
          <p className="font-display font-700 text-coffee text-xl">No orders match these filters.</p>
          <p className="editorial mt-3 text-muted">
            Try widening the channel or status filter, or clear the search.
          </p>
          <Link href="/admin/orders" className="anchor mt-6 inline-block font-display font-600 text-sm">
            Clear all filters
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-hairline rounded-xl bg-ivory shadow-soft overflow-hidden">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/admin/orders/${o.id}`}
                className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] items-baseline px-5 py-4 hover:bg-cream transition-colors"
              >
                <span
                  className={`inline-flex items-center justify-center self-start rounded-pill px-3 py-1 font-display font-700 text-xs uppercase tracking-wide ${STATUS_TONE[o.status]}`}
                >
                  {STATUS_LABEL[o.status]}
                </span>
                <div className="min-w-0">
                  <p className="font-display font-700 text-coffee truncate">
                    <span className="text-brick mr-2 capitalize">{o.channel}</span>
                    {o.summary}
                  </p>
                  <p className="font-sans text-sm text-muted truncate mt-0.5">
                    {o.customer.name} &middot; {o.customer.email}
                    {o.scheduledFor &&
                      ` · ${new Date(o.scheduledFor).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </p>
                  <p className="font-sans text-xs text-coffee/50 truncate mt-0.5">
                    {o.id} · received {new Date(o.createdAt).toLocaleString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="font-display font-700 tabular-nums text-coffee whitespace-nowrap">
                  {o.total === null ? "P.O.A." : priceFromPence(o.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
