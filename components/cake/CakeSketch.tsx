import { COLOR_PALETTE, type CakeConfig } from "./types";

interface CakeSketchProps {
  config: CakeConfig;
  className?: string;
}

/**
 * Hand-drawn-feel SVG cake that re-renders from the form config in real
 * time. The viewBox is fixed at 400×440; tiers are sized down from the
 * bottom (largest) to the top (smallest). Colours come from COLOR_PALETTE
 * so the form's colour swatches match exactly.
 *
 * Stroke-only outline keeps the sketch register consistent with the other
 * line illustrations (Kettle / Bench / Counter) — but each tier is filled
 * with the chosen frosting palette so the cake reads as the cake the
 * customer is ordering, not just an outline.
 */
export function CakeSketch({ config, className = "" }: CakeSketchProps) {
  const palette = COLOR_PALETTE[config.color];
  const STROKE = 1.6;
  const stroke = "#2A1810";

  // Tier geometry — bottom (1), middle (2), top (3). Heights and widths
  // shrink upward so a 3-tier cake has a believable wedding-cake silhouette.
  const TIERS: Array<{ w: number; h: number; cy: number }> = [
    { w: 280, h: 70, cy: 360 }, // bottom
    { w: 220, h: 60, cy: 290 }, // middle
    { w: 160, h: 50, cy: 230 }, // top
  ];

  const visibleTiers = TIERS.slice(0, config.tiers);
  const topTier = visibleTiers[visibleTiers.length - 1];

  return (
    <svg
      viewBox="0 0 400 440"
      role="img"
      aria-label={`A ${config.tiers}-tier ${config.shape} ${palette.label.toLowerCase()} cake`}
      className={className}
    >
      {/* Plate ----------------------------------------------------------- */}
      <ellipse cx="200" cy="408" rx="170" ry="14" fill="#E9DBC1" stroke={stroke} strokeWidth={STROKE} />
      <ellipse cx="200" cy="404" rx="160" ry="10" fill="#FBF4E5" stroke={stroke} strokeWidth={STROKE * 0.7} opacity="0.7" />

      {/* Tiers (bottom to top) ------------------------------------------- */}
      {visibleTiers.map((t, i) => (
        <Tier
          key={i}
          centreX={200}
          centreY={t.cy}
          width={t.w}
          height={t.h}
          shape={config.shape}
          style={config.style}
          palette={palette}
          stroke={stroke}
          strokeWidth={STROKE}
        />
      ))}

      {/* Inscription on the front of the top tier ------------------------ */}
      {config.inscription && config.inscription.trim() !== "" && topTier && (
        <text
          x="200"
          y={topTier.cy + 4}
          textAnchor="middle"
          fontFamily="var(--font-display), Fredoka, sans-serif"
          fontWeight="700"
          fontSize={topTier.w > 200 ? "16" : "14"}
          fill={palette.deep}
          style={{ paintOrder: "stroke" }}
          stroke="#FBF4E5"
          strokeWidth={3}
        >
          {truncate(config.inscription, topTier.w > 200 ? 24 : 16)}
        </text>
      )}

      {/* Topper above the top tier --------------------------------------- */}
      {topTier && (
        <Topper
          centreX={200}
          baseY={topTier.cy - topTier.h / 2}
          width={topTier.w}
          topper={config.topper}
          candles={config.candles}
          stroke={stroke}
          strokeWidth={STROKE}
          paletteDeep={palette.deep}
        />
      )}
    </svg>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

interface TierProps {
  centreX: number;
  centreY: number;
  width: number;
  height: number;
  shape: CakeConfig["shape"];
  style: CakeConfig["style"];
  palette: { light: string; body: string; deep: string };
  stroke: string;
  strokeWidth: number;
}

function Tier({ centreX, centreY, width, height, shape, style, palette, stroke, strokeWidth }: TierProps) {
  const left = centreX - width / 2;
  const right = centreX + width / 2;
  const top = centreY - height / 2;
  const bottom = centreY + height / 2;

  // For a round tier, the top + base are ellipses; for square, sharper rect.
  const ellipseRy = shape === "round" ? height * 0.18 : height * 0.06;

  return (
    <g>
      {/* Tier body — sides, then top --------------------------------- */}
      <path
        d={
          shape === "round"
            ? `M ${left} ${top} L ${left} ${bottom} A ${width / 2} ${ellipseRy} 0 0 0 ${right} ${bottom} L ${right} ${top} Z`
            : `M ${left} ${top} L ${left} ${bottom} L ${right} ${bottom} L ${right} ${top} Z`
        }
        fill={palette.body}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Top oval (round only — square has flat top). */}
      {shape === "round" && (
        <ellipse
          cx={centreX}
          cy={top}
          rx={width / 2}
          ry={ellipseRy}
          fill={palette.light}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}
      {shape === "square" && (
        <rect
          x={left}
          y={top - 4}
          width={width}
          height={8}
          fill={palette.light}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )}

      {/* Style-specific surface treatment ------------------------------- */}
      {style === "naked" && (
        <>
          {/* Visible sponge layers: 3 horizontal lines crossing the tier
              face, filling area between with a creamier tone. */}
          <line x1={left} y1={top + height / 3} x2={right} y2={top + height / 3} stroke={stroke} strokeWidth={strokeWidth * 0.7} opacity="0.75" />
          <line x1={left} y1={top + (2 * height) / 3} x2={right} y2={top + (2 * height) / 3} stroke={stroke} strokeWidth={strokeWidth * 0.7} opacity="0.75" />
        </>
      )}
      {style === "swirl" && (
        // Repeating arcs across the face for a piped-swirl frosting feel.
        Array.from({ length: Math.floor(width / 24) }).map((_, i) => {
          const cx = left + 12 + i * 24;
          return (
            <path
              key={i}
              d={`M ${cx - 8} ${top + height / 2} q 8 -8 16 0`}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth * 0.8}
              opacity="0.5"
            />
          );
        })
      )}

      {/* Drip accent — small saffron drips when colour is brick/saffron */}
      {(palette.body === "#C9483A" || palette.body === "#F5A623") && (
        <g opacity="0.85">
          <path
            d={`M ${left + 30} ${top + 4} q 0 12 6 14 q 6 -2 6 -14 Z`}
            fill={palette.deep}
            stroke={stroke}
            strokeWidth={strokeWidth * 0.6}
          />
          <path
            d={`M ${right - 36} ${top + 4} q 0 8 6 10 q 6 -2 6 -10 Z`}
            fill={palette.deep}
            stroke={stroke}
            strokeWidth={strokeWidth * 0.6}
          />
        </g>
      )}
    </g>
  );
}

interface TopperProps {
  centreX: number;
  baseY: number;
  width: number;
  topper: CakeConfig["topper"];
  candles: number;
  stroke: string;
  strokeWidth: number;
  paletteDeep: string;
}

function Topper({ centreX, baseY, width, topper, candles, stroke, strokeWidth, paletteDeep }: TopperProps) {
  if (topper === "none") return null;

  if (topper === "candles") {
    const n = Math.min(Math.max(1, candles), 12);
    const spread = Math.min(width - 40, 24 * n);
    const start = centreX - spread / 2;
    const step = n > 1 ? spread / (n - 1) : 0;
    return (
      <g>
        {Array.from({ length: n }).map((_, i) => {
          const x = start + i * step;
          return (
            <g key={i}>
              {/* Wax stick */}
              <rect
                x={x - 2}
                y={baseY - 28}
                width={4}
                height={26}
                fill="#FBF4E5"
                stroke={stroke}
                strokeWidth={strokeWidth}
                rx={1.5}
              />
              {/* Flame */}
              <path
                d={`M ${x} ${baseY - 36} q -3 4 0 6 q 3 -2 0 -6 Z`}
                fill="#F5A623"
                stroke="#C9483A"
                strokeWidth={strokeWidth * 0.6}
              />
              <circle cx={x} cy={baseY - 33} r="0.8" fill="#C9483A" />
            </g>
          );
        })}
      </g>
    );
  }

  if (topper === "fruit") {
    return (
      <g>
        {/* A trio of berries clustered on top */}
        <circle cx={centreX - 18} cy={baseY - 10} r="9" fill="#C9483A" stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx={centreX} cy={baseY - 14} r="11" fill="#A8392E" stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx={centreX + 18} cy={baseY - 10} r="9" fill="#C9483A" stroke={stroke} strokeWidth={strokeWidth} />
        {/* leaves */}
        <path d={`M ${centreX - 4} ${baseY - 22} q 4 -6 12 -4 q -2 8 -10 6 Z`} fill="#9DBA68" stroke={stroke} strokeWidth={strokeWidth * 0.7} />
        <circle cx={centreX} cy={baseY - 16} r="1" fill="#FBF4E5" />
      </g>
    );
  }

  if (topper === "flowers") {
    // A small posy of saffron + brick flowers
    const FLOWERS: [number, number, string][] = [
      [centreX - 16, baseY - 8, "#F5A623"],
      [centreX, baseY - 14, "#C9483A"],
      [centreX + 16, baseY - 8, "#F5A623"],
    ];
    return (
      <g>
        {FLOWERS.map(([x, y, color], i) => (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((a) => {
              const rad = (a * Math.PI) / 180;
              const px = x + Math.cos(rad) * 6;
              const py = y + Math.sin(rad) * 6;
              return (
                <ellipse
                  key={a}
                  cx={px}
                  cy={py}
                  rx="5"
                  ry="3.5"
                  fill={color}
                  stroke={stroke}
                  strokeWidth={strokeWidth * 0.7}
                  transform={`rotate(${a} ${px} ${py})`}
                />
              );
            })}
            <circle cx={x} cy={y} r="2.5" fill="#FBF4E5" stroke={stroke} strokeWidth={strokeWidth * 0.7} />
          </g>
        ))}
        {/* stem */}
        <path d={`M ${centreX} ${baseY - 4} q -4 -2 -8 4`} fill="none" stroke="#9DBA68" strokeWidth={strokeWidth * 1.2} />
      </g>
    );
  }

  if (topper === "figurine") {
    // Abstract figurine — a little person silhouette
    return (
      <g>
        <circle cx={centreX} cy={baseY - 24} r="6" fill={paletteDeep} stroke={stroke} strokeWidth={strokeWidth} />
        <path
          d={`M ${centreX} ${baseY - 18} L ${centreX} ${baseY - 4} M ${centreX - 6} ${baseY - 14} L ${centreX + 6} ${baseY - 14} M ${centreX} ${baseY - 4} L ${centreX - 4} ${baseY + 4} M ${centreX} ${baseY - 4} L ${centreX + 4} ${baseY + 4}`}
          fill="none"
          stroke={paletteDeep}
          strokeWidth={strokeWidth * 1.5}
          strokeLinecap="round"
        />
      </g>
    );
  }

  return null;
}
