# Reviewer

Type a brand name, get every review across Google, Deliveroo, Uber Eats,
Trustpilot and more — broken down per store, filtered by timeline, ready to
export as CSV or JSON.

Built with Next.js 14 (App Router), TypeScript and Tailwind. Mobile-first,
responsive, dark-mode aware.

## Features

- **Brand search** — type a brand, the app discovers its stores across every
  configured channel and merges duplicates.
- **Per-store breakdown** — average rating, rating distribution, and per-
  channel split for every store.
- **Timeline filter** — 7 days, 30 days, 90 days, 12 months, all-time, or a
  custom date range.
- **Channel & rating filters** — toggle channels and minimum rating; search
  inside review text or by author.
- **Export** — one click to CSV or JSON, scoped to the current filters.
- **Pluggable channels** — add your own adapter in `lib/adapters/`.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

The app boots in **demo mode** by default with a deterministic sample dataset
so you can explore the UI immediately.

## Going live

Copy `.env.example` to `.env.local` and set:

```
DATA_MODE=live
GOOGLE_PLACES_API_KEY=AIza...        # required for Google
DELIVEROO_FEED_URL=https://...       # optional, your own scraper/feed
```

### Channels

| Channel    | Status | Notes |
| ---------- | ------ | ----- |
| Google     | Live   | Uses Places Text Search to find stores and Place Details to fetch reviews. The Details endpoint returns up to 5 reviews per place; persist them over time for full history. |
| Deliveroo  | Stub   | Deliveroo has no public reviews API. Point `DELIVEROO_FEED_URL` at your own scraper/feed that returns the shape in `lib/adapters/deliveroo.ts`. |
| Uber Eats  | Demo   | Same pattern — drop a new adapter into `lib/adapters/`. |
| Trustpilot | Demo   | Same. |

### Adding a channel

1. Create `lib/adapters/<channel>.ts` exporting a `ChannelAdapter` factory.
2. Register it in `lib/adapters/index.ts` (`liveAdapters()` for live mode,
   `demoAdapters()` for the demo dataset).
3. Add the channel to `Channel` and `CHANNEL_META` in `lib/types.ts`.

## Architecture

```
app/
  page.tsx              # dashboard shell
  api/report/route.ts   # GET /api/report?brand=...&from=...&to=...
  api/export/route.ts   # GET /api/export?brand=...&format=csv|json
components/             # UI primitives (search, filters, store cards, charts)
lib/
  types.ts              # shared types
  utils.ts              # report builder, CSV serializer, time helpers
  adapters/             # channel adapters (google, deliveroo, demo, ...)
```

The orchestrator (`gatherForBrand`) calls every enabled adapter in parallel,
merges store lists by name+address, then fetches reviews for each store from
every adapter that lists it.

## Build

```bash
npm run build
npm start
```
