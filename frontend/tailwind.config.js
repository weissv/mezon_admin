/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // ИСПРАВЛЕНИЕ: Мы говорим ему искать во ВСЕХ подпапках src
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        mezon: {
          accent: "#A04A84",
          accentDark: "#8A3A70",
          teal: "#00859E",
          sand: "#FCD5A6",
          violet: "#8F93C0",
          dark: "#222222",
          cream: "#FEF9F4",
        },
      },
      boxShadow: {
        mezon: "0 18px 45px rgba(160, 74, 132, 0.25)",
      },
    },
  },
  plugins: [],
}