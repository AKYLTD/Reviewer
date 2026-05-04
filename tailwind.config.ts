import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E0E0C",
        paper: "#FAF7F0",
        bone: "#F2EDE2",
        smoke: "#26241F",
        muted: "#6B6760",
        hairline: "rgba(14, 14, 12, 0.12)",
        // Single warm accent. Used at most three times per page (price tags,
        // active menu state, one signature underline). Named "ember" to keep
        // it from being mistaken for a primary brand colour.
        ember: "#A4422A",
        emberSoft: "rgba(164, 66, 42, 0.12)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "Didot", "serif"],
        editorial: ["var(--font-editorial)", "EB Garamond", "Garamond", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      letterSpacing: {
        signage: "0.42em",
        widest: "0.28em",
        wide: "0.16em",
      },
      fontSize: {
        "display-2xl": ["clamp(5rem, 18vw, 16rem)", { lineHeight: "0.88", letterSpacing: "-0.025em" }],
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
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        anticipate: "cubic-bezier(0.5, -0.3, 0.2, 1.4)",
      },
      keyframes: {
        // Sign choreography on first paint. Each register settles in a
        // distinct rhythm — the descriptors part outward, then RONI'S drops
        // and tightens, then "Belsize Village" trails into italic.
        "descriptor-part": {
          "0%": { opacity: "0", transform: "translateX(0) scaleX(0.7)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateX(0) scaleX(1)" },
        },
        "wordmark-settle": {
          "0%": { opacity: "0", transform: "translateY(-1.2em) scaleY(1.18)", letterSpacing: "0.06em" },
          "55%": { opacity: "1" },
          "100%": { opacity: "1", transform: "translateY(0) scaleY(1)", letterSpacing: "0" },
        },
        "italic-trail": {
          "0%": { opacity: "0", transform: "translateX(-0.4em) skewX(-12deg)", filter: "blur(2px)" },
          "100%": { opacity: "1", transform: "translateX(0) skewX(0deg)", filter: "blur(0)" },
        },
        // Used by Reveal component on scroll-into-view.
        rise: {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "photo-reveal": {
          "0%": { opacity: "0", transform: "scale(1.06)", clipPath: "inset(8% 8% 8% 8%)" },
          "100%": { opacity: "1", transform: "scale(1)", clipPath: "inset(0 0 0 0)" },
        },
        "ticker-rise": {
          "0%, 60%": { opacity: "0", transform: "translateY(8px)" },
          "70%, 100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Subtle film grain over photographs.
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-1%, -1%)" },
          "30%": { transform: "translate(1%, -2%)" },
          "50%": { transform: "translate(-2%, 1%)" },
          "70%": { transform: "translate(2%, 0%)" },
          "90%": { transform: "translate(-1%, 2%)" },
        },
      },
      animation: {
        "descriptor-part": "descriptor-part 1100ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "wordmark-settle": "wordmark-settle 1400ms cubic-bezier(0.2, 0.8, 0.2, 1) 200ms both",
        "italic-trail": "italic-trail 1100ms cubic-bezier(0.2, 0.8, 0.2, 1) 900ms both",
        rise: "rise 800ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "photo-reveal": "photo-reveal 1200ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "ticker-rise": "ticker-rise 1800ms ease-out both",
        grain: "grain 8s steps(8) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
