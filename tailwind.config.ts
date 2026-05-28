import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── WHO 2021 PM2.5 AQI bands — mirrors Python constants exactly ──
        aqi: {
          good:      "#4CAF50",  // 0–15 µg/m³
          moderate:  "#FFEB3B",  // 15–25
          sensitive: "#FF9800",  // 25–50  (unhealthy for sensitive groups)
          unhealthy: "#F44336",  // 50–100
          hazardous: "#9C27B0",  // 100+
          unknown:   "#9E9E9E",
        },
        // ── Dark theme surfaces (blue-cool tint, matches #080B12 base) ───
        surface: {
          DEFAULT: "#111519",  // barely-blue lift off background
          2:       "#181D26",  // main card surface
          3:       "#222A38",  // inner surface / input backgrounds
        },
        // ── Text hierarchy ────────────────────────────────────────────────
        ink: {
          DEFAULT: "#f5f5f5",
          muted:   "#9AA3B0",
          faint:   "#757575",  // was #5a5a5a (3.8:1) — now 4.6:1 WCAG AA
        },
        // ── Interactive accent (mission-aligned) ────────────────────────────
        accent: {
          clean: "#4ADE80",  // WHO green: signals clear air target
        },
      },
      fontFamily: {
        sans:      ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        editorial: ["var(--font-newsreader)", "Georgia", "serif"],
        mono:      ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
