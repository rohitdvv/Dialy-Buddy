/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Nordic Clinical palette
        bg: '#F4F2ED',          // warm ivory base
        surface: '#FFFFFF',      // primary card surface
        surface2: '#F9F7F2',     // subtle depth
        border: '#DDD8CF',       // hairline
        'border-strong': '#C8C2B8', // stronger border
        ink: '#161B2E',          // primary text
        ink2: '#3D4556',         // secondary text
        muted: '#8B92A5',        // tertiary text
        teal: '#0B4F5C',         // primary — deep teal
        emerald: '#0F5C4F',      // secondary — deep forest
        moss: '#3D6B5A',         // success sage
        copper: '#B87333',       // warm accent
        amber: '#C8A040',        // gold accent (badges)
        rust: '#8B3D3D',         // soft alert
        sky: '#2D5F8F',          // info accent
      },
      fontFamily: {
        display: ['Playfair Display', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(22,27,46,0.04), 0 8px 32px -12px rgba(22,27,46,0.10)',
        'card': '0 1px 2px rgba(22,27,46,0.05), 0 12px 40px -18px rgba(11,79,92,0.16)',
        'ring-teal': '0 0 0 3px rgba(11,79,92,0.15)',
      },
    },
  },
  plugins: [],
}
