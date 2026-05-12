/**
 * Named image slots — every "real photo" slot on the site that an admin
 * should be able to swap independently. Each slot stores a URL (an
 * /uploads/* path uploaded via the admin, or empty to fall back to the
 * mockup library).
 *
 * The catalogue here is the source of truth for what the admin sees in
 * /admin/site-images. Match slot keys to where they're consumed.
 */

import { promises as fs } from "fs";
import path from "path";
import type { Mockup } from "./mockups";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = "image-slots.json";

export interface SlotDefinition {
  key: string;
  label: string;
  group: "Homepage" | "Process" | "Cake covers" | "Shopfronts" | "Story" | "Sections";
  /** Mockup key to fall back to when the slot is empty. */
  fallback: Mockup;
  /** Recommended aspect ratio (informational, for the admin). */
  aspect: string;
}

export const IMAGE_SLOTS: SlotDefinition[] = [
  // Homepage
  { key: "hero-bagels",          group: "Homepage", label: "Hero — bagels",            aspect: "4 / 5",  fallback: "bagel-hero" },
  { key: "signature-bagels",     group: "Homepage", label: "Signature — Bagels",       aspect: "1 / 1",  fallback: "icon-bagels" },
  { key: "signature-challah",    group: "Homepage", label: "Signature — Challah",      aspect: "1 / 1",  fallback: "icon-pastries" },
  { key: "signature-rugelach",   group: "Homepage", label: "Signature — Rugelach",     aspect: "1 / 1",  fallback: "icon-cakes" },
  { key: "menu-teaser",          group: "Homepage", label: "Menu teaser",              aspect: "3 / 2",  fallback: "bakery-interior" },
  { key: "catering-teaser",      group: "Homepage", label: "Catering teaser",          aspect: "5 / 4",  fallback: "platter" },
  // Process
  { key: "process-kettle",       group: "Process",  label: "Step i — Kettle",          aspect: "4 / 3",  fallback: "process-kettle" },
  { key: "process-bench",        group: "Process",  label: "Step ii — Bench",          aspect: "4 / 3",  fallback: "process-bench" },
  { key: "process-counter",      group: "Process",  label: "Step iii — Counter",       aspect: "4 / 3",  fallback: "process-counter" },
  // Cake covers
  { key: "cake-buttercream-round",  group: "Cake covers", label: "Buttercream · round",   aspect: "1 / 1", fallback: "cake-buttercream-round" },
  { key: "cake-buttercream-square", group: "Cake covers", label: "Buttercream · square",  aspect: "1 / 1", fallback: "cake-buttercream-square" },
  { key: "cake-ganache-round",      group: "Cake covers", label: "Ganache · round",       aspect: "1 / 1", fallback: "cake-ganache-round" },
  { key: "cake-ganache-square",     group: "Cake covers", label: "Ganache · square",      aspect: "1 / 1", fallback: "cake-ganache-square" },
  { key: "cake-icing-round",        group: "Cake covers", label: "Icing · round",         aspect: "1 / 1", fallback: "cake-icing-round" },
  { key: "cake-icing-square",       group: "Cake covers", label: "Icing · square",        aspect: "1 / 1", fallback: "cake-icing-square" },
  { key: "cake-image-print",        group: "Cake covers", label: "Image-print",           aspect: "1 / 1", fallback: "cake-image-print" },
  { key: "cake-3d",                 group: "Cake covers", label: "Sculpted 3D",           aspect: "1 / 1", fallback: "cake-3d" },
  // Shopfronts
  { key: "visit-shop-belsize",        group: "Shopfronts", label: "Shop — Belsize",         aspect: "4 / 5", fallback: "shopfront" },
  { key: "visit-shop-swains-lane",    group: "Shopfronts", label: "Shop — Swain's Lane",    aspect: "4 / 5", fallback: "shopfront" },
  { key: "visit-shop-west-hampstead", group: "Shopfronts", label: "Shop — West Hampstead",  aspect: "4 / 5", fallback: "shopfront" },
  { key: "visit-shop-muswell-hill",   group: "Shopfronts", label: "Shop — Muswell Hill",    aspect: "4 / 5", fallback: "shopfront" },
  // Story
  { key: "story-1989",   group: "Story", label: "Story — 1989", aspect: "4 / 5", fallback: "shopfront" },
  { key: "story-2011",   group: "Story", label: "Story — 2011", aspect: "4 / 5", fallback: "bakery-interior" },
  { key: "story-2025",   group: "Story", label: "Story — 2025", aspect: "4 / 5", fallback: "bagel-counter" },
  // Sections
  { key: "cakes-hero",   group: "Sections", label: "Cakes hero",  aspect: "4 / 5", fallback: "cake-buttercream-round" },
];

interface SlotsFile {
  slots: Record<string, string>;
}

async function readFile(): Promise<SlotsFile> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, FILE), "utf8");
    return JSON.parse(raw) as SlotsFile;
  } catch {
    return { slots: {} };
  }
}
async function writeFile(data: SlotsFile): Promise<void> {
  const tmp = path.join(DATA_DIR, `${FILE}.tmp`);
  const final = path.join(DATA_DIR, FILE);
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, final);
}

export async function getSlots(): Promise<Record<string, string>> {
  const file = await readFile();
  return file.slots;
}

export async function getSlot(key: string): Promise<string> {
  const slots = await getSlots();
  return slots[key] ?? "";
}

export async function setSlot(key: string, value: string): Promise<void> {
  const file = await readFile();
  file.slots[key] = value;
  await writeFile(file);
}

export async function clearSlot(key: string): Promise<void> {
  const file = await readFile();
  delete file.slots[key];
  await writeFile(file);
}
