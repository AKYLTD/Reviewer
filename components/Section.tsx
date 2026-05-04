import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  /** Slim padded section, used in dense pages (Visit, etc). */
  size?: "default" | "tall" | "slim";
  className?: string;
  id?: string;
}

/**
 * Horizontal page rhythm. Width caps to 1280 (editorial 68rem-ish for prose)
 * with generous padding that scales 1.25rem → 3rem. The section spacing here
 * is intentionally large; whitespace is the loudest design choice on this site.
 */
export function Section({ children, size = "default", className = "", id }: SectionProps) {
  const py =
    size === "tall"
      ? "py-24 md:py-36"
      : size === "slim"
        ? "py-12 md:py-16"
        : "py-20 md:py-28";
  return (
    <section id={id} className={`${py} ${className}`}>
      <div className="mx-auto w-full max-w-[1280px] px-page-x">{children}</div>
    </section>
  );
}
