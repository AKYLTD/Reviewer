/**
 * Classifier shared between /menu and /shop.
 *
 * Convention (Roni's): a category name with " ta" / "-ta" / "(ta)" /
 * trailing "ta" is the TAKEAWAY variant. The same base name without
 * "ta" is the EAT-IN variant. So:
 *
 *   "Salads"     → eat-in,  cleanName "Salads"
 *   "Salads ta"  → takeaway, cleanName "Salads"
 *   "Bagels-ta"  → takeaway, cleanName "Bagels"
 *
 * Legacy markers ("EAT IN", "DINE IN", "TAKEAWAY", etc.) are also
 * still respected anywhere in the name, so a category like
 * "Salads — Eat In" routes correctly. This means an admin can use
 * either convention without us breaking.
 */

const LEGACY_EAT_IN_RE   = /\b(EAT[\s-]?IN|DINE[\s-]?IN|IN[\s-]?STORE|RESTAURANT|TABLE|SIT[\s-]?DOWN)\b/i;
const LEGACY_TAKEAWAY_RE = /\b(TAKE[\s-]?AWAY|TAKE[\s-]?OUT|TO[\s-]?GO|GRAB[\s-]?AND[\s-]?GO|GRAB[\s-]?GO|TAKEOUT)\b/i;

// Match a standalone "ta" token surrounded by space, dash, slash,
// underscore, parens or end-of-string. We're careful not to match the
// "ta" inside words like "Pita" or "Pasta".
const TA_TAG_RE = /(^|[\s\-_/(])ta($|[\s\-_/)])/i;

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

function strip(name: string, re: RegExp): string {
  return name
    .replace(re, " ")
    .replace(/[-–—:|()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classify(rawName: string): { mode: "eat-in" | "takeaway"; cleanName: string } {
  // 1) Legacy explicit markers take precedence.
  if (LEGACY_EAT_IN_RE.test(rawName)) {
    return { mode: "eat-in", cleanName: titleCase(strip(rawName, LEGACY_EAT_IN_RE) || rawName) };
  }
  if (LEGACY_TAKEAWAY_RE.test(rawName)) {
    return { mode: "takeaway", cleanName: titleCase(strip(rawName, LEGACY_TAKEAWAY_RE) || rawName) };
  }
  // 2) Roni's "ta" tag convention.
  if (TA_TAG_RE.test(rawName)) {
    const cleaned = rawName.replace(TA_TAG_RE, " ").replace(/\s+/g, " ").trim();
    return { mode: "takeaway", cleanName: titleCase(cleaned || rawName) };
  }
  // 3) Default — eat-in (the brief: "if a category repeat itself without
  //    ta it means it is eat-in").
  return { mode: "eat-in", cleanName: titleCase(rawName) };
}

/**
 * Item-name level "ta" check. Some items carry the takeaway tag in their
 * own name (e.g. "Basque Cheesecake Ta") regardless of category. When
 * this fires we force the item into the takeaway mode and strip the tag
 * from the displayed name.
 */
export function classifyItemName(rawName: string): { takeaway: boolean; cleanName: string } {
  if (TA_TAG_RE.test(rawName)) {
    const cleaned = rawName.replace(TA_TAG_RE, " ").replace(/\s+/g, " ").trim();
    return { takeaway: true, cleanName: titleCase(cleaned || rawName) };
  }
  if (LEGACY_TAKEAWAY_RE.test(rawName)) {
    const cleaned = strip(rawName, LEGACY_TAKEAWAY_RE) || rawName;
    return { takeaway: true, cleanName: titleCase(cleaned) };
  }
  return { takeaway: false, cleanName: titleCase(rawName) };
}

export { titleCase };
