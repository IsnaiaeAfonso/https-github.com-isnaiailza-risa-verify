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
          DEFAULT: "#0E6F63",
          dark: "#0A5148",
          light: "#E4F1EE",
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
          DEFAULT: "#0F2843",
          dark: "#0A1B30",
          mid: "#16324F",
          light: "#1D3E60",
        },
        brand: {
          DEFAULT: "#2F63E5",
          dark: "#234DBD",
          light: "#EAF0FE",
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
