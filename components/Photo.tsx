import Image from "next/image";

interface PhotoProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  aspect?: string;
  caption?: string;
  priority?: boolean;
  className?: string;
  /** Visual tone for the placeholder when no src is provided. */
  tone?: "ink" | "warm" | "ember" | "bone";
}

const TONES: Record<NonNullable<PhotoProps["tone"]>, string> = {
  ink: "from-[#1a1814] to-[#3a342b] text-bone",
  warm: "from-[#d6c9b0] to-[#a8997d] text-ink",
  ember: "from-[#A4422A] to-[#6e2a18] text-bone",
  bone: "from-[#f0e9d8] to-[#d6cdb6] text-ink",
};

/**
 * Photography frame. With a real `src` it renders the optimised image with a
 * film-grain overlay. Without one, it renders an intentional tonal plate —
 * cinematic gradient, the alt as small caption, no "broken image" feel.
 */
export function Photo({
  src,
  alt,
  width = 1600,
  height = 1067,
  aspect = "3 / 2",
  caption,
  priority = false,
  className = "",
  tone = "warm",
}: PhotoProps) {
  return (
    <figure className={className}>
      <div
        className="relative w-full overflow-hidden grain"
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
          <PlaceholderPlate label={alt} tone={tone} />
        )}
      </div>
      {caption && (
        <figcaption className="label mt-3 text-muted">{caption}</figcaption>
      )}
    </figure>
  );
}

function PlaceholderPlate({ label, tone }: { label: string; tone: NonNullable<PhotoProps["tone"]> }) {
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${TONES[tone]} flex items-end p-6`}
    >
      {/* Soft vignette */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.18) 100%)",
        }}
      />
      <div className="relative flex w-full items-end justify-between gap-6">
        <span className="font-sans text-[0.62rem] font-light uppercase tracking-widest opacity-70">
          {label}
        </span>
        <span className="font-editorial italic text-[0.85rem] opacity-70">
          photograph pending
        </span>
      </div>
    </div>
  );
}
