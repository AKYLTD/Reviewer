import { NextResponse } from "next/server";

/**
 * Cake order capture endpoint. Accepts the live cake config + customer
 * fields produced by /cakes/order and (in production) should:
 *   1. Email the kitchen at cakes@ronisbelsize.com with a printable summary
 *   2. Email the customer a confirmation
 *   3. Optionally write a Customer Directory entry in Square
 *
 * For now this logs the order server-side and returns ok so the live form
 * works end-to-end without external dependencies.
 */
export async function POST(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Light validation — enough to reject the obviously broken without
  // duplicating the strict TS types client-side.
  const order = (payload as { order?: { email?: string; date?: string; name?: string } }).order;
  if (!order || !order.email || !order.date) {
    return NextResponse.json({ ok: false, error: "Missing email or date" }, { status: 400 });
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[cakes] order received:", JSON.stringify(payload, null, 2));
  }

  return NextResponse.json({ ok: true });
}
