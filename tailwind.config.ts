import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10161C",
        paper: "#F6F7F5",
        panel: "#FFFFFF",
        line: "#E1E4E1",
        muted: "#5B6A66",
        teal: {
          DEFAULT: "#18B9CF",
          dark: "#087F9B",
          light: "#E2F8FB",
        },
        amber: {
          DEFAULT: "#B4600A",
          light: "#FBEEDD",
        },
        rust: {
          DEFAULT: "#A23B2E",
          light: "#F8E7E3",
        },
        success: {
          DEFAULT: "#1E9E64",
          dark: "#167A4D",
          light: "#E3F5EC",
        },
        navy: {
          DEFAULT: "#0B1B31",
          dark: "#071321",
          mid: "#10243C",
          light: "#193451",
        },
        brand: {
          DEFAULT: "#1686E8",
          dark: "#0E5DB4",
          light: "#E5F3FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-plex)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,22,28,0.06), 0 1px 1px rgba(16,22,28,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
