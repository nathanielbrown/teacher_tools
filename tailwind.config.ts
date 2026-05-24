/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        
        success: 'var(--color-success-text)',
        'success-bg': 'var(--color-success-bg)',
        'success-border': 'var(--color-success-border)',
        
        warning: 'var(--color-warning-text)',
        'warning-bg': 'var(--color-warning-bg)',
        'warning-border': 'var(--color-warning-border)',

        caution: 'var(--color-caution-text)',
        'caution-bg': 'var(--color-caution-bg)',
        'caution-border': 'var(--color-caution-border)',

        info: 'var(--color-info-text)',
        'info-bg': 'var(--color-info-bg)',
        'info-border': 'var(--color-info-border)',

        'dark-bg': 'var(--color-dark-bg)',
        'dark-border': 'var(--color-dark-border)',
      }
    },
  },
  safelist: [
    { pattern: /(bg|text|border|shadow|from|to)-(primary|secondary|accent)/, variants: ['hover', 'active', 'group-hover'] },
  ],
  plugins: [],
}
