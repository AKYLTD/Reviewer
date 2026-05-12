import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createOrder as persistOrder, newOrderId } from "@/lib/orders";
import { createOrder as createSquareOrder, SquareNotConfiguredError } from "@/lib/square";
import { getContent } from "@/lib/content";
import { accrue, getCustomer, recordOrderForCustomer, REWARD_VALUE_PENCE, POINTS_PER_REWARD } from "@/lib/customers";

interface CartLine {
  itemId: string;
  name: string;
  unitPricePence: number;
  discountPence: number;
  quantity: number;
  category?: string;
}

interface Payload {
  cart: CartLine[];
  customer: { name: string; email: string; phone: string; customerId: string | null };
  pickup: { locationId: string; time: string; notes: string };
  service?:
    | { mode: "eat-in"; table: number; zone: "inside" | "outside" }
    | { mode: "takeaway" };
  redeemPoints: boolean;
}

export async function POST(req: Request) {
  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { cart, customer, pickup, redeemPoints } = payload;
  if (!cart?.length) return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400 });
  if (!customer?.name || !customer?.email || !customer?.phone) {
    return NextResponse.json({ ok: false, error: "Missing customer details" }, { status: 400 });
  }
  if (!pickup?.locationId || !pickup?.time) {
    return NextResponse.json({ ok: false, error: "Missing pickup details" }, { status: 400 });
  }

  // Resolve location + total
  const content = await getContent();
  const chosen = content.locations.find((l) => l.id === pickup.locationId);
  if (!chosen) {
    return NextResponse.json({ ok: false, error: "Unknown pickup location" }, { status: 400 });
  }

  const subtotal = cart.reduce((s, l) => s + l.unitPricePence * l.quantity, 0);
  const lineDiscounts = cart.reduce((s, l) => s + l.discountPence * l.quantity, 0);

  // Loyalty redemption — only honoured if the customer actually has the
  // points server-side (don't trust the client).
  let loyaltyDiscount = 0;
  let customerRecord = null;
  if (customer.customerId) {
    customerRecord = await getCustomer(customer.customerId);
    if (redeemPoints && customerRecord && customerRecord.points >= POINTS_PER_REWARD) {
      loyaltyDiscount = REWARD_VALUE_PENCE;
    }
  }

  const total = Math.max(0, subtotal - lineDiscounts - loyaltyDiscount);

  // Build the date+time pickup ISO. Default to today.
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const pickupISO = `${yyyy}-${mm}-${dd}T${pickup.time}:00`;

  // Push to Square (best-effort)
  let squareOrderId: string | undefined;
  let squareError: string | undefined;
  if (chosen.squareLocationId && process.env.SQUARE_ACCESS_TOKEN) {
    try {
      const isEatIn = payload.service?.mode === "eat-in";
      const tableDesc = isEatIn && payload.service?.mode === "eat-in"
        ? `Table ${payload.service.table} (${payload.service.zone})`
        : "";
      const result = await createSquareOrder({
        squareLocationId: chosen.squareLocationId,
        ticketName: isEatIn
          ? `${tableDesc} · ${customer.name}`
          : `Web — ${customer.name}`,
        idempotencyKey: randomUUID(),
        pickup: {
          displayName: customer.name,
          email: customer.email,
          phone: customer.phone,
          pickupAt: new Date(pickupISO).toISOString(),
          note: [
            isEatIn ? `EAT-IN · ${tableDesc}` : `Web shop order`,
            `Location: ${chosen.name}.`,
            pickup.notes ? `Notes: ${pickup.notes}` : "",
          ].filter(Boolean).join(" "),
        },
        lineItems: cart.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          price: l.unitPricePence - l.discountPence,
          note: l.discountPence > 0 ? `Promo applied (−£${(l.discountPence / 100).toFixed(2)} each)` : undefined,
        })),
      });
      squareOrderId = result.orderId;
    } catch (err) {
      squareError = err instanceof SquareNotConfiguredError ? "not-configured" : err instanceof Error ? err.message : "unknown";
      // eslint-disable-next-line no-console
      console.warn("[shop] Square order push failed:", squareError);
    }
  } else if (!chosen.squareLocationId) {
    squareError = "no-square-location-id";
  }

  // Persist
  let persistedId: string | undefined;
  try {
    const persisted = await persistOrder({
      id: newOrderId("cake" /* reuse channel taxonomy — TODO: add 'shop' channel */),
      channel: "cake", // placeholder; orders.ts schema can be extended to add "shop"
      scheduledFor: pickupISO,
      pickupLocationId: pickup.locationId,
      customer: { name: customer.name, email: customer.email, phone: customer.phone },
      summary:
        payload.service?.mode === "eat-in"
          ? `Eat-in · Table ${payload.service.table} (${payload.service.zone}) · ${cart.reduce((n, l) => n + l.quantity, 0)} items`
          : `Shop order · ${cart.reduce((n, l) => n + l.quantity, 0)} items`,
      details: {
        kind: "shop",
        service: payload.service ?? { mode: "takeaway" },
        cart,
        pickup,
        subtotal,
        lineDiscounts,
        loyaltyDiscount,
        customerId: customer.customerId,
      },
      total,
      squareOrderId,
      squareError,
    });
    persistedId = persisted.id;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[shop] persistence failed:", err);
  }

  // Loyalty bookkeeping
  if (customerRecord && persistedId) {
    if (loyaltyDiscount > 0) {
      await accrue(customerRecord.id, -POINTS_PER_REWARD, `Redeemed on order ${persistedId}`);
    }
    await recordOrderForCustomer(customerRecord.id, persistedId, total);
  }

  return NextResponse.json({
    ok: true,
    orderId: persistedId,
    squareOrderId,
    squareError,
    total,
  });
}
