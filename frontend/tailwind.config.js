import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50: "#f5f7fb",
          100: "#e8eef8",
          200: "#cad8ee",
          300: "#9fb7df",
          400: "#6f91ca",
          500: "#4f72b6",
          600: "#3f5b95",
          700: "#344978",
          800: "#213150",
          900: "#0f172a",
        },
        gold: {
          100: "#fdf6d7",
          200: "#f8e9ab",
          300: "#f2d77a",
          400: "#e6c14d",
          500: "#d4af37",
          600: "#b78f22",
          700: "#936d19",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(212, 175, 55, 0.16), 0 24px 80px rgba(15, 23, 42, 0.24)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(212,175,55,0.25), transparent 35%), radial-gradient(circle at top right, rgba(79,114,182,0.3), transparent 30%), linear-gradient(180deg, rgba(15,23,42,0.96), rgba(12,18,34,0.98))",
      },
    },
  },
  plugins: [animate],
};
