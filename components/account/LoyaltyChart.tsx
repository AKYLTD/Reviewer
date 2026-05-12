import type { LoyaltyEntry } from "@/lib/customers";

interface Props {
  history: LoyaltyEntry[];
  currentBalance: number;
  className?: string;
}

/**
 * Cumulative loyalty-points chart. Plots the running balance from each
 * history entry (oldest → newest) as an SVG area chart with rounded
 * markers at every transaction. Earns are saffron dots, redemptions
 * are brick. The current balance is annotated at the right edge.
 *
 * Renders nothing when there's no history yet.
 */
export function LoyaltyChart({ history, currentBalance, className = "" }: Props) {
  if (!history || history.length === 0) return null;

  // history is stored newest-first; reverse to oldest-first for plotting.
  const ordered = [...history].reverse();

  // Compute cumulative running balance at each entry. We walk forward
  // applying deltas; if the recorded balance drifted (manual edits etc.)
  // the chart still tracks the deltas correctly.
  let running = 0;
  const points: { t: number; balance: number; delta: number; ref: string }[] = ordered.map((e) => {
    running += e.delta;
    return { t: new Date(e.at).getTime(), balance: Math.max(0, running), delta: e.delta, ref: e.ref };
  });

  // The customer might have older redemptions reducing the running
  // total below the actual current balance; normalise to end at the
  // server's current balance so the chart's last point matches the
  // headline number elsewhere on the page.
  const last = points[points.length - 1];
  if (last && last.balance !== currentBalance) {
    const drift = currentBalance - last.balance;
    points.forEach((p) => (p.balance = Math.max(0, p.balance + drift)));
  }

  const W = 600;
  const H = 180;
  const padL = 14;
  const padR = 60;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const minT = points[0].t;
  const maxT = points[points.length - 1].t;
  const tSpan = Math.max(1, maxT - minT);
  const maxY = Math.max(currentBalance, ...points.map((p) => p.balance), 100);
  const niceMax = Math.ceil(maxY / 50) * 50;

  const x = (t: number) => padL + (tSpan === 0 ? innerW : ((t - minT) / tSpan) * innerW);
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;

  // Build the area path: line through points + close back to baseline.
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(1)} ${y(p.balance).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${x(points[points.length - 1].t).toFixed(1)} ${y(0)} L ${x(points[0].t).toFixed(1)} ${y(0)} Z`;

  // Grid lines (every 25% of niceMax).
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Loyalty points history — current balance ${currentBalance} points`}
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="loyalty-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5A623" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridSteps.map((s, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={padT + innerH - s * innerH}
              x2={W - padR}
              y2={padT + innerH - s * innerH}
              stroke="rgba(74,31,8,0.08)"
              strokeWidth={1}
            />
            <text
              x={W - padR + 6}
              y={padT + innerH - s * innerH + 3.5}
              fontFamily="var(--font-sans), system-ui, sans-serif"
              fontWeight={500}
              fontSize={10}
              fill="rgba(74,31,8,0.55)"
            >
              {Math.round(niceMax * s)}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill="url(#loyalty-fill)" />
        <path d={linePath} fill="none" stroke="#A8392E" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Markers */}
        {points.map((p, i) => {
          const earn = p.delta > 0;
          return (
            <g key={i}>
              <circle
                cx={x(p.t)}
                cy={y(p.balance)}
                r={earn ? 4 : 5}
                fill={earn ? "#F5A623" : "#C9483A"}
                stroke="#FBF4E5"
                strokeWidth={1.8}
              >
                <title>{`${new Date(p.t).toLocaleDateString("en-GB")} — ${p.delta > 0 ? "+" : ""}${p.delta} pts (${p.ref})`}</title>
              </circle>
            </g>
          );
        })}

        {/* Today annotation */}
        <text
          x={x(points[points.length - 1].t)}
          y={y(points[points.length - 1].balance) - 12}
          textAnchor="middle"
          fontFamily="var(--font-display), Fredoka, sans-serif"
          fontWeight={700}
          fontSize={14}
          fill="#2A1810"
        >
          {currentBalance}
        </text>

        {/* X-axis dates */}
        <text
          x={padL}
          y={H - 8}
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fontWeight={500}
          fontSize={10}
          fill="rgba(74,31,8,0.6)"
        >
          {new Date(minT).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </text>
        <text
          x={W - padR}
          y={H - 8}
          textAnchor="end"
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fontWeight={500}
          fontSize={10}
          fill="rgba(74,31,8,0.6)"
        >
          Today
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 font-sans text-xs text-coffee/70">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-pill bg-saffron" /> Earned
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-pill bg-brick" /> Redeemed
        </span>
        <span className="ml-auto font-display font-600 text-coffee tabular-nums">
          {history.length} transactions
        </span>
      </div>
    </div>
  );
}
