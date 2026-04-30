import type { Review, Store, Channel } from "../types";

const NAMES = [
  "Alex M.", "Priya S.", "Tom W.", "Chloe B.", "Marco D.", "Yuki T.",
  "Sam J.", "Hassan K.", "Lola P.", "Diego R.", "Aisha N.", "Olivia C.",
  "Ethan F.", "Noor A.", "Liam G.", "Sofia V.", "Ben H.", "Maya O.",
  "Jordan T.", "Esra B.",
];

const POSITIVE = [
  "Genuinely the best in the area. Food arrived hot and the staff were lovely.",
  "Reliable favourite. Order is always correct and on time.",
  "Beautiful presentation and the flavours really come through. Will reorder.",
  "Fast delivery, generous portions, and the packaging is solid.",
  "The team here are stars - friendly, fast, and the quality is consistent.",
  "Top tier. Easily a 5 - portions, taste and the little extras.",
];
const NEUTRAL = [
  "Decent. Nothing wrong, nothing amazing. Would order again if nearby.",
  "Food was okay, a bit cold by the time it arrived. Tasted fine.",
  "Average. Service was polite, food was standard.",
  "Solid 3 stars - good value, but the menu felt a bit limited.",
];
const NEGATIVE = [
  "Order arrived 40 minutes late and missing a side. Not great.",
  "Food was lukewarm and the chips were soggy. Disappointing.",
  "Quality has slipped recently. Used to be a favourite.",
  "Driver couldn't find the address and the support line wasn't helpful.",
];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const STORE_TEMPLATES: Array<Omit<Store, "id" | "brand" | "channels">> = [
  { name: "Shoreditch", address: "12 Curtain Rd", city: "London", country: "UK" },
  { name: "Soho", address: "44 Berwick St", city: "London", country: "UK" },
  { name: "King's Cross", address: "8 Pancras Sq", city: "London", country: "UK" },
  { name: "Manchester NQ", address: "29 Tib St", city: "Manchester", country: "UK" },
  { name: "Bristol Harbourside", address: "1 Canons Rd", city: "Bristol", country: "UK" },
  { name: "Edinburgh Old Town", address: "55 Cockburn St", city: "Edinburgh", country: "UK" },
  { name: "Leeds Trinity", address: "27 Albion St", city: "Leeds", country: "UK" },
  { name: "Brighton Lanes", address: "10 East St", city: "Brighton", country: "UK" },
];

export function buildDemoDataset(brand: string): { stores: Store[]; reviews: Review[] } {
  const seed = seedFromString(brand.toLowerCase().trim());
  const rng = mulberry32(seed);
  const storeCount = 4 + Math.floor(rng() * 4); // 4-7 stores
  const stores: Store[] = [];
  for (let i = 0; i < storeCount; i++) {
    const t = STORE_TEMPLATES[(seed + i) % STORE_TEMPLATES.length];
    const channels: Channel[] = ["google"];
    if (rng() > 0.2) channels.push("deliveroo");
    if (rng() > 0.5) channels.push("uber_eats");
    if (rng() > 0.7) channels.push("trustpilot");
    stores.push({
      id: `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`,
      brand,
      name: `${brand} ${t.name}`,
      address: t.address,
      city: t.city,
      country: t.country,
      channels,
    });
  }

  const reviews: Review[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  for (const store of stores) {
    const baseQuality = 3.4 + rng() * 1.4; // mean 3.4-4.8
    const count = 25 + Math.floor(rng() * 75); // 25-100 reviews per store
    for (let j = 0; j < count; j++) {
      const channel = pick(store.channels, rng);
      // skew rating around store baseQuality, clamped 1..5
      const noise = (rng() - 0.5) * 2.4;
      const rating = Math.max(1, Math.min(5, Math.round(baseQuality + noise)));
      const bucket = rating >= 4 ? POSITIVE : rating === 3 ? NEUTRAL : NEGATIVE;
      const ageDays = Math.floor(rng() * 540); // up to ~18 months
      reviews.push({
        id: `${store.id}-${channel}-${j}`,
        storeId: store.id,
        channel,
        author: pick(NAMES, rng),
        rating,
        text: pick(bucket, rng),
        createdAt: new Date(now - ageDays * day - Math.floor(rng() * day)).toISOString(),
        language: "en",
      });
    }
  }
  return { stores, reviews };
}
