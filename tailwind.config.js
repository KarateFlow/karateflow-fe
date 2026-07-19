/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          subtle: 'var(--color-primary-subtle)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
        },
        bg: {
          canvas: 'var(--color-bg-canvas)',
        },
        text: {
          main: 'var(--color-text-main)',
          muted: 'var(--color-text-muted)',
        },
        border: 'var(--color-border)',
        hover: 'var(--color-hover)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)'
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)'
        },
        error: {
          DEFAULT: 'var(--color-error)',
          bg: 'var(--color-error-bg)'
        }
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)'
      }
    },
  },
  plugins: [],
}

