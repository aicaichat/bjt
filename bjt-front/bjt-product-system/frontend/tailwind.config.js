/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#3154b3',
          DEFAULT: '#012583',
          dark: '#001a5d',
        },
        secondary: {
          light: 'var(--secondary-light)',
          DEFAULT: 'var(--secondary)',
          dark: 'var(--secondary-dark)',
        },
        gray: {
          lightest: '#f8fafc',
          light: '#f1f5f9',
          DEFAULT: '#cbd5e1',
          dark: '#64748b',
          darker: '#334155',
          darkest: '#0f172a',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--error)',
        info: 'var(--info)',
        background: '#F1F5F9',
        card: {
          DEFAULT: 'var(--color-card-bg)',
          alt: 'var(--color-input-bg)',
        },
        border: 'var(--color-border)',
        price: 'var(--color-price)',
        content: {
          DEFAULT: 'var(--color-text-content)',
          light: 'var(--color-text-label)',
        },
        title: 'var(--color-text-title)',
        label: 'var(--color-text-label)',
        input: {
          DEFAULT: 'var(--color-input-bg)',
        },
        button: {
          DEFAULT: 'var(--color-button-bg)',
          hover: 'var(--color-secondary-button-bg-hover)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary-button-bg)',
          text: 'var(--color-secondary-button-text)',
          hover: 'var(--color-secondary-button-bg-hover)',
          light: 'var(--color-secondary-button-bg)',
        },
        accent: {
          DEFAULT: 'var(--color-secondary-button-bg)',
          text: 'var(--color-secondary-button-text)',
          hover: 'var(--color-secondary-button-bg-hover)',
          light: 'var(--color-secondary-button-bg)',
        },
        'level-1-bg': 'var(--color-accessory-level-1-bg)',
        'level-2-bg': 'var(--color-accessory-level-2-bg)',
        'level-3-bg': 'var(--color-accessory-level-3-bg)',
        'level-4-bg': 'var(--color-accessory-level-4-bg)',
        'level-5-bg': 'var(--color-accessory-level-5-bg)',
        'tag-text': 'var(--color-accessory-tag-text)',
        error: 'var(--error)',
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // 确保Tailwind不会覆盖我们现有的自定义样式
  corePlugins: {
    preflight: false,
  },
} 