/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        surface: '#121212',
        border: '#262626',
        ink: '#F2EFE9',
        muted: '#A1A1AA',
        terracotta: '#D86B45',
        gold: '#E2C07C',
        sage: '#7A9371',
        rose: '#B96D71',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-terracotta': '0 0 40px -8px rgba(216,107,69,0.45)',
        'glow-soft': '0 0 60px -12px rgba(226,192,124,0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
