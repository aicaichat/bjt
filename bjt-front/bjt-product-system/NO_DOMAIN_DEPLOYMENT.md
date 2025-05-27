# 无域名部署指南

## 🌐 部署方案选择

### 方案一：使用服务器IP地址部署（推荐）
### 方案二：本地网络部署
### 方案三：使用免费域名服务

---

## 🚀 方案一：使用服务器IP地址部署

### 1. 修改环境配置

```bash
# 复制配置文件
cp env.production.example .env.production.ip

# 编辑配置文件
nano .env.production.ip
```

#### 配置内容 (.env.production.ip)
```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=bjt_product
MYSQL_USER=wordpress
MYSQL_PASSWORD=your_secure_wp_password

# WordPress配置
WORDPRESS_DB_HOST=mysql
WORDPRESS_DB_NAME=bjt_product
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=your_secure_wp_password
WORDPRESS_DB_CHARSET=utf8mb4
WORDPRESS_DB_COLLATE=

# WordPress安全密钥
WORDPRESS_AUTH_KEY=your_auth_key_here
WORDPRESS_SECURE_AUTH_KEY=your_secure_auth_key_here
WORDPRESS_LOGGED_IN_KEY=your_logged_in_key_here
WORDPRESS_NONCE_KEY=your_nonce_key_here
WORDPRESS_AUTH_SALT=your_auth_salt_here
WORDPRESS_SECURE_AUTH_SALT=your_secure_auth_salt_here
WORDPRESS_LOGGED_IN_SALT=your_logged_in_salt_here
WORDPRESS_NONCE_SALT=your_nonce_salt_here

# JWT配置
JWT_AUTH_SECRET_KEY=your_jwt_secret_key_here

# 使用服务器IP地址（替换为你的实际IP）
DOMAIN_NAME=192.168.1.100
WP_HOME=http://192.168.1.100
WP_SITEURL=http://192.168.1.100

# 禁用SSL（因为没有有效证书）
USE_SSL=false

# 备份配置
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### 2. 创建IP地址专用Docker Compose配置

```yaml
# docker/prod/docker-compose.ip.yml
version: '3.8'

services:
  # Nginx负载均衡和反向代理（IP地址版本）
  nginx:
    build:
      context: ../../
      dockerfile: docker/nginx/Dockerfile.ip
      args:
        - VITE_API_URL=http://${DOMAIN_NAME}/wp-json/bjt/v1
    ports:
      - "80:80"
      # 不开放443端口，因为没有SSL证书
    volumes:
      - ../../nginx/conf.d:/etc/nginx/conf.d
      - ../../backend:/var/www/html:ro
      - ../../plugins:/var/www/html/wp-content/plugins:ro
    depends_on:
      - wordpress
    environment:
      - DOMAIN_NAME=${DOMAIN_NAME}
      - USE_SSL=${USE_SSL}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - bjt_network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped

  # WordPress应用服务器
  wordpress:
    build:
      context: ../../docker/wordpress
      dockerfile: Dockerfile.prod
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_NAME: ${MYSQL_DATABASE}
      WORDPRESS_DB_USER: ${MYSQL_USER}
      WORDPRESS_DB_PASSWORD: ${MYSQL_PASSWORD}
      WORDPRESS_DB_CHARSET: ${WORDPRESS_DB_CHARSET}
      WORDPRESS_DB_COLLATE: ${WORDPRESS_DB_COLLATE}
      WORDPRESS_AUTH_KEY: ${WORDPRESS_AUTH_KEY}
      WORDPRESS_SECURE_AUTH_KEY: ${WORDPRESS_SECURE_AUTH_KEY}
      WORDPRESS_LOGGED_IN_KEY: ${WORDPRESS_LOGGED_IN_KEY}
      WORDPRESS_NONCE_KEY: ${WORDPRESS_NONCE_KEY}
      WORDPRESS_AUTH_SALT: ${WORDPRESS_AUTH_SALT}
      WORDPRESS_SECURE_AUTH_SALT: ${WORDPRESS_SECURE_AUTH_SALT}
      WORDPRESS_LOGGED_IN_SALT: ${WORDPRESS_LOGGED_IN_SALT}
      WORDPRESS_NONCE_SALT: ${WORDPRESS_NONCE_SALT}
      JWT_AUTH_SECRET_KEY: ${JWT_AUTH_SECRET_KEY}
      WP_HOME: ${WP_HOME}
      WP_SITEURL: ${WP_SITEURL}
      WORDPRESS_CONFIG_EXTRA: |
        define('WP_HOME', '${WP_HOME}');
        define('WP_SITEURL', '${WP_SITEURL}');
        define('WP_CONTENT_URL', '${WP_HOME}/wp-content');
        define('WP_CONTENT_DIR', '/var/www/html/wp-content');
        define('JWT_AUTH_SECRET_KEY', '${JWT_AUTH_SECRET_KEY}');
        define('WP_DEBUG', false);
        define('WP_DEBUG_LOG', false);
        define('WP_DEBUG_DISPLAY', false);
        define('FORCE_SSL_ADMIN', false);
        define('WP_CACHE', true);
    volumes:
      - ../../backend:/var/www/html
      - ../../plugins:/var/www/html/wp-content/plugins
      - wordpress_uploads:/var/www/html/wp-content/uploads
      - wordpress_cache:/var/www/html/wp-content/cache
    env_file:
      - ../../.env.production.ip
    depends_on:
      - mysql
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/wp-admin/admin-ajax.php"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - bjt_network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped

  # MySQL数据库
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - mysql_backup:/backup
      - ../../docker/mysql/conf.d:/etc/mysql/conf.d
    command: --default-authentication-plugin=mysql_native_password --innodb-buffer-pool-size=256M
    env_file:
      - ../../.env.production.ip
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    networks:
      - bjt_network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped

  # 数据库备份服务
  mysql-backup:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
    volumes:
      - mysql_backup:/backup
      - ../../scripts/backup.sh:/backup.sh
    command: >
      sh -c "
        echo '${BACKUP_SCHEDULE} /backup.sh' > /etc/crontabs/root &&
        crond -f
      "
    depends_on:
      - mysql
    networks:
      - bjt_network
    restart: unless-stopped

networks:
  bjt_network:
    driver: bridge

volumes:
  mysql_data:
    driver: local
  mysql_backup:
    driver: local
  wordpress_uploads:
    driver: local
  wordpress_cache:
    driver: local
```

### 3. 创建IP地址专用Nginx配置

```nginx
# nginx/conf.d/ip.conf
# HTTP配置（无SSL）
server {
    listen 80;
    server_name _;  # 接受任何主机名
    root /usr/share/nginx/html;
    index index.html index.php;

    # 日志配置
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # WordPress API路由
    location /wp-json/ {
        proxy_pass http://wordpress:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # CORS支持
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # 缓存API响应
        proxy_cache_valid 200 5m;
        proxy_cache_valid 404 1m;
    }

    # WordPress管理后台
    location ~ ^/(wp-admin|wp-login\.php) {
        proxy_pass http://wordpress:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # PHP文件处理
    location ~ \.php$ {
        proxy_pass http://wordpress:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # WordPress内容目录
    location ~ ^/wp-content/ {
        proxy_pass http://wordpress:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 静态文件缓存
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # 静态文件缓存
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri $uri/ =404;
    }

    # 前端应用路由
    location / {
        try_files $uri $uri/ /index.html;
        
        # 前端文件缓存
        location ~* \.(html)$ {
            expires 1h;
            add_header Cache-Control "public, max-age=3600";
        }
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 禁止访问敏感文件
    location ~* \.(sql|bak|backup|log)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 限制请求大小
    client_max_body_size 64M;
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

### 4. 创建IP地址专用Nginx Dockerfile

```dockerfile
# docker/nginx/Dockerfile.ip
# 多阶段构建：先构建前端，再构建nginx
FROM node:18-alpine as frontend-builder

# 设置工作目录
WORKDIR /app

# 复制前端package文件
COPY frontend/package*.json ./

# 安装依赖
RUN npm ci

# 复制前端源代码
COPY frontend/ ./

# 设置环境变量（HTTP版本）
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# 构建前端应用
RUN npm run build

# 第二阶段：构建nginx镜像
FROM nginx:alpine

# 安装必要的工具
RUN apk add --no-cache curl

# 复制前端构建结果
COPY --from=frontend-builder /app/build /usr/share/nginx/html

# 复制nginx配置文件（IP版本）
COPY nginx/conf.d/ip.conf /etc/nginx/conf.d/default.conf

# 创建nginx用户和组（如果不存在）
RUN addgroup -g 101 -S nginx || true
RUN adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# 设置正确的权限
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /var/log/nginx

# 创建nginx运行时需要的目录
RUN mkdir -p /var/cache/nginx/client_temp
RUN mkdir -p /var/cache/nginx/proxy_temp
RUN mkdir -p /var/cache/nginx/fastcgi_temp
RUN mkdir -p /var/cache/nginx/uwsgi_temp
RUN mkdir -p /var/cache/nginx/scgi_temp

# 设置权限
RUN chown -R nginx:nginx /var/cache/nginx

# 暴露端口（只有80端口）
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 5. 创建IP地址部署脚本

```bash
#!/bin/bash
# deploy-ip.sh - IP地址部署脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取服务器IP地址
get_server_ip() {
    # 尝试获取公网IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")
    
    # 获取内网IP
    PRIVATE_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ip route get 1 | awk '{print $7}' 2>/dev/null || echo "")
    
    echo "检测到的IP地址："
    if [ ! -z "$PUBLIC_IP" ]; then
        echo "  公网IP: $PUBLIC_IP"
    fi
    if [ ! -z "$PRIVATE_IP" ]; then
        echo "  内网IP: $PRIVATE_IP"
    fi
    
    echo ""
    echo "请选择要使用的IP地址："
    echo "1) 公网IP: $PUBLIC_IP"
    echo "2) 内网IP: $PRIVATE_IP"
    echo "3) 手动输入IP地址"
    
    read -p "请选择 (1-3): " choice
    
    case $choice in
        1)
            if [ ! -z "$PUBLIC_IP" ]; then
                SERVER_IP=$PUBLIC_IP
            else
                print_error "无法获取公网IP"
                exit 1
            fi
            ;;
        2)
            if [ ! -z "$PRIVATE_IP" ]; then
                SERVER_IP=$PRIVATE_IP
            else
                print_error "无法获取内网IP"
                exit 1
            fi
            ;;
        3)
            read -p "请输入IP地址: " SERVER_IP
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac
    
    print_message "使用IP地址: $SERVER_IP"
}

# 创建IP配置文件
create_ip_config() {
    print_message "创建IP地址配置文件..."
    
    if [ ! -f ".env.production.ip" ]; then
        cp env.production.example .env.production.ip
    fi
    
    # 更新配置文件中的IP地址
    sed -i "s/DOMAIN_NAME=.*/DOMAIN_NAME=$SERVER_IP/" .env.production.ip
    sed -i "s|WP_HOME=.*|WP_HOME=http://$SERVER_IP|" .env.production.ip
    sed -i "s|WP_SITEURL=.*|WP_SITEURL=http://$SERVER_IP|" .env.production.ip
    sed -i "s/USE_SSL=.*/USE_SSL=false/" .env.production.ip
    
    print_message "配置文件已更新"
}

# 检查必要工具
check_requirements() {
    print_message "检查系统要求..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_message "系统要求检查通过"
}

# 停止现有服务
stop_services() {
    print_message "停止现有服务..."
    
    if docker-compose -f docker/prod/docker-compose.ip.yml ps | grep -q "Up"; then
        docker-compose -f docker/prod/docker-compose.ip.yml down
    fi
    
    print_message "现有服务已停止"
}

# 启动服务
start_services() {
    print_message "启动IP地址部署服务..."
    
    # 设置环境变量
    export $(cat .env.production.ip | xargs)
    
    # 构建并启动服务
    docker-compose -f docker/prod/docker-compose.ip.yml build --no-cache
    docker-compose -f docker/prod/docker-compose.ip.yml up -d
    
    print_message "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_message "等待服务就绪..."
    
    # 等待MySQL就绪
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker/prod/docker-compose.ip.yml exec -T mysql \
           mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    # 等待WordPress就绪
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost/wp-admin/admin-ajax.php &> /dev/null; then
            break
        fi
        sleep 5
        timeout=$((timeout-5))
    done
    
    print_message "所有服务已就绪"
}

# 显示部署信息
show_deployment_info() {
    print_message "部署完成！"
    echo ""
    echo "访问信息："
    echo "  前端应用: http://$SERVER_IP"
    echo "  WordPress管理后台: http://$SERVER_IP/wp-admin"
    echo "  API接口: http://$SERVER_IP/wp-json/bjt/v1"
    echo ""
    echo "注意事项："
    echo "  - 使用HTTP协议（无SSL加密）"
    echo "  - 确保防火墙开放80端口"
    echo "  - 如果是云服务器，检查安全组设置"
    echo ""
    echo "服务状态："
    docker-compose -f docker/prod/docker-compose.ip.yml ps
}

# 主函数
main() {
    print_message "开始IP地址部署 BJT 产品管理系统..."
    
    check_requirements
    get_server_ip
    create_ip_config
    stop_services
    start_services
    wait_for_services
    show_deployment_info
}

# 执行主函数
main "$@"
```

---

## 🏠 方案二：本地网络部署

### 适用场景
- 内网环境
- 开发测试
- 局域网访问

### 配置步骤

1. **使用localhost或内网IP**
```bash
# .env.production.local
DOMAIN_NAME=localhost
WP_HOME=http://localhost
WP_SITEURL=http://localhost
USE_SSL=false
```

2. **端口映射**
```yaml
# docker-compose.local.yml
services:
  nginx:
    ports:
      - "8080:80"  # 避免与其他服务冲突
```

3. **访问地址**
```
前端: http://localhost:8080
API: http://localhost:8080/wp-json/bjt/v1
管理后台: http://localhost:8080/wp-admin
```

---

## 🆓 方案三：使用免费域名服务

### 免费域名提供商
1. **Freenom** (免费.tk, .ml, .ga域名)
2. **No-IP** (免费动态DNS)
3. **DuckDNS** (免费子域名)
4. **Cloudflare** (免费DNS + CDN)

### 使用DuckDNS示例

1. **注册DuckDNS账号**
   - 访问 https://www.duckdns.org
   - 创建子域名：`yourapp.duckdns.org`

2. **配置动态DNS**
```bash
# 安装DuckDNS更新脚本
echo "curl 'https://www.duckdns.org/update?domains=yourapp&token=your-token&ip=' >/dev/null 2>&1" > /etc/cron.d/duckdns
```

3. **使用域名部署**
```bash
# .env.production
DOMAIN_NAME=yourapp.duckdns.org
WP_HOME=https://yourapp.duckdns.org
WP_SITEURL=https://yourapp.duckdns.org
```

---

## 🔧 部署命令总结

### IP地址部署
```bash
# 给脚本执行权限
chmod +x deploy-ip.sh

# 执行IP地址部署
./deploy-ip.sh
```

### 本地部署
```bash
# 使用本地配置
docker-compose -f docker/prod/docker-compose.local.yml up -d
```

### 免费域名部署
```bash
# 使用标准部署脚本
./deploy.sh
```

---

## ⚠️ 注意事项

### 安全考虑
1. **HTTP vs HTTPS**: IP地址部署通常使用HTTP，安全性较低
2. **防火墙设置**: 确保开放必要端口
3. **访问控制**: 考虑IP白名单限制

### 网络配置
1. **云服务器**: 检查安全组设置
2. **内网部署**: 确保网络可达性
3. **端口冲突**: 避免与其他服务冲突

### 性能优化
1. **缓存策略**: HTTP环境下的缓存配置
2. **CDN**: 考虑使用免费CDN服务
3. **监控**: 设置基本的服务监控

选择最适合你环境的部署方案，IP地址部署是最简单直接的方式！ 