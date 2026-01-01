import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        red: {
          50: '#fff0f0',  // Linkist Red - very light tint for backgrounds
          100: '#ffe0e0', // Linkist Red - light tint
          200: '#ffc0c0', // Linkist Red - medium light tint
          300: '#ff8080', // Linkist Red - light for focus rings
          400: '#ff4040', // Linkist Red - medium
          500: '#ff0000', // Linkist Red - primary brand color
          600: '#ff0000', // Linkist Red - primary (matching 500 for consistency)
          700: '#cc0000', // Linkist Red - darker for hover states
          800: '#990000', // Linkist Red - very dark
          900: '#660000', // Linkist Red - darkest
        },
        gold: {
          50: '#FFFAEB',
          100: '#FCEFC7',
          200: '#FAE3A3',
          300: '#F7D070',
          400: '#F5C651',
          500: '#F2BD3B', // Primary Gold
          600: '#D9A223',
          700: '#B38115',
          800: '#8C630D',
          900: '#6E4C0A',
        },
      },
    },
  },
} satisfies Config
