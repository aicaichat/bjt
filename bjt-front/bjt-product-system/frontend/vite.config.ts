import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 智能检测WordPress主机
const getWordPressHost = () => {
  // 1. 优先使用环境变量
  if (process.env.VITE_WORDPRESS_HOST) {
    return process.env.VITE_WORDPRESS_HOST;
  }
  
  // 2. 根据NODE_ENV自动检测
  const isDev = process.env.NODE_ENV === 'development';
  
  // 3. 检测Docker环境
  const isDocker = process.env.DOCKER_ENV || 
                   process.env.COMPOSE_PROJECT_NAME || 
                   process.env.HOSTNAME?.includes('docker');
  
  if (isDev && isDocker) {
    // Docker开发环境：尝试多个可能的服务名
    return process.env.VITE_WORDPRESS_HOST || 'http://dev-wordpress-1:80';
  }
  
  if (!isDev && isDocker) {
    // Docker生产环境
    return 'http://wordpress:80';
  }
  
  // 4. 默认：使用相对路径（适用于Nginx代理）
  return '';
};

const wordpressHost = getWordPressHost();
console.log('🔧 WordPress Host Configuration:', {
  host: wordpressHost,
  isDev: process.env.NODE_ENV === 'development',
  hasEnvVar: !!process.env.VITE_WORDPRESS_HOST
});

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // 使用根路径
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
    allowedHosts: ['frontend', 'localhost'],
    // 只有在有明确target时才启用代理（避免空字符串导致问题）
    ...(wordpressHost ? {
      proxy: {
        '/wp-json': {
          target: wordpressHost,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('🚨 Proxy error:', err.message);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('📤 Sending Request to:', req.method, req.url, '→', wordpressHost);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('📥 Received Response:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/wp-admin': {
          target: wordpressHost,
          changeOrigin: true,
          secure: false
        }
      }
    } : {})
  },
  build: {
    outDir: 'build',
    sourcemap: true
  }
})
