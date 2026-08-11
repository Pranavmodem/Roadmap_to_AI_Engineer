/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090f",
          900: "#0b0e17",
          800: "#121627",
          700: "#1a2036",
          600: "#242c4a",
        },
        neon: {
          DEFAULT: "#22d3ee",
          purple: "#a78bfa",
          green: "#34d399",
          amber: "#fbbf24",
          rose: "#fb7185",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(34, 211, 238, 0.25)",
        "glow-purple": "0 0 24px rgba(167, 139, 250, 0.25)",
      },
    },
  },
  plugins: [],
};
