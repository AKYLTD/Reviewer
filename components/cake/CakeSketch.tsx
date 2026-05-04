import { COVER_PALETTE, SIZE_OPTIONS, type CakeConfig } from "./types";

interface CakeSketchProps {
  config: CakeConfig;
  className?: string;
}

const STROKE_INK = "#2A1810";
const STROKE = 1.6;

/**
 * Single-tier cake sketch that re-renders from CakeConfig in real time.
 * Drives:
 *   - Bottom-tier width from chosen size (8" → 18")
 *   - Profile from chosen shape (round / square / image / special-3D)
 *   - Surface treatment from chosen cover (icing / buttercream / ganache)
 *   - Add-on indicators: image-print rectangle on top, fruit pile, jam drip
 *   - Inscribed message rendered on the cake's face
 */
export function CakeSketch({ config, className = "" }: CakeSketchProps) {
  const palette = COVER_PALETTE[config.cover];
  const size = SIZE_OPTIONS.find((s) => s.id === config.size) ?? SIZE_OPTIONS[1];

  // Map inches (8 — 18) to a tier width in the 400px viewBox.
  const widthRange = { min: 200, max: 340 };
  const inchRange = { min: 8, max: 18 };
  const tierWidth =
    widthRange.min +
    ((size.inches - inchRange.min) / (inchRange.max - inchRange.min)) *
      (widthRange.max - widthRange.min);

  const tierHeight = 100;
  const centreX = 200;
  const baseY = 360;
  const topY = baseY - tierHeight;
  const left = centreX - tierWidth / 2;
  const right = centreX + tierWidth / 2;

  return (
    <svg
      viewBox="0 0 400 440"
      role="img"
      aria-label={`${size.label} ${config.shape} cake with ${config.cover} cover`}
      className={className}
    >
      {/* Plate ----------------------------------------------------------- */}
      <ellipse cx={centreX} cy={baseY + 26} rx={tierWidth / 2 + 30} ry="14" fill="#E9DBC1" stroke={STROKE_INK} strokeWidth={STROKE} />
      <ellipse cx={centreX} cy={baseY + 22} rx={tierWidth / 2 + 22} ry="10" fill="#FBF4E5" stroke={STROKE_INK} strokeWidth={STROKE * 0.7} opacity="0.7" />

      {/* Cake body — varies by shape ------------------------------------ */}
      {config.shape === "round" && (
        <RoundCake left={left} right={right} top={topY} bottom={baseY} centreX={centreX} palette={palette} />
      )}
      {config.shape === "square" && (
        <SquareCake left={left} right={right} top={topY} bottom={baseY} palette={palette} />
      )}
      {config.shape === "image" && (
        <ImagePrintCake left={left} right={right} top={topY} bottom={baseY} centreX={centreX} palette={palette} />
      )}
      {config.shape === "special-3d" && (
        <Sculpted3DCake left={left} right={right} top={topY} bottom={baseY} centreX={centreX} palette={palette} />
      )}

      {/* Surface treatment — depends on cover --------------------------- */}
      <SurfaceTreatment
        left={left}
        right={right}
        top={topY}
        bottom={baseY}
        centreX={centreX}
        cover={config.cover}
        shape={config.shape}
      />

      {/* Filling indicators — fruits and jam show as a peeking layer ----- */}
      {config.filling === "fruits" && (
        <FruitPile centreX={centreX} top={topY} />
      )}
      {config.filling === "jam" && (
        <JamDrip left={left} right={right} top={topY} centreX={centreX} />
      )}

      {/* Inscription text — rendered on the cake's face ----------------- */}
      {config.message && config.message.trim() !== "" && config.shape !== "image" && (
        <text
          x={centreX}
          y={topY + tierHeight / 2 + 6}
          textAnchor="middle"
          fontFamily="var(--font-display), Fredoka, sans-serif"
          fontWeight="700"
          fontSize={tierWidth > 280 ? "18" : tierWidth > 220 ? "16" : "14"}
          fill={config.cover === "ganache" ? "#FBF4E5" : "#2A1810"}
          style={{ paintOrder: "stroke" }}
          stroke={config.cover === "ganache" ? "#3D1B0A" : "#FBF4E5"}
          strokeWidth={3}
        >
          {truncate(config.message, tierWidth > 280 ? 28 : 20)}
        </text>
      )}

      {/* Image-print indicator — message renders inside the photo frame */}
      {config.message && config.message.trim() !== "" && config.shape === "image" && (
        <text
          x={centreX}
          y={topY + tierHeight / 2 + 6}
          textAnchor="middle"
          fontFamily="var(--font-display), Fredoka, sans-serif"
          fontWeight="700"
          fontSize="14"
          fill="#FBF4E5"
          style={{ paintOrder: "stroke" }}
          stroke="#2A1810"
          strokeWidth={3}
        >
          {truncate(config.message, 22)}
        </text>
      )}
    </svg>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

interface BodyProps {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centreX: number;
  palette: { light: string; body: string; deep: string };
}

function RoundCake({ left, right, top, bottom, centreX, palette }: BodyProps) {
  const ry = 14;
  return (
    <g>
      <path
        d={`M ${left} ${top} L ${left} ${bottom} A ${(right - left) / 2} ${ry} 0 0 0 ${right} ${bottom} L ${right} ${top} Z`}
        fill={palette.body}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <ellipse cx={centreX} cy={top} rx={(right - left) / 2} ry={ry} fill={palette.light} stroke={STROKE_INK} strokeWidth={STROKE} />
    </g>
  );
}

function SquareCake({ left, right, top, bottom, palette }: Omit<BodyProps, "centreX">) {
  return (
    <g>
      <rect x={left} y={top} width={right - left} height={bottom - top} fill={palette.body} stroke={STROKE_INK} strokeWidth={STROKE} strokeLinejoin="round" rx={4} />
      <rect x={left} y={top - 5} width={right - left} height={10} fill={palette.light} stroke={STROKE_INK} strokeWidth={STROKE} rx={2} />
    </g>
  );
}

function ImagePrintCake({ left, right, top, bottom, centreX, palette }: BodyProps) {
  const ry = 14;
  return (
    <g>
      <path
        d={`M ${left} ${top} L ${left} ${bottom} A ${(right - left) / 2} ${ry} 0 0 0 ${right} ${bottom} L ${right} ${top} Z`}
        fill={palette.body}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <ellipse cx={centreX} cy={top} rx={(right - left) / 2} ry={ry} fill={palette.light} stroke={STROKE_INK} strokeWidth={STROKE} />
      {/* Edible-image rectangle on top */}
      <rect
        x={centreX - (right - left) * 0.32}
        y={top - 4}
        width={(right - left) * 0.64}
        height={tierFaceHeight() * 0.5}
        rx={4}
        fill="#C9483A"
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        opacity="0.95"
      />
      {/* Subtle photo gleam */}
      <rect
        x={centreX - (right - left) * 0.3}
        y={top - 2}
        width={(right - left) * 0.6}
        height={6}
        rx={3}
        fill="#FBF4E5"
        opacity="0.35"
      />
    </g>
  );
}

function Sculpted3DCake({ left, right, top, bottom, centreX, palette }: BodyProps) {
  // A sculpted shape — soft top dome + flared bottom, like a cake bust.
  return (
    <g>
      <path
        d={`M ${left + 12} ${top + 16} Q ${centreX} ${top - 32} ${right - 12} ${top + 16} L ${right} ${bottom} L ${left} ${bottom} Z`}
        fill={palette.body}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {/* sculpted highlight */}
      <path
        d={`M ${centreX - 30} ${top - 8} Q ${centreX} ${top - 24} ${centreX + 30} ${top - 8}`}
        fill="none"
        stroke={palette.light}
        strokeWidth={STROKE * 2}
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Soft contour lines for shape interest */}
      <path d={`M ${left + 24} ${top + 24} Q ${centreX} ${top - 8} ${right - 24} ${top + 24}`} fill="none" stroke={STROKE_INK} strokeWidth={STROKE * 0.7} opacity="0.45" />
    </g>
  );
}

interface SurfaceProps {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centreX: number;
  cover: CakeConfig["cover"];
  shape: CakeConfig["shape"];
}

function SurfaceTreatment({ left, right, top, bottom, centreX, cover, shape }: SurfaceProps) {
  if (shape === "image") return null;

  if (cover === "buttercream") {
    // Piped swirl rosettes around the top edge
    const count = Math.floor((right - left) / 28);
    return (
      <g>
        {Array.from({ length: count }).map((_, i) => {
          const cx = left + 14 + i * 28;
          return (
            <path
              key={i}
              d={`M ${cx - 9} ${top + 4} q 0 -8 9 -8 q 9 0 9 8 q 0 8 -9 8 q -9 0 -9 -8 Z`}
              fill="none"
              stroke={STROKE_INK}
              strokeWidth={STROKE * 0.7}
              opacity="0.55"
            />
          );
        })}
      </g>
    );
  }

  if (cover === "ganache") {
    // Ganache drips on the front
    const drips = [-0.3, -0.1, 0.1, 0.3];
    return (
      <g>
        {drips.map((p, i) => {
          const x = centreX + (right - left) * p;
          const h = 16 + (i % 2) * 8;
          return (
            <path
              key={i}
              d={`M ${x - 5} ${top + 4} q 0 ${h} 5 ${h + 2} q 5 -2 5 -${h + 2} Z`}
              fill="#3D1B0A"
              stroke={STROKE_INK}
              strokeWidth={STROKE * 0.7}
              opacity="0.95"
            />
          );
        })}
      </g>
    );
  }

  // icing — a single pale highlight curve on the body
  return (
    <path
      d={`M ${left + 18} ${top + 30} Q ${centreX} ${top + 14} ${right - 18} ${top + 30}`}
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={STROKE * 1.5}
      strokeLinecap="round"
      opacity="0.5"
    />
  );
}

function FruitPile({ centreX, top }: { centreX: number; top: number }) {
  const cy = top - 10;
  return (
    <g>
      <circle cx={centreX - 14} cy={cy + 2} r="7" fill="#C9483A" stroke={STROKE_INK} strokeWidth={STROKE} />
      <circle cx={centreX} cy={cy - 3} r="9" fill="#A8392E" stroke={STROKE_INK} strokeWidth={STROKE} />
      <circle cx={centreX + 14} cy={cy + 2} r="7" fill="#C9483A" stroke={STROKE_INK} strokeWidth={STROKE} />
      <circle cx={centreX - 5} cy={cy + 5} r="5" fill="#7B1F1F" stroke={STROKE_INK} strokeWidth={STROKE * 0.8} />
      <circle cx={centreX + 6} cy={cy + 5} r="5" fill="#7B1F1F" stroke={STROKE_INK} strokeWidth={STROKE * 0.8} />
      <path d={`M ${centreX - 4} ${cy - 14} q 4 -6 12 -4 q -2 8 -10 6 Z`} fill="#9DBA68" stroke={STROKE_INK} strokeWidth={STROKE * 0.7} />
    </g>
  );
}

function JamDrip({ left, right, top, centreX }: { left: number; right: number; top: number; centreX: number }) {
  // A tiny visible jam line peeking from the side cuts
  const positions = [left + 24, centreX - 30, centreX + 30, right - 24];
  return (
    <g>
      {positions.map((x, i) => (
        <path
          key={i}
          d={`M ${x - 5} ${top + 28} q 5 -3 10 0 q -2 6 -10 4 Z`}
          fill="#C9483A"
          stroke={STROKE_INK}
          strokeWidth={STROKE * 0.6}
          opacity="0.95"
        />
      ))}
    </g>
  );
}

function tierFaceHeight() {
  return 100;
}
