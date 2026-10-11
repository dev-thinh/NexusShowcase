import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        navy: {
          50: '#F0F5FA',
          100: '#DFEAF5',
          200: '#BFD5EC',
          300: '#8EB6DF',
          400: '#5692CF',
          500: '#2E72BE',
          600: '#1E58A3',
          700: '#1A4683',
          800: '#163B6E',
          900: '#0F294A',
          950: '#08172B',
        },
        scholar: {
          gold: '#B45309',
          goldlight: '#FEF3C7',
          paper: '#FFFFFF',
          parchment: '#F8FAFC',
          border: '#E2E8F0',
        },
      },
      keyframes: {
        'filmstrip-roll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'filmstrip-roll': 'filmstrip-roll 32s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
