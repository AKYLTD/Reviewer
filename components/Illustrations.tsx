/**
 * Hand-drawn-feel SVG line illustrations for the homepage process strip,
 * tinted in the warm palette. Stroke uses currentColor so the parent
 * controls the ink. Saffron accent dot per illustration.
 */

interface Props {
  className?: string;
  title: string;
}

const STROKE = 1.6;

export function KettleIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      <path d="M70 38 Q66 28 74 22 Q82 16 78 8" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity="0.55" />
      <path d="M100 36 Q94 24 102 16 Q110 8 104 0" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity="0.7" />
      <path d="M130 38 Q126 28 134 22 Q142 16 138 8" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" opacity="0.55" />
      <ellipse cx="100" cy="50" rx="62" ry="10" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M38 50 L48 160 Q50 178 70 180 L130 180 Q150 178 152 160 L162 50" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <ellipse cx="100" cy="58" rx="56" ry="6" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity="0.5" />
      <ellipse cx="80" cy="70" rx="14" ry="5" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="80" cy="70" rx="5" ry="2" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <ellipse cx="124" cy="74" rx="14" ry="5" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="124" cy="74" rx="5" ry="2" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <circle cx="104" cy="2" r="2" fill="#F5A623" />
    </svg>
  );
}

export function BenchIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      <line x1="20" y1="120" x2="180" y2="120" stroke="currentColor" strokeWidth={STROKE} />
      <line x1="14" y1="160" x2="186" y2="160" stroke="currentColor" strokeWidth={STROKE} opacity="0.5" />
      <path d="M32 100 Q30 88 42 86 L60 86 Q66 86 68 92 L72 110 Q72 118 64 118 L36 118 Q30 118 32 100 Z" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <line x1="46" y1="86" x2="46" y2="76" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="54" y1="86" x2="54" y2="74" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="62" y1="86" x2="62" y2="76" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <ellipse cx="105" cy="118" rx="16" ry="5" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="105" cy="118" rx="6" ry="2" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <ellipse cx="135" cy="118" rx="16" ry="5" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="135" cy="118" rx="6" ry="2" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <ellipse cx="165" cy="118" rx="14" ry="4" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="165" cy="118" rx="5" ry="1.6" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} />
      <circle cx="92" cy="138" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="118" cy="142" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="148" cy="144" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="160" cy="138" r="0.8" fill="currentColor" opacity="0.5" />
      <circle cx="100" cy="148" r="0.8" fill="currentColor" opacity="0.4" />
      <circle cx="135" cy="118" r="2" fill="#F5A623" />
    </svg>
  );
}

export function CounterIllustration({ className, title }: Props) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} className={className}>
      <title>{title}</title>
      <ellipse cx="100" cy="120" rx="68" ry="14" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <ellipse cx="100" cy="118" rx="56" ry="10" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.7} opacity="0.5" />
      <path d="M70 116 Q70 102 100 102 Q130 102 130 116" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M76 102 Q76 92 100 92 Q124 92 124 102" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M82 92 Q82 84 100 84 Q118 84 118 92" fill="none" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M88 78 Q86 72 92 70" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} strokeLinecap="round" opacity="0.55" />
      <path d="M100 76 Q98 68 104 64" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} strokeLinecap="round" opacity="0.7" />
      <path d="M112 78 Q110 72 116 70" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.8} strokeLinecap="round" opacity="0.55" />
      <line x1="14" y1="160" x2="186" y2="160" stroke="currentColor" strokeWidth={STROKE} opacity="0.5" />
      <circle cx="104" cy="62" r="2" fill="#F5A623" />
    </svg>
  );
}
