/**
 * Curated mockup imagery — a consistent visual register (warm light,
 * wood / ceramic surfaces) so the site feels art-directed rather than
 * stock-randomised. Every key resolves to an Unsplash-hosted JPEG with
 * crop + quality params baked in.
 *
 * Replace any of them by adding a real photograph in /admin/images and
 * pointing the Photo's `src` prop at the upload path. The mockup is
 * the default; admin uploads always win.
 */

export type Mockup =
  // Hero / morning bake
  | "bagel-hero"
  | "bagel-counter"
  | "bagel-stack"
  | "bagel-bench"
  | "morning-bake"
  // Process steps (replaces the old kettle / bench / counter sketches)
  | "process-kettle"
  | "process-bench"
  | "process-counter"
  // Shop & interior
  | "bakery-interior"
  | "shopfront"
  // Drinks & sundries
  | "coffee"
  // Cakes — cover-matched
  | "cake-buttercream-round"
  | "cake-buttercream-square"
  | "cake-ganache-round"
  | "cake-ganache-square"
  | "cake-icing-round"
  | "cake-icing-square"
  | "cake-image-print"
  | "cake-3d"
  | "cake-stack"
  | "cake-decorating"
  // Food — category icons (replaces the old food-icon sketches)
  | "icon-bagels"
  | "icon-coffee"
  | "icon-pastries"
  | "icon-salads"
  | "icon-catering"
  | "icon-cakes"
  // Catering & spreads
  | "platter"
  | "table-spread"
  // Sandwiches & salads
  | "salad"
  | "smoked-salmon"
  | "croissant";

const U = (id: string, w = 1600, h = 1067) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

export const MOCKUPS: Record<Mockup, string> = {
  // Hero / morning bake
  "bagel-hero":              U("1606101205803-c3b16e9d8ad5"),
  "bagel-counter":           U("1551024601-bec78aea704b"),
  "bagel-stack":             U("1592151450004-7c63d7b30fa6"),
  "bagel-bench":             U("1509440159596-0249088772ff"),
  "morning-bake":            U("1568471173242-461f0a730452"),
  // Process — same warm-wood register as the rest
  "process-kettle":          U("1556909114-f6e7ad7d3136"),
  "process-bench":           U("1509440159596-0249088772ff"),
  "process-counter":         U("1567306226416-28f0efdc88ce"),
  // Shop & interior
  "bakery-interior":         U("1554118811-1e0d58224f24"),
  "shopfront":               U("1559925393-8be0ec4767c8"),
  // Coffee
  "coffee":                  U("1495474472287-4d71bcdd2085"),
  // Cake covers
  "cake-buttercream-round":  U("1578985545062-69928b1d9587"),
  "cake-buttercream-square": U("1535254973040-607b474cb50d"),
  "cake-ganache-round":      U("1606890737304-57a1ca8a5b62"),
  "cake-ganache-square":     U("1571115177098-24ec42ed204d"),
  "cake-icing-round":        U("1557925923-cd4648e211a0"),
  "cake-icing-square":       U("1486427944299-d1955d23e34d"),
  "cake-image-print":        U("1605294283565-5dad8da6b4b5"),
  "cake-3d":                 U("1586985289688-ca3cf47d3e6e"),
  "cake-stack":              U("1535254973040-607b474cb50d"),
  "cake-decorating":         U("1571115177098-24ec42ed204d"),
  // Category icons (square crops, match the warm register)
  "icon-bagels":             U("1606101205803-c3b16e9d8ad5", 600, 600),
  "icon-coffee":             U("1495474472287-4d71bcdd2085", 600, 600),
  "icon-pastries":           U("1555507036-ab1f4038808a", 600, 600),
  "icon-salads":             U("1546069901-ba9599a7e63c",  600, 600),
  "icon-catering":           U("1565299624946-b28f40a0ae38", 600, 600),
  "icon-cakes":              U("1578985545062-69928b1d9587", 600, 600),
  // Catering / platters
  "platter":                 U("1565299624946-b28f40a0ae38"),
  "table-spread":            U("1414235077428-338989a2e8c0"),
  // Sandwiches & salads
  "salad":                   U("1546069901-ba9599a7e63c"),
  "smoked-salmon":           U("1555243896-771fbe89cdaa"),
  "croissant":               U("1555507036-ab1f4038808a"),
};

export function mockupUrl(key: Mockup): string {
  return MOCKUPS[key] ?? MOCKUPS["bagel-hero"];
}
