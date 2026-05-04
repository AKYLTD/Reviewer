import { NextResponse } from "next/server";

/**
 * Catering enquiry endpoint. Currently a capture stub — in production this
 * should forward to the shop's email address (or a Square Customer Directory
 * entry plus an internal Slack/SMS notification) per square-setup-plan.md.
 *
 * No persistence yet: that decision is upstream of the current task and
 * depends on whether Alon wants enquiries inside Square's Customer Directory,
 * a separate inbox, or routed via the existing kitchen-printer pipeline.
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
    if (!payload[key] || typeof payload[key] !== "string" && typeof payload[key] !== "number") {
      return NextResponse.json({ ok: false, error: `Missing ${key}` }, { status: 400 });
    }
  }

  if (process.env.NODE_ENV !== "production") {
    // Surface the lead in the dev terminal so it's visible while testing.
    // eslint-disable-next-line no-console
    console.log("[catering] enquiry:", payload);
  }

  return NextResponse.json({ ok: true });
}
