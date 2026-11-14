/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D1A',
        surface: '#141428',
        card: '#1C1C38',
        primary: {
          DEFAULT: '#7C6EF8',
          dark: '#5B4ECC',
        },
        success: '#34D399',
        danger: '#F87171',
        warning: '#FBBF24',
        textPrimary: '#FFFFFF',
        textSecondary: '#9898B3',
        textMuted: '#5C5C78',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
