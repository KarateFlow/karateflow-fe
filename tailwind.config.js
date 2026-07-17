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
          aka: 'var(--color-primary-aka)',
        },
        secondary: {
          ao: 'var(--color-secondary-ao)',
        },
        bg: {
          canvas: 'var(--color-bg-canvas)',
        },
        surface: 'var(--color-surface)',
        text: {
          main: 'var(--color-text-main)',
          muted: 'var(--color-text-muted)',
        },
        border: 'var(--color-border)',
        hover: 'var(--color-hover)'
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)'
      }
    },
  },
  plugins: [],
}

