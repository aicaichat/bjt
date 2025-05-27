# BJT产品管理系统 - 部署架构详解

## 🏗️ 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS (443) / HTTP (80)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx容器                                │
│  ┌─────────────────┐  ┌─────────────────────────────────────┤
│  │   前端静态文件   │  │        反向代理                     │
│  │   React Build   │  │  /wp-json/* → WordPress容器         │
│  │   /index.html   │  │  /wp-admin/* → WordPress容器        │
│  │   /assets/*     │  │  *.php → WordPress容器              │
│  └─────────────────┘  └─────────────────────────────────────┤
└─────────────────────┬───────────────────────────────────────┘
                      │ 内部网络 (bjt_network)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  WordPress容器                              │
│  ┌─────────────────────────────────────────────────────────┤
│  │  WordPress核心 + 自定义插件                             │
│  │  - bjt-product-admin (管理界面)                         │
│  │  - bjt-core-entities (核心实体)                         │
│  │  - REST API端点 (/wp-json/bjt/v1/*)                    │
│  └─────────────────────────────────────────────────────────┤
└─────────────────────┬───────────────────────────────────────┘
                      │ MySQL连接
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL容器                                │
│  ┌─────────────────────────────────────────────────────────┤
│  │  数据库: bjt_product                                    │
│  │  - 产品表 (products)                                    │
│  │  - 配件表 (accessories)                                 │
│  │  - 耗材表 (consumables)                                 │
│  │  - 备件表 (spare_parts)                                 │
│  │  - 用户表 (wp_users)                                    │
│  └─────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────┤
```

## 🔧 构建部署流程详解

### 第一步：多阶段Docker构建

#### 1. 前端构建阶段 (docker/nginx/Dockerfile.prod)

```dockerfile
# 第一阶段：构建前端
FROM node:18-alpine as frontend-builder
WORKDIR /app

# 复制package文件并安装依赖
COPY frontend/package*.json ./
RUN npm ci

# 复制源代码
COPY frontend/ ./

# 设置API URL环境变量
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# 构建前端应用 → 输出到 /app/build
RUN npm run build
```

**构建过程**：
1. 安装Node.js依赖（包括TypeScript、Vite等）
2. 编译TypeScript → JavaScript
3. 打包React组件和资源
4. 优化和压缩代码
5. 生成静态文件到 `/app/build` 目录

#### 2. Nginx镜像构建阶段

```dockerfile
# 第二阶段：构建nginx
FROM nginx:alpine

# 复制前端构建结果
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# 复制nginx配置
COPY nginx/conf.d/production.conf /etc/nginx/conf.d/default.conf
```

**构建过程**：
1. 从前端构建阶段复制静态文件
2. 配置Nginx反向代理规则
3. 设置SSL和安全头
4. 配置缓存策略

#### 3. WordPress容器构建

```dockerfile
# WordPress生产环境
FROM wordpress:6.4-php8.2-apache

# 安装PHP扩展和工具
RUN apt-get update && apt-get install -y curl zip unzip git
RUN docker-php-ext-install mysqli pdo pdo_mysql

# 安装WP-CLI
RUN curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/v2.8.1/wp-cli.phar

# 复制自定义配置
COPY php.ini /usr/local/etc/php/conf.d/custom.ini
COPY apache.conf /etc/apache2/sites-available/000-default.conf
```

### 第二步：Docker Compose编排

```yaml
services:
  nginx:
    build:
      context: ../../
      dockerfile: docker/nginx/Dockerfile.prod
      args:
        - VITE_API_URL=https://${DOMAIN_NAME}/wp-json/bjt/v1
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - wordpress

  wordpress:
    build:
      context: ../../docker/wordpress
      dockerfile: Dockerfile.prod
    environment:
      WORDPRESS_DB_HOST: mysql
      # ... 其他环境变量
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: bjt_product
```

## 🌐 前后端API互通设置

### 1. 前端API配置

#### 构建时API URL注入
```bash
# Docker构建时传入API URL
docker build --build-arg VITE_API_URL=https://your-domain.com/wp-json/bjt/v1
```

#### 前端API服务配置 (src/services/api.ts)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 2. Nginx反向代理配置

#### 关键路由规则 (nginx/conf.d/production.conf)
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # WordPress API路由
    location /wp-json/ {
        proxy_pass http://wordpress:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # API缓存策略
        proxy_cache_valid 200 5m;
        proxy_cache_valid 404 1m;
    }

    # WordPress管理后台
    location ~ ^/(wp-admin|wp-login\.php) {
        proxy_pass http://wordpress:80;
        # ... 代理头设置
    }

    # PHP文件处理
    location ~ \.php$ {
        proxy_pass http://wordpress:80;
        # ... 代理头设置
    }

    # 前端应用路由 (SPA路由支持)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. WordPress API端点

#### 自定义REST API路由 (plugins/bjt-core-entities/)
```php
// 注册API路由
add_action('rest_api_init', function () {
    register_rest_route('bjt/v1', '/products', array(
        'methods' => 'GET',
        'callback' => 'get_products',
        'permission_callback' => '__return_true'
    ));
    
    register_rest_route('bjt/v1', '/accessories', array(
        'methods' => 'GET',
        'callback' => 'get_accessories',
        'permission_callback' => '__return_true'
    ));
});
```

## 🔄 请求流程示例

### 前端请求产品列表的完整流程：

1. **前端发起请求**
   ```typescript
   // 前端代码
   const response = await fetch('https://your-domain.com/wp-json/bjt/v1/products');
   ```

2. **Nginx接收请求**
   ```
   GET https://your-domain.com/wp-json/bjt/v1/products
   ↓
   匹配到 location /wp-json/ 规则
   ```

3. **反向代理到WordPress**
   ```
   Nginx → http://wordpress:80/wp-json/bjt/v1/products
   ```

4. **WordPress处理API请求**
   ```php
   // WordPress内部路由
   /wp-json/bjt/v1/products → get_products() 函数
   ```

5. **数据库查询**
   ```php
   // 查询MySQL数据库
   $products = $wpdb->get_results("SELECT * FROM products");
   ```

6. **返回JSON响应**
   ```
   WordPress → Nginx → 前端
   JSON格式的产品数据
   ```

## 🔐 安全和认证

### JWT认证流程
```typescript
// 1. 前端登录
const loginResponse = await api.post('/auth/login', {
    username: 'user',
    password: 'pass'
});

// 2. 获取JWT token
const token = loginResponse.data.token;

// 3. 后续请求携带token
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### WordPress JWT验证
```php
// WordPress插件验证JWT
add_filter('rest_authentication_errors', function($result) {
    if (!empty($result)) {
        return $result;
    }
    
    $token = get_jwt_token_from_header();
    if (!$token || !verify_jwt_token($token)) {
        return new WP_Error('jwt_auth_invalid_token', 'Invalid token');
    }
    
    return $result;
});
```

## 📊 性能优化

### 1. 缓存策略
- **静态文件**: 1年缓存
- **API响应**: 5分钟缓存
- **HTML文件**: 1小时缓存

### 2. 压缩优化
- Gzip压缩所有文本文件
- 图片优化和懒加载
- 代码分割和按需加载

### 3. 数据库优化
- MySQL连接池
- 查询缓存
- 索引优化

## 🚀 部署命令

```bash
# 1. 配置环境变量
cp env.production.example .env.production
nano .env.production

# 2. 一键部署
chmod +x deploy.sh
./deploy.sh
```

部署脚本会自动：
1. 检查系统要求
2. 验证配置文件
3. 生成SSL证书（如需要）
4. 构建所有Docker镜像
5. 启动服务容器
6. 等待服务就绪
7. 显示访问信息

这样的架构确保了前后端的完全分离，同时通过Nginx实现了统一的入口点和高效的请求路由。 