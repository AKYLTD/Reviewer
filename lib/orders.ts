/**
 * File-backed order store. Persists every cake and catering submission
 * captured by /api/* so the admin back-office can list, view detail,
 * update status, and add internal notes — without standing up a database.
 *
 * Click-and-collect and order-at-table flow direct through Square Online
 * and aren't represented here; admin links those to the Square dashboard
 * (or, when GET /v2/orders/search is wired up, fetches them on demand).
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type OrderChannel = "cake" | "catering";
export type OrderStatus =
  | "new"
  | "confirmed"
  | "in-progress"
  | "ready"
  | "completed"
  | "cancelled";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  "in-progress": "In progress",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-saffron text-coffee",
  confirmed: "bg-saffronSoft text-coffee",
  "in-progress": "bg-brick text-cream",
  ready: "bg-coffee text-saffron",
  completed: "bg-bone text-coffee",
  cancelled: "bg-cocoa/10 text-cocoa",
};

export interface OrderRecord {
  id: string;
  channel: OrderChannel;
  status: OrderStatus;
  createdAt: string; // ISO 8601
  updatedAt: string;
  /** When the customer wants the cake / catering — may be in the future. */
  scheduledFor?: string;
  pickupLocationId?: string;
  customer: { name: string; email: string; phone?: string };
  /** One-line description suitable for list rows. */
  summary: string;
  /** Channel-specific payload (CakeConfig + form, CateringForm fields). */
  details: Record<string, unknown>;
  /** Quoted total in pence; null for P.O.A. catering enquiries. */
  total: number | null;
  squareOrderId?: string;
  squareError?: string;
  /** Free-text internal notes from the admin. */
  internalNotes: string;
  /** Server-uploaded asset paths (cake image, etc). */
  attachments: string[];
}

export interface OrdersFile {
  orders: OrderRecord[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = "orders.json";

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
  return JSON.parse(raw) as T;
}
async function writeJson(file: string, data: unknown): Promise<void> {
  const tmp = path.join(DATA_DIR, `${file}.tmp`);
  const final = path.join(DATA_DIR, file);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, final);
}

export async function listOrders(): Promise<OrderRecord[]> {
  try {
    const file = await readJson<OrdersFile>(ORDERS_FILE);
    return file.orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  const orders = await listOrders();
  return orders.find((o) => o.id === id) ?? null;
}

/** Generate a short, human-readable order id (e.g. ord-2026-0508-1f3a). */
export function newOrderId(channel: OrderChannel): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const tail = randomUUID().slice(0, 4);
  return `${channel.slice(0, 3)}-${yyyy}-${mm}${dd}-${tail}`;
}

export async function createOrder(
  partial: Omit<OrderRecord, "id" | "createdAt" | "updatedAt" | "internalNotes" | "attachments" | "status"> & {
    id?: string;
    status?: OrderStatus;
    attachments?: string[];
  },
): Promise<OrderRecord> {
  let file: OrdersFile;
  try {
    file = await readJson<OrdersFile>(ORDERS_FILE);
  } catch {
    file = { orders: [] };
  }
  const now = new Date().toISOString();
  const record: OrderRecord = {
    id: partial.id ?? newOrderId(partial.channel),
    status: partial.status ?? "new",
    createdAt: now,
    updatedAt: now,
    internalNotes: "",
    attachments: partial.attachments ?? [],
    ...partial,
  };
  file.orders.push(record);
  await writeJson(ORDERS_FILE, file);
  return record;
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<OrderRecord, "status" | "internalNotes">>,
): Promise<OrderRecord | null> {
  const file = await readJson<OrdersFile>(ORDERS_FILE);
  const idx = file.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  file.orders[idx] = {
    ...file.orders[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(ORDERS_FILE, file);
  return file.orders[idx];
}

export async function deleteOrder(id: string): Promise<boolean> {
  const file = await readJson<OrdersFile>(ORDERS_FILE);
  const next = file.orders.filter((o) => o.id !== id);
  if (next.length === file.orders.length) return false;
  await writeJson(ORDERS_FILE, { orders: next });
  return true;
}

/** Aggregate stats for the admin dashboard. */
export async function ordersStats(): Promise<{
  total: number;
  byStatus: Record<OrderStatus, number>;
  byChannel: Record<OrderChannel, number>;
  recent: OrderRecord[];
}> {
  const orders = await listOrders();
  const byStatus = {
    new: 0, confirmed: 0, "in-progress": 0, ready: 0, completed: 0, cancelled: 0,
  } as Record<OrderStatus, number>;
  const byChannel = { cake: 0, catering: 0 } as Record<OrderChannel, number>;
  for (const o of orders) {
    byStatus[o.status]++;
    byChannel[o.channel]++;
  }
  return {
    total: orders.length,
    byStatus,
    byChannel,
    recent: orders.slice(0, 10),
  };
}

export function priceFromPence(pence: number, currency = "GBP"): string {
  const amount = pence / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
