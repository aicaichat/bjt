# BJT产品管理系统架构设计

## 一、系统架构概述

### 1.1 整体架构
```
客户端层
    ↓
负载均衡层 (Nginx)
    ↓
应用层 (React + WordPress)
    ↓
数据层 (MySQL)
```

### 1.2 技术栈
- 前端：React 18 + TypeScript + Vite + Ant Design
- 后端：WordPress (PHP 8.0+)
- 数据库：MySQL 8.0
- 容器化：Docker + Docker Compose
- 服务器：Nginx 1.20+

## 二、部署架构

### 2.1 开发环境
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # 前端开发服务器
  frontend:
    build:
      context: ./bjt-front
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./bjt-front:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:8080

  # WordPress开发服务器
  wordpress:
    image: wordpress:php8.0
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_NAME: bjt_product
      WORDPRESS_DEBUG: 1
    volumes:
      - ./wordpress:/var/www/html
      - ./plugins:/var/www/html/wp-content/plugins

  # MySQL数据库
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: bjt_product
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### 2.2 生产环境
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Nginx负载均衡
  nginx:
    image: nginx:1.20
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - wordpress

  # WordPress应用服务器
  wordpress:
    image: wordpress:php8.0
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_NAME: bjt_product
    volumes:
      - ./wordpress:/var/www/html
      - ./plugins:/var/www/html/wp-content/plugins

  # MySQL数据库
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: bjt_product
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

### 2.3 Nginx配置
```nginx
# nginx/conf.d/default.conf
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # WordPress API
    location /wp-json/ {
        proxy_pass http://wordpress;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WordPress管理后台
    location /wp-admin/ {
        proxy_pass http://wordpress;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 三、系统组件

### 3.1 前端架构
```
bjt-front/
├── src/
│   ├── pages/          # 页面组件
│   ├── components/     # 公共组件
│   ├── services/       # API服务
│   ├── contexts/       # 状态管理
│   ├── utils/          # 工具函数
│   └── i18n/           # 国际化
└── build/              # 构建输出
```

### 3.2 后端架构
```
bjt-product-admin/
├── includes/           # 核心功能
│   ├── admin/         # 管理后台
│   ├── api/           # API接口
│   └── functions.php  # 通用函数
├── public-frontend/    # 前端资源
└── templates/         # 模板文件
```

### 3.3 数据库架构
```
数据库表
├── wp_bjt_product_lines      # 产品线
├── wp_bjt_host_models        # 主机型号
├── wp_bjt_accessory_models   # 配件型号
├── wp_bjt_spare_part_models  # 备件型号
├── wp_bjt_parts             # 料号
├── wp_bjt_accessories       # 配件
├── wp_bjt_consumables       # 耗材
└── wp_bjt_spare_parts       # 备件
```

## 四、安全架构

### 4.1 认证授权
- JWT token认证
- WordPress用户权限系统
- API访问控制

### 4.2 数据安全
- HTTPS加密传输
- SQL注入防护
- XSS防护
- CSRF防护

### 4.3 访问控制
```php
// 权限检查示例
function check_user_permission($capability) {
    if (!current_user_can($capability)) {
        return new WP_Error(
            'permission_denied',
            '没有权限执行此操作',
            array('status' => 403)
        );
    }
    return true;
}
```

## 五、性能优化

### 5.1 前端优化
- 代码分割
- 懒加载
- 资源压缩
- 缓存策略

### 5.2 后端优化
- 数据库索引
- 查询优化
- 缓存机制
- 并发控制

### 5.3 部署优化
- CDN加速
- 负载均衡
- 数据库主从
- 监控告警

## 六、监控运维

### 6.1 日志系统
```yaml
# 日志配置
logging:
  frontend:
    level: info
    path: /var/log/frontend
  wordpress:
    level: debug
    path: /var/log/wordpress
  nginx:
    level: info
    path: /var/log/nginx
```

### 6.2 监控指标
- 系统资源使用率
- API响应时间
- 错误率统计
- 用户行为分析

### 6.3 告警机制
- 系统异常告警
- 性能阈值告警
- 安全事件告警
- 业务指标告警

## 七、部署流程

### 7.1 开发环境部署
```bash
# 1. 克隆代码
git clone <repository_url>
cd bjt-product-system

# 2. 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 3. 安装依赖
cd bjt-front
npm install

# 4. 启动开发服务器
npm run dev
```

### 7.2 生产环境部署
```bash
# 1. 构建前端
cd bjt-front
npm run build

# 2. 配置环境变量
cp .env.example .env
# 编辑.env文件

# 3. 启动生产环境
docker-compose -f docker-compose.prod.yml up -d

# 4. 检查服务状态
docker-compose ps
```

### 7.3 更新流程
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 构建新版本
cd bjt-front
npm run build

# 3. 更新容器
docker-compose -f docker-compose.prod.yml up -d --build

# 4. 清理旧版本
docker system prune -f
```

## 八、灾备方案

### 8.1 数据备份
- 数据库定时备份
- 文件系统备份
- 配置文件备份

### 8.2 故障恢复
- 服务自动重启
- 数据恢复流程
- 应急响应机制

### 8.3 高可用方案
- 多实例部署
- 负载均衡
- 数据库主从
- 异地容灾 