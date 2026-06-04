import type { Config } from "tailwindcss";

// Calm Web, product register: Restrained palette, OKLCH, cool-tinted neutrals,
// one accent (indigo) for selection/state only. Light theme — physical scene:
// an agency walking a client through profitability on a laptop or projector in
// a daytime meeting room; light + high-contrast reads clearer than dark SaaS.
// Text colors are contrast-checked against `canvas`: ink/muted clear ≥4.5:1.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "oklch(0.985 0.004 250)",  // page bg, faint cool tint
        surface: "oklch(1 0 0)",            // panels
        sunken: "oklch(0.965 0.005 250)",   // insets / secondary fills
        edge: "oklch(0.915 0.006 255)",     // hairline borders
        ink: "oklch(0.24 0.02 260)",        // primary text  (~12:1 on canvas)
        muted: "oklch(0.46 0.02 260)",      // labels/captions (~5:1, passes)
        faint: "oklch(0.58 0.02 260)",      // de-emphasis, ≥18px only
        accent: "oklch(0.55 0.17 265)",     // indigo: selection/primary/state
        positive: "oklch(0.55 0.13 155)",
        warn: "oklch(0.62 0.13 75)",
        negative: "oklch(0.56 0.20 25)",
        // platform identity (spend allocation)
        meta: "oklch(0.58 0.16 265)",
        google: "oklch(0.62 0.13 150)",
        tiktok: "oklch(0.62 0.17 12)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif", "system-ui", "-apple-system",
          "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
