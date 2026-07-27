/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        neon: "#ff0033",
        metal: "#b8b8b8",
        metalDark: "#1d1d1d",
      },
      boxShadow: {
        glow: "0 0 60px rgba(255, 0, 51, 0.25)", // Sombra de resplandor en rojo neón
      },
    },
  },
  plugins: [],
};