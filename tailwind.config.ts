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
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        background: "#16130F",
        surface: "#211C16",
        border: "#3A3128",
        foreground: "#F4EEE3",
        muted: "#A89F92",
        accent: {
          DEFAULT: "#E8553A",
          hover: "#CF4830",
          soft: "#F7DED7",
        },
        highlight: {
          DEFAULT: "#E3B23C",
          hover: "#C99A2E",
          soft: "#F5E4BC",
        },
        success: "#7FB069",
        warning: "#E3B23C",
        danger: "#E8553A",
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
