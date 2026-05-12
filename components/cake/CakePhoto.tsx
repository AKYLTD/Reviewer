import Image from "next/image";
import { mockupUrl, type Mockup } from "@/lib/mockups";
import {
  COVER_OPTIONS,
  SHAPE_OPTIONS,
  SIZE_OPTIONS,
  BASE_OPTIONS,
  FILLING_OPTIONS,
  type CakeConfig,
} from "./types";

interface CakePhotoProps {
  config: CakeConfig;
  className?: string;
  /** Compact preset card shows photo + minimal label only. */
  compact?: boolean;
}

/**
 * Replaces the previous live SVG sketch. Looks up a cover- and shape-
 * matched real cake photograph and renders it large, with a clean text
 * spec card listing the customer's selections. The photo updates as
 * choices change so the customer still sees their cake "appear" — just
 * via real photography instead of an illustration.
 */
export function CakePhoto({ config, className = "", compact = false }: CakePhotoProps) {
  const mock = pickCakeMockup(config);
  const url = mockupUrl(mock);

  const size = SIZE_OPTIONS.find((s) => s.id === config.size);
  const shape = SHAPE_OPTIONS.find((s) => s.id === config.shape);
  const cover = COVER_OPTIONS.find((c) => c.id === config.cover);
  const base = BASE_OPTIONS.find((b) => b.id === config.base);
  const fillings = FILLING_OPTIONS.filter((f) => config.fillings.includes(f.id));

  return (
    <div className={className}>
      <div className="relative w-full aspect-square overflow-hidden rounded-xl shadow-soft bg-bone">
        <Image
          src={url}
          alt={`${size?.label} ${shape?.label} cake with ${cover?.label.toLowerCase()}`}
          width={1200}
          height={1200}
          unoptimized
          className="h-full w-full object-cover"
        />
        {!compact && config.shape === "image" && (
          <div className="absolute inset-x-3 top-3 inline-flex items-center gap-2 rounded-pill bg-coffee/90 px-3 py-1.5 text-cream text-xs font-display font-700">
            Edible-image print
          </div>
        )}
        {!compact && config.shape === "special-3d" && (
          <div className="absolute inset-x-3 top-3 inline-flex items-center gap-2 rounded-pill bg-coffee/90 px-3 py-1.5 text-cream text-xs font-display font-700">
            Sculpted 3D — designed to your brief
          </div>
        )}
      </div>

      {!compact && (
        <div className="mt-5 rounded-xl bg-cream/70 p-5">
          <Spec label="Size"     value={size?.label ?? "—"} />
          <Spec label="Shape"    value={shape?.label ?? "—"} />
          <Spec label="Cover"    value={cover?.label ?? "—"} />
          <Spec label="Base"     value={base?.label ?? "—"} />
          <Spec
            label={fillings.length > 1 ? "Fillings" : "Filling"}
            value={fillings.length ? fillings.map((f) => f.label).join(" + ") : "—"}
          />
          {config.message?.trim() && (
            <Spec label="Message" value={`"${config.message}"`} />
          )}
        </div>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-hairline last:border-b-0">
      <span className="font-sans text-xs uppercase tracking-wide font-600 text-coffee/70">
        {label}
      </span>
      <span className="font-display font-700 text-coffee text-right truncate max-w-[18rem]">
        {value}
      </span>
    </div>
  );
}

/**
 * Pick a mockup for the cake. Cover dominates (most visually distinctive),
 * shape secondary. Image-print and 3D have their own representative shots.
 */
function pickCakeMockup(c: CakeConfig): Mockup {
  if (c.shape === "image") return "cake-image-print";
  if (c.shape === "special-3d") return "cake-3d";
  const isSquare = c.shape === "square";
  switch (c.cover) {
    case "ganache":
      return isSquare ? "cake-ganache-square" : "cake-ganache-round";
    case "icing":
      return isSquare ? "cake-icing-square" : "cake-icing-round";
    case "buttercream":
    default:
      return isSquare ? "cake-buttercream-square" : "cake-buttercream-round";
  }
}
