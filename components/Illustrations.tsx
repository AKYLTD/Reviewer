/**
 * Hand-drawn-feel SVG line illustrations for the homepage process strip.
 * They sit on warm paper, render at any size, and stay-in-brand without a
 * photographer. Ink is kept at 1.4px stroke; ember is reserved for one
 * accent dot per illustration.
 */

interface Props {
  className?: string;
  title: string;
}

const STROKE = 1.4;

export function KettleIllustration({ className, title }: Props) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      {/* Steam */}
      <path
        d="M70 38 Q66 28 74 22 Q82 16 78 8"
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M100 36 Q94 24 102 16 Q110 8 104 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M130 38 Q126 28 134 22 Q142 16 138 8"
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* Pot rim */}
      <ellipse cx="100" cy="50" rx="62" ry="10" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      {/* Pot body */}
      <path
        d="M38 50 L48 160 Q50 178 70 180 L130 180 Q150 178 152 160 L162 50"
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {/* Water surface ring */}
      <ellipse cx="100" cy="58" rx="56" ry="6" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity="0.5" />
      {/* Bagel bobbing */}
      <ellipse cx="80" cy="70" rx="14" ry="5" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="80" cy="70" rx="5" ry="2" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <ellipse cx="124" cy="74" rx="14" ry="5" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="124" cy="74" rx="5" ry="2" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      {/* Ember accent — single steam tip */}
      <circle cx="104" cy="2" r="1.6" fill="#A4422A" />
    </svg>
  );
}

export function BenchIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* Bench top */}
      <line x1="20" y1="120" x2="180" y2="120" stroke="currentColor" strokeWidth={STROKE} />
      <line x1="14" y1="160" x2="186" y2="160" stroke="currentColor" strokeWidth={STROKE} opacity="0.5" />
      {/* Hand */}
      <path
        d="M32 100 Q30 88 42 86 L60 86 Q66 86 68 92 L72 110 Q72 118 64 118 L36 118 Q30 118 32 100 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {/* Fingers */}
      <line x1="46" y1="86" x2="46" y2="76" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="54" y1="86" x2="54" y2="74" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="62" y1="86" x2="62" y2="76" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* Three rings of dough */}
      <ellipse cx="105" cy="118" rx="16" ry="5" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="105" cy="118" rx="6" ry="2" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <ellipse cx="135" cy="118" rx="16" ry="5" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="135" cy="118" rx="6" ry="2" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <ellipse cx="165" cy="118" rx="14" ry="4" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="165" cy="118" rx="5" ry="1.6" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      {/* Flour speckle */}
      <circle cx="92" cy="138" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="118" cy="142" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="148" cy="144" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="160" cy="138" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="100" cy="148" r="0.8" fill="currentColor" opacity="0.4" />
      {/* Ember */}
      <circle cx="135" cy="118" r="1.4" fill="#A4422A" />
    </svg>
  );
}

export function CounterIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      {/* Plate */}
      <ellipse cx="100" cy="120" rx="68" ry="14" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="100" cy="118" rx="56" ry="10" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity="0.5" />
      {/* Stacked bagel halves */}
      <path d="M70 116 Q70 102 100 102 Q130 102 130 116" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M76 102 Q76 92 100 92 Q124 92 124 102" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M82 92 Q82 84 100 84 Q118 84 118 92" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      {/* Steam wisps */}
      <path d="M88 78 Q86 72 92 70" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} strokeLinecap="round" opacity="0.55" />
      <path d="M100 76 Q98 68 104 64" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} strokeLinecap="round" opacity="0.7" />
      <path d="M112 78 Q110 72 116 70" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} strokeLinecap="round" opacity="0.55" />
      {/* Counter line */}
      <line x1="14" y1="160" x2="186" y2="160" stroke="currentColor" strokeWidth={STROKE} opacity="0.5" />
      {/* Ember — top wisp tip */}
      <circle cx="104" cy="62" r="1.4" fill="#A4422A" />
    </svg>
  );
}

export function CalligraphicR({ className, title = "R" }: { className?: string; title?: string }) {
  // Calligraphic R-mark for the footer / favicon, derived from the older
  // Roni's brand asset described in the brief. Used as a secondary mark.
  return (
    <svg viewBox="0 0 80 80" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      <path
        d="M22 14 Q22 10 26 10 L48 10 Q60 10 60 22 Q60 34 48 36 Q56 36 60 46 L66 64 Q67 68 62 70 Q57 70 55 66 L48 50 Q45 42 38 42 L34 42 L34 64 Q34 70 28 70 Q22 70 22 64 Z M34 18 L34 36 L46 36 Q52 36 52 26 Q52 18 46 18 Z"
        fill="currentColor"
      />
    </svg>
  );
}
