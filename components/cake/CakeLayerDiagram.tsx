import {
  BASE_OPTIONS,
  COVER_OPTIONS,
  FILLING_OPTIONS,
  SIZE_OPTIONS,
  type CakeBase,
  type CakeConfig,
  type CakeCover,
  type CakeFilling,
} from "./types";

interface Props {
  config: CakeConfig;
  className?: string;
  /** Drop the right-side labels — useful in compact preset thumbnails. */
  compact?: boolean;
}

/**
 * Exploded layer diagram of a cake, in the style of a labelled cross-
 * section illustration. Each material the customer picks renders as its
 * own stacked slab with a distinct fill + texture; labels on the right
 * connect to each layer with a thin rule.
 *
 * Adapts to the cake config in real time:
 *  - Sponge layers = number of fillings + 1 (so 1 filling = 2 sponges,
 *    2 fillings = 3 sponges).
 *  - Each filling slab is coloured per material (jam, vanilla cream,
 *    fruit-berry pattern, chocolate ganache).
 *  - Cover slab carries dripping side drops on dark covers, piped
 *    rosettes on buttercream, a soft highlight on smooth icing.
 *  - Topper above the cover renders per the topper choice
 *    (candles / fruit / flowers / figurine).
 */
export function CakeLayerDiagram({ config, className = "", compact = false }: Props) {
  const sizeRec = SIZE_OPTIONS.find((s) => s.id === config.size) ?? SIZE_OPTIONS[1];
  const fillings = FILLING_OPTIONS.filter((f) => config.fillings.includes(f.id));
  // At least one sponge layer, even if no fillings (so cake has a body).
  const fillingCount = Math.max(1, fillings.length);
  const spongeCount = fillingCount + 1;

  // Slab geometry — coordinates in the 600x780 viewBox.
  const VW = 600;
  const VH = 780;
  const cakeCx = compact ? 300 : 240;
  // Map cake size (8–18 inch) to drawn width.
  const widthRange = { min: 220, max: 360 };
  const inchRange = { min: 8, max: 18 };
  const cakeWidth =
    widthRange.min +
    ((sizeRec.inches - inchRange.min) / (inchRange.max - inchRange.min)) *
      (widthRange.max - widthRange.min);
  const left = cakeCx - cakeWidth / 2;
  const right = cakeCx + cakeWidth / 2;

  // Heights per slab type. The customer's real form has no separate
  // topper field, so no topper layer is rendered — labelling the
  // inscription as a band on the cover would be future work.
  const TOPPER_H = 0;
  const COVER_H = 60;
  const SPONGE_H = 64;
  const FILLING_H = 28;
  const BASE_H = 44;
  const PLATE_H = 14;

  // Build slabs from top to bottom in render order
  type Slab = {
    key: string;
    kind: "topper" | "cover" | "sponge" | "filling" | "base" | "plate";
    y: number;
    height: number;
    label: string;
  };

  const slabs: Slab[] = [];
  let cursor = 50; // start padding from top

  slabs.push({
    key: "cover",
    kind: "cover",
    y: cursor,
    height: COVER_H,
    label: coverLabel(config),
  });
  cursor += COVER_H;

  // Interleave sponges and fillings: sponge, [filling, sponge]*N
  for (let i = 0; i < spongeCount; i++) {
    slabs.push({
      key: `sponge-${i}`,
      kind: "sponge",
      y: cursor,
      height: SPONGE_H,
      label: `${baseLabel(config.base)} Sponge${spongeCount > 1 ? ` (Layer ${spongeCount - i})` : ""}`,
    });
    cursor += SPONGE_H;
    if (i < fillingCount) {
      const f = fillings[i] ?? FILLING_OPTIONS[1];
      slabs.push({
        key: `filling-${i}`,
        kind: "filling",
        y: cursor,
        height: FILLING_H,
        label: fillingLabel(f.id),
      });
      cursor += FILLING_H;
    }
  }

  slabs.push({
    key: "base",
    kind: "base",
    y: cursor,
    height: BASE_H,
    label: `${coverLabelShort(config.cover)} Frosting Base`,
  });
  cursor += BASE_H;

  slabs.push({
    key: "plate",
    kind: "plate",
    y: cursor,
    height: PLATE_H,
    label: "Cake stand",
  });
  cursor += PLATE_H;

  const totalHeight = cursor + 30;
  const viewH = Math.max(VH, totalHeight + 40);

  // Label x positions
  const labelStartX = right + 24;
  const labelTextX = right + 60;

  return (
    <svg
      viewBox={`0 0 ${VW} ${viewH}`}
      role="img"
      aria-label="Cake layer diagram"
      className={className}
      preserveAspectRatio="xMidYMin meet"
    >
      <defs>
        <filter id="cake-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" />
          <feOffset dx="0" dy="3" result="b" />
          <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {slabs.map((s, i) => (
        <g key={s.key} filter="url(#cake-soft-shadow)">
          {renderSlabBody(s, slabs, { left, right, centreX: cakeCx, config })}
        </g>
      ))}

      {/* LABELS ------------------------------------------------------- */}
      {!compact && slabs.filter((s) => s.kind !== "plate").map((s, i, arr) => {
        const number = i + 1;
        const yMid = s.y + s.height / 2;
        return (
          <g key={`label-${s.key}`}>
            <line
              x1={right + 4}
              y1={yMid}
              x2={labelStartX + 24}
              y2={yMid}
              stroke="#2A1810"
              strokeWidth={1}
              opacity={0.55}
            />
            <circle cx={labelStartX + 24} cy={yMid} r={2.5} fill="#C9483A" />
            <text
              x={labelTextX}
              y={yMid + 1}
              dominantBaseline="middle"
              fontFamily="var(--font-display), Fredoka, sans-serif"
              fontWeight={700}
              fontSize={15}
              fill="#2A1810"
            >
              <tspan fill="#C9483A">{String(number).padStart(2, "0")}.</tspan>{" "}
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* =============================================================== */
/* SLAB RENDERERS                                                  */
/* =============================================================== */

type SlabRec = { key: string; kind: string; y: number; height: number; label: string };

function renderSlabBody(
  slab: SlabRec,
  all: SlabRec[],
  ctx: { left: number; right: number; centreX: number; config: CakeConfig },
) {
  switch (slab.kind) {
    case "cover":
      return <CoverSlab y={slab.y} height={slab.height} left={ctx.left} right={ctx.right} centreX={ctx.centreX} config={ctx.config} />;
    case "sponge":
      return <SpongeSlab y={slab.y} height={slab.height} left={ctx.left} right={ctx.right} base={ctx.config.base} />;
    case "filling": {
      // Recover the filling index from this slab's position among
      // filling-kind slabs.
      const fillingSlabs = all.filter((s) => s.kind === "filling");
      const idx = fillingSlabs.findIndex((s) => s.key === slab.key);
      const f = ctx.config.fillings[idx] ?? "vanilla";
      return <FillingSlab y={slab.y} height={slab.height} left={ctx.left} right={ctx.right} centreX={ctx.centreX} kind={f as CakeFilling} />;
    }
    case "base":
      return <BaseFrostingSlab y={slab.y} height={slab.height} left={ctx.left} right={ctx.right} centreX={ctx.centreX} cover={ctx.config.cover} />;
    case "plate":
      return <Plate y={slab.y} height={slab.height} centreX={ctx.centreX} />;
    default:
      return null;
  }
}

/* =============================================================== */
/* SHAPES                                                          */
/* =============================================================== */

function SpongeSlab({
  y, height, left, right, base,
}: { y: number; height: number; left: number; right: number; base: CakeBase }) {
  const { body, crumb } = spongeColors(base);
  const w = right - left;
  // Crumb dot pattern — 20 random-ish positions seeded from the y so it
  // stays stable as the layer count changes.
  const dots = Array.from({ length: 22 }).map((_, i) => {
    const px = left + 8 + ((i * 137 + (y % 53)) % (w - 16));
    const py = y + 8 + ((i * 89 + (y % 31)) % (height - 16));
    return { px, py };
  });
  return (
    <g>
      <rect x={left} y={y} width={w} height={height} rx={4} fill={body} stroke="#2A1810" strokeWidth={1.4} />
      <line x1={left} y1={y + 1} x2={right} y2={y + 1} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.px} cy={d.py} r={1.6} fill={crumb} opacity={0.65} />
      ))}
    </g>
  );
}

function FillingSlab({
  y, height, left, right, centreX, kind,
}: { y: number; height: number; left: number; right: number; centreX: number; kind: CakeFilling }) {
  const w = right - left;
  const { body, accent, kind: t } = fillingStyle(kind);
  return (
    <g>
      <rect x={left} y={y} width={w} height={height} rx={3} fill={body} stroke="#2A1810" strokeWidth={1.4} />
      {/* Highlight strip on top */}
      <line x1={left + 4} y1={y + 3} x2={right - 4} y2={y + 3} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
      {t === "fruits" && (
        <>
          {/* Berry texture — small red circles */}
          {Array.from({ length: 10 }).map((_, i) => {
            const cx = left + 12 + i * ((w - 24) / 9);
            return (
              <g key={i}>
                <circle cx={cx} cy={y + height / 2} r={5} fill={accent} stroke="#2A1810" strokeWidth={0.8} />
                <circle cx={cx - 1.4} cy={y + height / 2 - 1.4} r={1.4} fill="rgba(255,255,255,0.55)" />
              </g>
            );
          })}
        </>
      )}
      {t === "jam" && (
        <>
          {/* Wavy darker ribbon */}
          <path
            d={`M ${left + 6} ${y + height / 2} ${Array.from({ length: 10 }).map((_, i) => {
              const x = left + 6 + i * ((w - 12) / 9);
              return `Q ${x + 6} ${y + (i % 2 === 0 ? 4 : height - 4)} ${x + 12} ${y + height / 2}`;
            }).join(" ")}`}
            stroke={accent}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            opacity={0.85}
          />
        </>
      )}
      {t === "smooth" && (
        // Tiny dots — vanilla cream / chocolate fudge texture
        Array.from({ length: 12 }).map((_, i) => {
          const cx = left + 8 + i * ((w - 16) / 11);
          return <circle key={i} cx={cx} cy={y + height / 2} r={0.9} fill={accent} opacity={0.5} />;
        })
      )}
    </g>
  );
}

function CoverSlab({
  y, height, left, right, centreX, config,
}: { y: number; height: number; left: number; right: number; centreX: number; config: CakeConfig }) {
  const palette = coverColors(config.cover);
  const w = right - left;
  return (
    <g>
      {/* Drips hanging below the cover slab (rendered first so the body
          paints over them at the top, giving a seamless join). */}
      <DripsRow
        y={y + height}
        left={left + 16}
        right={right - 16}
        cover={config.cover}
        palette={palette}
      />
      {/* Main slab */}
      <rect x={left} y={y} width={w} height={height} rx={6} fill={palette.body} stroke="#2A1810" strokeWidth={1.4} />
      {/* Top oval band — the visible "top" of the iced cake */}
      <rect x={left + 2} y={y + 2} width={w - 4} height={9} rx={3} fill={palette.light} stroke="none" />
      {/* Surface treatment per cover */}
      {config.cover === "buttercream" && (
        // Piped rosettes around the edge
        Array.from({ length: Math.floor(w / 26) }).map((_, i) => {
          const cx = left + 14 + i * 26;
          return (
            <g key={i}>
              <circle cx={cx} cy={y + height / 2} r={9} fill={palette.light} stroke="#2A1810" strokeWidth={0.9} opacity={0.95} />
              <path d={`M ${cx - 7} ${y + height / 2 + 1} q 0 -7 7 -7 q 7 0 7 7`} fill="none" stroke="#2A1810" strokeWidth={0.7} opacity={0.55} />
              <circle cx={cx - 2} cy={y + height / 2 - 2} r={1.2} fill="rgba(255,255,255,0.85)" />
            </g>
          );
        })
      )}
      {config.cover === "icing" && (
        <path
          d={`M ${left + 10} ${y + height - 12} Q ${centreX} ${y + 4} ${right - 10} ${y + height - 12}`}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
      {config.cover === "ganache" && (
        // Glossy highlight line near the top
        <line
          x1={left + 14} y1={y + height / 2 - 4}
          x2={right - 14} y2={y + height / 2 - 4}
          stroke="rgba(255,255,255,0.32)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function DripsRow({
  y, left, right, cover, palette,
}: { y: number; left: number; right: number; cover: CakeCover; palette: { light: string; body: string; deep: string }; }) {
  if (cover !== "ganache" && cover !== "buttercream") {
    // Icing: subtle drips
    const drips = [-0.4, -0.18, 0.02, 0.22, 0.42];
    return (
      <g>
        {drips.map((p, i) => {
          const cx = (left + right) / 2 + (right - left) * p;
          const h = 10 + (i % 2) * 6;
          return (
            <path
              key={i}
              d={`M ${cx - 5} ${y - 6} q 0 ${h} 5 ${h + 2} q 5 -2 5 -${h + 2} Z`}
              fill={palette.deep}
              stroke="#2A1810"
              strokeWidth={1}
              opacity={0.85}
            />
          );
        })}
      </g>
    );
  }
  const drips = cover === "ganache" ? [-0.4, -0.22, -0.05, 0.12, 0.3, 0.45] : [-0.3, -0.05, 0.18, 0.4];
  return (
    <g>
      {drips.map((p, i) => {
        const cx = (left + right) / 2 + (right - left) * p;
        const heights = [22, 32, 16, 28, 20, 26];
        const h = heights[i % heights.length];
        return (
          <g key={i}>
            <path
              d={`M ${cx - 6} ${y - 8} q 0 ${h - 4} 6 ${h} q 6 -4 6 -${h - 4} Z`}
              fill={palette.deep}
              stroke="#2A1810"
              strokeWidth={1}
            />
            <path
              d={`M ${cx - 3} ${y - 6} q 0 ${h - 8} 2 ${h - 6}`}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}

function BaseFrostingSlab({
  y, height, left, right, centreX, cover,
}: { y: number; height: number; left: number; right: number; centreX: number; cover: CakeCover }) {
  const palette = coverColors(cover);
  const w = right - left;
  return (
    <g>
      <rect
        x={left}
        y={y}
        width={w}
        height={height}
        rx={6}
        fill={palette.body}
        stroke="#2A1810"
        strokeWidth={1.4}
      />
      {/* Sprinkle ring across the base */}
      {Array.from({ length: 16 }).map((_, i) => {
        const cx = left + 12 + i * ((w - 24) / 15);
        const cy = y + height / 2 + (i % 2 === 0 ? -3 : 3);
        const hue = ["#C9483A", "#F5A623", "#FBF4E5", "#C9928A", "#5C2F18"][i % 5];
        return (
          <rect
            key={i}
            x={cx - 4}
            y={cy - 1.4}
            width={8}
            height={2.8}
            rx={1.4}
            fill={hue}
            transform={`rotate(${(i * 37) % 90 - 45} ${cx} ${cy})`}
          />
        );
      })}
    </g>
  );
}

function Plate({ y, height, centreX }: { y: number; height: number; centreX: number }) {
  return (
    <g>
      <ellipse cx={centreX} cy={y + height / 2 + 4} rx={220} ry={9} fill="#E9DBC1" stroke="#2A1810" strokeWidth={1.2} />
      <ellipse cx={centreX} cy={y + height / 2 + 2} rx={200} ry={6} fill="#FBF4E5" opacity={0.6} />
    </g>
  );
}


function coverLabel(config: CakeConfig): string {
  const cover = COVER_OPTIONS.find((c) => c.id === config.cover)?.label ?? config.cover;
  if (config.cover === "ganache") return `${cover} Drip Glaze`;
  if (config.cover === "icing") return `${cover} Glaze`;
  return cover;
}

function coverLabelShort(cover: CakeCover): string {
  return COVER_OPTIONS.find((c) => c.id === cover)?.label ?? cover;
}

function baseLabel(base: CakeBase): string {
  return BASE_OPTIONS.find((b) => b.id === base)?.label.replace(" sponge", "") ?? base;
}

function fillingLabel(f: CakeFilling): string {
  return FILLING_OPTIONS.find((x) => x.id === f)?.label ?? f;
}

/* =============================================================== */
/* PALETTES                                                        */
/* =============================================================== */

function spongeColors(base: CakeBase): { body: string; crumb: string } {
  switch (base) {
    case "chocolate": return { body: "#7B4827", crumb: "#3D1B0A" };
    case "vanilla":   return { body: "#F5E6BE", crumb: "#D9BD7C" };
    case "mousse":    return { body: "#F0DDD0", crumb: "#D6BCA9" };
    default:          return { body: "#E5D29A", crumb: "#B89366" };
  }
}

function fillingStyle(filling: CakeFilling): { body: string; accent: string; kind: "fruits" | "jam" | "smooth" } {
  switch (filling) {
    case "fruits":    return { body: "#FFCFC4", accent: "#C9483A", kind: "fruits" };
    case "jam":       return { body: "#E89283", accent: "#7B1F1F", kind: "jam" };
    case "chocolate": return { body: "#5C2F18", accent: "#3D1B0A", kind: "smooth" };
    case "vanilla":   return { body: "#FFF6E0", accent: "#D9BD7C", kind: "smooth" };
    default:          return { body: "#F5E6BE", accent: "#D9BD7C", kind: "smooth" };
  }
}

function coverColors(cover: CakeCover): { light: string; body: string; deep: string } {
  switch (cover) {
    case "icing":       return { light: "#FFFFFF", body: "#F8F1E1", deep: "#D9C9A6" };
    case "buttercream": return { light: "#FFF6E0", body: "#F5E6BE", deep: "#D9BD7C" };
    case "ganache":     return { light: "#7B4827", body: "#5C2F18", deep: "#3D1B0A" };
  }
}
