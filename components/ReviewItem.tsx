import type { Review } from "@/lib/types";
import { CHANNEL_META } from "@/lib/types";
import { Stars } from "./Stars";
import { relativeTime } from "@/lib/utils";

export function ReviewItem({ review }: { review: Review }) {
  const meta = CHANNEL_META[review.channel];
  return (
    <li className="py-3 first:pt-0 last:pb-0 animate-rise">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
          <span className="font-medium text-ink-700 dark:text-ink-200">{meta.label}</span>
        </span>
        <span className="text-ink-400">·</span>
        <span className="font-medium text-ink-700 dark:text-ink-200">{review.author}</span>
        <span className="text-ink-400">·</span>
        <span>{relativeTime(review.createdAt)}</span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Stars value={review.rating} size={12} />
          <span className="tabular-nums">{review.rating.toFixed(1)}</span>
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-800 dark:text-ink-100">{review.text}</p>
    </li>
  );
}
