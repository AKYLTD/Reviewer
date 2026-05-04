import type { ReactNode } from "react";

const INPUT =
  "w-full border-0 border-b border-hairline bg-transparent px-0 py-3 font-editorial text-[1.0625rem] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-0";

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
      <span className="label block">{label}</span>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 font-editorial italic text-[0.85rem] text-muted">{hint}</p>}
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
