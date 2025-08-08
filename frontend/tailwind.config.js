/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // ИСПРАВЛЕНИЕ: Мы говорим ему искать во ВСЕХ подпапках src
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}