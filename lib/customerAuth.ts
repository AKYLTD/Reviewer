/**
 * Customer session cookies. Same pattern as lib/auth.ts (admin) but
 * scoped to customers: the JWT-like signed cookie carries the customer
 * id, not a generic "admin" subject.
 *
 * Production: swap for NextAuth.js with a real adapter. The shape of
 * the session object is intentionally tiny so the swap is mechanical.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "ronis_customer";
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be set to at least 16 chars");
  }
  return s;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function fromB64url(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64url(new Uint8Array(sig));
}
async function verify(data: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    fromB64url(signature),
    new TextEncoder().encode(data),
  );
}

interface CustomerSession {
  sub: string; // customer id
  exp: number;
}

export async function createCustomerSessionToken(customerId: string): Promise<string> {
  const payload: CustomerSession = {
    sub: customerId,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
  };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await sign(body, getSecret());
  return `${body}.${sig}`;
}

export async function readCustomerSession(token: string | null | undefined): Promise<CustomerSession | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!(await verify(body, sig, getSecret()))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as CustomerSession;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentCustomerSession(): Promise<CustomerSession | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  return readCustomerSession(token);
}

export const CUSTOMER_COOKIE = COOKIE_NAME;
export const CUSTOMER_MAX_AGE = SESSION_DURATION;
