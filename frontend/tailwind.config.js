/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563eb",
          light: "#3b82f6",
          dark: "#1d4ed8",
        },
        ink: "#111827",
        muted: "#6b7280",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 10px 40px -12px rgba(37, 99, 235, 0.12)",
        "card-sm": "0 1px 2px rgba(0,0,0,0.05), 0 8px 24px -8px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
