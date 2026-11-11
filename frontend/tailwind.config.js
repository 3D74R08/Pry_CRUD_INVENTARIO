/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        'background-secondary': 'var(--bg-secondary)',
        surface: 'var(--surface)',
        'surface-elevated': 'var(--surface-elevated)',
        border: 'var(--border-color)',
        input: 'var(--border-color)',
        ring: 'var(--primary)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          foreground: '#FFFFFF',
        },
        foreground: {
          DEFAULT: 'var(--text-main)',
          muted: 'var(--text-secondary)',
        },
        success: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
          bg: 'var(--success-bg)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
          bg: 'var(--warning-bg)',
        },
        danger: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
          bg: 'var(--danger-bg)',
        },
        info: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
          bg: 'var(--info-bg)',
        },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
