"use client";

import { useState, useRef, type ReactNode } from "react";
import { CakeSketch } from "./CakeSketch";
import {
  BASE_OPTIONS,
  COVER_OPTIONS,
  DEFAULT_CAKE,
  defaultFields,
  FILLING_OPTIONS,
  SHAPE_OPTIONS,
  SIZE_OPTIONS,
  computeTotal,
  formatGBP,
  type CakeBase,
  type CakeConfig,
  type CakeCover,
  type CakeFilling,
  type CakeShape,
  type OrderFields,
  type PickupLocation,
} from "./types";

type Status = "idle" | "submitting" | "sent" | "error";

interface CakeBuilderProps {
  locations: PickupLocation[];
  defaultLocationId: string;
}

/**
 * Live cake order builder. Sketch on the left, form on the right.
 *
 * Submission path:
 *   1. If an edible-image file is attached, build FormData and POST to
 *      /api/cakes (multipart). Otherwise post as JSON.
 *   2. The endpoint validates, attempts to create a Square Order at the
 *      chosen pickup location (so the till prints it in the kitchen), and
 *      always captures the order server-side as a backstop.
 */
export function CakeBuilder({ locations, defaultLocationId }: CakeBuilderProps) {
  const [config, setConfig] = useState<CakeConfig>(DEFAULT_CAKE);
  const [fields, setFields] = useState<OrderFields>(() => defaultFields(defaultLocationId));
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setC = <K extends keyof CakeConfig>(key: K, value: CakeConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));
  const setF = <K extends keyof OrderFields>(key: K, value: OrderFields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  const total = computeTotal(config);
  const selectedShape = SHAPE_OPTIONS.find((s) => s.id === config.shape);
  const selectedFilling = FILLING_OPTIONS.find((f) => f.id === config.filling);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setF("imageFileName", file?.name ?? "");
  };

  const clearImage = () => {
    setImageFile(null);
    setF("imageFileName", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      let res: Response;
      if (config.shape === "image" && imageFile) {
        const fd = new FormData();
        fd.append("payload", JSON.stringify({ cake: config, order: fields, quotedTotal: total }));
        fd.append("image", imageFile);
        res = await fetch("/api/cakes", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/cakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cake: config, order: fields, quotedTotal: total }),
        });
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Server returned ${res.status}`);
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (status === "sent") return <ThankYou config={config} fields={fields} total={total} />;

  return (
    <div className="grid gap-10 md:grid-cols-12 md:gap-14">
      {/* ----------------------------------------------------- LIVE PREVIEW */}
      <aside className="md:col-span-5 md:sticky md:top-24 self-start">
        <div className="rounded-xl bg-ivory p-6 md:p-8 shadow-soft">
          <CakeSketch config={config} className="mx-auto w-full max-w-[400px]" />

          <div className="mt-6 text-center">
            <p className="font-display font-700 text-2xl text-coffee">
              Your cake
            </p>
            <p className="font-sans text-muted mt-1 text-sm">
              {SIZE_OPTIONS.find((s) => s.id === config.size)?.label} ·{" "}
              {selectedShape?.label.toLowerCase()} ·{" "}
              {COVER_OPTIONS.find((c) => c.id === config.cover)?.label.toLowerCase()}
            </p>
            <p className="font-sans text-muted text-sm">
              {BASE_OPTIONS.find((b) => b.id === config.base)?.label.toLowerCase()} with{" "}
              {selectedFilling?.label.toLowerCase()}
            </p>
            {fields.imageFileName && config.shape === "image" && (
              <p className="font-sans text-coffee text-xs mt-2 truncate">
                Image: {fields.imageFileName}
              </p>
            )}
          </div>

          <div className="mt-6 rounded-md bg-saffron px-5 py-4 text-center shadow-chip">
            <p className="font-sans font-600 text-xs uppercase tracking-wide text-coffee/80">
              Estimated total
            </p>
            <p className="mt-1 font-display font-700 text-3xl text-coffee">
              {total === null ? "P.O.A." : formatGBP(total)}
            </p>
            {total === null && (
              <p className="mt-1 font-sans text-xs text-coffee/80">
                Special 3D shapes are quoted from your design
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* ----------------------------------------------------- FORM */}
      <form onSubmit={submit} className="md:col-span-7 space-y-12" encType="multipart/form-data">
        {/* ALLERGEN NOTICE */}
        <div className="rounded-md border-2 border-brick bg-cream/60 p-5">
          <p className="font-display font-700 text-coffee text-base md:text-lg">
            A note on allergens
          </p>
          <p className="font-sans text-coffee/85 mt-2 text-[0.95rem] leading-relaxed">
            Our kitchen is <strong className="font-700">not a nut-free or
            dairy-free environment</strong>. We&rsquo;ll do our best to meet
            your needs &mdash; please flag any requirements in &ldquo;Special
            requests&rdquo; below.
          </p>
        </div>

        {/* SECTION 01 */}
        <SectionBlock label="01" title="Size &amp; shape">
          <Field label="Size">
            <SizeChips value={config.size} onChange={(v) => setC("size", v)} />
          </Field>

          <Field label="Shape">
            <div className="flex flex-wrap gap-2">
              {SHAPE_OPTIONS.map((s) => (
                <ChipButton
                  key={s.id}
                  active={config.shape === s.id}
                  onClick={() => setC("shape", s.id as CakeShape)}
                >
                  {s.label}
                  {s.surcharge && (
                    <span className="ml-2 font-700 text-saffron">+£{s.surcharge / 100}</span>
                  )}
                  {s.poa && <span className="ml-2 font-700 text-saffron">P.O.A.</span>}
                </ChipButton>
              ))}
            </div>
            {selectedShape?.hint && (
              <p className="mt-2 font-sans text-[0.85rem] text-muted">{selectedShape.hint}</p>
            )}
            {config.shape === "special-3d" && (
              <div className="mt-3">
                <Input
                  value={fields.shapeOther}
                  onChange={(v) => setF("shapeOther", v)}
                  placeholder="Describe the 3D shape you'd like (we'll quote from your design)"
                />
              </div>
            )}

            {/* IMAGE PRINT — file input ----------------------------------- */}
            {config.shape === "image" && (
              <div className="mt-4 rounded-md border-2 border-dashed border-brick/40 bg-cream/50 p-5">
                <p className="font-display font-700 text-coffee">Upload your image</p>
                <p className="font-sans text-sm text-muted mt-1">
                  JPEG or PNG, up to 8&nbsp;MB. We&rsquo;ll print it on edible
                  rice paper. Avoid copyrighted material.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="btn-saffron cursor-pointer">
                    <span>{imageFile ? "Choose another" : "Choose image"}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="image"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={onImageChange}
                    />
                  </label>
                  {imageFile && (
                    <>
                      <span className="font-sans text-sm text-coffee max-w-[18rem] truncate">
                        {imageFile.name}{" "}
                        <span className="text-muted">
                          ({Math.round(imageFile.size / 1024)} KB)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="font-sans text-[0.75rem] font-600 uppercase tracking-widest text-brick hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                {imageFile && (
                  <div className="mt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Your upload preview"
                      className="max-h-48 rounded-md border border-hairline"
                    />
                  </div>
                )}
              </div>
            )}
          </Field>
        </SectionBlock>

        {/* SECTION 02 — what's inside */}
        <SectionBlock label="02" title="Inside the cake">
          <Field label="Cake base">
            <div className="flex flex-wrap gap-2">
              {BASE_OPTIONS.map((b) => (
                <ChipButton
                  key={b.id}
                  active={config.base === b.id}
                  onClick={() => setC("base", b.id as CakeBase)}
                >
                  {b.label}
                </ChipButton>
              ))}
            </div>
            {config.base === "other" && (
              <div className="mt-3">
                <Input
                  value={fields.baseOther}
                  onChange={(v) => setF("baseOther", v)}
                  placeholder="Tell us what base you'd like"
                />
              </div>
            )}
          </Field>

          <Field label="Cake filling">
            <div className="flex flex-wrap gap-2">
              {FILLING_OPTIONS.map((f) => (
                <ChipButton
                  key={f.id}
                  active={config.filling === f.id}
                  onClick={() => setC("filling", f.id as CakeFilling)}
                >
                  {f.label}
                  {f.surcharge && (
                    <span className="ml-2 font-700 text-saffron">+£{f.surcharge / 100}</span>
                  )}
                </ChipButton>
              ))}
            </div>
            {selectedFilling?.hint && (
              <p className="mt-2 font-sans text-[0.85rem] text-muted">{selectedFilling.hint}</p>
            )}
            {config.filling === "other" && (
              <div className="mt-3">
                <Input
                  value={fields.fillingOther}
                  onChange={(v) => setF("fillingOther", v)}
                  placeholder="Tell us what filling you'd like"
                />
              </div>
            )}
          </Field>

          <Field label="Cake cover">
            <div className="flex flex-wrap gap-2">
              {COVER_OPTIONS.map((c) => (
                <ChipButton
                  key={c.id}
                  active={config.cover === c.id}
                  onClick={() => setC("cover", c.id as CakeCover)}
                >
                  {c.label}
                </ChipButton>
              ))}
              <ChipButton
                active={false}
                onClick={() => setF("coverOther", fields.coverOther || "Other")}
              >
                Other
              </ChipButton>
            </div>
            {fields.coverOther && (
              <div className="mt-3">
                <Input
                  value={fields.coverOther}
                  onChange={(v) => setF("coverOther", v)}
                  placeholder="Tell us what cover you'd like"
                />
              </div>
            )}
          </Field>
        </SectionBlock>

        {/* SECTION 03 — message */}
        <SectionBlock label="03" title="Message on the cake">
          <Field
            label="Message"
            hint='e.g. "Happy 5th Birthday Roni". Up to 30 characters; leave blank for none.'
          >
            <Input
              value={config.message}
              onChange={(v) => setC("message", v)}
              placeholder="Happy Birthday …"
              maxLength={30}
            />
          </Field>
        </SectionBlock>

        {/* SECTION 04 — when & where */}
        <SectionBlock label="04" title="When &amp; where">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date" hint="We can arrange delivery for an extra charge — flag in special requests below.">
              <Input
                value={fields.date}
                onChange={(v) => setF("date", v)}
                type="date"
                required
              />
            </Field>
            <Field label="Time">
              <Input
                value={fields.time}
                onChange={(v) => setF("time", v)}
                type="time"
                required
              />
            </Field>
          </div>

          <Field label="Pick up from">
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <ChipButton
                  key={loc.id}
                  active={fields.location === loc.id}
                  onClick={() => setF("location", loc.id)}
                >
                  {loc.label}
                </ChipButton>
              ))}
              <ChipButton
                active={fields.location === "other"}
                onClick={() => setF("location", "other")}
              >
                Other
              </ChipButton>
            </div>
            {fields.location === "other" && (
              <div className="mt-3">
                <Input
                  value={fields.locationOther}
                  onChange={(v) => setF("locationOther", v)}
                  placeholder="Where would you like to pick up?"
                />
              </div>
            )}
          </Field>
        </SectionBlock>

        {/* SECTION 05 — you */}
        <SectionBlock label="05" title="You">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={fields.name} onChange={(v) => setF("name", v)} required />
            </Field>
            <Field label="Phone number">
              <Input value={fields.phone} onChange={(v) => setF("phone", v)} type="tel" required />
            </Field>
          </div>
          <Field label="Email">
            <Input value={fields.email} onChange={(v) => setF("email", v)} type="email" required />
          </Field>
          <Field
            label="Special requests"
            hint="Allergens, delivery, design notes — anything we should know."
          >
            <Textarea
              value={fields.specialRequests}
              onChange={(v) => setF("specialRequests", v)}
              rows={4}
              placeholder="Optional"
            />
          </Field>
        </SectionBlock>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-hairline">
          <p className="font-sans text-sm text-muted max-w-md">
            We&rsquo;ll come back the same morning to confirm the design.
            Payment when you collect.
          </p>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="btn-primary disabled:opacity-50"
          >
            <span>
              {status === "submitting" ? "Sending…" : "Send my cake order"}
            </span>
          </button>
        </div>

        {status === "error" && (
          <p className="font-display text-brick">
            Couldn&rsquo;t send that &mdash; {error}. Please try again or
            email{" "}
            <a className="anchor font-600" href="mailto:info@ronisonline.com">
              info@ronisonline.com
            </a>
            .
          </p>
        )}
      </form>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/*  Form primitives                                                      */
/* --------------------------------------------------------------------- */

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
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 font-sans text-[0.85rem] text-muted">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
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

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-pill px-4 py-2 font-display font-600 text-sm transition ${
        active
          ? "bg-brick text-cream shadow-chip"
          : "bg-ivory text-coffee hover:bg-saffron/40"
      }`}
    >
      {children}
    </button>
  );
}

function SizeChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SIZE_OPTIONS.map((s) => {
        const on = s.id === value;
        return (
          <button
            type="button"
            key={s.id}
            onClick={() => onChange(s.id)}
            aria-pressed={on}
            className={`text-left rounded-md border-2 p-4 transition ${
              on
                ? "border-brick bg-saffron/30"
                : "border-hairline bg-ivory hover:border-saffron"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display font-700 text-coffee text-lg">
                {s.label}
              </span>
              <span className="font-display font-700 text-brick">
                {formatGBP(s.price)}
              </span>
            </div>
            <p className="font-sans text-sm text-muted mt-1">{s.serves}</p>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/*  Thank-you screen                                                     */
/* --------------------------------------------------------------------- */

function ThankYou({
  config,
  fields,
  total,
}: {
  config: CakeConfig;
  fields: OrderFields;
  total: number | null;
}) {
  return (
    <div className="grid gap-10 md:grid-cols-12 items-center">
      <aside className="md:col-span-5">
        <div className="rounded-xl bg-ivory p-8 shadow-soft">
          <CakeSketch config={config} className="mx-auto w-full max-w-[360px]" />
          <div className="mt-6 rounded-md bg-saffron px-5 py-4 text-center shadow-chip">
            <p className="font-sans font-600 text-xs uppercase tracking-wide text-coffee/80">
              Estimated total
            </p>
            <p className="mt-1 font-display font-700 text-3xl text-coffee">
              {total === null ? "P.O.A." : formatGBP(total)}
            </p>
          </div>
        </div>
      </aside>
      <div className="md:col-span-7">
        <span className="label">Order received</span>
        <h2 className="mt-3 font-display font-700 text-display-lg text-coffee leading-[1.0]">
          Thank you, {fields.name || "friend"}.
        </h2>
        <p className="editorial mt-6 max-w-prose">
          Your cake is in our system. The kitchen will come back the same
          morning to confirm the design and the timing for{" "}
          <strong className="font-600">{fields.date || "your chosen date"}</strong>
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
