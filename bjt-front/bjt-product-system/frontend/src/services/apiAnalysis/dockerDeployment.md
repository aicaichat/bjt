# Docker 部署方案

## 1. 项目结构

```
product-management-system/
├── bjt-front/                # 前端项目
├── bjt-product-admin/        # WordPress后端项目
├── docker/                   # Docker配置文件目录
│   ├── nginx/               # Nginx配置
│   │   ├── conf.d/         # Nginx站点配置
│   │   └── nginx.conf      # Nginx主配置
│   ├── mysql/              # MySQL配置和数据
│   │   ├── conf.d/        # MySQL配置
│   │   └── data/          # MySQL数据目录
│   └── wordpress/          # WordPress配置
│       └── php.ini         # PHP配置
├── docker-compose.yml       # Docker编排配置
└── .env                     # 环境变量配置
```

## 2. Docker Compose 配置

```yaml
version: '3.8'

services:
  # MySQL服务
  mysql:
    image: mysql:8.0
    container_name: product-management-system-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - ./docker/mysql/data:/var/lib/mysql
      - ./docker/mysql/conf.d:/etc/mysql/conf.d
    networks:
      - bjt-network
    ports:
      - "3306:3306"

  # WordPress服务
  wordpress:
    image: wordpress:6.4-php8.1-fpm
    container_name: product-management-system-wordpress
    restart: always
    depends_on:
      - mysql
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_USER: ${MYSQL_USER}
      WORDPRESS_DB_PASSWORD: ${MYSQL_PASSWORD}
      WORDPRESS_DB_NAME: ${MYSQL_DATABASE}
      WORDPRESS_DEBUG: 1
    volumes:
      - ./bjt-product-admin:/var/www/html
      - ./docker/wordpress/php.ini:/usr/local/etc/php/conf.d/custom.ini
    networks:
      - bjt-network

  # React前端服务
  frontend:
    build:
      context: ./bjt-front
      dockerfile: Dockerfile
    container_name: product-management-system-frontend
    restart: always
    volumes:
      - ./bjt-front:/app
      - /app/node_modules
    networks:
      - bjt-network
    ports:
      - "3000:3000"

  # Nginx服务
  nginx:
    image: nginx:1.24
    container_name: product-management-system-nginx
    restart: always
    depends_on:
      - wordpress
      - frontend
    volumes:
      - ./bjt-product-admin:/var/www/html
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/nginx/conf.d:/etc/nginx/conf.d
    networks:
      - bjt-network
    ports:
      - "80:80"
      - "443:443"

networks:
  bjt-network:
    driver: bridge
```

## 3. 环境变量配置 (.env)

```env
# MySQL配置
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=bjt_product_db
MYSQL_USER=bjt_user
MYSQL_PASSWORD=your_password

# WordPress配置
WORDPRESS_DEBUG=1

# 前端配置
REACT_APP_API_URL=http://localhost/wp-json/bjt/v1
NODE_ENV=production
```

## 4. Nginx配置

### 4.1 主配置 (nginx.conf)
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    keepalive_timeout 65;
    
    include /etc/nginx/conf.d/*.conf;
}
```

### 4.2 站点配置 (conf.d/default.conf)
```nginx
server {
    listen 80;
    server_name localhost;
    
    # 前端应用
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WordPress API
    location /wp-json {
        root /var/www/html;
        try_files $uri $uri/ /index.php?$args;
        
        location ~ \.php$ {
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass wordpress:9000;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO $fastcgi_path_info;
        }
    }
    
    # WordPress管理后台
    location /wp-admin {
        root /var/www/html;
        try_files $uri $uri/ /index.php?$args;
        
        location ~ \.php$ {
            fastcgi_split_path_info ^(.+\.php)(/.+)$;
            fastcgi_pass wordpress:9000;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO $fastcgi_path_info;
        }
    }
}
```

## 5. 前端Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 6. 部署步骤

1. 安装Docker和Docker Compose
```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，设置相应的环境变量
```

3. 启动服务
```bash
# 首次启动
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

4. 初始化WordPress
```bash
# 进入WordPress容器
docker-compose exec wordpress bash

# 安装WP-CLI
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
chmod +x wp-cli.phar
mv wp-cli.phar /usr/local/bin/wp

# 初始化WordPress
wp core install --url=http://localhost --title="BJT Product Management" --admin_user=admin --admin_password=your_password --admin_email=admin@example.com

# 激活插件
wp plugin activate bjt-product-admin
```

## 7. 维护命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新服务
docker-compose pull
docker-compose up -d

# 查看日志
docker-compose logs -f [service_name]

# 进入容器
docker-compose exec [service_name] bash

# 备份数据库
docker-compose exec mysql mysqldump -u root -p bjt_product_db > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u root -p bjt_product_db < backup.sql
```

## 8. 注意事项

1. 安全配置
   - 修改默认密码
   - 配置SSL证书
   - 限制管理后台访问IP
   - 设置防火墙规则

2. 性能优化
   - 配置MySQL缓存
   - 配置Nginx缓存
   - 配置PHP-FPM参数
   - 使用Redis缓存（可选）

3. 备份策略
   - 定期备份数据库
   - 备份WordPress文件
   - 备份配置文件
   - 设置自动备份脚本

4. 监控方案
   - 配置容器健康检查
   - 设置资源使用告警
   - 监控服务状态
   - 配置日志聚合 