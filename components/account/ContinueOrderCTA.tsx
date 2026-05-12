"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "ronis-cart-v1";

interface Props {
  /** Optional destination override (?continue=… from signup). */
  continueHref?: string;
  /** Whether this is a fresh signup (?from=signup) — drives copy. */
  freshSignup?: boolean;
}

/**
 * Read-only cart sniffer. If the customer has items in their cart (set
 * elsewhere — /shop, /menu) we surface a prominent "Continue your order"
 * card on /account so a fresh sign-up doesn't lose their work. Renders
 * nothing when the cart is empty.
 */
export function ContinueOrderCTA({ continueHref, freshSignup }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return setCount(0);
      const arr = JSON.parse(raw) as Array<{ quantity: number }>;
      setCount(arr.reduce((n, l) => n + (l.quantity || 0), 0));
    } catch {
      setCount(0);
    }
  }, []);

  if (count === null || count === 0) return null;

  const href = continueHref ?? "/shop/checkout";

  return (
    <article className="rounded-xl panel-brick p-6 shadow-pop flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="label">{freshSignup ? "Welcome back to your order" : "Unfinished order"}</p>
        <p className="mt-2 font-display font-700 text-cream text-2xl leading-tight">
          You have {count} {count === 1 ? "item" : "items"} in your bag.
        </p>
        <p className="font-sans text-cream/85 text-sm mt-1">
          {freshSignup
            ? "Your account is created — pick up where you left off."
            : "Pick up where you left off and check out."}
        </p>
      </div>
      <Link href={href} className="btn-saffron">
        <span>Go back to your order</span>
      </Link>
    </article>
  );
}
