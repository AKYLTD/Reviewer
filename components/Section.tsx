import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  size?: "default" | "tall" | "slim";
  className?: string;
  /** Render the section as a coloured panel that bleeds full-width.
   *  The inner content stays inside the editorial max-width. */
  panel?: "cream" | "ivory" | "coffee" | "brick" | "saffron";
  id?: string;
}

const PANELS: Record<NonNullable<SectionProps["panel"]>, string> = {
  cream: "bg-cream",
  ivory: "bg-ivory",
  coffee: "panel-coffee",
  brick: "panel-brick",
  saffron: "bg-saffron text-coffee",
};

export function Section({ children, size = "default", className = "", panel, id }: SectionProps) {
  const padding =
    size === "tall" ? "section-tall" : size === "slim" ? "section-slim" : "section";
  return (
    <section id={id} className={`${padding} ${panel ? PANELS[panel] : ""} ${className}`}>
      <div className="mx-auto w-full max-w-[1320px] px-page-x">{children}</div>
    </section>
  );
}
