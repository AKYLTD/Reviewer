import Image from "next/image";
import { BagelMark } from "./BagelMark";

interface MastheadProps {
  artwork?: string;
  artworkWidth?: number;
  artworkHeight?: number;
  variant?: "hero" | "compact" | "stacked";
  className?: string;
  wordmark?: string;
  subtitle?: string;
  descriptor?: string;
  addressNumber?: string;
}

/**
 * v3 — warm, rounded, food-magazine masthead. Mark + wordmark composition
 * inspired by the Fresh Catering reference shared by the user. The mark is
 * the bagel ring; the wordmark uses the rounded display sans.
 */
export function Masthead({
  artwork,
  artworkWidth = 1600,
  artworkHeight = 900,
  variant = "hero",
  className = "",
  wordmark = "Roni's",
  subtitle = "Belsize Village",
  descriptor = "BAGEL BAKERY & CAFÉ",
}: MastheadProps) {
  if (artwork) {
    return (
      <div className={className}>
        <Image
          src={artwork}
          alt={`${wordmark} ${subtitle} ${descriptor}`}
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
        className={`inline-flex items-center gap-2 leading-none text-coffee ${className}`}
        aria-label={`${wordmark} ${subtitle}`}
      >
        <BagelMark className="h-7 w-7" />
        <span className="font-display text-[1.35rem] font-700 leading-none">
          {wordmark}
          <span className="text-brick">.</span>
        </span>
      </span>
    );
  }

  if (variant === "stacked") {
    // Used inside dark coffee panels — uses cream ink.
    return (
      <span className={`inline-flex flex-col items-center gap-3 ${className}`}>
        <BagelMark className="h-16 w-16" />
        <span className="font-display text-display-md text-cream font-700 leading-none">
          {wordmark}
          <span className="text-saffron">.</span>
        </span>
        <span className="font-sans text-[0.72rem] tracking-wide uppercase font-500 text-saffron">
          {subtitle}
        </span>
      </span>
    );
  }

  // HERO ----------------------------------------------------------------
  return (
    <div className={`relative w-full text-center ${className}`}>
      <div className="inline-flex flex-col items-center gap-4">
        <span className="animate-mark-bounce">
          <BagelMark className="h-24 w-24 md:h-28 md:w-28" />
        </span>

        <span className="label-muted animate-rise" style={{ animationDelay: "200ms" }}>
          {descriptor}
        </span>

        <h1 className="font-display font-700 text-display-2xl text-coffee leading-[0.92] animate-wordmark-pop">
          {wordmark}
          <span className="text-brick">.</span>
        </h1>

        <p className="font-display text-display-md font-500 text-brick animate-rise" style={{ animationDelay: "600ms" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
