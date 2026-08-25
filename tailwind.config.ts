import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // B.A.N. primary palette
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        // Dark backgrounds
        navy: {
          950: "#0a0f1e",
          900: "#0d1526",
          800: "#111827",
          700: "#1a2035",
        },
        // Glass surfaces
        glass: {
          50: "rgba(255,255,255,0.05)",
          100: "rgba(255,255,255,0.08)",
          200: "rgba(255,255,255,0.12)",
          border: "rgba(255,255,255,0.08)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.08)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(37,99,235,0.3)" },
          "50%": { boxShadow: "0 0 60px rgba(37,99,235,0.6), 0 0 100px rgba(6,182,212,0.3)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      backgroundImage: {
        "ban-gradient": "linear-gradient(135deg, #0a0f1e 0%, #0d1a3a 50%, #0a1a2e 100%)",
        "glow-gradient": "radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.15) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
