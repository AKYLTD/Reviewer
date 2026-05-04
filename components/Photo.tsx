import Image from "next/image";

interface PhotoProps {
  /** Path to the photograph, e.g. /images/hero-bagels.jpg. When omitted, an
   *  intentional graphite plate is rendered — a holding frame, not a broken
   *  image. Photography for this site is intentionally being commissioned
   *  fresh; the brief calls for a post-makeover interior shoot and a
   *  golden-hour shopfront. */
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  /** Aspect ratio for the holding frame (CSS aspect-ratio string). */
  aspect?: string;
  caption?: string;
  priority?: boolean;
  className?: string;
}

export function Photo({
  src,
  alt,
  width = 1600,
  height = 1067,
  aspect = "3 / 2",
  caption,
  priority = false,
  className = "",
}: PhotoProps) {
  return (
    <figure className={className}>
      <div
        className="relative w-full overflow-hidden bg-bone"
        style={{ aspectRatio: aspect }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderPlate label={alt} />
        )}
      </div>
      {caption && (
        <figcaption className="label mt-3 text-muted">{caption}</figcaption>
      )}
    </figure>
  );
}

function PlaceholderPlate({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-end justify-between p-5">
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full text-ink/8"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#hatch)" />
      </svg>
      <span className="relative font-sans text-[0.65rem] font-light uppercase tracking-widest text-ink/55">
        Photograph &mdash; {label}
      </span>
      <span className="relative font-editorial italic text-[0.85rem] text-ink/55">
        to be commissioned
      </span>
    </div>
  );
}
