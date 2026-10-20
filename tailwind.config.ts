import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontWeight: {
      normal: 'var(--font-weight-normal)',
      semibold: 'var(--font-weight-emphasis)',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['var(--font-sans)', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', '"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        // Semantic Token Mapping
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface)',
          subtle: 'var(--surface-subtle)',
          hover: 'var(--surface-hover)',
          active: 'var(--surface-active)',
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          secondary: 'var(--foreground-secondary)',
          muted: 'var(--foreground-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          active: 'var(--primary-active)',
          foreground: 'var(--primary-foreground)',
          subtle: 'var(--primary-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          foreground: 'var(--accent-foreground)',
          subtle: 'var(--accent-subtle)',
        },
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
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'filmstrip-roll': 'filmstrip-roll 40s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
