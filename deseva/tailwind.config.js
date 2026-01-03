/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'academic-blue': '#3b82f6',
        'academic-green': '#10b981',
        'light-bg': '#f8fafc',
        'card-bg': '#ffffff',
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        'border-light': '#e2e8f0',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
