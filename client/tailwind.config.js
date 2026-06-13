/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        bg: { DEFAULT: '#0B0E11', 1: '#1E2026', 2: '#2B2F36', 3: '#363C45' },
        accent: { DEFAULT: '#F0B90B', hover: '#D4A408', dim: 'rgba(240,185,11,0.12)' },
        buy:  { DEFAULT: '#0ECB81', dim: 'rgba(14,203,129,0.12)' },
        sell: { DEFAULT: '#F6465D', dim: 'rgba(246,70,93,0.12)' },
        text: { primary: '#EAECEF', secondary: '#848E9C', muted: '#5E6673' },
        border: { DEFAULT: '#2B2F36', subtle: '#1E2026' },
      },
      fontFamily: { mono: ['JetBrains Mono', 'Fira Code', 'monospace'] },
      borderRadius: { DEFAULT: '4px', sm: '2px', md: '6px', lg: '8px' },
      animation: {
        'price-up': 'flashGreen 0.4s ease-out',
        'price-down': 'flashRed 0.4s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'ticker-scroll': 'tickerScroll 40s linear infinite',
      },
      keyframes: {
        flashGreen: { '0%': { background: 'rgba(14,203,129,0.3)' }, '100%': { background: 'transparent' } },
        flashRed:   { '0%': { background: 'rgba(246,70,93,0.3)' },  '100%': { background: 'transparent' } },
        fadeIn:     { '0%': { opacity: 0 },         '100%': { opacity: 1 } },
        slideUp:    { '0%': { transform: 'translateY(8px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        tickerScroll: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
