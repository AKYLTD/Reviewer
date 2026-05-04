/**
 * File-backed content store. Reads and writes JSON files in /data.
 *
 * The intent is "minimal CMS": a Git-tracked source of truth that an
 * authenticated admin can edit through the /admin UI. No database. Edits
 * persist on the server filesystem — production should ensure the deploy
 * target keeps /data writable across deploys (Vercel does *not*: edits made
 * on Vercel are lost on next deploy unless mirrored to a database or blob
 * store. For Roni's, where the menu changes rarely, edits should be made
 * locally and committed; the production /admin is a preview of changes
 * pending commit. See README "Content editing" for the rule of thumb.)
 */

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export interface BrandContent {
  wordmark: string;
  subtitle: string;
  descriptor: string;
  addressNumber: string;
  logoSrc: string;
  tagline: string;
}

export interface HeroContent {
  headline: string;
  subhead: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export interface SiteContent {
  brand: BrandContent;
  hero: HeroContent;
  openingNote: { title: string; body: string[] };
  process: { n: string; label: string }[];
  hours: { day: string; hours: string }[];
  address: { line1: string; line2: string; phone: string; email: string };
  story: {
    intro: string;
    milestones: { year: string; place: string; body: string }[];
  };
}

export interface MenuRecord {
  categories: { id: string; name: string }[];
  items: {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    price: number; // pence
    imageSrc: string;
  }[];
}

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

export const getContent = (): Promise<SiteContent> => readJson<SiteContent>("content.json");
export const saveContent = (data: SiteContent) => writeJson("content.json", data);

export const getMenu = (): Promise<MenuRecord> => readJson<MenuRecord>("menu.json");
export const saveMenu = (data: MenuRecord) => writeJson("menu.json", data);

/** Format pence → display string. */
export function priceFromPence(pence: number, currency = "GBP"): string {
  const amount = pence / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `£${amount.toFixed(2)}`;
  }
}
