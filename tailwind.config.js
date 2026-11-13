/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#0a0b0d',
          900: '#111216',
          850: '#17191f',
          800: '#1e2129',
          750: '#252933',
          700: '#2d323e',
          600: '#3e4454',
          500: '#5c647a',
          400: '#8792ab',
          300: '#b4bcd0',
          200: '#dce0eb',
          100: '#f1f3f9',
        },
        accent: {
          cyan: '#00f0ff',
          neon: '#39ff14',
          orange: '#ff6b00',
          purple: '#b026ff',
          pink: '#ff007f',
          amber: '#ffaa00'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

