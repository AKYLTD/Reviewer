/**
 * Minimal admin auth — single-password, signed-cookie sessions.
 *
 * Why not NextAuth: this site has one user (the shop owner). NextAuth would
 * be more code, more dependencies, and more cognitive overhead than a single
 * HMAC'd cookie. The trade-off: no roles, no MFA. Acceptable for a CMS that
 * edits a JSON file.
 *
 * The cookie carries a payload (`{ sub: 'admin', exp }`) signed with
 * ADMIN_SESSION_SECRET. We use Node's webcrypto for HMAC-SHA256 so this
 * works in both the Node runtime (server actions, route handlers) and the
 * Edge runtime (middleware).
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "ronis_admin";
const ONE_DAY = 60 * 60 * 24;
const SESSION_DURATION = ONE_DAY * 7;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be set to at least 16 chars");
  }
  return secret;
}

function getPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD must be set");
  return pw;
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

interface SessionPayload {
  sub: "admin";
  exp: number; // unix seconds
}

export async function createSessionToken(): Promise<string> {
  const payload: SessionPayload = {
    sub: "admin",
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
  };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await sign(body, getSecret());
  return `${body}.${sig}`;
}

export async function readSession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!(await verify(body, sig, getSecret()))) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time-ish password comparison. */
export function passwordMatches(input: string): boolean {
  const expected = getPassword();
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ input.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function getCurrentSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return readSession(token);
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = SESSION_DURATION;
