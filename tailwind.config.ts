import type { Config } from "tailwindcss";

/**
 * Polish pass — design tokens aligned to UI/UX Pro Max:
 *  • 3-tier elevation scale (e1 raised / e2 floating / e3 modal)
 *  • Animation timing in the 150–300ms band (skill rule
 *    `duration-timing`); easing closer to Apple HIG fluid curve.
 *  • Display ramp tightened for tighter visual hierarchy.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F0E4D0",
        ivory: "#FBF4E5",
        bone: "#E9DBC1",
        cocoa: "#2A1810",
        coffee: "#4A1F08",
        bark: "#6E3214",
        brick: "#C9483A",
        brickDark: "#A8392E",
        saffron: "#F5A623",
        saffronSoft: "#FFD089",
        // Rose pastel — the new pastel anchor that replaces the heavy
        // dark brown on inverted panels. Light surface that pairs warmly
        // with brick and saffron without competing.
        rose: "#F2D5CC",
        roseDeep: "#C9928A",
        muted: "#7B6855",
        hairline: "rgba(42, 24, 16, 0.14)",
        hairlineStrong: "rgba(42, 24, 16, 0.22)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Recoleta", "DM Serif Display", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.28em",
        wide: "0.14em",
        signage: "0.42em",
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.75rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        pill: "999px",
      },
      fontSize: {
        // Tighter ramp — display-2xl pulled in from 13vw to 11vw on big
        // screens so the hero stops crashing the page; everything else
        // rebalanced one notch tighter for a cleaner hierarchy.
        "display-2xl": ["clamp(3.75rem, 11vw, 9rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-xl": ["clamp(3rem, 8vw, 6.5rem)", { lineHeight: "0.98", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.018em" }],
        "display-md": ["clamp(1.875rem, 4vw, 2.75rem)", { lineHeight: "1.08", letterSpacing: "-0.012em" }],
        "display-sm": ["clamp(1.375rem, 2.5vw, 1.875rem)", { lineHeight: "1.15", letterSpacing: "-0.005em" }],
      },
      spacing: {
        "page-x": "clamp(1.25rem, 4vw, 3rem)",
      },
      maxWidth: {
        editorial: "68rem",
        prose: "38rem",
      },
      // 3-tier elevation. e1 stays on (cards), e2 on hover, e3 for menus
      // and modals. Old `soft`/`pop`/`chip` aliased so existing usages
      // keep working without a churn-y find/replace.
      boxShadow: {
        e1: "0 1px 2px rgba(74, 31, 8, 0.05), 0 2px 8px rgba(74, 31, 8, 0.05)",
        e2: "0 2px 6px rgba(74, 31, 8, 0.08), 0 16px 32px rgba(74, 31, 8, 0.08)",
        e3: "0 4px 12px rgba(74, 31, 8, 0.12), 0 28px 56px rgba(74, 31, 8, 0.10)",
        soft: "0 1px 2px rgba(74, 31, 8, 0.05), 0 2px 8px rgba(74, 31, 8, 0.05)",
        pop:  "0 2px 6px rgba(74, 31, 8, 0.08), 0 16px 32px rgba(74, 31, 8, 0.08)",
        chip: "0 1px 3px rgba(74, 31, 8, 0.10)",
      },
      transitionTimingFunction: {
        // Apple HIG–style fluid out (snappier than the stock cubic-bezier).
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        wordmarkPop: {
          // Tighter, less wobbly entrance — translate distance halved.
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        // 280ms entry, 280ms entry-with-delay variants honour the
        // skill's duration-timing rule (150–300ms micro-interactions).
        rise: "rise 280ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "rise-slow": "rise 360ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "wordmark-pop": "wordmarkPop 320ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both",
        marquee: "marquee 36s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
