import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
      // 100vh doesn't account for mobile Safari/Chrome's dynamic address
      // bar, so min-h-screen/h-screen can clip content or leave a gap as
      // the toolbar shows/hides. 100dvh tracks the actual visible viewport.
      minHeight: {
        screen: "100dvh",
      },
      height: {
        screen: "100dvh",
      },
      colors: {
        background: "#16130F",
        surface: "#211C16",
        border: "#3A3128",
        foreground: "#F4EEE3",
        muted: "#A89F92",
        accent: {
          DEFAULT: "#9C2B3C",
          hover: "#7D2130",
          soft: "#F5DCE0",
        },
        highlight: {
          DEFAULT: "#E3B23C",
          hover: "#C99A2E",
          soft: "#F5E4BC",
        },
        success: "#7FB069",
        warning: "#E3B23C",
        danger: "#9C2B3C",
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
  plugins: [
    // Without this, touch devices apply :hover on tap and it sticks until
    // the next tap elsewhere — buttons/links look permanently "hovered"
    // after being pressed. Scopes hover: to devices that actually have one.
    plugin(({ addVariant }) => {
      addVariant("hover", "@media (hover: hover) and (pointer: fine)");
    }),
  ],
};
export default config;
