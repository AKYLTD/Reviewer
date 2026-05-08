import Link from "next/link";
import { ordersStats, STATUS_LABEL, STATUS_TONE, priceFromPence } from "@/lib/orders";
import { getContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [stats, content, settings] = await Promise.all([
    ordersStats(),
    getContent(),
    getSettings(),
  ]);

  const chCake = settings.channels.cakes;
  const chCater = settings.channels.catering;
  const chCC = settings.channels["click-collect"];
  const chOAT = settings.channels["order-at-table"];

  return (
    <div className="space-y-12">
      <header>
        <p className="label">Overview</p>
        <h1 className="mt-3 font-display font-700 text-display-lg text-coffee">
          Back office.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          What&rsquo;s come in, what&rsquo;s outstanding, where your shops are
          configured. Updates here flow to the live site.
        </p>
      </header>

      {/* TOP NUMBERS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New" value={stats.byStatus.new} hint="awaiting review" />
        <Stat label="Confirmed" value={stats.byStatus.confirmed} hint="kitchen has it" />
        <Stat label="In progress" value={stats.byStatus["in-progress"]} hint="being prepared" />
        <Stat label="Ready" value={stats.byStatus.ready} hint="awaiting collection" />
      </section>

      {/* CHANNEL TILES */}
      <section>
        <header className="mb-6">
          <p className="label">Channels</p>
          <h2 className="mt-2 font-display font-700 text-coffee text-2xl">Order paths</h2>
        </header>
        <ul className="grid gap-4 md:grid-cols-2">
          <ChannelTile
            title="Cake orders"
            count={stats.byChannel.cake}
            href="/admin/orders?channel=cake"
            body="Built on /cakes/order, captured here. Pushed to Square at the chosen pickup shop when configured."
            stateLabel={chCake.enabled ? `Enabled · ${chCake.leadHours}h lead` : "Disabled"}
            stateOn={chCake.enabled}
          />
          <ChannelTile
            title="Catering enquiries"
            count={stats.byChannel.catering}
            href="/admin/orders?channel=catering"
            body="Submitted via the /catering form. Quote the customer back from the order detail page."
            stateLabel={chCater.enabled ? `Enabled · ${chCater.leadHours}h lead` : "Disabled"}
            stateOn={chCater.enabled}
          />
          <ChannelTile
            title="Click & collect"
            count={null}
            href={chCC.squareOnlineUrl || "https://squareup.com/dashboard/orders/overview"}
            external
            body="Customers order direct through Square Online. Manage at the Square dashboard; the till prints to the kitchen automatically."
            stateLabel={chCC.enabled ? `Enabled · ${chCC.leadMinutes}m lead` : "Disabled"}
            stateOn={chCC.enabled}
          />
          <ChannelTile
            title="Order at table"
            count={null}
            href={chOAT.squareOnlineUrl || "https://squareup.com/dashboard/orders/overview"}
            external
            body="QR-driven dine-in flow. Same Square Online plumbing — manage in the Square dashboard."
            stateLabel={chOAT.enabled ? "Enabled" : "Disabled"}
            stateOn={chOAT.enabled}
          />
        </ul>
      </section>

      {/* RECENT ORDERS */}
      <section>
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="label">Latest activity</p>
            <h2 className="mt-2 font-display font-700 text-coffee text-2xl">Recent orders</h2>
          </div>
          <Link href="/admin/orders" className="anchor font-display font-600 text-sm">
            View all &rarr;
          </Link>
        </header>
        {stats.recent.length === 0 ? (
          <div className="rounded-xl bg-ivory p-10 text-center shadow-soft">
            <p className="font-display font-700 text-coffee text-xl">Nothing yet</p>
            <p className="editorial mt-3 text-muted">
              The first cake or catering submission shows up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-hairline rounded-xl bg-ivory shadow-soft overflow-hidden">
            {stats.recent.map((o) => (
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
                        ` · ${new Date(o.scheduledFor).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
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
      </section>

      {/* SHORTCUTS */}
      <section>
        <header className="mb-6">
          <p className="label">Shortcuts</p>
          <h2 className="mt-2 font-display font-700 text-coffee text-2xl">Edit the site</h2>
        </header>
        <ul className="grid gap-4 md:grid-cols-3">
          <ShortcutTile href="/admin/menu" title="Menu" body={`Manage items and prices in the manual menu fallback. Square pulls live when configured.`} />
          <ShortcutTile
            href="/admin/locations"
            title="Locations"
            body={`${content.locations.length} shops · primary is ${content.locations.find((l) => l.id === content.primaryLocationId)?.shortName ?? "—"}`}
          />
          <ShortcutTile href="/admin/content" title="Content" body="Hero copy, opening note, story timeline, footer." />
          <ShortcutTile href="/admin/brand" title="Brand" body="Wordmark, taglines, logo source." />
          <ShortcutTile href="/admin/images" title="Images" body="Upload photographs and the shopfront artwork." />
          <ShortcutTile href="/admin/settings" title="Settings" body="Channel lead times, cake sizes & prices." />
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl bg-ivory p-5 shadow-soft">
      <p className="font-sans text-xs uppercase tracking-wide font-600 text-coffee/70">{label}</p>
      <p className="mt-2 font-display font-700 text-4xl tabular-nums text-coffee">{value}</p>
      <p className="mt-1 font-sans text-sm text-muted">{hint}</p>
    </div>
  );
}

function ChannelTile({
  title,
  count,
  href,
  body,
  stateLabel,
  stateOn,
  external,
}: {
  title: string;
  count: number | null;
  href: string;
  body: string;
  stateLabel: string;
  stateOn: boolean;
  external?: boolean;
}) {
  const Wrap = ({ children }: { children: React.ReactNode }) =>
    external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">{children}</a>
    ) : (
      <Link href={href} className="block">{children}</Link>
    );
  return (
    <li>
      <Wrap>
        <article className="rounded-xl bg-ivory p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display font-700 text-coffee text-xl">{title}</h3>
            {count !== null && (
              <span className="font-display font-700 text-3xl tabular-nums text-brick">{count}</span>
            )}
            {external && (
              <span className="font-sans text-xs text-muted">Square ↗</span>
            )}
          </div>
          <p className="font-sans text-sm text-coffee/80 mt-3 leading-relaxed">{body}</p>
          <p className="mt-4 inline-flex items-center gap-2">
            <span className={`h-2 w-2 rounded-pill ${stateOn ? "bg-brick" : "bg-cocoa/30"}`} />
            <span className="font-sans text-xs uppercase tracking-wide font-600 text-coffee/70">
              {stateLabel}
            </span>
          </p>
        </article>
      </Wrap>
    </li>
  );
}

function ShortcutTile({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-xl bg-ivory p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop"
      >
        <p className="font-display font-700 text-coffee text-lg">
          {title}
          <span aria-hidden className="float-right text-brick">&rarr;</span>
        </p>
        <p className="font-sans text-sm text-coffee/80 mt-2 leading-relaxed">{body}</p>
      </Link>
    </li>
  );
}
