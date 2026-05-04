import Image from "next/image";

interface MastheadProps {
  /**
   * Optional path to the actual shopfront artwork (e.g. /logos/sign-final.png
   * or /logos/sign.svg). When present, the artwork is used directly per the
   * brief — the SVG reconstruction below is only a placeholder for
   * environments where the file hasn't been added yet.
   */
  artwork?: string;
  artworkWidth?: number;
  artworkHeight?: number;
  /** Variant — "hero" is the homepage masthead, "compact" is for the nav. */
  variant?: "hero" | "compact";
  className?: string;
}

/**
 * The shopfront sign is the brand's source of truth. This component renders
 * either the real artwork (if `artwork` is supplied — e.g. once
 * /public/logos/sign-final.png lands) or an SVG reconstruction built from the
 * three typographic registers described in the brief:
 *
 *   1. RONI'S        → Marcellus (Didone-family display serif)
 *   2. Belsize Village → EB Garamond Bold Italic (old-style)
 *   3. 37 BAGEL BAKERY & CAFÉ 39 → Public Sans Light, wide-tracked
 *
 * The reconstruction is good enough to ship the site immediately; the real
 * artwork should replace it as soon as it's available.
 */
export function Masthead({
  artwork,
  artworkWidth = 1600,
  artworkHeight = 900,
  variant = "hero",
  className = "",
}: MastheadProps) {
  if (artwork) {
    return (
      <div className={className}>
        <Image
          src={artwork}
          alt="Roni's · Belsize Village · Bagel Bakery & Café · 37–39 Belsize Lane"
          width={artworkWidth}
          height={artworkHeight}
          priority={variant === "hero"}
          className="mx-auto h-auto w-full"
        />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-baseline gap-[0.18em] font-display leading-none text-ink ${className}`}
        aria-label="Roni's Belsize Village"
      >
        <span className="text-[1.15rem] tracking-[0.02em]">RONI&rsquo;S</span>
        <span className="font-editorial italic text-[0.95rem] font-semibold">
          Belsize&nbsp;Village
        </span>
      </span>
    );
  }

  return (
    <div className={`relative w-full ${className}`} aria-label="Roni's · Belsize Village · Bagel Bakery & Café · 37–39">
      {/* Top descriptor row: 37 — BAGEL BAKERY & CAFÉ — 39 */}
      <div className="flex items-center justify-center gap-[clamp(1rem,3vw,2.5rem)]">
        <span className="font-sans font-extralight tracking-signage text-[clamp(0.625rem,1.1vw,0.875rem)] text-ink">
          37
        </span>
        <span aria-hidden className="h-px w-[clamp(1rem,3vw,3rem)] bg-ink/60" />
        <span className="font-sans font-extralight tracking-signage text-[clamp(0.625rem,1.1vw,0.875rem)] text-ink">
          BAGEL BAKERY &amp; CAF&Eacute;
        </span>
        <span aria-hidden className="h-px w-[clamp(1rem,3vw,3rem)] bg-ink/60" />
        <span className="font-sans font-extralight tracking-signage text-[clamp(0.625rem,1.1vw,0.875rem)] text-ink">
          39
        </span>
      </div>

      {/* RONI'S — the masthead. Animation is a single, slow settle. */}
      <h1 className="mt-[clamp(0.5rem,1.5vw,1.25rem)] text-center font-display text-display-xl text-ink animate-settle">
        <span className="inline-block">RONI&rsquo;S</span>
      </h1>

      {/* Belsize Village — italic old-style serif beneath. */}
      <p className="-mt-[clamp(0.25rem,0.75vw,0.75rem)] text-center font-editorial italic font-semibold text-[clamp(1.5rem,4vw,3rem)] leading-none text-ink">
        Belsize Village
      </p>
    </div>
  );
}
