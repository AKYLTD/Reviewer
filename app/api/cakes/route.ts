import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getContent } from "@/lib/content";
import { createOrder, SquareNotConfiguredError } from "@/lib/square";
import {
  SIZE_OPTIONS,
  SHAPE_OPTIONS,
  BASE_OPTIONS,
  COVER_OPTIONS,
  FILLING_OPTIONS,
  computeTotal,
  type CakeConfig,
  type OrderFields,
} from "@/components/cake/types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "cake-orders");
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png"]);

interface OrderPayload {
  cake: CakeConfig;
  order: OrderFields;
  quotedTotal: number | null;
}

/**
 * Cake-order capture endpoint. Two paths in:
 *
 *   1. JSON  — most orders. Plain POST with cake config + customer fields.
 *   2. Multipart — when an edible-image upload accompanies an "image" shape.
 *      The payload field is the JSON above; the image field is the file.
 *
 * On success we attempt to create a Square Order at the customer's chosen
 * pickup location with state OPEN. Square's automatic routing surfaces it
 * on the till, and the kitchen receipt printer fires at the matching
 * location. The order is also captured server-side as a backstop so a
 * Square outage never loses a cake.
 */
export async function POST(req: Request) {
  let payload: OrderPayload;
  let imagePath: string | null = null;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.startsWith("multipart/form-data")) {
      const fd = await req.formData();
      const raw = fd.get("payload");
      if (typeof raw !== "string") {
        return NextResponse.json({ ok: false, error: "Missing payload" }, { status: 400 });
      }
      payload = JSON.parse(raw) as OrderPayload;

      const file = fd.get("image");
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_BYTES) {
          return NextResponse.json({ ok: false, error: "Image is over 8 MB" }, { status: 413 });
        }
        if (!ALLOWED.has(file.type)) {
          return NextResponse.json(
            { ok: false, error: "Image must be JPEG or PNG" },
            { status: 415 },
          );
        }
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
        const buf = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(path.join(UPLOAD_DIR, filename), buf);
        imagePath = `/uploads/cake-orders/${filename}`;
      }
    } else {
      payload = (await req.json()) as OrderPayload;
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { order, cake } = payload;
  if (!order?.email || !order?.date || !order?.name || !order?.phone) {
    return NextResponse.json(
      { ok: false, error: "Missing required customer fields" },
      { status: 400 },
    );
  }

  // Resolve the chosen pickup location to its Square location ID. If the
  // customer chose "other" we leave squareLocationId empty and skip the
  // till push (the order is still captured server-side).
  const content = await getContent();
  const chosen = content.locations.find((l) => l.id === order.location);
  const squareLocationId = chosen?.squareLocationId ?? "";
  const locationLabel = chosen?.name ?? order.locationOther ?? "Other";

  const summary = describeCake(cake, order, imagePath);
  const total = payload.quotedTotal ?? computeTotal(cake);

  // Always log the order (server-side) — the email/Slack/SMS forwarder
  // hooks here in production. This guarantees no order is ever silently
  // lost even if Square is unavailable.
  // eslint-disable-next-line no-console
  console.log("[cakes] order:", {
    name: order.name,
    email: order.email,
    phone: order.phone,
    pickupAt: `${order.date}T${order.time}`,
    pickup: locationLabel,
    summary,
    quotedTotal: total,
    imagePath,
  });

  // Push to Square so it prints at the till.
  let squareOrderId: string | undefined;
  let squareError: string | undefined;
  if (squareLocationId && process.env.SQUARE_ACCESS_TOKEN) {
    try {
      const pickupAt = new Date(`${order.date}T${order.time}:00`).toISOString();
      const result = await createOrder({
        squareLocationId,
        ticketName: `Cake — ${order.name}`,
        idempotencyKey: randomUUID(),
        pickup: {
          displayName: order.name,
          email: order.email,
          phone: order.phone,
          pickupAt,
          note: `Web cake order. Pickup: ${locationLabel}.`,
        },
        lineItems: [
          {
            name: lineItemName(cake),
            quantity: 1,
            price: total ?? undefined,
            note: summary,
          },
        ],
      });
      squareOrderId = result.orderId;
    } catch (err) {
      squareError =
        err instanceof SquareNotConfiguredError
          ? "not-configured"
          : err instanceof Error
            ? err.message
            : "unknown";
      // eslint-disable-next-line no-console
      console.warn("[cakes] Square order push failed:", squareError);
    }
  } else if (!squareLocationId) {
    squareError = "no-square-location-id";
  }

  return NextResponse.json({
    ok: true,
    squareOrderId,
    squareError,
    imagePath,
  });
}

function lineItemName(c: CakeConfig): string {
  const size = SIZE_OPTIONS.find((s) => s.id === c.size)?.label ?? c.size;
  const shape = SHAPE_OPTIONS.find((s) => s.id === c.shape)?.label ?? c.shape;
  const cover = COVER_OPTIONS.find((cv) => cv.id === c.cover)?.label ?? c.cover;
  return `Custom Cake — ${size} ${shape} · ${cover}`;
}

function describeCake(c: CakeConfig, o: OrderFields, imagePath: string | null): string {
  const lines: string[] = [];
  const size = SIZE_OPTIONS.find((s) => s.id === c.size);
  const shape = SHAPE_OPTIONS.find((s) => s.id === c.shape);
  const base = BASE_OPTIONS.find((b) => b.id === c.base);
  const fillings = FILLING_OPTIONS.filter((f) => c.fillings.includes(f.id));
  const cover = COVER_OPTIONS.find((cv) => cv.id === c.cover);

  if (size) lines.push(`Size: ${size.label} · ${size.serves}`);
  if (shape) lines.push(`Shape: ${shape.label}${shape.poa ? " (P.O.A.)" : ""}`);
  if (c.shape === "special-3d" && o.shapeOther) lines.push(`3D detail: ${o.shapeOther}`);
  if (base) lines.push(`Base: ${base.label}${c.base === "other" && o.baseOther ? ` — ${o.baseOther}` : ""}`);
  if (fillings.length) {
    const fillingLabel = fillings.map((f) => f.label).join(" + ");
    lines.push(
      `Fillings: ${fillingLabel}${c.fillings.includes("other") && o.fillingOther ? ` — ${o.fillingOther}` : ""}`,
    );
  }
  if (cover) lines.push(`Cover: ${cover.label}`);
  if (o.coverOther) lines.push(`Cover (other): ${o.coverOther}`);
  if (c.message) lines.push(`Message: "${c.message}"`);
  if (imagePath) lines.push(`Image upload: ${imagePath}`);
  if (o.specialRequests) lines.push(`Special: ${o.specialRequests}`);
  return lines.join(" · ");
}
