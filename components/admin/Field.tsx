import type { ReactNode } from "react";

const INPUT =
  "w-full rounded-md bg-ivory border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee placeholder:text-muted focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 transition";

export function Field({
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

export function Input({
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  step,
  min,
}: {
  name: string;
  defaultValue?: string | number;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: number | string;
  min?: number;
}) {
  return (
    <input
      name={name}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      step={step}
      min={min}
      className={INPUT}
    />
  );
}

export function Textarea({
  name,
  defaultValue,
  rows = 4,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue}
      rows={rows}
      placeholder={placeholder}
      className={`${INPUT} resize-y`}
    />
  );
}
