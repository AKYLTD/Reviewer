/**
 * Cake order types and option lists, matched to Roni's actual cake order
 * form. Single-tier cakes only; pickup from one of four shops; shape
 * includes "image print" and "special 3D" options with add-on cost.
 */

export type CakeShape = "round" | "square" | "image" | "special-3d";
export type CakeCover = "icing" | "buttercream" | "ganache";
export type CakeBase = "chocolate" | "vanilla" | "mousse" | "other";
export type CakeFilling = "chocolate" | "vanilla" | "fruits" | "jam" | "other";

export interface CakeSize {
  id: string;
  inches: number;
  price: number;        // pence; null when "P.O.A."
  serves: string;       // human-readable serving range
  label: string;        // headline label, e.g. "10 inch"
}

export const SIZE_OPTIONS: CakeSize[] = [
  { id: "8",  inches: 8,  price: 3200, serves: "up to 8 people",  label: "8 inch" },
  { id: "10", inches: 10, price: 4400, serves: "8 — 12 people",   label: "10 inch" },
  { id: "12", inches: 12, price: 6500, serves: "15 — 20 people",  label: "12 inch" },
  { id: "14", inches: 14, price: 8500, serves: "22 — 26 people",  label: "14 inch" },
  { id: "18", inches: 18, price: 12500, serves: "35 — 40 people", label: "18 inch" },
];

/**
 * Pickup locations are sourced from data/content.json `locations` and
 * passed into the builder as a prop. The id is the location.id from that
 * record; the form falls back to "other" with a free-text field.
 */
export interface PickupLocation {
  id: string;
  label: string;
}

export const SHAPE_OPTIONS: { id: CakeShape; label: string; surcharge?: number; poa?: boolean; hint?: string }[] = [
  { id: "round",       label: "Round" },
  { id: "square",      label: "Square" },
  { id: "image",       label: "Image print",   surcharge: 1200, hint: "Edible-image print on top · +£12" },
  { id: "special-3d",  label: "Special 3D",    poa: true,        hint: "Sculpted to your design · price on application" },
];

export const COVER_OPTIONS: { id: CakeCover; label: string }[] = [
  { id: "icing",       label: "Icing" },
  { id: "buttercream", label: "Butter cream" },
  { id: "ganache",     label: "Chocolate ganache" },
];

export const BASE_OPTIONS: { id: CakeBase; label: string }[] = [
  { id: "chocolate", label: "Chocolate sponge" },
  { id: "vanilla",   label: "Vanilla sponge" },
  { id: "mousse",    label: "Mousse" },
  { id: "other",     label: "Other (tell us below)" },
];

export const FILLING_OPTIONS: { id: CakeFilling; label: string; surcharge?: number; hint?: string }[] = [
  { id: "chocolate", label: "Chocolate filling" },
  { id: "vanilla",   label: "Vanilla filling" },
  { id: "fruits",    label: "Fruits layer", surcharge: 500, hint: "Fresh berries between the layers · +£5" },
  { id: "jam",       label: "Jam layer",    surcharge: 300, hint: "Raspberry or apricot · +£3" },
  { id: "other",     label: "Other (tell us below)" },
];

export interface CakeConfig {
  size: string;        // CakeSize.id
  shape: CakeShape;
  cover: CakeCover;
  base: CakeBase;
  /** Multi-select — customers often want layers of more than one filling. */
  fillings: CakeFilling[];
  message: string;
}

export const DEFAULT_CAKE: CakeConfig = {
  size: "10",
  shape: "round",
  cover: "buttercream",
  base: "chocolate",
  fillings: ["vanilla"],
  message: "Happy Birthday Roni",
};

export interface OrderFields {
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  /** Either a PickupLocation.id or "other". */
  location: string;
  locationOther: string;
  baseOther: string;
  fillingOther: string;
  shapeOther: string;
  coverOther: string;
  specialRequests: string;
  /** Filename of the uploaded edible-image print, set by the form when a
   *  file is attached. The actual file goes via FormData; this is the
   *  display name used in the live preview. */
  imageFileName: string;
}

export function defaultFields(defaultLocationId: string): OrderFields {
  return {
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "12:00",
    location: defaultLocationId,
    locationOther: "",
    baseOther: "",
    fillingOther: "",
    shapeOther: "",
    coverOther: "",
    specialRequests: "",
    imageFileName: "",
  };
}

/**
 * Compute the running total in pence based on the current config.
 * Returns null if the cake is "P.O.A." (price on application — special 3D).
 * Filling surcharges stack — every selected filling that carries a charge
 * (fruits +£5, jam +£3) is added to the total.
 */
export function computeTotal(config: CakeConfig): number | null {
  const size = SIZE_OPTIONS.find((s) => s.id === config.size);
  if (!size) return 0;

  const shape = SHAPE_OPTIONS.find((s) => s.id === config.shape);
  if (shape?.poa) return null;

  let total = size.price;
  if (shape?.surcharge) total += shape.surcharge;

  for (const fid of config.fillings) {
    const fill = FILLING_OPTIONS.find((f) => f.id === fid);
    if (fill?.surcharge) total += fill.surcharge;
  }

  return total;
}

export function formatGBP(pence: number): string {
  const amount = pence / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** Visual palette for each cover so the SVG can render the right surface. */
export const COVER_PALETTE: Record<CakeCover, { light: string; body: string; deep: string }> = {
  icing:       { light: "#FFFFFF", body: "#F8F1E1", deep: "#D9C9A6" },
  buttercream: { light: "#FFF6E0", body: "#F5E6BE", deep: "#D9BD7C" },
  ganache:     { light: "#7B4827", body: "#5C2F18", deep: "#3D1B0A" },
};
