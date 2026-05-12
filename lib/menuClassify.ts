/**
 * Classifier shared between /menu and /shop. Returns the service mode
 * implied by a Square category name, plus the cleaned-up display name
 * with the prefix/suffix stripped and title-case applied.
 *
 * Picks up "eat in" / "dine in" / "table" / "restaurant" / "in-store"
 * ANYWHERE in the category name — start, end, parenthetical, whatever.
 * Same for takeaway markers. The previous prefix-only match left items
 * named "Salads — Eat In" in the takeaway tab; this fixes that.
 */

const EAT_IN_RE  = /\b(EAT[\s-]?IN|DINE[\s-]?IN|IN[\s-]?STORE|RESTAURANT|TABLE|SIT[\s-]?DOWN)\b/i;
const TAKEAWAY_RE = /\b(TAKE[\s-]?AWAY|TAKE[\s-]?OUT|TO[\s-]?GO|GRAB[\s-]?AND[\s-]?GO|GRAB[\s-]?GO|TAKEOUT)\b/i;

const SMALL = new Set(["and", "or", "of", "the", "a", "an", "to", "in", "on", "for", "with", "&"]);

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i, arr) =>
      i > 0 && i < arr.length - 1 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/** Strip a mode marker and surrounding delimiters / dashes. */
function strip(name: string, re: RegExp): string {
  return name
    .replace(re, " ")
    .replace(/[-–—:|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classify(rawName: string): { mode: "eat-in" | "takeaway"; cleanName: string } {
  if (EAT_IN_RE.test(rawName)) {
    const cleaned = strip(rawName, EAT_IN_RE) || rawName;
    return { mode: "eat-in", cleanName: titleCase(cleaned) };
  }
  if (TAKEAWAY_RE.test(rawName)) {
    const cleaned = strip(rawName, TAKEAWAY_RE) || rawName;
    return { mode: "takeaway", cleanName: titleCase(cleaned) };
  }
  return { mode: "takeaway", cleanName: titleCase(rawName) };
}

export { titleCase };
