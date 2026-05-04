/**
 * Sketch-style food illustrations to enrich image-led sections without
 * requiring photography. Stroke uses currentColor; saffron accent dot per
 * illustration matches the existing Kettle/Bench/Counter sketches.
 */

interface Props {
  className?: string;
  title: string;
}

const STROKE = 1.6;

export function SandwichIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* Top bagel half (with sesame) */}
      <path d="M40 60 Q40 35 100 35 Q160 35 160 60 L150 80 L50 80 Z" fill="#F5E6BE" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <circle cx="70" cy="50" r="1.4" fill="currentColor" opacity="0.6" />
      <circle cx="100" cy="42" r="1.4" fill="currentColor" opacity="0.6" />
      <circle cx="130" cy="50" r="1.4" fill="currentColor" opacity="0.6" />
      {/* Cream cheese layer */}
      <path d="M50 80 Q60 90 100 90 Q140 90 150 80 L150 92 Q140 100 100 100 Q60 100 50 92 Z" fill="#FBF4E5" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      {/* Salmon */}
      <path d="M50 100 Q60 110 100 110 Q140 110 150 100 L155 116 Q140 124 100 124 Q60 124 45 116 Z" fill="#E8857A" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M55 110 Q70 105 85 110 Q100 115 115 110 Q130 105 145 110" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.6} opacity="0.5" />
      {/* Cucumber */}
      <ellipse cx="80" cy="124" rx="9" ry="2.5" fill="#9DBA68" stroke="currentColor" strokeWidth={STROKE * 0.7} />
      <ellipse cx="120" cy="124" rx="9" ry="2.5" fill="#9DBA68" stroke="currentColor" strokeWidth={STROKE * 0.7} />
      {/* Bottom bagel half */}
      <path d="M50 130 Q40 135 40 152 Q40 178 100 178 Q160 178 160 152 Q160 135 150 130 Z" fill="#F5E6BE" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      {/* Steam tip */}
      <path d="M100 22 Q96 16 102 12 Q108 8 104 4" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} strokeLinecap="round" opacity="0.6" />
      <circle cx="104" cy="2" r="1.6" fill="#F5A623" />
    </svg>
  );
}

export function CroissantIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* Plate */}
      <ellipse cx="100" cy="160" rx="74" ry="9" fill="#FBF4E5" stroke="currentColor" strokeWidth={STROKE} />
      {/* Croissant body — crescent */}
      <path
        d="M50 140 Q40 120 56 96 Q72 72 100 70 Q132 68 148 92 Q160 116 156 138 Q150 152 130 152 Q120 142 110 148 Q98 152 90 144 Q78 136 70 146 Q56 152 50 140 Z"
        fill="#E8B973"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {/* Layer scoring */}
      <path d="M62 122 Q70 108 88 100" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity="0.55" />
      <path d="M82 116 Q92 100 110 96" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity="0.55" />
      <path d="M100 110 Q116 96 134 100" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity="0.55" />
      <path d="M120 116 Q138 108 152 122" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity="0.55" />
      {/* Steam */}
      <path d="M100 60 Q96 52 102 46" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} strokeLinecap="round" opacity="0.6" />
      <circle cx="102" cy="42" r="1.6" fill="#F5A623" />
    </svg>
  );
}

export function CoffeeIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* Saucer */}
      <ellipse cx="100" cy="170" rx="70" ry="8" fill="#FBF4E5" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="100" cy="166" rx="60" ry="6" fill="#F0E4D0" stroke="currentColor" strokeWidth={STROKE * 0.6} opacity="0.6" />
      {/* Cup body */}
      <path d="M58 76 L142 76 L138 154 Q136 162 128 162 L72 162 Q64 162 62 154 Z" fill="#FBF4E5" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      {/* Coffee surface */}
      <ellipse cx="100" cy="76" rx="42" ry="8" fill="#5C2F18" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="100" cy="74" rx="34" ry="5" fill="#7B4827" opacity="0.85" />
      {/* Heart latte art */}
      <path
        d="M96 72 Q92 68 92 64 Q92 60 96 60 Q100 60 100 64 Q100 60 104 60 Q108 60 108 64 Q108 68 104 72 Q102 74 100 76 Q98 74 96 72 Z"
        fill="#F0E4D0"
        opacity="0.85"
      />
      {/* Handle */}
      <path d="M142 96 Q170 96 170 124 Q170 152 142 152" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      {/* Steam */}
      <path d="M82 50 Q78 40 86 32" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} strokeLinecap="round" opacity="0.55" />
      <path d="M100 46 Q94 36 102 28" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} strokeLinecap="round" opacity="0.7" />
      <path d="M118 50 Q122 40 114 32" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} strokeLinecap="round" opacity="0.55" />
      <circle cx="102" cy="24" r="1.8" fill="#F5A623" />
    </svg>
  );
}

export function PlatterIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* Tray */}
      <ellipse cx="100" cy="130" rx="92" ry="22" fill="#FBF4E5" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="100" cy="126" rx="84" ry="16" fill="#F0E4D0" stroke="currentColor" strokeWidth={STROKE * 0.6} opacity="0.5" />
      {/* Bagels arranged */}
      <g>
        <ellipse cx="50" cy="116" rx="16" ry="6" fill="#F5E6BE" stroke="currentColor" strokeWidth={STROKE} />
        <ellipse cx="50" cy="116" rx="6" ry="2" fill="#5C2F18" />
        <ellipse cx="86" cy="120" rx="16" ry="6" fill="#F5E6BE" stroke="currentColor" strokeWidth={STROKE} />
        <ellipse cx="86" cy="120" rx="6" ry="2" fill="#5C2F18" />
        <ellipse cx="122" cy="116" rx="16" ry="6" fill="#F5E6BE" stroke="currentColor" strokeWidth={STROKE} />
        <ellipse cx="122" cy="116" rx="6" ry="2" fill="#5C2F18" />
        <ellipse cx="156" cy="120" rx="14" ry="5" fill="#F5E6BE" stroke="currentColor" strokeWidth={STROKE} />
        <ellipse cx="156" cy="120" rx="5" ry="1.6" fill="#5C2F18" />
      </g>
      {/* Sliced cucumber accents on top */}
      <circle cx="64" cy="106" r="3" fill="#9DBA68" stroke="currentColor" strokeWidth={STROKE * 0.6} />
      <circle cx="100" cy="108" r="3" fill="#9DBA68" stroke="currentColor" strokeWidth={STROKE * 0.6} />
      <circle cx="138" cy="106" r="3" fill="#9DBA68" stroke="currentColor" strokeWidth={STROKE * 0.6} />
      {/* Lemon wedge */}
      <path d="M170 108 q -4 -4 0 -8 q 4 0 4 4 q 0 4 -4 4 Z" fill="#F5A623" stroke="currentColor" strokeWidth={STROKE * 0.7} />
      <circle cx="172" cy="104" r="0.6" fill="#F0E4D0" />
    </svg>
  );
}

export function SaladIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* Bowl */}
      <path d="M28 110 L172 110 Q170 168 100 172 Q30 168 28 110 Z" fill="#FBF4E5" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <ellipse cx="100" cy="110" rx="72" ry="10" fill="#F0E4D0" stroke="currentColor" strokeWidth={STROKE} />
      {/* Greens */}
      <path d="M48 100 q 10 -16 24 -10 q 8 -12 22 -8 q 8 -16 22 -8 q 12 -10 22 -2 q 14 0 14 18" fill="#9DBA68" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M58 92 q 8 -12 18 -8" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.6} opacity="0.6" />
      <path d="M88 86 q 8 -10 16 -6" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.6} opacity="0.6" />
      {/* Tomato */}
      <circle cx="76" cy="98" r="6" fill="#C9483A" stroke="currentColor" strokeWidth={STROKE * 0.7} />
      <circle cx="124" cy="96" r="6" fill="#C9483A" stroke="currentColor" strokeWidth={STROKE * 0.7} />
      {/* Olive */}
      <ellipse cx="98" cy="102" rx="4" ry="3" fill="#5C2F18" stroke="currentColor" strokeWidth={STROKE * 0.6} />
      {/* Saffron seed */}
      <circle cx="140" cy="100" r="2" fill="#F5A623" />
    </svg>
  );
}

export function CakeIllustration({ className, title }: Props) {
  // Static cake icon for the homepage tile (simplified version of CakeSketch).
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* Plate */}
      <ellipse cx="100" cy="170" rx="80" ry="8" fill="#FBF4E5" stroke="currentColor" strokeWidth={STROKE} />
      {/* Bottom tier */}
      <path d="M40 120 L40 162 Q40 168 60 168 L140 168 Q160 168 160 162 L160 120 Z" fill="#F5E6BE" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <ellipse cx="100" cy="120" rx="60" ry="10" fill="#FFF6E0" stroke="currentColor" strokeWidth={STROKE} />
      {/* Top tier */}
      <path d="M64 80 L64 116 Q64 122 80 122 L120 122 Q136 122 136 116 L136 80 Z" fill="#E89283" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <ellipse cx="100" cy="80" rx="36" ry="6" fill="#FFCFC4" stroke="currentColor" strokeWidth={STROKE} />
      {/* Drip */}
      <path d="M76 78 q 0 12 6 14 q 6 -2 6 -14 Z" fill="#C9483A" stroke="currentColor" strokeWidth={STROKE * 0.6} />
      <path d="M114 78 q 0 8 6 10 q 6 -2 6 -10 Z" fill="#C9483A" stroke="currentColor" strokeWidth={STROKE * 0.6} />
      {/* Candle + flame */}
      <rect x="98" y="56" width="4" height="22" fill="#FBF4E5" stroke="currentColor" strokeWidth={STROKE} rx="1.5" />
      <path d="M100 50 q -3 4 0 6 q 3 -2 0 -6 Z" fill="#F5A623" stroke="#C9483A" strokeWidth={STROKE * 0.6} />
      <circle cx="100" cy="52" r="1" fill="#C9483A" />
    </svg>
  );
}
