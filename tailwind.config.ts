import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        primary: "#4F46E5",
        secondary: "#7C3AED",
        accent: "#06B6D4",
        "dark-bg": "#0B0D1A",
        "card-bg": "#111328",
        surface: "#1A1D35",
      },
    },
  },
  plugins: [],
};
export default config;
