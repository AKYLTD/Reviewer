import { CHANNEL_META, type Channel } from "@/lib/types";

export function ChannelBadge({
  channel,
  count,
  active,
  onClick,
}: {
  channel: Channel;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const meta = CHANNEL_META[channel];
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-transparent text-white"
          : "border-black/10 bg-white text-ink-700 hover:border-black/20 dark:border-white/10 dark:bg-ink-900 dark:text-ink-100"
      }`}
      style={active ? { background: meta.color } : undefined}
      type={onClick ? "button" : undefined}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: active ? "rgba(255,255,255,0.85)" : meta.color }}
      />
      {meta.label}
      {typeof count === "number" && (
        <span className={`ml-0.5 tabular-nums ${active ? "opacity-90" : "opacity-60"}`}>{count}</span>
      )}
    </Tag>
  );
}
