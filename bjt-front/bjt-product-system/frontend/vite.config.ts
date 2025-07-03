import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 简化配置：直接使用环境变量
console.log('🔧 Environment Configuration:', {
  VITE_API_URL: process.env.VITE_API_URL,
  VITE_WORDPRESS_HOST: process.env.VITE_WORDPRESS_HOST,
  DOCKER_ENV: process.env.DOCKER_ENV,
  NODE_ENV: process.env.NODE_ENV
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 开发服务器配置
  server: {
    host: '0.0.0.0',
    port: 5173, // 🔧 强制使用5173端口，避免CORS问题
    strictPort: true, // 如果端口被占用则报错，不自动切换
    // 🔧 智能API代理配置 - 支持开发/Docker/生产环境
    proxy: {
      // 代理所有以 /wp-json 开头的请求到后端WordPress服务器
      '/wp-json': {
        target: process.env.DOCKER_ENV === 'true' 
          ? 'http://wordpress:80' 
          : (process.env.VITE_WORDPRESS_HOST || 'http://localhost:8080'),
        changeOrigin: true,
        secure: false,
        timeout: 15000, // 15秒超时（生产环境可能需要更长时间）
        configure: (proxy, _options) => {
          const targetUrl = process.env.VITE_WORDPRESS_HOST || 'http://localhost:8080';
          
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message);
            console.error('Request URL:', req.url);
            console.error('Request method:', req.method);
            console.error('Target URL:', targetUrl);
          });
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Proxying:', req.method, req.url, '→', targetUrl);
            // 添加必要的请求头
            proxyReq.setHeader('Accept', 'application/json');
            if (req.method === 'POST' || req.method === 'PUT') {
              proxyReq.setHeader('Content-Type', 'application/json');
            }
            // 添加CORS头部
            proxyReq.setHeader('Access-Control-Allow-Origin', '*');
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 Response:', proxyRes.statusCode || 'unknown', req.url);
            if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
              console.error('❌ API Error:', proxyRes.statusCode, proxyRes.statusMessage);
            }
          });
        },
      },
      // 代理WordPress管理相关请求
      '/wp-admin': {
        target: process.env.DOCKER_ENV === 'true' 
          ? 'http://wordpress:80' 
          : 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // 代理WordPress登录相关请求
      '/wp-login.php': {
        target: process.env.DOCKER_ENV === 'true' 
          ? 'http://wordpress:80' 
          : 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 优化构建
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          utils: ['axios', 'dayjs']
        }
      }
    }
  },
  // 定义全局常量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  }
})
