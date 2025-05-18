import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '', // 使用相对路径
  plugins: [react()],
  css: { // Explicitly set postcss config
    postcss: './postcss.config.js'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@config': path.resolve(__dirname, './src/config'),
      '@types': path.resolve(__dirname, './src/types'),
      '@api': path.resolve(__dirname, './src/api'),
      '@mock': path.resolve(__dirname, './src/mock'),
      '@translations': path.resolve(__dirname, './src/translations')
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true,
    strictPort: true, // 确保使用指定端口
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true
  }
})
