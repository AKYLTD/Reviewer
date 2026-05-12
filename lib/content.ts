/**
 * File-backed content store. Reads and writes JSON files in /data.
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

export interface LocationHours {
  day: string;
  hours: string;
}

export interface LocationTransport {
  label: string;
  detail: string;
}

export interface Location {
  id: string;
  name: string;
  shortName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  hours: LocationHours[];
  transport: LocationTransport[];
  /** Square location ID — pasted in by admin to route orders here. */
  squareLocationId: string;
  /** Optional latitude/longitude for nearest-shop detection. Set in admin. */
  lat?: number;
  lng?: number;
}

export interface SiteContent {
  brand: BrandContent;
  hero: HeroContent;
  openingNote: { title: string; body: string[] };
  process: { n: string; label: string }[];
  story: {
    intro: string;
    milestones: { year: string; place: string; body: string }[];
  };
  primaryLocationId: string;
  locations: Location[];
}

export interface MenuRecord {
  categories: { id: string; name: string }[];
  items: {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    price: number;
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

/** Resolve the primary location, with a sensible fallback. */
export function primaryLocation(content: SiteContent): Location {
  const found = content.locations.find((l) => l.id === content.primaryLocationId);
  return found ?? content.locations[0];
}

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
