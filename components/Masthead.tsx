import Image from "next/image";

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
 * Typographic masthead — wordmark + subtitle + descriptor only. The bagel
 * mark sketch was removed in favour of a pure type composition; the brick
 * full-stop after the wordmark is the brand's signature accent.
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
        className={`inline-flex items-baseline gap-2 leading-none text-coffee ${className}`}
        aria-label={`${wordmark} ${subtitle}`}
      >
        <span className="font-display text-[1.5rem] font-700 leading-none">
          {wordmark}
          <span className="text-brick">.</span>
        </span>
        <span className="font-display italic text-[1rem] font-500 text-coffee/75 hidden sm:inline">
          {subtitle}
        </span>
      </span>
    );
  }

  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center gap-2 ${className}`}>
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

  // HERO --------------------------------------------------------------
  return (
    <div className={`relative w-full text-center ${className}`}>
      <div className="inline-flex flex-col items-center gap-4">
        <span className="label-muted animate-rise" style={{ animationDelay: "0ms" }}>
          {descriptor}
        </span>

        <h1 className="font-display font-700 text-display-2xl text-coffee leading-[0.92] animate-wordmark-pop">
          {wordmark}
          <span className="text-brick">.</span>
        </h1>

        <p
          className="font-display text-display-md font-500 text-brick animate-rise"
          style={{ animationDelay: "400ms" }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
