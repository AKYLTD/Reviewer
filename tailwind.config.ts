import type { Config } from "tailwindcss";

/**
 * v3 — Warm food-magazine system, in the lineage of the Fresh Catering
 * brand board the user shared. Brick / saffron / brown / cream. Rounded
 * friendly typography. Larger radii. Approachable, not minimal-cold.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        cream: "#F0E4D0", // primary background, the warmest paper
        ivory: "#FBF4E5", // soft elevated surface
        bone: "#E9DBC1", // section divider tint
        // Inks
        cocoa: "#2A1810", // body text
        coffee: "#4A1F08", // dark sections / footer
        bark: "#6E3214", // hover / pressed
        // Brand
        brick: "#C9483A", // primary action
        brickDark: "#A8392E", // pressed / active
        saffron: "#F5A623", // highlight / price chip
        saffronSoft: "#FFD089", // soft highlight surface
        // Quiet utility
        muted: "#7B6855",
        hairline: "rgba(42, 24, 16, 0.14)",
      },
      fontFamily: {
        // Rounded friendly display sans — closest free analogue to the
        // "Fresh" logo's wordmark. Bound via next/font in app/layout.tsx.
        display: ["var(--font-display)", "Recoleta", "DM Serif Display", "sans-serif"],
        // Clean modern body sans, warmer than Inter.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.28em",
        wide: "0.14em",
        signage: "0.42em",
      },
      borderRadius: {
        // Rounded everywhere — buttons, cards, image frames, chips.
        sm: "0.5rem",
        DEFAULT: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        pill: "999px",
      },
      fontSize: {
        "display-2xl": ["clamp(4.5rem, 13vw, 11rem)", { lineHeight: "0.92", letterSpacing: "-0.025em" }],
        "display-xl": ["clamp(3.5rem, 9vw, 8rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.75rem, 7vw, 5.5rem)", { lineHeight: "1.0", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(2rem, 5vw, 3.5rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        "display-sm": ["clamp(1.5rem, 3vw, 2.25rem)", { lineHeight: "1.1" }],
      },
      spacing: {
        "page-x": "clamp(1.25rem, 4vw, 3rem)",
      },
      maxWidth: {
        editorial: "68rem",
        prose: "38rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(74, 31, 8, 0.06), 0 8px 32px rgba(74, 31, 8, 0.06)",
        pop: "0 4px 12px rgba(74, 31, 8, 0.10), 0 24px 48px rgba(74, 31, 8, 0.10)",
        chip: "0 2px 4px rgba(74, 31, 8, 0.10)",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bagelSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        wordmarkPop: {
          "0%": { opacity: "0", transform: "translateY(28px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        markBounce: {
          "0%": { opacity: "0", transform: "scale(0.4) rotate(-12deg)" },
          "60%": { transform: "scale(1.08) rotate(2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        rise: "rise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "bagel-spin": "bagelSpin 14s linear infinite",
        "wordmark-pop": "wordmarkPop 900ms cubic-bezier(0.2, 0.8, 0.2, 1) 200ms both",
        "mark-bounce": "markBounce 900ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        marquee: "marquee 36s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
