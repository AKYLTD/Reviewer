/** Shape of the cake-builder configuration. Single source of truth: the
 *  CakeSketch SVG and the order form both consume this. */

export type CakeShape = "round" | "square";
export type CakeStyle = "smooth" | "naked" | "swirl";
export type CakeColor = "vanilla" | "chocolate" | "strawberry" | "saffron" | "brick" | "pistachio" | "lavender";
export type CakeTopper = "none" | "candles" | "fruit" | "flowers" | "figurine";

export interface CakeConfig {
  tiers: 1 | 2 | 3;
  shape: CakeShape;
  style: CakeStyle;
  color: CakeColor;
  topper: CakeTopper;
  candles: number;
  inscription: string;
  // Editorial choice — drives flavour but not the sketch.
  sponge: string;
}

export const DEFAULT_CAKE: CakeConfig = {
  tiers: 1,
  shape: "round",
  style: "smooth",
  color: "vanilla",
  topper: "candles",
  candles: 6,
  inscription: "Happy Birthday",
  sponge: "vanilla",
};

/** Fill colour for each frosting choice. Two-tone (light/dark) so the
 *  CakeSketch can render highlight + body without re-mixing. */
export const COLOR_PALETTE: Record<CakeColor, { light: string; body: string; deep: string; label: string }> = {
  vanilla:    { light: "#FFF6E0", body: "#F5E6BE", deep: "#D9BD7C", label: "Vanilla cream" },
  chocolate:  { light: "#7B4827", body: "#5C2F18", deep: "#3D1B0A", label: "Chocolate ganache" },
  strawberry: { light: "#FFCFC4", body: "#E8857A", deep: "#B05546", label: "Strawberry" },
  saffron:    { light: "#FFE0A1", body: "#F5A623", deep: "#B97712", label: "Saffron honey" },
  brick:      { light: "#E89283", body: "#C9483A", deep: "#8C2A1E", label: "Roni's brick" },
  pistachio:  { light: "#D7E5B4", body: "#9DBA68", deep: "#6E8848", label: "Pistachio" },
  lavender:   { light: "#E1D2EE", body: "#B795D2", deep: "#8265A0", label: "Lavender" },
};

export const STYLE_LABELS: Record<CakeStyle, string> = {
  smooth: "Smooth iced",
  naked: "Semi-naked",
  swirl: "Swirled",
};

export const SHAPE_LABELS: Record<CakeShape, string> = {
  round: "Round",
  square: "Square",
};

export const TOPPER_LABELS: Record<CakeTopper, string> = {
  none: "Plain",
  candles: "Candles",
  fruit: "Fresh fruit",
  flowers: "Edible flowers",
  figurine: "Custom figurine",
};

export const SPONGE_OPTIONS = [
  "Vanilla",
  "Chocolate",
  "Lemon drizzle",
  "Marble",
  "Carrot",
  "Red velvet",
  "Coffee & walnut",
];

export const ALLERGEN_OPTIONS = [
  "Nut-free",
  "Gluten-friendly",
  "Dairy-free",
  "Eggless",
  "Vegan",
];

export const OCCASION_OPTIONS = [
  "Birthday",
  "Wedding / engagement",
  "Anniversary",
  "Bar / Bat Mitzvah",
  "Shabbat",
  "Holiday",
  "Just because",
];
