import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
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
          50: '#FFFFFF',
          100: '#FFFFFF',
          200: '#153D67',
          300: '#153D67',
          400: '#153D67',
          500: '#153D67',
          600: '#153D67',
          700: '#153D67',
          800: '#153D67',
          900: '#153D67',
          950: '#153D67',
        },
        scholar: {
          gold: '#153D67',
          goldlight: '#FFFFFF',
          paper: '#FFFFFF',
          parchment: '#FFFFFF',
          border: '#E2E8F0',
        },
      },
    },
  },
  plugins: [],
};
export default config;
