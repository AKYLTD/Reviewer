interface BagelMarkProps {
  className?: string;
  /** Animate slow rotation. */
  spin?: boolean;
  title?: string;
}

/**
 * The bagel mark — Roni's equivalent of the Fresh Catering rosette. A
 * rounded torus with sesame freckles, tinted in the brick/saffron family.
 * Uses currentColor for the freckles so it can sit on any panel.
 */
export function BagelMark({ className = "", spin = false, title = "Roni's bagel mark" }: BagelMarkProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={title}
      className={`${className} ${spin ? "animate-bagel-spin" : ""}`}
    >
      <title>{title}</title>
      <defs>
        <radialGradient id="bagel-body" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#E89F3A" />
          <stop offset="55%" stopColor="#C9483A" />
          <stop offset="100%" stopColor="#8C2A20" />
        </radialGradient>
        <radialGradient id="bagel-hole" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4A1F08" />
          <stop offset="100%" stopColor="#2A1810" />
        </radialGradient>
      </defs>
      {/* outer ring */}
      <circle cx="100" cy="100" r="90" fill="url(#bagel-body)" />
      {/* highlight crescent */}
      <path
        d="M40 60 Q70 30 130 35 Q90 35 60 70 Z"
        fill="rgba(255, 230, 180, 0.5)"
      />
      {/* hole */}
      <circle cx="100" cy="100" r="34" fill="url(#bagel-hole)" />
      <circle cx="100" cy="100" r="34" fill="none" stroke="#1a0d05" strokeWidth="1" opacity="0.4" />
      {/* sesame freckles — scattered around the dough */}
      {SESAME.map(([cx, cy, r, rot], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.45}
          fill="#FBE7B7"
          opacity="0.85"
          transform={`rotate(${rot} ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

const SESAME: [number, number, number, number][] = [
  [60, 50, 3, 30], [88, 38, 3, -10], [120, 40, 2.6, 22],
  [150, 60, 3, 50], [165, 92, 2.8, -20], [158, 130, 3, 18],
  [136, 158, 2.8, 40], [105, 168, 3, -8], [70, 162, 3, -32],
  [44, 138, 2.8, 14], [32, 105, 3, -50], [38, 72, 2.6, 4],
  [76, 70, 2.6, -10], [125, 70, 2.6, 18], [148, 100, 2.5, 0],
  [128, 138, 2.6, 36], [78, 138, 2.6, -28], [54, 96, 2.6, -8],
];

/**
 * Compact circular badge with the bagel mark inset on a saffron tile —
 * matches the small icon set on the Fresh brand board.
 */
export function BagelBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <span className="absolute inset-0 rounded-md bg-saffron" />
      <BagelMark className="relative h-3/4 w-3/4" />
    </div>
  );
}
