import { NextResponse } from "next/server";
import { gatherForBrand } from "@/lib/adapters";
import { buildReport } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const brand = (url.searchParams.get("brand") ?? "").trim();
  if (!brand) {
    return NextResponse.json({ error: "brand is required" }, { status: 400 });
  }
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  try {
    const { stores, reviews, mode, channels } = await gatherForBrand(brand);
    const report = buildReport(brand, stores, reviews, { from, to });
    return NextResponse.json({ ok: true, mode, channels, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
