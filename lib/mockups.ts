/**
 * Curated mockup imagery for placeholder use across the site. Real
 * photography from /admin/images takes precedence; these step in when no
 * `src` is set on a Photo component, so a fresh deploy still feels
 * populated rather than empty.
 *
 * Each entry is a stable Unsplash URL with crop+quality params baked in.
 * Replace any of them by adding a real photograph in /admin/images and
 * pointing the Photo's `src` prop at the upload path.
 */

export type Mockup =
  | "bagel-hero"
  | "bagel-counter"
  | "bagel-stack"
  | "bagel-bench"
  | "bakery-interior"
  | "shopfront"
  | "coffee"
  | "cake"
  | "cake-stack"
  | "cake-decorating"
  | "platter"
  | "salad"
  | "smoked-salmon"
  | "croissant"
  | "table-spread"
  | "morning-bake";

const U = (id: string, w = 1600, h = 1067) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

export const MOCKUPS: Record<Mockup, string> = {
  // Bagels & morning bake
  "bagel-hero":      U("1606101205803-c3b16e9d8ad5"),
  "bagel-counter":   U("1551024601-bec78aea704b"),
  "bagel-stack":     U("1592151450004-7c63d7b30fa6"),
  "bagel-bench":     U("1509440159596-0249088772ff"),
  "morning-bake":    U("1568471173242-461f0a730452"),
  // Shop & interior
  "bakery-interior": U("1554118811-1e0d58224f24"),
  "shopfront":       U("1559925393-8be0ec4767c8"),
  // Coffee
  "coffee":          U("1495474472287-4d71bcdd2085"),
  // Cakes
  "cake":            U("1578985545062-69928b1d9587"),
  "cake-stack":      U("1535254973040-607b474cb50d"),
  "cake-decorating": U("1571115177098-24ec42ed204d"),
  // Catering / platters
  "platter":         U("1565299624946-b28f40a0ae38"),
  "table-spread":    U("1414235077428-338989a2e8c0"),
  // Sandwiches & salads
  "salad":           U("1546069901-ba9599a7e63c"),
  "smoked-salmon":   U("1555243896-771fbe89cdaa"),
  "croissant":       U("1555507036-ab1f4038808a"),
};

/** Resolve a mockup key to its URL, with fallback to bagel-hero. */
export function mockupUrl(key: Mockup): string {
  return MOCKUPS[key] ?? MOCKUPS["bagel-hero"];
}
