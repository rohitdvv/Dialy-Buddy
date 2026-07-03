/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Nordic Clinical + Deep Forest palette
        bg: '#F5F1EA',          // warm ivory base
        surface: '#FFFFFF',      // primary card surface
        surface2: '#EFEAE0',     // subtle depth
        border: '#E4DED4',       // hairline
        ink: '#1B2321',          // primary text (deep slate-green)
        ink2: '#3B4A48',         // secondary text
        muted: '#7A8583',        // tertiary text
        teal: '#0E5F5C',         // primary — deep teal
        emerald: '#146356',      // secondary — deep forest
        moss: '#4A7A5F',         // success sage
        copper: '#B96A3A',       // warm accent
        amber: '#C69749',        // gold accent (badges)
        rust: '#A94A3A',         // soft alert
        sky: '#3A6E8F',          // info accent
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(27,35,33,0.04), 0 8px 32px -12px rgba(27,35,33,0.10)',
        'card': '0 1px 2px rgba(27,35,33,0.05), 0 12px 40px -18px rgba(14,95,92,0.18)',
        'ring-teal': '0 0 0 3px rgba(14,95,92,0.15)',
      },
    },
  },
  plugins: [],
}
