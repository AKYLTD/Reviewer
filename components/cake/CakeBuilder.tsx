"use client";

import { useState, type ReactNode } from "react";
import { CakeSketch } from "./CakeSketch";
import {
  ALLERGEN_OPTIONS,
  COLOR_PALETTE,
  DEFAULT_CAKE,
  OCCASION_OPTIONS,
  SHAPE_LABELS,
  SPONGE_OPTIONS,
  STYLE_LABELS,
  TOPPER_LABELS,
  type CakeColor,
  type CakeConfig,
  type CakeShape,
  type CakeStyle,
  type CakeTopper,
} from "./types";

type Status = "idle" | "submitting" | "sent" | "error";

interface OrderFields {
  occasion: string;
  guests: string;
  date: string;
  time: string;
  fulfilment: "collect" | "deliver";
  postcode: string;
  allergens: string[];
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const DEFAULT_FIELDS: OrderFields = {
  occasion: OCCASION_OPTIONS[0],
  guests: "8",
  date: "",
  time: "12:00",
  fulfilment: "collect",
  postcode: "",
  allergens: [],
  name: "",
  phone: "",
  email: "",
  notes: "",
};

/**
 * The /cakes/order experience: live SVG cake on the left, sectioned form
 * on the right. Every option in the form is reflected in the sketch in
 * real time so the customer literally watches their cake being built.
 *
 * Submits to POST /api/cakes — currently a capture stub that logs the
 * order. Production should forward to the kitchen email and/or write the
 * order to Square's Customer Directory + an internal note.
 */
export function CakeBuilder() {
  const [config, setConfig] = useState<CakeConfig>(DEFAULT_CAKE);
  const [fields, setFields] = useState<OrderFields>(DEFAULT_FIELDS);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const setC = <K extends keyof CakeConfig>(key: K, value: CakeConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const setF = <K extends keyof OrderFields>(key: K, value: OrderFields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  const toggleAllergen = (a: string) =>
    setFields((f) => ({
      ...f,
      allergens: f.allergens.includes(a)
        ? f.allergens.filter((x) => x !== a)
        : [...f.allergens, a],
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/cakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cake: config, order: fields }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (status === "sent") return <ThankYou config={config} fields={fields} />;

  return (
    <div className="grid gap-10 md:grid-cols-12 md:gap-14">
      {/* PREVIEW — sticky on desktop, top of stack on mobile ----------- */}
      <aside className="md:col-span-5 md:sticky md:top-24 self-start">
        <div className="rounded-xl bg-ivory p-6 md:p-8 shadow-soft">
          <CakeSketch config={config} className="mx-auto w-full max-w-[400px]" />
          <div className="mt-6 text-center">
            <p className="font-display font-700 text-2xl text-coffee">
              Your cake
            </p>
            <p className="font-sans text-muted mt-1 text-sm">
              {config.tiers === 1 ? "Single tier" : `${config.tiers} tiers`} ·{" "}
              {SHAPE_LABELS[config.shape].toLowerCase()} ·{" "}
              {COLOR_PALETTE[config.color].label.toLowerCase()}
            </p>
            <p className="font-sans text-muted text-sm">
              {STYLE_LABELS[config.style].toLowerCase()} ·{" "}
              {TOPPER_LABELS[config.topper].toLowerCase()}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {fields.allergens.map((a) => (
              <span key={a} className="inline-flex items-center rounded-pill bg-saffron px-3 py-1 font-display font-600 text-xs text-coffee">
                {a}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* FORM ---------------------------------------------------------- */}
      <form onSubmit={submit} className="md:col-span-7 space-y-12">
        {/* SECTION 1 — the cake itself */}
        <SectionBlock label="01" title="Build your cake">
          <Field label="Occasion">
            <Select value={fields.occasion} onChange={(v) => setF("occasion", v)} options={OCCASION_OPTIONS} />
          </Field>

          <Field label="Tiers">
            <ChipGroup
              options={[
                { value: "1", label: "1 tier" },
                { value: "2", label: "2 tiers" },
                { value: "3", label: "3 tiers" },
              ]}
              value={String(config.tiers)}
              onChange={(v) => setC("tiers", Number(v) as 1 | 2 | 3)}
            />
          </Field>

          <Field label="Shape">
            <ChipGroup
              options={[
                { value: "round", label: "Round" },
                { value: "square", label: "Square" },
              ]}
              value={config.shape}
              onChange={(v) => setC("shape", v as CakeShape)}
            />
          </Field>

          <Field label="Style">
            <ChipGroup
              options={[
                { value: "smooth", label: "Smooth iced" },
                { value: "naked", label: "Semi-naked" },
                { value: "swirl", label: "Swirled" },
              ]}
              value={config.style}
              onChange={(v) => setC("style", v as CakeStyle)}
            />
          </Field>

          <Field label="Frosting colour">
            <ColorSwatches value={config.color} onChange={(v) => setC("color", v)} />
          </Field>
        </SectionBlock>

        {/* SECTION 2 — topper + inscription */}
        <SectionBlock label="02" title="Top it off">
          <Field label="Topper">
            <ChipGroup
              options={Object.entries(TOPPER_LABELS).map(([value, label]) => ({ value, label }))}
              value={config.topper}
              onChange={(v) => setC("topper", v as CakeTopper)}
            />
          </Field>

          {config.topper === "candles" && (
            <Field label={`Candles · ${config.candles}`}>
              <input
                type="range"
                min={1}
                max={12}
                value={config.candles}
                onChange={(e) => setC("candles", Number(e.target.value))}
                className="w-full accent-brick"
              />
            </Field>
          )}

          <Field label="Inscription" hint="Up to 30 characters. Leave blank for none.">
            <Input
              value={config.inscription}
              maxLength={30}
              onChange={(v) => setC("inscription", v)}
              placeholder="Happy Birthday Sara"
            />
          </Field>
        </SectionBlock>

        {/* SECTION 3 — taste */}
        <SectionBlock label="03" title="Inside the cake">
          <Field label="Sponge">
            <Select value={config.sponge} onChange={(v) => setC("sponge", v)} options={SPONGE_OPTIONS} />
          </Field>

          <Field label="Allergens & dietary">
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map((a) => {
                const on = fields.allergens.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAllergen(a)}
                    className={`rounded-pill px-4 py-2 font-display font-600 text-sm transition ${
                      on
                        ? "bg-coffee text-saffron shadow-chip"
                        : "bg-ivory text-coffee hover:bg-saffron/40"
                    }`}
                    aria-pressed={on}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </Field>
        </SectionBlock>

        {/* SECTION 4 — when */}
        <SectionBlock label="04" title="When &amp; where">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Guests">
              <Input value={fields.guests} onChange={(v) => setF("guests", v)} type="number" min="2" />
            </Field>
            <Field label="Date">
              <Input value={fields.date} onChange={(v) => setF("date", v)} type="date" required />
            </Field>
            <Field label="Time">
              <Input value={fields.time} onChange={(v) => setF("time", v)} type="time" />
            </Field>
          </div>

          <Field label="Collect or deliver?">
            <ChipGroup
              options={[
                { value: "collect", label: "Collect from shop" },
                { value: "deliver", label: "Deliver to me" },
              ]}
              value={fields.fulfilment}
              onChange={(v) => setF("fulfilment", v as "collect" | "deliver")}
            />
          </Field>

          {fields.fulfilment === "deliver" && (
            <Field label="Delivery postcode">
              <Input value={fields.postcode} onChange={(v) => setF("postcode", v)} placeholder="NW3 …" />
            </Field>
          )}
        </SectionBlock>

        {/* SECTION 5 — you */}
        <SectionBlock label="05" title="And you">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <Input value={fields.name} onChange={(v) => setF("name", v)} required />
            </Field>
            <Field label="Phone">
              <Input value={fields.phone} onChange={(v) => setF("phone", v)} type="tel" />
            </Field>
          </div>
          <Field label="Email">
            <Input value={fields.email} onChange={(v) => setF("email", v)} type="email" required />
          </Field>
          <Field label="Anything else we should know?">
            <Textarea value={fields.notes} onChange={(v) => setF("notes", v)} rows={3} placeholder="Optional" />
          </Field>
        </SectionBlock>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <p className="font-sans text-sm text-muted max-w-md">
            We&rsquo;ll come back the same morning with a quote and confirm
            the design. No payment until you approve.
          </p>
          <button type="submit" disabled={status === "submitting"} className="btn-primary disabled:opacity-50">
            <span>{status === "submitting" ? "Sending…" : "Send my cake order"}</span>
          </button>
        </div>

        {status === "error" && (
          <p className="font-display text-brick">
            Couldn&rsquo;t send that — {error}. Please try again or email{" "}
            <a className="anchor font-600" href="mailto:cakes@ronisbelsize.com">cakes@ronisbelsize.com</a>.
          </p>
        )}
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Form primitives (kept local — they're tightly coupled to the      */
/*  builder's visual language)                                        */
/* ------------------------------------------------------------------ */

function SectionBlock({
  label,
  title,
  children,
}: {
  label: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <header className="mb-6 flex items-baseline gap-3">
        <span className="font-display font-700 text-brick text-lg">{label}</span>
        <h2 className="font-display font-700 text-coffee text-2xl md:text-3xl">{title}</h2>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1 font-sans text-[0.85rem] text-muted">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  min,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string | number;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      maxLength={maxLength}
      className="w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee placeholder:text-muted focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 transition"
    />
  );
}

function Textarea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee placeholder:text-muted focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 transition resize-y"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 transition"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={on}
            className={`rounded-pill px-4 py-2 font-display font-600 text-sm transition ${
              on
                ? "bg-brick text-cream shadow-chip"
                : "bg-ivory text-coffee hover:bg-saffron/40"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ColorSwatches({
  value,
  onChange,
}: {
  value: CakeColor;
  onChange: (v: CakeColor) => void;
}) {
  const entries = Object.entries(COLOR_PALETTE) as [CakeColor, (typeof COLOR_PALETTE)[CakeColor]][];
  return (
    <div className="flex flex-wrap gap-3">
      {entries.map(([k, p]) => {
        const on = k === value;
        return (
          <button
            type="button"
            key={k}
            onClick={() => onChange(k)}
            aria-pressed={on}
            aria-label={p.label}
            title={p.label}
            className={`group relative h-12 w-12 rounded-pill border-2 transition ${
              on ? "border-coffee shadow-pop scale-110" : "border-transparent hover:scale-105"
            }`}
            style={{ background: p.body }}
          >
            <span className="sr-only">{p.label}</span>
            <span
              aria-hidden
              className="absolute inset-1.5 rounded-pill"
              style={{ background: p.light, opacity: 0.45 }}
            />
          </button>
        );
      })}
    </div>
  );
}

function ThankYou({ config, fields }: { config: CakeConfig; fields: OrderFields }) {
  return (
    <div className="grid gap-10 md:grid-cols-12 items-center">
      <aside className="md:col-span-5">
        <div className="rounded-xl bg-ivory p-8 shadow-soft">
          <CakeSketch config={config} className="mx-auto w-full max-w-[360px]" />
        </div>
      </aside>
      <div className="md:col-span-7">
        <span className="label">Order received</span>
        <h2 className="mt-3 font-display font-700 text-display-lg text-coffee leading-[1.0]">
          Thank you, {fields.name || "friend"}.
        </h2>
        <p className="editorial mt-6 max-w-prose">
          Your cake is with the kitchen. We&rsquo;ll come back the same
          morning with a quote and confirm timing for{" "}
          <strong className="font-600">
            {fields.date || "your chosen date"}
          </strong>
          .
        </p>
        <p className="editorial mt-3 text-muted">
          A copy of your order is on its way to{" "}
          <strong className="font-600">{fields.email}</strong>.
        </p>
      </div>
    </div>
  );
}
