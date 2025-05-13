#!/bin/bash
# 前端部署脚本
set -e

# 解压构建产物
tar -xzvf frontend-dist.tar.gz

# 创建需要的目录和配置
mkdir -p docker/dev/nginx
cat > docker/dev/nginx/frontend.conf << 'EOC'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /wp-json/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }

    location /wp-admin/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
}
EOC

# 清理旧容器
podman pod rm -f dev || true

# 创建新Pod
podman pod create --name=dev --share=net -p 80:80 -p 8080:8080 -p 3306:3306

# 创建前端Dockerfile
cat > docker/dev/nginx/Dockerfile.prod << 'EOC'
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY docker/dev/nginx/frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EOC

# 构建并运行前端
podman build -t local/frontend -f docker/dev/nginx/Dockerfile.prod .
podman run --pod=dev --name=frontend -d local/frontend

# 运行MySQL
podman run --pod=dev --name=mysql \
  -v mysql_data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=bjt_product \
  -e MYSQL_USER=wordpress \
  -e MYSQL_PASSWORD=wordpress \
  -d mysql:8.0 --default-authentication-plugin=mysql_native_password

# 运行WordPress
podman run --pod=dev --name=wordpress \
  -v ./wordpress:/var/www/html \
  -v ./plugins:/var/www/html/wp-content/plugins \
  -e WORDPRESS_DB_HOST=localhost \
  -e WORDPRESS_DB_USER=wordpress \
  -e WORDPRESS_DB_PASSWORD=wordpress \
  -e WORDPRESS_DB_NAME=bjt_product \
  -e WORDPRESS_DEBUG=1 \
  -d wordpress

echo "部署完成，访问 http://<服务器IP>/"
