/**
 * File-backed customer store. **MVP only.** Production must swap in a
 * real auth provider (NextAuth, Clerk, or Supabase Auth) and a real
 * database. Cards must NEVER be stored here — payment storage is
 * delegated to Stripe Customer Portal in production, which holds the
 * card on its side and gives us back a tokenized reference.
 *
 * What this file does provide:
 *  - A typed schema for the customer record
 *  - Read/write helpers with atomic writes
 *  - Password hashing via Node's crypto.scrypt (no extra deps)
 *  - Loyalty point accrual + redemption math
 *
 * What this file DOESN'T provide:
 *  - Email verification
 *  - Password reset flow
 *  - Rate-limiting brute-force protection
 *  - Real session management beyond a signed cookie (lib/auth.ts is
 *    similarly minimal; in production both swap to NextAuth.js).
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID, scrypt as scryptCb, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb);

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = "customers.json";

export interface LoyaltyEntry {
  /** ISO 8601 timestamp. */
  at: string;
  /** Positive: earned. Negative: redeemed. */
  delta: number;
  /** Order ID or note. */
  ref: string;
}

export interface CustomerRecord {
  id: string;
  email: string;
  name: string;
  phone?: string;
  /** salt:hash (hex). */
  passwordHash: string;
  /** Loyalty balance — kept denormalised for fast reads. */
  points: number;
  history: LoyaltyEntry[];
  /** Order ids placed by this customer. */
  orderIds: string[];
  /** MVP payment-method placeholder — production uses Stripe tokens. */
  paymentMethods: {
    id: string;
    brand: string;  // visa, mastercard, etc.
    last4: string;
    expiry: string; // MM/YY
    label: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface File {
  customers: CustomerRecord[];
}

async function readFile(): Promise<File> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, FILE), "utf8");
    return JSON.parse(raw) as File;
  } catch {
    return { customers: [] };
  }
}
async function writeFile(data: File): Promise<void> {
  const tmp = path.join(DATA_DIR, `${FILE}.tmp`);
  const final = path.join(DATA_DIR, FILE);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, final);
}

async function hash(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

async function verify(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const buf = (await scrypt(password, salt, 64)) as Buffer;
  const stash = Buffer.from(hashHex, "hex");
  if (buf.length !== stash.length) return false;
  return timingSafeEqual(buf, stash);
}

/* ============================================================== */
/* PUBLIC API                                                     */
/* ============================================================== */

export async function findCustomerByEmail(email: string): Promise<CustomerRecord | null> {
  const file = await readFile();
  const norm = email.toLowerCase().trim();
  return file.customers.find((c) => c.email.toLowerCase() === norm) ?? null;
}

export async function getCustomer(id: string): Promise<CustomerRecord | null> {
  const file = await readFile();
  return file.customers.find((c) => c.id === id) ?? null;
}

export async function listCustomers(): Promise<CustomerRecord[]> {
  const file = await readFile();
  return [...file.customers].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export async function createCustomer(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<CustomerRecord> {
  const file = await readFile();
  const email = input.email.toLowerCase().trim();
  if (file.customers.some((c) => c.email.toLowerCase() === email)) {
    throw new Error("An account with that email already exists.");
  }
  const now = new Date().toISOString();
  const passwordHash = await hash(input.password);
  const record: CustomerRecord = {
    id: `cust-${randomUUID().slice(0, 8)}`,
    email,
    name: input.name.trim(),
    phone: input.phone?.trim(),
    passwordHash,
    points: 0,
    history: [],
    orderIds: [],
    paymentMethods: [],
    createdAt: now,
    updatedAt: now,
  };
  file.customers.push(record);
  await writeFile(file);
  return record;
}

export async function authenticate(email: string, password: string): Promise<CustomerRecord | null> {
  const c = await findCustomerByEmail(email);
  if (!c) return null;
  if (!(await verify(password, c.passwordHash))) return null;
  return c;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Pick<CustomerRecord, "name" | "phone">>,
): Promise<CustomerRecord | null> {
  const file = await readFile();
  const idx = file.customers.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  file.customers[idx] = {
    ...file.customers[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(file);
  return file.customers[idx];
}

/* ---------- LOYALTY ----------------------------------------- */

/** 1 point per £ spent (1 point per 100 pence, rounded). */
export const POINTS_PER_PENNY = 0.01;
/** Redeem 100 points → £5 off (500 pence). */
export const POINTS_PER_REWARD = 100;
export const REWARD_VALUE_PENCE = 500;

export function pointsForSpend(pence: number): number {
  return Math.floor(pence * POINTS_PER_PENNY);
}

export async function accrue(
  id: string,
  delta: number,
  ref: string,
): Promise<CustomerRecord | null> {
  const file = await readFile();
  const idx = file.customers.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const c = file.customers[idx];
  const next = {
    ...c,
    points: Math.max(0, c.points + delta),
    history: [{ at: new Date().toISOString(), delta, ref }, ...c.history].slice(0, 200),
    updatedAt: new Date().toISOString(),
  };
  file.customers[idx] = next;
  await writeFile(file);
  return next;
}

export async function recordOrderForCustomer(id: string, orderId: string, totalPence: number) {
  const earned = pointsForSpend(totalPence);
  await accrue(id, earned, `Order ${orderId}`);
  // Append the order id to the customer's order list.
  const file = await readFile();
  const idx = file.customers.findIndex((c) => c.id === id);
  if (idx === -1) return;
  if (!file.customers[idx].orderIds.includes(orderId)) {
    file.customers[idx].orderIds.unshift(orderId);
    file.customers[idx].updatedAt = new Date().toISOString();
    await writeFile(file);
  }
}
