export function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-black/5 bg-white p-4 shadow-card dark:border-white/10 dark:bg-ink-900"
          >
            <div className="shimmer h-3 w-20 rounded animate-shimmer" />
            <div className="shimmer mt-3 h-6 w-28 rounded animate-shimmer" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-black/5 bg-white p-4 shadow-card dark:border-white/10 dark:bg-ink-900"
        >
          <div className="shimmer h-4 w-1/3 rounded animate-shimmer" />
          <div className="shimmer mt-3 h-3 w-1/2 rounded animate-shimmer" />
          <div className="shimmer mt-3 h-3 w-2/3 rounded animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
