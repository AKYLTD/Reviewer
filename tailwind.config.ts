import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef1",
          200: "#d9d9e0",
          300: "#b6b6c2",
          400: "#8a8a99",
          500: "#646474",
          600: "#4a4a58",
          700: "#363643",
          800: "#23232d",
          900: "#13131a",
          950: "#08080d",
        },
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bcd1ff",
          300: "#90b3ff",
          400: "#618bff",
          500: "#3d68ff",
          600: "#2747f5",
          700: "#1f37d8",
          800: "#1f30af",
          900: "#1f2e89",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(8, 8, 13, 0.04), 0 4px 16px rgba(8, 8, 13, 0.04)",
        pop: "0 8px 32px rgba(8, 8, 13, 0.10)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        rise: "rise 220ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
