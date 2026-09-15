import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        fjalla: ["var(--font-fjalla)", "sans-serif"],
      },
      colors: {
        background: "#fafafa",
        surface: "#ffffff",
        border: "#e5e7eb",
        foreground: "#111827",
        muted: "#6b7280",
        accent: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.5)" },
          "70%": { boxShadow: "0 0 0 20px rgba(239, 68, 68, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" },
        },
        "grow-bar": {
          from: { width: "0%" },
          to: { width: "var(--target-width)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "grow-bar": "grow-bar 1s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
