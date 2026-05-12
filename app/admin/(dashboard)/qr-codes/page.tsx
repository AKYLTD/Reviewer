import { headers } from "next/headers";
import Link from "next/link";
import { getContent } from "@/lib/content";

export const metadata = { title: "Table QR codes" };
export const dynamic = "force-dynamic";

function deriveOrigin(): string {
  // Prefer the public site URL if configured; otherwise reconstruct
  // from request headers (works on Vercel + local).
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function qrUrl(target: string): string {
  // QR Server — free, reliable. Returns a PNG.
  return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&qzone=1&margin=12&data=${encodeURIComponent(target)}`;
}

export default async function QRCodesPage({
  searchParams,
}: {
  searchParams: { location?: string };
}) {
  const content = await getContent();
  const origin = deriveOrigin();

  const selectedId = searchParams.location ?? content.primaryLocationId ?? content.locations[0]?.id;
  const selected = content.locations.find((l) => l.id === selectedId);

  if (!selected) {
    return (
      <div>
        <p className="label">QR codes</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">No locations configured.</h1>
        <p className="editorial mt-3">
          Add a shop in <Link href="/admin/locations" className="anchor font-600">Locations</Link>.
        </p>
      </div>
    );
  }

  const inside = Array.from({ length: selected.tablesInside ?? 0 }, (_, i) => i + 1);
  const outside = Array.from({ length: selected.tablesOutside ?? 0 }, (_, i) => i + 1);

  return (
    <div className="space-y-10">
      <header>
        <p className="label">Table QR codes</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
          Scan-to-order, per table.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          Each QR code below opens the shop pre-filled to that table at{" "}
          <strong className="font-600">{selected.name}</strong>. Print, laminate,
          stick on the table. When a customer scans, the &ldquo;Ordering for
          table N&rdquo; banner appears across all the order pages and the
          checkout pre-fills the table number.
        </p>
      </header>

      {/* SHOP SWITCHER */}
      <div className="flex flex-wrap gap-2">
        {content.locations.map((loc) => {
          const active = loc.id === selected.id;
          return (
            <Link
              key={loc.id}
              href={`/admin/qr-codes?location=${loc.id}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center justify-center min-h-11 rounded-pill px-5 py-2 font-display font-700 text-sm transition ${
                active
                  ? "bg-brick text-cream shadow-chip"
                  : "bg-ivory text-coffee hover:bg-saffron/40"
              }`}
            >
              {loc.shortName}
              <span className={`ml-2 text-xs ${active ? "text-saffron" : "text-coffee/50"}`}>
                {(loc.tablesInside ?? 0) + (loc.tablesOutside ?? 0)}
              </span>
            </Link>
          );
        })}
      </div>

      {inside.length === 0 && outside.length === 0 && (
        <div className="rounded-xl bg-ivory p-8 shadow-soft text-center">
          <p className="font-display font-700 text-coffee text-xl">No tables configured here yet.</p>
          <p className="editorial mt-3 text-muted">
            Set inside/outside table counts on the{" "}
            <Link href={`/admin/locations`} className="anchor font-600">Locations</Link>{" "}
            page.
          </p>
        </div>
      )}

      {inside.length > 0 && (
        <section>
          <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display font-700 text-coffee text-2xl">
              Inside · {inside.length} tables
            </h2>
            <a
              href={`/admin/qr-codes/print?location=${selected.id}&zone=inside`}
              target="_blank"
              rel="noopener noreferrer"
              className="anchor font-display font-600 text-sm"
            >
              Open printable sheet ↗
            </a>
          </header>
          <ul className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {inside.map((n) => (
              <QrTile
                key={`in-${n}`}
                location={selected}
                origin={origin}
                table={n}
                zone="inside"
              />
            ))}
          </ul>
        </section>
      )}

      {outside.length > 0 && (
        <section>
          <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display font-700 text-coffee text-2xl">
              Outside · {outside.length} tables
            </h2>
            <a
              href={`/admin/qr-codes/print?location=${selected.id}&zone=outside`}
              target="_blank"
              rel="noopener noreferrer"
              className="anchor font-display font-600 text-sm"
            >
              Open printable sheet ↗
            </a>
          </header>
          <ul className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {outside.map((n) => (
              <QrTile
                key={`out-${n}`}
                location={selected}
                origin={origin}
                table={n}
                zone="outside"
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function QrTile({
  location,
  origin,
  table,
  zone,
}: {
  location: { id: string; name: string };
  origin: string;
  table: number;
  zone: "inside" | "outside";
}) {
  const target = `${origin}/shop?location=${location.id}&table=${table}&zone=${zone}`;
  return (
    <li className="rounded-xl bg-ivory p-5 shadow-soft text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl(target)}
        alt={`QR for ${location.name} ${zone} table ${table}`}
        className="mx-auto w-full max-w-[180px] aspect-square bg-cream rounded-md"
      />
      <p className="mt-3 font-display font-700 text-coffee text-lg">
        Table {table}
      </p>
      <p className="label-muted">
        {zone}
      </p>
      <a
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        className="anchor mt-2 inline-block font-display font-600 text-xs"
      >
        Test link ↗
      </a>
    </li>
  );
}
