import Image from "next/image";

interface MastheadProps {
  /** Optional path to the actual shopfront artwork (e.g. /logos/sign-final.png). */
  artwork?: string;
  artworkWidth?: number;
  artworkHeight?: number;
  variant?: "hero" | "compact";
  className?: string;
  /** Editable from /admin → brand. */
  wordmark?: string;
  subtitle?: string;
  descriptor?: string;
  addressNumber?: string;
}

/**
 * The shopfront sign. Two render paths:
 *
 *   1. If `artwork` is supplied, use it. The brief is right that the real
 *      sign should win once the file is in place.
 *   2. Otherwise, render a sign-shaped reconstruction from three typographic
 *      registers, choreographed in three distinct motions on first paint —
 *      the descriptor row parts outward, RONI'S settles down from above with
 *      letter-spacing tightening, and "Belsize Village" trails in italic.
 *
 * The compact variant is for the navigation lockup.
 */
export function Masthead({
  artwork,
  artworkWidth = 1600,
  artworkHeight = 900,
  variant = "hero",
  className = "",
  wordmark = "RONI’S",
  subtitle = "Belsize Village",
  descriptor = "BAGEL BAKERY & CAFÉ",
  addressNumber = "37–39",
}: MastheadProps) {
  if (artwork) {
    return (
      <div className={className}>
        <Image
          src={artwork}
          alt={`${wordmark} ${subtitle} ${descriptor} ${addressNumber}`}
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
        aria-label={`${wordmark} ${subtitle}`}
      >
        <span className="text-[1.2rem] tracking-[0.02em]">{wordmark}</span>
        <span className="font-editorial italic text-[0.95rem] font-semibold">
          {subtitle}
        </span>
      </span>
    );
  }

  // Split addressNumber so we can render flanking address numerals (37 — 39).
  const [addrLeft, addrRight] = addressNumber.includes("–")
    ? addressNumber.split("–")
    : addressNumber.includes("-")
      ? addressNumber.split("-")
      : [addressNumber, addressNumber];

  return (
    <div
      className={`relative w-full ${className}`}
      aria-label={`${wordmark} · ${subtitle} · ${descriptor} · ${addressNumber}`}
    >
      {/* DESCRIPTOR ROW ----------------------------------------------------- */}
      <div className="flex items-center justify-center gap-[clamp(0.75rem,2.5vw,2rem)]">
        <span
          className="font-sans font-extralight tracking-signage text-[clamp(0.625rem,1.05vw,0.8rem)] text-ink animate-descriptor-part"
          style={{ animationDelay: "0ms" }}
        >
          {addrLeft.trim()}
        </span>
        <span
          aria-hidden
          className="h-px w-[clamp(1rem,3vw,3rem)] bg-ink/60 origin-left animate-descriptor-part"
          style={{ animationDelay: "60ms" }}
        />
        <span
          className="font-sans font-extralight tracking-signage text-[clamp(0.625rem,1.05vw,0.8rem)] text-ink whitespace-nowrap animate-descriptor-part"
          style={{ animationDelay: "120ms" }}
        >
          {descriptor}
        </span>
        <span
          aria-hidden
          className="h-px w-[clamp(1rem,3vw,3rem)] bg-ink/60 origin-right animate-descriptor-part"
          style={{ animationDelay: "60ms" }}
        />
        <span
          className="font-sans font-extralight tracking-signage text-[clamp(0.625rem,1.05vw,0.8rem)] text-ink animate-descriptor-part"
          style={{ animationDelay: "0ms" }}
        >
          {addrRight.trim()}
        </span>
      </div>

      {/* WORDMARK — RONI'S, drops & tightens ------------------------------- */}
      <h1 className="mt-[clamp(0.5rem,1.5vw,1.25rem)] text-center font-display text-display-2xl text-ink overflow-hidden">
        <span className="inline-block animate-wordmark-settle">{wordmark}</span>
      </h1>

      {/* ITALIC SUBTITLE — trails into place -------------------------------- */}
      <p
        className="-mt-[clamp(0.5rem,1.25vw,1.25rem)] text-center font-editorial italic font-semibold text-[clamp(1.5rem,4vw,3rem)] leading-none text-ink animate-italic-trail"
      >
        {subtitle}
      </p>
    </div>
  );
}
