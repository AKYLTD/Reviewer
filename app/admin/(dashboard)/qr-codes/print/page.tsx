import { headers } from "next/headers";
import { getContent } from "@/lib/content";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Print QR sheet" };
export const dynamic = "force-dynamic";

function deriveOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function qrUrl(target: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&qzone=1&margin=12&data=${encodeURIComponent(target)}`;
}

export default async function PrintSheet({
  searchParams,
}: {
  searchParams: { location?: string; zone?: string };
}) {
  const content = await getContent();
  const origin = deriveOrigin();
  const loc = content.locations.find((l) => l.id === searchParams.location);
  const zone: "inside" | "outside" = searchParams.zone === "outside" ? "outside" : "inside";
  if (!loc) {
    return <p className="p-10 font-display">Location not found.</p>;
  }
  const count = zone === "inside" ? (loc.tablesInside ?? 0) : (loc.tablesOutside ?? 0);
  const tables = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="bg-white text-black p-8 print:p-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          .no-print { display: none !important; }
          body { background: white; }
        }
        .qr-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12mm;
        }
        .qr-card {
          break-inside: avoid;
          page-break-inside: avoid;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 8mm;
          text-align: center;
        }
        .qr-card img { width: 100%; height: auto; }
      `}</style>
      <div className="no-print mb-6 flex items-center justify-between">
        <p className="font-display font-700 text-2xl">
          {loc.name} — {zone} tables ({tables.length})
        </p>
        <PrintButton />
      </div>
      <div className="qr-grid">
        {tables.map((n) => {
          const target = `${origin}/shop?location=${loc.id}&table=${n}&zone=${zone}`;
          return (
            <div key={n} className="qr-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl(target)} alt={`Table ${n}`} />
              <p style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 18, marginTop: 6 }}>
                {loc.shortName}
              </p>
              <p style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 700, fontSize: 28 }}>
                Table {n}
              </p>
              <p style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                {zone}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
