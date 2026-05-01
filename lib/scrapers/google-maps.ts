import { chromium, type Browser, type BrowserContext } from "playwright";
import type { Review, Store } from "../types";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });
  }
  return browserPromise;
}

async function newCtx(_brand: string): Promise<BrowserContext> {
  const browser = await getBrowser();
  return browser.newContext({
    locale: "en-GB",
    timezoneId: "Europe/London",
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    extraHTTPHeaders: { "accept-language": "en-GB,en;q=0.9" },
    serviceWorkers: "block",
    bypassCSP: true,
    reducedMotion: "reduce",
    acceptDownloads: false,
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchStores(brand: string): Promise<Store[]> {
  const ctx = await newCtx(brand);
  try {
    const page = await ctx.newPage();
    await page.goto(
      `https://www.google.com/maps/search/${encodeURIComponent(brand)}/`,
      { waitUntil: "domcontentloaded", timeout: 30_000 },
    );
    await dismissConsent(page);

    // Two layouts: list (multiple results) or single place page.
    await Promise.race([
      page.waitForSelector('[role="feed"]', { timeout: 20_000 }).catch(() => null),
      page.waitForSelector("h1.DUwDvf", { timeout: 20_000 }).catch(() => null),
    ]);

    const isSingle = (await page.locator("h1.DUwDvf").count()) > 0;
    if (isSingle) {
      const single = await extractSingle(page);
      return single ? [toStore(brand, single)] : [];
    }

    // Scroll the feed to load more results.
    const feed = page.locator('[role="feed"]').first();
    let prevCount = 0;
    for (let i = 0; i < 8; i++) {
      const count = await feed.locator("> div > div > a").count();
      if (count === prevCount) break;
      prevCount = count;
      await feed.evaluate((el) => el.scrollBy(0, 1200));
      await page.waitForTimeout(700);
    }

    const raw = await feed.evaluate((root) => {
      const out: Array<{
        name: string;
        url: string;
        address: string;
        rating?: number;
        numReviews?: number;
      }> = [];
      const cards = root.querySelectorAll("div.Nv2PK, div[jsaction*='mouseover'][role]");
      cards.forEach((card) => {
        const a = card.querySelector("a.hfpxzc") as HTMLAnchorElement | null;
        if (!a) return;
        const name = a.getAttribute("aria-label")?.trim() ?? "";
        const url = a.href;
        // Address sits in a sibling row near the rating block
        const rows = card.querySelectorAll(".W4Efsd");
        let address = "";
        rows.forEach((row) => {
          const text = row.textContent ?? "";
          if (text.includes("·")) {
            const parts = text.split("·").map((p) => p.trim());
            const candidate = parts.find((p) => /\d/.test(p) && !/min|km|mi/.test(p));
            if (candidate && !address) address = candidate;
          }
        });
        const ratingEl = card.querySelector('span[role="img"][aria-label*="star"]');
        const ratingText = ratingEl?.getAttribute("aria-label") ?? "";
        const ratingMatch = ratingText.match(/([0-9.]+)/);
        const numMatch = ratingText.match(/([0-9,]+)\s+review/);
        out.push({
          name,
          url,
          address,
          rating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
          numReviews: numMatch ? parseInt(numMatch[1].replace(/,/g, ""), 10) : undefined,
        });
      });
      return out;
    });

    return raw
      .filter((r) => r.name)
      .map((r) => toStore(brand, r));
  } finally {
    await ctx.close();
  }
}

export async function fetchReviewsForStore(store: Store, max = 80): Promise<Review[]> {
  if (!store.url) return [];
  const ctx = await newCtx(store.brand);
  try {
    const page = await ctx.newPage();
    await page.goto(store.url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await dismissConsent(page);

    // Click the Reviews tab.
    const reviewsTab = page.locator('button[aria-label*="Reviews"], button[role="tab"]:has-text("Reviews")').first();
    if (await reviewsTab.count()) {
      await reviewsTab.click({ timeout: 5_000 }).catch(() => null);
    }

    // The reviews list scrolls inside its own panel.
    const list = page
      .locator('div[aria-label*="Reviews"], div.m6QErb[aria-label]')
      .filter({ has: page.locator('[data-review-id]') })
      .first();

    await list.waitFor({ timeout: 15_000 }).catch(() => null);

    let last = 0;
    for (let i = 0; i < 30; i++) {
      const count = await page.locator("[data-review-id]").count();
      if (count >= max) break;
      if (count === last) {
        // Try scrolling document as fallback
        await page.mouse.wheel(0, 1500);
      } else {
        last = count;
      }
      await list.evaluate((el) => el.scrollBy(0, 1500)).catch(() => null);
      await page.waitForTimeout(600);
    }

    // Expand any "More" buttons in reviews so we get full text.
    const mores = page.locator('button:has-text("More"), button[aria-label="See more"]');
    const moreCount = await mores.count();
    for (let i = 0; i < Math.min(moreCount, 200); i++) {
      await mores.nth(i).click({ timeout: 1000 }).catch(() => null);
    }

    const reviews = await page.evaluate((storeId: string) => {
      const cards = Array.from(document.querySelectorAll("[data-review-id]"));
      return cards.map((card, i) => {
        const id = card.getAttribute("data-review-id") ?? `idx-${i}`;
        const author =
          (card.querySelector(".d4r55") as HTMLElement | null)?.innerText?.trim() ??
          (card.querySelector('button[aria-label*=" "]') as HTMLElement | null)?.innerText?.trim() ??
          "Anonymous";
        const ratingEl = card.querySelector('span[role="img"][aria-label*="star"]');
        const ratingText = ratingEl?.getAttribute("aria-label") ?? "";
        const ratingMatch = ratingText.match(/([0-9.]+)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
        const text =
          (card.querySelector(".wiI7pd") as HTMLElement | null)?.innerText?.trim() ??
          (card.querySelector(".MyEned") as HTMLElement | null)?.innerText?.trim() ??
          "";
        const time =
          (card.querySelector(".rsqaWe") as HTMLElement | null)?.innerText?.trim() ??
          (card.querySelector(".DU9Pgb") as HTMLElement | null)?.innerText?.trim() ??
          "";
        return { id, author, rating, text, relativeTime: time };
      });
    }, store.id);

    return reviews
      .filter((r) => r.rating > 0)
      .map<Review>((r, i) => ({
        id: `${store.id}:gms:${r.id}`,
        storeId: store.id,
        channel: "google",
        author: r.author,
        rating: r.rating,
        text: r.text,
        createdAt: relativeToIso(r.relativeTime) ?? new Date().toISOString(),
        url: store.url,
      }));
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function dismissConsent(page: import("playwright").Page) {
  // Google consent dialog ("Before you continue").
  const buttons = ["Accept all", "I agree", "Reject all"];
  for (const label of buttons) {
    const btn = page.locator(`button:has-text("${label}")`).first();
    if (await btn.count()) {
      await btn.click({ timeout: 3000 }).catch(() => null);
      await page.waitForTimeout(500);
      return;
    }
  }
}

async function extractSingle(page: import("playwright").Page) {
  return page.evaluate(() => {
    const name = (document.querySelector("h1.DUwDvf") as HTMLElement | null)?.innerText?.trim() ?? "";
    const addressBtn = document.querySelector('button[data-item-id="address"]');
    const address = (addressBtn as HTMLElement | null)?.innerText?.trim() ?? "";
    const ratingEl = document.querySelector('div.F7nice span[aria-hidden="true"]');
    const rating = ratingEl ? parseFloat(ratingEl.textContent ?? "0") : undefined;
    const numEl = document.querySelector('div.F7nice span[aria-label*="review"]');
    const numText = numEl?.getAttribute("aria-label") ?? "";
    const numMatch = numText.match(/([0-9,]+)/);
    const numReviews = numMatch ? parseInt(numMatch[1].replace(/,/g, ""), 10) : undefined;
    return { name, address, rating, numReviews, url: location.href };
  });
}

interface RawStore {
  name: string;
  url: string;
  address: string;
  rating?: number;
  numReviews?: number;
}

function toStore(brand: string, r: RawStore): Store {
  const id = `gms:${stableId(r.url || r.name + r.address)}`;
  return {
    id,
    brand,
    name: r.name,
    address: r.address,
    channels: ["google"],
    url: r.url,
  };
}

function stableId(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

// "3 weeks ago" / "a year ago" / "2 days ago" / "Edited 4 months ago"
function relativeToIso(rel: string): string | null {
  if (!rel) return null;
  const cleaned = rel.replace(/^Edited\s+/i, "").trim();
  const m = cleaned.match(/^(a|an|\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!m) return null;
  const n = m[1] === "a" || m[1] === "an" ? 1 : parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const now = new Date();
  switch (unit) {
    case "second":
      now.setSeconds(now.getSeconds() - n);
      break;
    case "minute":
      now.setMinutes(now.getMinutes() - n);
      break;
    case "hour":
      now.setHours(now.getHours() - n);
      break;
    case "day":
      now.setDate(now.getDate() - n);
      break;
    case "week":
      now.setDate(now.getDate() - n * 7);
      break;
    case "month":
      now.setMonth(now.getMonth() - n);
      break;
    case "year":
      now.setFullYear(now.getFullYear() - n);
      break;
  }
  return now.toISOString();
}
