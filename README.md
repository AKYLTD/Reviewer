# Roni's Belsize Village

Marketing site for Roni's Belsize Village &mdash; bagel bakery and caf&eacute;
at 37&ndash;39 Belsize Lane, London NW3.

Confident-minimal-luxury aesthetic in the lineage of Aesop / Le Labo / *Cereal*
magazine. Black on warm paper, the new shopfront sign as the masthead,
photography brings the colour. See `BRIEF.md` (Alon's brief) for the full
brand direction; the implementation here is the response.

## Tech

- Next.js 14 (App Router) + TypeScript
- Tailwind for layout primitives
- `next/font` for the three typographic registers from the sign:
  - **Marcellus** &mdash; Didone-flavoured display serif for *RONI&rsquo;S*
  - **EB Garamond** Bold Italic &mdash; *Belsize Village* descriptor
  - **Public Sans** Light, wide-tracked &mdash; address numerals and labels

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

## What's here

| Route | Page |
| --- | --- |
| `/` | Homepage &mdash; masthead, opening note, ordering paths, catering teaser, visit footer |
| `/click-collect` | Walk-in-walk-out ordering flow (will embed Square Online checkout) |
| `/order-at-table` | QR-driven dine-in flow (placeholder; Square Online integration pending) |
| `/catering` | Sample platters + enquiry form (`POST /api/catering`) |
| `/cakes` | Custom cakes, occasions, allergen promise |
| `/story` | 1989 &rarr; 2011 &rarr; 2025 long editorial scroll |
| `/visit` | Hours, transport, parking, embedded map |

## Photography

Photographs aren&rsquo;t in the repo yet. The `Photo` component renders an
intentional graphite holding-frame when no `src` is provided &mdash; not a
broken image. Once shots arrive, drop them in `public/images/` and add the
`src` prop to the matching `Photo` instance:

```tsx
<Photo src="/images/hero-bagels.jpg" alt="…" aspect="16 / 9" priority />
```

The brief calls for a fresh shoot (post-makeover interior, golden-hour
shopfront). Existing studio shots may be reusable for bagels and breakfast.

## The shopfront sign

The brand&rsquo;s source of truth is the new shopfront sign. Drop the artwork
in `public/logos/sign-final.png` (or `sign.svg`) and pass it to the masthead:

```tsx
<Masthead artwork="/logos/sign-final.png" artworkWidth={1600} artworkHeight={900} />
```

Until then, `<Masthead />` renders a faithful web-font reconstruction using
the three families above. The reconstruction is good enough to ship; the real
artwork should replace it as soon as it lands.

## Square integration (next)

Per `square-setup-plan.md` (in Alon&rsquo;s brief folder), the live site will:

1. Embed Square Online for click-and-collect, dine-in, and catering checkout
2. Route every order through to the kitchen printer at 37&ndash;39 Belsize Lane
3. Use the Customer Directory for catering enquiry leads

The `POST /api/catering` route is currently a capture stub that logs the
enquiry server-side. Wire it through to email or Square Customer Directory
in production.

## Branch

Development is on `claude/ronis-belsize-website-Fcu2K`.
