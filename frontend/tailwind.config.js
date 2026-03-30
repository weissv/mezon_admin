/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        mezon:          "var(--shadow-card)",
        glass:          "var(--shadow-subtle)",
        "glass-lg":     "var(--shadow-card)",
        "glass-xl":     "var(--shadow-floating)",
        "macos-btn":    "var(--shadow-subtle)",
        "macos-input":  "var(--shadow-subtle)",
        "macos-card":   "var(--shadow-card)",
        "macos-floating": "var(--shadow-floating)",
        "macos-window": "var(--shadow-floating)",
      },
      borderRadius: {
        macos:      "var(--radius-lg)",
        panel:      "var(--radius-xl)",
        pill:       "var(--radius-pill)",
        "macos-lg": "var(--radius-xl)",
        "macos-xl": "var(--radius-2xl)",
        window:     "var(--radius-3xl)",
      },
    },
  },
  plugins: [],
}
