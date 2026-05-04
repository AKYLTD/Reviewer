import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E0E0C",
        paper: "#FAF7F0",
        // Tonal range derived from the warm-paper / ink pair.
        // Use sparingly — the system is bichromatic on purpose.
        bone: "#F2EDE2",
        smoke: "#26241F",
        muted: "#6B6760",
        hairline: "rgba(14, 14, 12, 0.12)",
      },
      fontFamily: {
        // CSS variables are bound in app/layout.tsx via next/font.
        display: ["var(--font-display)", "Cormorant Garamond", "Didot", "serif"],
        editorial: ["var(--font-editorial)", "EB Garamond", "Garamond", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      letterSpacing: {
        // Wide tracking for the geometric-sans descriptors on the sign.
        signage: "0.42em",
        widest: "0.28em",
        wide: "0.16em",
      },
      fontSize: {
        // Editorial display ramp. Clamp() keeps the homepage masthead
        // proportionate from 320px → 1920px without hand-rolled breakpoints.
        "display-xl": ["clamp(4rem, 14vw, 12rem)", { lineHeight: "0.92", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(3rem, 9vw, 7rem)", { lineHeight: "0.96", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(2.25rem, 5.5vw, 4rem)", { lineHeight: "1.02", letterSpacing: "-0.01em" }],
        "display-sm": ["clamp(1.75rem, 3.5vw, 2.5rem)", { lineHeight: "1.08", letterSpacing: "-0.005em" }],
      },
      spacing: {
        "page-x": "clamp(1.25rem, 4vw, 3rem)",
      },
      maxWidth: {
        editorial: "68rem",
        prose: "38rem",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        settle: {
          "0%": { opacity: "0", letterSpacing: "0.02em" },
          "100%": { opacity: "1", letterSpacing: "0" },
        },
      },
      animation: {
        rise: "rise 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        settle: "settle 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
