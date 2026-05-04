import { COVER_PALETTE, SIZE_OPTIONS, type CakeConfig } from "./types";

interface CakeSketchProps {
  config: CakeConfig;
  className?: string;
}

const STROKE_INK = "#2A1810";
const STROKE = 1.4;

/**
 * Refined cake sketch. Built from layered SVG primitives with linear and
 * radial gradients, a soft ground shadow, top highlights and per-cover
 * frosting treatments designed to read as a hand-rendered illustration
 * rather than a flat icon. Re-renders from CakeConfig on every change.
 *
 * Drives:
 *   - Bottom-tier width from chosen size (8" → 18")
 *   - Profile from chosen shape (round / square / image / sculpted 3D)
 *   - Surface treatment from chosen cover (icing / buttercream / ganache)
 *   - Multi-filling indicators: fruit pile + jam drips can co-render
 *   - Inscribed message rendered on the cake's face
 */
export function CakeSketch({ config, className = "" }: CakeSketchProps) {
  const palette = COVER_PALETTE[config.cover];
  const size = SIZE_OPTIONS.find((s) => s.id === config.size) ?? SIZE_OPTIONS[1];

  // Map inches (8 → 18) to a tier width in the 440px viewBox.
  const widthRange = { min: 220, max: 360 };
  const inchRange = { min: 8, max: 18 };
  const tierWidth =
    widthRange.min +
    ((size.inches - inchRange.min) / (inchRange.max - inchRange.min)) *
      (widthRange.max - widthRange.min);

  const tierHeight = 110;
  const centreX = 220;
  const baseY = 380;
  const topY = baseY - tierHeight;
  const left = centreX - tierWidth / 2;
  const right = centreX + tierWidth / 2;

  const gradientId = `cake-grad-${config.cover}`;
  const topGradId = `cake-top-${config.cover}`;
  const sideGradId = `cake-side-${config.cover}`;

  return (
    <svg
      viewBox="0 0 440 460"
      role="img"
      aria-label={`${size.label} ${config.shape} cake with ${config.cover} cover`}
      className={className}
    >
      <defs>
        {/* Body gradient — light at the top, darker at the bottom. */}
        <linearGradient id={sideGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.body} />
          <stop offset="1" stopColor={palette.deep} />
        </linearGradient>
        {/* Top oval gradient — radial highlight to suggest a soft surface. */}
        <radialGradient id={topGradId} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor={palette.light} />
          <stop offset="0.6" stopColor={palette.body} />
          <stop offset="1" stopColor={palette.deep} />
        </radialGradient>
        {/* Plate radial — gives the saucer some depth. */}
        <radialGradient id="plate-grad" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#FBF4E5" />
          <stop offset="1" stopColor="#D9C9A6" />
        </radialGradient>
        {/* Soft drop-shadow filter for the cake body. */}
        <filter id="cake-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" />
          <feOffset dx="0" dy="6" result="blurred" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.28" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Ground shadow filter — used on the dedicated shadow ellipse. */}
        <filter id="ground-shadow" x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* GROUND SHADOW ------------------------------------------------ */}
      <ellipse
        cx={centreX}
        cy={baseY + 38}
        rx={tierWidth / 2 + 28}
        ry={10}
        fill="rgba(74, 31, 8, 0.32)"
        filter="url(#ground-shadow)"
      />

      {/* PLATE -------------------------------------------------------- */}
      <ellipse
        cx={centreX}
        cy={baseY + 28}
        rx={tierWidth / 2 + 36}
        ry={14}
        fill="url(#plate-grad)"
        stroke={STROKE_INK}
        strokeWidth={STROKE}
      />
      <ellipse
        cx={centreX}
        cy={baseY + 24}
        rx={tierWidth / 2 + 28}
        ry={10}
        fill="none"
        stroke={STROKE_INK}
        strokeWidth={STROKE * 0.5}
        opacity="0.4"
      />

      {/* CAKE BODY — varies by shape --------------------------------- */}
      <g filter="url(#cake-shadow)">
        {config.shape === "round" && (
          <RoundCake
            left={left}
            right={right}
            top={topY}
            bottom={baseY}
            centreX={centreX}
            sideGradId={sideGradId}
            topGradId={topGradId}
            palette={palette}
          />
        )}
        {config.shape === "square" && (
          <SquareCake
            left={left}
            right={right}
            top={topY}
            bottom={baseY}
            sideGradId={sideGradId}
            topGradId={topGradId}
            palette={palette}
          />
        )}
        {config.shape === "image" && (
          <ImagePrintCake
            left={left}
            right={right}
            top={topY}
            bottom={baseY}
            centreX={centreX}
            sideGradId={sideGradId}
            topGradId={topGradId}
            palette={palette}
          />
        )}
        {config.shape === "special-3d" && (
          <Sculpted3DCake
            left={left}
            right={right}
            top={topY}
            bottom={baseY}
            centreX={centreX}
            sideGradId={sideGradId}
            palette={palette}
          />
        )}
      </g>

      {/* SURFACE TREATMENT -------------------------------------------- */}
      <SurfaceTreatment
        left={left}
        right={right}
        top={topY}
        bottom={baseY}
        centreX={centreX}
        cover={config.cover}
        shape={config.shape}
      />

      {/* FILLINGS — multi-render -------------------------------------- */}
      {config.fillings.includes("fruits") && config.shape !== "image" && (
        <FruitPile centreX={centreX} top={topY} />
      )}
      {config.fillings.includes("jam") && config.shape !== "image" && (
        <JamDrip left={left} right={right} top={topY} centreX={centreX} />
      )}

      {/* INSCRIPTION ------------------------------------------------- */}
      {config.message && config.message.trim() !== "" && config.shape !== "image" && (
        <InscriptionBanner
          centreX={centreX}
          y={topY + tierHeight / 2 + 4}
          tierWidth={tierWidth}
          message={config.message}
          cover={config.cover}
        />
      )}
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

/* -------------------------------------------------------------------- */
/* BODY VARIANTS                                                        */
/* -------------------------------------------------------------------- */

interface BodyProps {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centreX: number;
  sideGradId: string;
  topGradId: string;
  palette: { light: string; body: string; deep: string };
}

function RoundCake({ left, right, top, bottom, centreX, sideGradId, topGradId, palette }: BodyProps) {
  const ry = 16;
  return (
    <g>
      {/* Bottom curve outline (the underside ellipse) */}
      <ellipse
        cx={centreX}
        cy={bottom}
        rx={(right - left) / 2}
        ry={ry}
        fill={palette.deep}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        opacity="0.85"
      />
      {/* Side body */}
      <path
        d={`M ${left} ${top} L ${left} ${bottom} A ${(right - left) / 2} ${ry} 0 0 0 ${right} ${bottom} L ${right} ${top} Z`}
        fill={`url(#${sideGradId})`}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {/* Top oval */}
      <ellipse
        cx={centreX}
        cy={top}
        rx={(right - left) / 2}
        ry={ry}
        fill={`url(#${topGradId})`}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
      />
      {/* Top inner ring — a thin highlight that catches the light */}
      <ellipse
        cx={centreX}
        cy={top - 2}
        rx={(right - left) / 2 - 4}
        ry={ry - 4}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={STROKE * 0.6}
      />
    </g>
  );
}

function SquareCake({ left, right, top, bottom, sideGradId, topGradId }: Omit<BodyProps, "centreX">) {
  return (
    <g>
      <rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        rx={6}
        fill={`url(#${sideGradId})`}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
      />
      <rect
        x={left - 1}
        y={top - 6}
        width={right - left + 2}
        height={12}
        rx={3}
        fill={`url(#${topGradId})`}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
      />
      <rect
        x={left + 4}
        y={top - 4}
        width={right - left - 8}
        height={8}
        rx={2}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={STROKE * 0.6}
      />
    </g>
  );
}

function ImagePrintCake({ left, right, top, bottom, centreX, sideGradId, topGradId, palette }: BodyProps) {
  const ry = 16;
  return (
    <g>
      <ellipse
        cx={centreX}
        cy={bottom}
        rx={(right - left) / 2}
        ry={ry}
        fill={palette.deep}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        opacity="0.85"
      />
      <path
        d={`M ${left} ${top} L ${left} ${bottom} A ${(right - left) / 2} ${ry} 0 0 0 ${right} ${bottom} L ${right} ${top} Z`}
        fill={`url(#${sideGradId})`}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <ellipse
        cx={centreX}
        cy={top}
        rx={(right - left) / 2}
        ry={ry}
        fill={`url(#${topGradId})`}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
      />
      {/* Edible-image rectangle — printed on a saffron mat to show through */}
      <rect
        x={centreX - (right - left) * 0.34}
        y={top + 6}
        width={(right - left) * 0.68}
        height={48}
        rx={6}
        fill="#3D1B0A"
        stroke={STROKE_INK}
        strokeWidth={STROKE}
      />
      <rect
        x={centreX - (right - left) * 0.32}
        y={top + 8}
        width={(right - left) * 0.64}
        height={6}
        rx={3}
        fill="rgba(251, 244, 229, 0.35)"
      />
      {/* Subtle grid lines suggesting an image */}
      <line
        x1={centreX - (right - left) * 0.32}
        y1={top + 28}
        x2={centreX + (right - left) * 0.32}
        y2={top + 28}
        stroke="rgba(251, 244, 229, 0.18)"
        strokeWidth="1"
      />
      <line
        x1={centreX - (right - left) * 0.32}
        y1={top + 40}
        x2={centreX + (right - left) * 0.32}
        y2={top + 40}
        stroke="rgba(251, 244, 229, 0.18)"
        strokeWidth="1"
      />
    </g>
  );
}

function Sculpted3DCake({ left, right, top, bottom, centreX, sideGradId, palette }: Omit<BodyProps, "topGradId">) {
  return (
    <g>
      {/* A more interesting silhouette — bell-shaped with subtle shoulders */}
      <path
        d={`
          M ${left + 10} ${top + 22}
          Q ${centreX - 60} ${top - 18} ${centreX} ${top - 30}
          Q ${centreX + 60} ${top - 18} ${right - 10} ${top + 22}
          L ${right} ${bottom}
          A ${(right - left) / 2} 16 0 0 0 ${left} ${bottom}
          Z
        `}
        fill={`url(#${sideGradId})`}
        stroke={STROKE_INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {/* Sculpted dome highlight */}
      <path
        d={`M ${centreX - 40} ${top - 18} Q ${centreX} ${top - 36} ${centreX + 40} ${top - 18}`}
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={STROKE * 2.4}
        strokeLinecap="round"
      />
      {/* Subtle shoulder line */}
      <path
        d={`M ${left + 24} ${top + 26} Q ${centreX} ${top - 8} ${right - 24} ${top + 26}`}
        fill="none"
        stroke={STROKE_INK}
        strokeWidth={STROKE * 0.6}
        opacity="0.4"
      />
      {/* A small accent dot like a finial */}
      <circle cx={centreX} cy={top - 36} r="3" fill={palette.deep} stroke={STROKE_INK} strokeWidth={STROKE * 0.6} />
    </g>
  );
}

/* -------------------------------------------------------------------- */
/* SURFACE TREATMENTS                                                   */
/* -------------------------------------------------------------------- */

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
  if (shape === "image" || shape === "special-3d") return null;

  if (cover === "buttercream") {
    // Piped rosettes around the top edge — proper layered swirls.
    const tierWidth = right - left;
    const count = Math.max(4, Math.floor(tierWidth / 30));
    const step = tierWidth / count;
    return (
      <g>
        {Array.from({ length: count }).map((_, i) => {
          const cx = left + step / 2 + i * step;
          // Each rosette = three concentric arcs, slightly rotated, with
          // a small highlight dot to suggest sheen.
          return (
            <g key={i} transform={`translate(${cx} ${top}) scale(0.95)`}>
              <circle r="9" fill="#FFF6E0" stroke={STROKE_INK} strokeWidth={STROKE * 0.6} opacity="0.88" />
              <path d="M -7 0 q 0 -8 7 -8 q 7 0 7 8" fill="none" stroke={STROKE_INK} strokeWidth={STROKE * 0.6} opacity="0.6" />
              <path d="M -5 -2 q 0 -5 5 -5 q 5 0 5 5" fill="none" stroke={STROKE_INK} strokeWidth={STROKE * 0.5} opacity="0.5" />
              <circle cx="-2" cy="-3" r="1.4" fill="rgba(255,255,255,0.95)" />
            </g>
          );
        })}
      </g>
    );
  }

  if (cover === "ganache") {
    // Multiple drips with shading and gloss highlights — uneven heights
    // and widths so it doesn't read as a pattern.
    const drips = [-0.36, -0.18, 0.02, 0.22, 0.4];
    return (
      <g>
        {drips.map((p, i) => {
          const x = centreX + (right - left) * p;
          const heights = [22, 32, 16, 28, 20];
          const h = heights[i % heights.length];
          return (
            <g key={i}>
              <path
                d={`M ${x - 7} ${top + 6} q 0 ${h - 4} 7 ${h} q 7 -4 7 -${h - 4} Z`}
                fill="#3D1B0A"
                stroke={STROKE_INK}
                strokeWidth={STROKE * 0.7}
              />
              <path
                d={`M ${x - 4} ${top + 8} q 0 ${h - 8} 3 ${h - 6}`}
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={STROKE * 0.7}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </g>
    );
  }

  // Smooth icing — a soft cross-tier highlight + bottom shadow strip.
  return (
    <g>
      <path
        d={`M ${left + 18} ${top + 38} Q ${centreX} ${top + 14} ${right - 18} ${top + 38}`}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth={STROKE * 1.6}
        strokeLinecap="round"
      />
      <path
        d={`M ${left + 12} ${bottom - 10} Q ${centreX} ${bottom - 4} ${right - 12} ${bottom - 10}`}
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth={STROKE * 1.2}
        strokeLinecap="round"
      />
    </g>
  );
}

/* -------------------------------------------------------------------- */
/* FILLINGS                                                             */
/* -------------------------------------------------------------------- */

function FruitPile({ centreX, top }: { centreX: number; top: number }) {
  const cy = top - 14;
  return (
    <g>
      {/* Glossy berries with light catchlights */}
      <Berry cx={centreX - 18} cy={cy + 6} r={8} fill="#A8392E" />
      <Berry cx={centreX + 16} cy={cy + 8} r={9} fill="#C9483A" />
      <Berry cx={centreX - 4} cy={cy - 2} r={11} fill="#7B1F1F" />
      <Berry cx={centreX + 4} cy={cy + 10} r={6} fill="#A8392E" />
      <Berry cx={centreX - 10} cy={cy + 12} r={5} fill="#C9483A" />
      {/* Mint leaf */}
      <path
        d={`M ${centreX - 4} ${cy - 16} q 5 -6 14 -3 q -2 8 -10 6 Z`}
        fill="#9DBA68"
        stroke={STROKE_INK}
        strokeWidth={STROKE * 0.7}
      />
      <line
        x1={centreX - 4}
        y1={cy - 16}
        x2={centreX + 4}
        y2={cy - 12}
        stroke={STROKE_INK}
        strokeWidth={STROKE * 0.4}
        opacity="0.5"
      />
    </g>
  );
}

function Berry({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={STROKE_INK} strokeWidth={STROKE * 0.7} />
      <ellipse cx={cx - r * 0.3} cy={cy - r * 0.4} rx={r * 0.35} ry={r * 0.2} fill="rgba(255,255,255,0.6)" />
    </g>
  );
}

function JamDrip({ left, right, top, centreX }: { left: number; right: number; top: number; centreX: number }) {
  // A jam line peeking from the side cuts — uneven dots like a layer
  // showing through, with shine.
  const positions = [left + 26, centreX - 36, centreX + 6, centreX + 42, right - 26];
  return (
    <g>
      {positions.map((x, i) => (
        <g key={i}>
          <path
            d={`M ${x - 6} ${top + 32} q 6 -4 12 0 q -2 8 -12 5 Z`}
            fill="#C9483A"
            stroke={STROKE_INK}
            strokeWidth={STROKE * 0.6}
          />
          <ellipse cx={x - 2} cy={top + 33} rx={2} ry={1} fill="rgba(255,255,255,0.6)" />
        </g>
      ))}
    </g>
  );
}

/* -------------------------------------------------------------------- */
/* INSCRIPTION                                                          */
/* -------------------------------------------------------------------- */

function InscriptionBanner({
  centreX,
  y,
  tierWidth,
  message,
  cover,
}: {
  centreX: number;
  y: number;
  tierWidth: number;
  message: string;
  cover: CakeConfig["cover"];
}) {
  const isDark = cover === "ganache";
  const fontSize = tierWidth > 320 ? 19 : tierWidth > 270 ? 16 : 14;
  const text = truncate(message, tierWidth > 320 ? 28 : 20);
  return (
    <g>
      <text
        x={centreX}
        y={y}
        textAnchor="middle"
        fontFamily="var(--font-display), Fredoka, sans-serif"
        fontWeight="700"
        fontSize={fontSize}
        fill={isDark ? "#FBF4E5" : "#2A1810"}
        style={{ paintOrder: "stroke" }}
        stroke={isDark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.85)"}
        strokeWidth={3.5}
      >
        {text}
      </text>
    </g>
  );
}
