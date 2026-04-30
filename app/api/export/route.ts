import { gatherForBrand } from "@/lib/adapters";
import { buildReport, reportToCsv } from "@/lib/utils";

export const dynamic = "force-dynamic";

function safeName(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const brand = (url.searchParams.get("brand") ?? "").trim();
  if (!brand) return new Response("brand is required", { status: 400 });
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const { stores, reviews } = await gatherForBrand(brand);
  const report = buildReport(brand, stores, reviews, { from, to });
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${safeName(brand)}-reviews-${stamp}`;

  if (format === "json") {
    return new Response(JSON.stringify(report, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}.json"`,
      },
    });
  }
  const csv = reportToCsv(report);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
