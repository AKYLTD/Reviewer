"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "sent" | "error";

const FIELD =
  "w-full border-0 border-b border-hairline bg-transparent px-0 py-3 font-editorial text-[1.0625rem] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-0";
const LABEL = "label block";

/**
 * Catering enquiry form. Submits to /api/catering, which is currently a stub
 * that captures the lead — production should forward to the shop's email or
 * a Square Customer Directory entry per square-setup-plan.md.
 */
export function CateringForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (status === "sent") {
    return (
      <div className="border border-hairline p-page-x py-12">
        <p className="font-display text-display-sm text-ink">Thank you.</p>
        <p className="editorial mt-4">
          Your enquiry is with the kitchen. We&rsquo;ll come back to you with a
          quote and timing the same morning.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div className="grid gap-7 md:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" type="text" required className={FIELD} placeholder="Full name" />
        </div>
        <div>
          <label className={LABEL} htmlFor="company">
            Company / occasion
          </label>
          <input id="company" name="company" type="text" className={FIELD} placeholder="Optional" />
        </div>
      </div>

      <div className="grid gap-7 md:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className={FIELD} placeholder="you@company.com" />
        </div>
        <div>
          <label className={LABEL} htmlFor="phone">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" className={FIELD} placeholder="07…" />
        </div>
      </div>

      <div className="grid gap-7 md:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="date">
            Date needed
          </label>
          <input id="date" name="date" type="date" required className={FIELD} />
        </div>
        <div>
          <label className={LABEL} htmlFor="time">
            Service time
          </label>
          <input id="time" name="time" type="time" className={FIELD} />
        </div>
        <div>
          <label className={LABEL} htmlFor="guests">
            Guest count
          </label>
          <input id="guests" name="guests" type="number" min={1} required className={FIELD} placeholder="e.g. 24" />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="postcode">
          Delivery postcode
        </label>
        <input id="postcode" name="postcode" type="text" className={FIELD} placeholder="NW3 …" />
      </div>

      <div>
        <label className={LABEL} htmlFor="notes">
          What are you planning?
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          className={`${FIELD} resize-none`}
          placeholder="Allergens, format, anything we should know"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <p className="label text-muted">
          We&rsquo;ll reply by email. No marketing list, no chasing.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center border border-ink bg-ink px-7 py-3 font-sans text-[0.78rem] font-light uppercase tracking-widest text-paper transition-colors hover:bg-paper hover:text-ink disabled:opacity-50"
        >
          {status === "submitting" ? "Sending…" : "Send enquiry"}
        </button>
      </div>

      {status === "error" && (
        <p className="font-editorial italic text-[0.95rem] text-ink">
          We couldn&rsquo;t send that &mdash; {error}. Please try again or email{" "}
          <a className="anchor" href="mailto:hello@ronisbelsize.com">
            hello@ronisbelsize.com
          </a>
          .
        </p>
      )}
    </form>
  );
}
