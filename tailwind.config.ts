import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0a0a0b",
        surface: "#141416",
        edge: "#26262b",
        muted: "#8a8a93",
        accent: "#7c9cff",
        positive: "#5ad19a",
        negative: "#ff7a85",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
