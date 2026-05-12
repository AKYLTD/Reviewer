/**
 * Server-only promotions store. Atomic-rename writes to data/promotions.json.
 * Imported by admin pages + the shop page (server side). The shop's client
 * component imports only the pure types/helpers from lib/promotions.ts.
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Promotion } from "./promotions";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = "promotions.json";

interface File {
  promotions: Promotion[];
}

async function readFile(): Promise<File> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, FILE), "utf8");
    return JSON.parse(raw) as File;
  } catch {
    return { promotions: [] };
  }
}
async function writeFile(data: File): Promise<void> {
  const tmp = path.join(DATA_DIR, `${FILE}.tmp`);
  const final = path.join(DATA_DIR, FILE);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, final);
}

export async function listPromotions(): Promise<Promotion[]> {
  const f = await readFile();
  return f.promotions.sort((a, b) => (a.enabled === b.enabled ? 0 : a.enabled ? -1 : 1));
}

export async function activePromotions(now = new Date()): Promise<Promotion[]> {
  const all = await listPromotions();
  const t = now.getTime();
  return all.filter((p) => {
    if (!p.enabled) return false;
    if (p.startsAt && new Date(p.startsAt).getTime() > t) return false;
    if (p.endsAt && new Date(p.endsAt).getTime() < t) return false;
    return true;
  });
}

export async function activeBanner(): Promise<Promotion | null> {
  const promos = await activePromotions();
  return promos.find((p) => p.kind === "banner") ?? null;
}

export async function createPromotion(
  data: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
): Promise<Promotion> {
  const file = await readFile();
  const now = new Date().toISOString();
  const promo: Promotion = {
    id: `promo-${randomUUID().slice(0, 8)}`,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  file.promotions.push(promo);
  await writeFile(file);
  return promo;
}

export async function updatePromotion(
  id: string,
  patch: Partial<Omit<Promotion, "id" | "createdAt">>,
): Promise<Promotion | null> {
  const file = await readFile();
  const idx = file.promotions.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  file.promotions[idx] = {
    ...file.promotions[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(file);
  return file.promotions[idx];
}

export async function deletePromotion(id: string): Promise<boolean> {
  const file = await readFile();
  const next = file.promotions.filter((p) => p.id !== id);
  if (next.length === file.promotions.length) return false;
  await writeFile({ promotions: next });
  return true;
}
