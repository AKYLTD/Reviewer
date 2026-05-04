"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "sent" | "error";

const FIELD =
  "w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee placeholder:text-muted focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 transition";
const LABEL =
  "block font-sans font-600 text-sm uppercase tracking-wide text-coffee mb-2";

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
      <div className="rounded-xl bg-saffron/30 p-8 text-center">
        <p className="font-display font-700 text-3xl text-coffee">Thank you.</p>
        <p className="editorial mt-3">
          Your enquiry is with the kitchen. We&rsquo;ll come back to you with a
          quote and timing the same morning.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="name">Your name</label>
          <input id="name" name="name" type="text" required className={FIELD} placeholder="Full name" />
        </div>
        <div>
          <label className={LABEL} htmlFor="company">Company / occasion</label>
          <input id="company" name="company" type="text" className={FIELD} placeholder="Optional" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className={FIELD} placeholder="you@company.com" />
        </div>
        <div>
          <label className={LABEL} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" className={FIELD} placeholder="07…" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="date">Date needed</label>
          <input id="date" name="date" type="date" required className={FIELD} />
        </div>
        <div>
          <label className={LABEL} htmlFor="time">Service time</label>
          <input id="time" name="time" type="time" className={FIELD} />
        </div>
        <div>
          <label className={LABEL} htmlFor="guests">Guest count</label>
          <input id="guests" name="guests" type="number" min={1} required className={FIELD} placeholder="e.g. 24" />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="postcode">Delivery postcode</label>
        <input id="postcode" name="postcode" type="text" className={FIELD} placeholder="NW3 …" />
      </div>

      <div>
        <label className={LABEL} htmlFor="notes">What are you planning?</label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          className={`${FIELD} resize-none`}
          placeholder="Allergens, format, anything we should know"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="font-sans text-sm text-muted">
          We&rsquo;ll reply by email. No marketing list.
        </p>
        <button type="submit" disabled={status === "submitting"} className="btn-primary disabled:opacity-50">
          <span>{status === "submitting" ? "Sending…" : "Send enquiry"}</span>
        </button>
      </div>

      {status === "error" && (
        <p className="font-display text-brick">
          Couldn&rsquo;t send that — {error}. Please try again or email{" "}
          <a className="anchor font-600" href="mailto:hello@ronisbelsize.com">
            hello@ronisbelsize.com
          </a>
          .
        </p>
      )}
    </form>
  );
}
