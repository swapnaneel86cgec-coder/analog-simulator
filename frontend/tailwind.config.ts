import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        instrument: {
          dark: "#0F172A", // slate-900
          panel: "#1E293B", // slate-800
          screen: "#020617", // slate-950
          border: "#334155", // slate-700
          green: "#22C55E", // neon green
          red: "#EF4444", // red alert
          blue: "#3B82F6", // neon blue
        }
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
