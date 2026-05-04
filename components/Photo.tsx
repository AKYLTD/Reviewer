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
  /** Visual register for the placeholder when no photograph is provided. */
  tone?: "saffron" | "brick" | "coffee" | "cream";
  rounded?: "sm" | "md" | "lg" | "xl";
}

const TONES: Record<NonNullable<PhotoProps["tone"]>, string> = {
  saffron: "from-saffron to-[#E2861E] text-coffee",
  brick: "from-brick to-brickDark text-cream",
  coffee: "from-coffee to-[#1F0F03] text-cream",
  cream: "from-bone to-cream text-coffee",
};

const RADIUS: Record<NonNullable<PhotoProps["rounded"]>, string> = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-[2.5rem]",
};

export function Photo({
  src,
  alt,
  width = 1600,
  height = 1067,
  aspect = "3 / 2",
  caption,
  priority = false,
  className = "",
  tone = "saffron",
  rounded = "lg",
}: PhotoProps) {
  return (
    <figure className={className}>
      <div
        className={`relative w-full overflow-hidden ${RADIUS[rounded]} shadow-soft`}
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
        <figcaption className="label-muted mt-3">{caption}</figcaption>
      )}
    </figure>
  );
}

function PlaceholderPlate({
  label,
  tone,
}: {
  label: string;
  tone: NonNullable<PhotoProps["tone"]>;
}) {
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${TONES[tone]} flex items-end p-6`}>
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.18) 100%)",
        }}
      />
      <div className="relative flex w-full items-end justify-between gap-6">
        <span className="font-sans text-[0.7rem] font-600 uppercase tracking-wide opacity-90">
          {label}
        </span>
        <span className="font-display text-[0.95rem] font-500 opacity-80">
          photo coming
        </span>
      </div>
    </div>
  );
}
