/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "var(--app-bg)",
          surface: "var(--app-surface)",
          border: "var(--app-border)",
          'text-primary': "var(--app-text-primary)",
          'text-secondary': "var(--app-text-secondary)",
          accent: "var(--app-accent)",
          'accent-contrast': "var(--app-accent-contrast)",
        }
      }
    },
  },
  plugins: [],
}
