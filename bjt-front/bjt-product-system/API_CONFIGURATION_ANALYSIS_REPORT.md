# BJT 产品系统 API 配置问题系统分析报告

## 🔍 问题概览

经过系统分析，发现线下环境和线上环境API配置存在以下关键问题：

### 1. **配置文件分散且逻辑不一致**
### 2. **环境变量使用不规范**
### 3. **代理和CORS配置冲突**
### 4. **部署脚本环境配置不统一**

---

## 📋 详细问题分析

### 1. 多重API配置文件问题

#### 发现的配置文件：
- `frontend/src/config/appConfig.ts` - 主配置
- `frontend/src/api/config.ts` - API专用配置
- `frontend/src/config/constants.ts` - 常量配置
- `frontend/src/config/env.ts` - 环境配置

#### 问题表现：
```typescript
// appConfig.ts - 复杂的getApiBaseUrl()逻辑
const getApiBaseUrl = (): string => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  const mode = import.meta.env.MODE;
  const isDev = import.meta.env.DEV;
  
  if (envApiUrl) return envApiUrl;
  if (isDev || mode === 'development') return 'http://localhost:8080/wp-json/bjt/v1';
  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location;
    return `${protocol}//${host}/wp-json/bjt/v1`;
  }
  return '/wp-json/bjt/v1';
};

// api/config.ts - 不同的URL选择逻辑
export const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (isDevelopment && useProxy) return '/wp-json/bjt/v1';
  return 'http://localhost:8080/wp-json/bjt/v1';
})();

// constants.ts - 又是另一套配置
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || '/wp-json/bjt/v1',
  timeout: 10000,
  retryAttempts: 3
};
```

**问题影响**: 不同文件使用不同的API URL，导致请求不一致。

### 2. 环境变量配置混乱

#### 发现的环境变量：
```bash
# env.production.eorder.example
VITE_API_URL=/wp-json/bjt/v1
VITE_WORDPRESS_HOST=  # 有时为空
VITE_USE_PROXY=true   # 代理配置

# vite.config.ts 中的配置
VITE_WORDPRESS_HOST=http://dev-wordpress-1:80  # Docker开发环境
```

#### 问题表现：
- **开发环境**: 硬编码 `http://localhost:8080/wp-json/bjt/v1`
- **生产环境**: 相对路径 `/wp-json/bjt/v1`
- **Docker环境**: 服务名 `http://wordpress:80/wp-json/bjt/v1`

### 3. 代理和CORS配置冲突

#### 多重CORS配置：
```nginx
# nginx/conf.d/ip.conf
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";

# plugins/bjt-cors/bjt-cors.php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
```

#### 代理配置不一致：
```typescript
// vite.config.ts - 条件性代理
...(wordpressHost ? {
  proxy: {
    '/wp-json': {
      target: wordpressHost,
      changeOrigin: true,
      secure: false
    }
  }
} : {})
```

---

## 🔧 解决方案

### 阶段1: 统一API配置文件

#### 1.1 创建中心化API配置

```typescript
// src/config/api.config.ts
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  corsEnabled: boolean;
  debugMode: boolean;
}

class ApiConfigManager {
  private static instance: ApiConfigManager;
  private config: ApiConfig;

  private constructor() {
    this.config = this.initializeConfig();
  }

  static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager();
    }
    return ApiConfigManager.instance;
  }

  private initializeConfig(): ApiConfig {
    const environment = this.detectEnvironment();
    
    return {
      baseUrl: this.getBaseUrl(environment),
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
      retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
      corsEnabled: import.meta.env.VITE_CORS_ENABLED === 'true',
      debugMode: import.meta.env.DEV || false
    };
  }

  private detectEnvironment(): 'development' | 'production' | 'docker' {
    if (import.meta.env.DEV) return 'development';
    if (import.meta.env.DOCKER_ENV) return 'docker';
    return 'production';
  }

  private getBaseUrl(environment: string): string {
    // 1. 优先使用明确设置的环境变量
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }

    // 2. 根据环境选择默认值
    switch (environment) {
      case 'development':
        return 'http://localhost:8080/wp-json/bjt/v1';
      case 'docker':
        return 'http://wordpress:80/wp-json/bjt/v1';
      case 'production':
        return '/wp-json/bjt/v1';
      default:
        return '/wp-json/bjt/v1';
    }
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  getDebugInfo() {
    return {
      config: this.config,
      environment: this.detectEnvironment(),
      envVars: {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        MODE: import.meta.env.MODE,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD
      }
    };
  }
}

export const apiConfig = ApiConfigManager.getInstance();
export default apiConfig;
```

#### 1.2 标准化环境变量

```bash
# .env.development
VITE_API_URL=http://localhost:8080/wp-json/bjt/v1
VITE_API_TIMEOUT=10000
VITE_API_RETRY_ATTEMPTS=3
VITE_CORS_ENABLED=true
VITE_DEBUG=true

# .env.production
VITE_API_URL=/wp-json/bjt/v1
VITE_API_TIMEOUT=8000
VITE_API_RETRY_ATTEMPTS=2
VITE_CORS_ENABLED=false
VITE_DEBUG=false

# .env.docker
VITE_API_URL=http://wordpress:80/wp-json/bjt/v1
VITE_API_TIMEOUT=15000
VITE_API_RETRY_ATTEMPTS=3
VITE_CORS_ENABLED=true
VITE_DEBUG=true
DOCKER_ENV=true
```

### 阶段2: 标准化CORS和代理配置

#### 2.1 统一CORS策略

```typescript
// src/services/cors.config.ts
export const CORS_CONFIG = {
  development: {
    origins: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  production: {
    origins: ['https://eorder.lockedair.com', 'https://bjt.nh.cool'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With']
  }
};
```

#### 2.2 优化Nginx配置

```nginx
# nginx/conf.d/unified-api.conf
upstream wordpress_backend {
    server wordpress:80;
}

# API代理配置
location /wp-json/ {
    proxy_pass http://wordpress_backend;
    
    # 标准代理头
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 超时配置
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    
    # 环境特定的CORS配置
    include /etc/nginx/conf.d/cors-${ENVIRONMENT}.conf;
}
```

### 阶段3: 部署配置统一化

#### 3.1 环境检测脚本

```bash
#!/bin/bash
# scripts/detect-environment.sh

detect_environment() {
    if [ -n "$DOCKER_ENV" ]; then
        echo "docker"
    elif [ -n "$PRODUCTION" ]; then
        echo "production"
    else
        echo "development"
    fi
}

setup_environment() {
    local env=$(detect_environment)
    
    case $env in
        "development")
            export VITE_API_URL="http://localhost:8080/wp-json/bjt/v1"
            ;;
        "docker")
            export VITE_API_URL="http://wordpress:80/wp-json/bjt/v1"
            ;;
        "production")
            export VITE_API_URL="/wp-json/bjt/v1"
            ;;
    esac
    
    echo "Environment: $env"
    echo "API URL: $VITE_API_URL"
}
```

#### 3.2 统一部署脚本

```bash
#!/bin/bash
# scripts/deploy-unified.sh

set -e

echo "🚀 BJT统一部署脚本"

# 1. 环境检测
source scripts/detect-environment.sh
setup_environment

# 2. 配置验证
echo "📋 配置验证..."
if [ -z "$VITE_API_URL" ]; then
    echo "❌ VITE_API_URL未设置"
    exit 1
fi

# 3. 构建前端
echo "🔨 构建前端应用..."
cd frontend
npm run build

# 4. 部署
echo "📦 执行部署..."
# 具体部署逻辑根据环境选择
```

---

## 🎯 实施计划

### 第1周: 配置统一化
- [ ] 创建中心化API配置管理器
- [ ] 标准化环境变量命名
- [ ] 更新所有调用点使用统一配置

### 第2周: 代理和CORS优化
- [ ] 统一CORS配置策略
- [ ] 优化Nginx代理配置
- [ ] 移除重复的CORS设置

### 第3周: 部署流程标准化
- [ ] 创建环境检测脚本
- [ ] 统一部署脚本
- [ ] 测试各环境部署流程

### 第4周: 测试和文档
- [ ] 全环境API测试
- [ ] 创建配置文档
- [ ] 培训团队使用新配置

---

## 🔍 问题排查工具

### API配置诊断脚本

```typescript
// src/utils/api-diagnostics.ts
export class ApiDiagnostics {
  static async runDiagnostics() {
    const config = apiConfig.getConfig();
    const debugInfo = apiConfig.getDebugInfo();
    
    const results = {
      config,
      debugInfo,
      connectivity: await this.testConnectivity(config.baseUrl),
      cors: await this.testCors(config.baseUrl),
      endpoints: await this.testEndpoints(config.baseUrl)
    };
    
    console.table(results);
    return results;
  }
  
  private static async testConnectivity(baseUrl: string) {
    try {
      const response = await fetch(`${baseUrl}/`);
      return {
        status: 'success',
        code: response.status,
        message: 'API可达'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
  
  private static async testCors(baseUrl: string) {
    // CORS测试逻辑
  }
  
  private static async testEndpoints(baseUrl: string) {
    // 端点测试逻辑
  }
}
```

---

## 📞 需要确认的信息

为了完善解决方案，我需要确认以下信息：

1. **当前生产环境域名**: 是否只有 `eorder.lockedair.com` 还是有多个？
2. **Docker服务命名**: WordPress容器的确切服务名是什么？
3. **SSL证书配置**: 生产环境是否使用HTTPS？
4. **负载均衡**: 是否有多个WordPress实例？
5. **CDN配置**: 静态资源是否使用CDN？

请提供这些信息，我将据此优化解决方案。 