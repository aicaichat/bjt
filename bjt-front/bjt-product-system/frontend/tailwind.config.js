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
          DEFAULT: '#005BAB',
          dark: '#004980',
          light: '#3378B8',
        },
        secondary: {
          DEFAULT: '#FF8A00',
          dark: '#E67D00',
          light: '#FFA133',
        },
        gray: {
          lightest: '#F8F9FA',
          light: '#E9ECEF',
          DEFAULT: '#DEE2E6',
          dark: '#CED4DA',
          darker: '#ADB5BD',
          darkest: '#6C757D',
        },
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
        info: '#17A2B8',
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