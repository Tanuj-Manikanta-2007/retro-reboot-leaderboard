import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arcade: {
          bg: "rgb(var(--arcade-bg) / <alpha-value>)",
          surface: "rgb(var(--arcade-surface) / <alpha-value>)",
          card: "rgb(var(--arcade-card) / <alpha-value>)",
          border: "rgb(var(--arcade-border) / <alpha-value>)",
          muted: "rgb(var(--arcade-muted) / <alpha-value>)",
        },
        cogaan: {
          gold: "#F5B800",
          yellow: "#FFBE1A",
          dark: "#D99B00",
        },
        neon: {
          cyan: "#06B6D4",
          violet: "#8B5CF6",
          crimson: "#EF4444",
          green: "#10B981",
          amber: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        pixel: ["'Press Start 2P'", "monospace"],
      },
      boxShadow: {
        neon: "0 0 15px -3px rgba(245, 184, 0, 0.3)",
        cyan: "0 0 15px -3px rgba(6, 182, 212, 0.3)",
        violet: "0 0 15px -3px rgba(139, 92, 246, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
