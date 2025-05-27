# API通信流程详解

## 🔄 完整的请求-响应流程

### 1. 前端发起API请求

```typescript
// 前端 React 组件
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 发起API请求
        const response = await apiClient.get('/products');
        setProducts(response.data);
      } catch (error) {
        console.error('获取产品列表失败:', error);
      }
    };
    
    fetchProducts();
  }, []);
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
};
```

### 2. API客户端配置

```typescript
// src/services/api.ts
import axios from 'axios';

// 从环境变量获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒超时
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，重定向到登录页
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 🌐 网络请求路径

### 生产环境请求流程

```
1. 前端发起请求
   ↓
   GET https://your-domain.com/wp-json/bjt/v1/products
   ↓
2. DNS解析 → 服务器IP
   ↓
3. HTTPS连接 → Nginx容器 (端口443)
   ↓
4. Nginx路由匹配
   location /wp-json/ {
     proxy_pass http://wordpress:80;
   }
   ↓
5. 反向代理 → WordPress容器 (内部端口80)
   ↓
6. WordPress路由解析
   /wp-json/bjt/v1/products → REST API处理器
   ↓
7. 插件处理
   bjt-core-entities插件 → get_products()函数
   ↓
8. 数据库查询
   MySQL容器 → SELECT * FROM products
   ↓
9. 数据返回
   MySQL → WordPress → Nginx → 前端
```

### 开发环境请求流程

```
1. 前端发起请求 (localhost:5173)
   ↓
   GET http://localhost:8080/wp-json/bjt/v1/products
   ↓
2. Vite代理配置
   proxy: {
     '/wp-json': {
       target: 'http://localhost:8080',
       changeOrigin: true
     }
   }
   ↓
3. 直接访问WordPress容器
   ↓
4. WordPress处理 → MySQL查询 → 返回数据
```

## 🔧 Nginx配置详解

### 关键配置文件: nginx/conf.d/production.conf

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # 1. WordPress API路由 - 最重要的配置
    location /wp-json/ {
        # 代理到WordPress容器
        proxy_pass http://wordpress:80;
        
        # 保持原始请求信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # 缓存策略
        proxy_cache_valid 200 5m;  # 成功响应缓存5分钟
        proxy_cache_valid 404 1m;  # 404错误缓存1分钟
        
        # CORS支持
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
    
    # 2. WordPress管理后台
    location ~ ^/(wp-admin|wp-login\.php) {
        proxy_pass http://wordpress:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 3. PHP文件处理
    location ~ \.php$ {
        proxy_pass http://wordpress:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 4. WordPress静态内容
    location ~ ^/wp-content/ {
        proxy_pass http://wordpress:80;
        
        # 静态文件长期缓存
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }
    
    # 5. 前端应用 (SPA路由支持)
    location / {
        # 尝试查找文件，如果不存在则返回index.html
        try_files $uri $uri/ /index.html;
        
        # HTML文件短期缓存
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, max-age=3600";
        }
    }
    
    # 6. 静态资源长期缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

## 🔐 认证和安全

### JWT认证流程

```typescript
// 1. 用户登录
const login = async (username: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login', {
      username,
      password
    });
    
    const { token, user } = response.data;
    
    // 存储token
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// 2. 自动添加认证头
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### WordPress端JWT验证

```php
// plugins/bjt-core-entities/includes/auth.php

// 验证JWT token
function verify_jwt_token($token) {
    try {
        $secret_key = defined('JWT_AUTH_SECRET_KEY') ? JWT_AUTH_SECRET_KEY : 'fallback-secret';
        $decoded = JWT::decode($token, $secret_key, array('HS256'));
        
        // 验证用户是否存在
        $user = get_user_by('id', $decoded->data->user->id);
        if (!$user) {
            return false;
        }
        
        // 设置当前用户
        wp_set_current_user($user->ID);
        
        return true;
    } catch (Exception $e) {
        return false;
    }
}

// REST API权限检查
function check_api_permissions($request) {
    $auth_header = $request->get_header('authorization');
    
    if (!$auth_header) {
        return new WP_Error('no_auth', '需要认证', array('status' => 401));
    }
    
    $token = str_replace('Bearer ', '', $auth_header);
    
    if (!verify_jwt_token($token)) {
        return new WP_Error('invalid_token', '无效的token', array('status' => 401));
    }
    
    return true;
}
```

## 📊 性能监控和调试

### 前端API调试

```typescript
// 开发环境API调试
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use((config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data
    });
    return config;
  });
  
  apiClient.interceptors.response.use(
    (response) => {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
      return response;
    },
    (error) => {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data
      });
      return Promise.reject(error);
    }
  );
}
```

### 服务器端日志

```bash
# 查看Nginx访问日志
docker-compose -f docker/prod/docker-compose.prod.yml logs nginx

# 查看WordPress错误日志
docker-compose -f docker/prod/docker-compose.prod.yml logs wordpress

# 查看MySQL查询日志
docker-compose -f docker/prod/docker-compose.prod.yml logs mysql

# 实时监控所有日志
docker-compose -f docker/prod/docker-compose.prod.yml logs -f
```

## 🔧 故障排除

### 常见API问题

1. **CORS错误**
   ```
   解决方案: 检查Nginx配置中的CORS头设置
   ```

2. **404 API端点不存在**
   ```
   检查: WordPress插件是否正确注册了REST API路由
   ```

3. **认证失败**
   ```
   检查: JWT token是否正确，是否过期
   ```

4. **代理超时**
   ```
   调整: Nginx代理超时设置
   proxy_connect_timeout 60s;
   proxy_send_timeout 60s;
   proxy_read_timeout 60s;
   ```

这个架构确保了前后端的完全分离，同时通过Nginx提供了统一的入口点和高效的请求路由，实现了高性能、高可用的生产环境部署。 