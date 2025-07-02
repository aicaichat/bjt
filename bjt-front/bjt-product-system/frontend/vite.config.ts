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
    // 🔧 修复API代理配置 - 增强错误处理和日志
    proxy: {
      // 代理所有以 /wp-json 开头的请求到后端WordPress服务器
      '/wp-json': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        timeout: 10000, // 10秒超时
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message);
            console.error('Request URL:', req.url);
            console.error('Request method:', req.method);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Proxying:', req.method, req.url, '→ http://localhost:8080');
            // 添加必要的请求头
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');
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
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // 代理WordPress登录相关请求
      '/wp-login.php': {
        target: 'http://localhost:8080',
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
