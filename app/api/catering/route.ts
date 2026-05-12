import { NextResponse } from "next/server";
import { createOrder as persistOrder, newOrderId } from "@/lib/orders";

/**
 * Catering enquiry endpoint. Captures the lead to the local orders store
 * so it lands in the admin back-office, then returns ok. Production
 * email forwarding hooks here.
 */
export async function POST(req: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["name", "email", "date", "guests"] as const;
  for (const key of required) {
    const v = payload[key];
    if (v === undefined || v === null || (typeof v !== "string" && typeof v !== "number")) {
      return NextResponse.json({ ok: false, error: `Missing ${key}` }, { status: 400 });
    }
  }

  const name = String(payload.name);
  const email = String(payload.email);
  const phone = payload.phone ? String(payload.phone) : undefined;
  const date = String(payload.date);
  const time = payload.time ? String(payload.time) : "12:00";
  const guests = String(payload.guests);
  const company = payload.company ? String(payload.company) : "";
  const postcode = payload.postcode ? String(payload.postcode) : "";
  const notes = payload.notes ? String(payload.notes) : "";

  const summary = `Catering enquiry — ${guests} guests${company ? ` · ${company}` : ""}`;

  let persistedId: string | undefined;
  try {
    const persisted = await persistOrder({
      id: newOrderId("catering"),
      channel: "catering",
      scheduledFor: `${date}T${time}:00`,
      customer: { name, email, phone },
      summary,
      details: {
        guests: Number(guests) || guests,
        company,
        postcode,
        notes,
        raw: payload,
      },
      // Catering is enquiry-first; we don't quote until the kitchen
      // replies, so the total stays null in the record.
      total: null,
    });
    persistedId = persisted.id;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[catering] failed to persist enquiry:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[catering] enquiry:", { id: persistedId, ...payload });
  }

  return NextResponse.json({ ok: true, orderId: persistedId });
}
