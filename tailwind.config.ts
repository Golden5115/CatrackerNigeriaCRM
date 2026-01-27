import type { Config } from "tailwindcss";

const config: Config = {
  // ⬇️ THIS IS THE CRITICAL PART FOR YOUR FOLDER STRUCTURE
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",        // Scans your app folder
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Scans your components folder
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50:  "#f2f9f1",
          100: "#e0f2de",
          500: "#84c47c", // Your Green
          600: "#6aa663",
          700: "#52854d",
          900: "#2d4a2a",
        }
      },
    },
  },
  plugins: [],
};
export default config;