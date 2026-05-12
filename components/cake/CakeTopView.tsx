import { COVER_OPTIONS, type CakeConfig } from "./types";

interface Props {
  config: CakeConfig;
  className?: string;
}

/**
 * Top-down view of the cake. Shows the shape (round / square / special-3D
 * silhouette / image-print frame) and the inscription text in the centre.
 * Used alongside the layer cross-section diagram so the customer sees
 * both planes of their cake.
 */
export function CakeTopView({ config, className = "" }: Props) {
  const palette = coverColors(config.cover);
  const VW = 300;
  const VH = 300;
  const cx = VW / 2;
  const cy = VH / 2;
  const r = 120; // base radius for round

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      role="img"
      aria-label={`Top-down view of ${config.shape} cake`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="top-grad" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={palette.light} />
          <stop offset="0.6" stopColor={palette.body} />
          <stop offset="1" stopColor={palette.deep} />
        </radialGradient>
        <filter id="top-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="4" result="b" />
          <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Plate halo */}
      <circle cx={cx} cy={cy} r={r + 22} fill="#E9DBC1" opacity={0.85} />
      <circle cx={cx} cy={cy} r={r + 14} fill="#FBF4E5" opacity={0.9} stroke="#2A1810" strokeWidth={1.2} />

      <g filter="url(#top-shadow)">
        {config.shape === "round" && (
          <RoundTop cx={cx} cy={cy} r={r} palette={palette} />
        )}
        {config.shape === "square" && (
          <SquareTop cx={cx} cy={cy} half={r} palette={palette} />
        )}
        {config.shape === "image" && (
          <ImagePrintTop cx={cx} cy={cy} r={r} palette={palette} message={config.message} />
        )}
        {config.shape === "special-3d" && (
          <SculptedTop cx={cx} cy={cy} r={r} palette={palette} />
        )}
      </g>

      {/* Inscription — not on image-print (the photo carries the text) */}
      {config.shape !== "image" && config.message?.trim() && (
        <Inscription cx={cx} cy={cy} maxWidth={r * 1.6} text={config.message} dark={config.cover === "ganache"} />
      )}

      {/* Outer drip dots peeking just past the edge (for ganache + icing) */}
      {(config.shape === "round" || config.shape === "image") && (
        <Drips cx={cx} cy={cy} r={r} cover={config.cover} palette={palette} />
      )}
    </svg>
  );
}

function RoundTop({
  cx, cy, r, palette,
}: { cx: number; cy: number; r: number; palette: { light: string; body: string; deep: string }; }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="url(#top-grad)" stroke="#2A1810" strokeWidth={1.5} />
      {/* Subtle inner ring */}
      <circle cx={cx} cy={cy} r={r - 8} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
    </g>
  );
}

function SquareTop({
  cx, cy, half, palette,
}: { cx: number; cy: number; half: number; palette: { light: string; body: string; deep: string }; }) {
  // Slightly rounded square so it reads as a baked-tin shape, not a CSS
  // rectangle. Side ≈ half * 1.78 = ~80% of radius * 2.
  const side = half * 1.78;
  const x = cx - side / 2;
  const y = cy - side / 2;
  return (
    <g>
      <rect x={x} y={y} width={side} height={side} rx={10} fill="url(#top-grad)" stroke="#2A1810" strokeWidth={1.5} />
      <rect x={x + 8} y={y + 8} width={side - 16} height={side - 16} rx={6} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
    </g>
  );
}

function ImagePrintTop({
  cx, cy, r, palette, message,
}: { cx: number; cy: number; r: number; palette: { light: string; body: string; deep: string }; message: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={palette.body} stroke="#2A1810" strokeWidth={1.5} />
      {/* Edible-image rectangle in the centre */}
      <rect
        x={cx - r * 0.62}
        y={cy - r * 0.42}
        width={r * 1.24}
        height={r * 0.84}
        rx={8}
        fill="#3D1B0A"
        stroke="#2A1810"
        strokeWidth={1.5}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontFamily="var(--font-display), Fredoka, sans-serif"
        fontWeight={700}
        fontSize={16}
        fill="#FBF4E5"
        style={{ paintOrder: "stroke" }}
        stroke="#2A1810"
        strokeWidth={2}
      >
        {(message || "Your photo here").slice(0, 22)}
      </text>
    </g>
  );
}

function SculptedTop({
  cx, cy, r, palette,
}: { cx: number; cy: number; r: number; palette: { light: string; body: string; deep: string }; }) {
  // A scalloped / sculpted silhouette — six rounded lobes around a centre.
  const lobes = 6;
  const pts: string[] = [];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const aNext = ((i + 0.5) / lobes) * Math.PI * 2;
    const aMid = ((i + 0.5) / lobes) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const xn = cx + Math.cos(aNext) * (r + 12);
    const yn = cy + Math.sin(aNext) * (r + 12);
    pts.push(`${i === 0 ? "M" : "L"} ${x} ${y} Q ${xn} ${yn} ${cx + Math.cos((i + 1) / lobes * Math.PI * 2) * r} ${cy + Math.sin((i + 1) / lobes * Math.PI * 2) * r}`);
  }
  return (
    <g>
      <path d={`${pts.join(" ")} Z`} fill="url(#top-grad)" stroke="#2A1810" strokeWidth={1.5} />
    </g>
  );
}

function Drips({
  cx, cy, r, cover, palette,
}: { cx: number; cy: number; r: number; cover: CakeConfig["cover"]; palette: { light: string; body: string; deep: string }; }) {
  // Drops at irregular angles around the edge, only visible just past the
  // cake outline (giving the impression of glaze running down the sides
  // when seen from above).
  const drips = cover === "ganache"
    ? [10, 50, 105, 160, 215, 260, 315]
    : cover === "icing"
      ? [20, 90, 175, 240, 300]
      : [];
  return (
    <g>
      {drips.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const cxD = cx + Math.cos(a) * r;
        const cyD = cy + Math.sin(a) * r;
        const len = [10, 16, 12, 18, 14, 11, 17][i % 7];
        return (
          <ellipse
            key={i}
            cx={cxD}
            cy={cyD}
            rx={5}
            ry={len * 0.5}
            transform={`rotate(${deg + 90} ${cxD} ${cyD})`}
            fill={palette.deep}
            stroke="#2A1810"
            strokeWidth={0.8}
            opacity={0.85}
          />
        );
      })}
    </g>
  );
}

function Inscription({
  cx, cy, maxWidth, text, dark,
}: { cx: number; cy: number; maxWidth: number; text: string; dark: boolean }) {
  // Split into up to 2 lines so longer messages still fit.
  const trimmed = text.trim().slice(0, 30);
  const words = trimmed.split(/\s+/);
  let l1 = "";
  let l2 = "";
  for (const w of words) {
    if ((l1 + " " + w).trim().length <= 16) l1 = (l1 + " " + w).trim();
    else l2 = (l2 + " " + w).trim();
  }
  const fontSize = trimmed.length > 16 ? 18 : 22;
  return (
    <g>
      <text
        x={cx}
        y={cy + (l2 ? -6 : 6)}
        textAnchor="middle"
        fontFamily="var(--font-display), Fredoka, sans-serif"
        fontWeight={700}
        fontSize={fontSize}
        fill={dark ? "#FBF4E5" : "#2A1810"}
        style={{ paintOrder: "stroke" }}
        stroke={dark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.85)"}
        strokeWidth={3.5}
      >
        {l1}
      </text>
      {l2 && (
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fontFamily="var(--font-display), Fredoka, sans-serif"
          fontWeight={700}
          fontSize={fontSize}
          fill={dark ? "#FBF4E5" : "#2A1810"}
          style={{ paintOrder: "stroke" }}
          stroke={dark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.85)"}
          strokeWidth={3.5}
        >
          {l2}
        </text>
      )}
    </g>
  );
}

function coverColors(cover: CakeConfig["cover"]): { light: string; body: string; deep: string } {
  switch (cover) {
    case "icing":       return { light: "#FFFFFF", body: "#F8F1E1", deep: "#D9C9A6" };
    case "buttercream": return { light: "#FFF6E0", body: "#F5E6BE", deep: "#D9BD7C" };
    case "ganache":     return { light: "#7B4827", body: "#5C2F18", deep: "#3D1B0A" };
  }
}
