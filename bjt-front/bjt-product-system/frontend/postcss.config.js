export default {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nested',
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': false
      }
    }
  }
} 