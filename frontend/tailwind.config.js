/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      colors: {
        mezon: {
          accent: "#007AFF",
          accentDark: "#0056CC",
          teal: "#30B0C7",
          sand: "#FFD60A",
          violet: "#BF5AF2",
          dark: "#1D1D1F",
          cream: "#F5F5F7",
        },
        glass: {
          bg: "rgba(255, 255, 255, 0.72)",
          border: "rgba(0, 0, 0, 0.06)",
          hover: "rgba(0, 0, 0, 0.04)",
          active: "rgba(0, 0, 0, 0.08)",
        },
        macos: {
          blue: "#007AFF",
          green: "#34C759",
          red: "#FF3B30",
          orange: "#FF9500",
          yellow: "#FFD60A",
          purple: "#BF5AF2",
          pink: "#FF2D55",
          gray: "#8E8E93",
          "gray-2": "#636366",
          "gray-3": "#48484A",
          "gray-4": "#3A3A3C",
          "gray-5": "#2C2C2E",
          "gray-6": "#1C1C1E",
          "fill-primary": "rgba(120, 120, 128, 0.2)",
          "fill-secondary": "rgba(120, 120, 128, 0.16)",
          "fill-tertiary": "rgba(120, 120, 128, 0.12)",
          separator: "rgba(60, 60, 67, 0.12)",
          background: "#F5F5F7",
          "grouped-bg": "#F2F2F7",
          "elevated-bg": "#FFFFFF",
        },
      },
      boxShadow: {
        mezon: "0 4px 24px rgba(0, 0, 0, 0.08)",
        glass: "0 2px 12px rgba(0, 0, 0, 0.04), 0 0.5px 0 rgba(0, 0, 0, 0.04)",
        "glass-lg": "0 8px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)",
        "glass-xl": "0 16px 64px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
        "macos-btn": "0 0.5px 1px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(0, 0, 0, 0.04)",
        "macos-input": "0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)",
        "macos-window": "0 24px 80px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        macos: "10px",
        "macos-lg": "14px",
        "macos-xl": "18px",
      },
      backdropBlur: {
        glass: "40px",
        "glass-lg": "60px",
      },
    },
  },
  plugins: [],
}