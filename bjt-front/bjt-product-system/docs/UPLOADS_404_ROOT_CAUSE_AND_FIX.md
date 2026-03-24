# Uploads 404 根本原因分析和修复方案

## 🔍 根本原因（Root Cause）

### 问题1: Nginx `try_files` 在 `alias` location 中的行为问题

**当前配置**：
```nginx
location /uploads/ {
    alias /usr/share/nginx/html/uploads/;
    try_files $uri @wordpress_uploads;
}
```

**问题**：
1. 当使用 `alias` 时，`try_files` 会先检查 alias 路径（`/usr/share/nginx/html/uploads/product_lines/...`）
2. 如果文件不存在，`try_files` 应该跳转到 `@wordpress_uploads`
3. **但是**：`try_files` 在 alias location 中，如果目录存在但文件不存在，可能不会正确跳转
4. 更严重的是：如果 alias 路径的目录不存在，`try_files` 可能直接返回 404，而不跳转到 named location

### 问题2: Apache Alias 配置可能未生效

**已添加的配置**：
```apache
Alias /uploads /var/www/html/frontend/public/uploads
```

**问题**：
- 如果 WordPress 镜像没有重新构建，Apache 配置不会生效
- 需要确认配置是否已部署到容器中

### 问题3: 路径映射不完整

**请求路径**: `/uploads/product_lines/Paper%20Cushioning%20Machine.jpg`
**实际文件**: `/var/www/html/frontend/public/uploads/product-lines/images/Paper Cushioning Machine.jpg`

**路径差异**：
- `product_lines` (下划线) → `product-lines` (连字符)
- 缺少 `images/` 子目录
- URL编码：`%20` → 空格

## ✅ 验证方法

### 步骤1: 运行诊断脚本

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system
./scripts/diagnose-uploads-root-cause.sh
```

### 步骤2: 手动验证文件位置

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system
COMPOSE=$(test -f .env.production && echo "docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml" || echo "docker compose -f docker/prod/docker-compose.prod.yml")

# 1. 检查文件是否存在
$COMPOSE exec wordpress find /var/www/html/frontend/public/uploads -iname "*paper*cushioning*" -o -iname "*cushioning*machine*" 2>/dev/null

# 2. 检查Apache配置
$COMPOSE exec wordpress cat /etc/apache2/sites-enabled/000-default.conf | grep -i "Alias.*uploads"

# 3. 测试Apache Alias
$COMPOSE exec nginx curl -I "http://wordpress:80/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg" 2>/dev/null | head -1

# 4. 检查Nginx配置
$COMPOSE exec nginx cat /etc/nginx/conf.d/production.conf | grep -A 20 "location /uploads/"

# 5. 检查Nginx错误日志
$COMPOSE exec nginx tail -20 /var/log/nginx/error.log | grep -i "upload\|404"
```

### 步骤3: 测试完整请求流程

```bash
# 从Nginx容器内部测试
$COMPOSE exec nginx curl -v "http://localhost/uploads/product_lines/Paper%20Cushioning%20Machine.jpg" 2>&1 | grep -E "HTTP|X-Served-By|Location"
```

## 🔧 修复方案

### 方案1: 修复Nginx配置（推荐 - 立即生效）

**问题**：`try_files` 在 alias location 中可能不会正确跳转

**解决方案**：使用 `error_page` 或直接代理

#### 选项A: 使用 error_page（推荐）

```nginx
location /uploads/ {
    alias /usr/share/nginx/html/uploads/;
    
    # 先尝试直接提供文件
    try_files $uri =404;
    
    # 如果404，使用error_page跳转到WordPress
    error_page 404 = @wordpress_uploads;
}

location @wordpress_uploads {
    # 重写URL路径
    rewrite ^/uploads/product_lines/(.*)$ /frontend/public/uploads/product-lines/images/$1 break;
    rewrite ^/uploads/(.*)$ /frontend/public/uploads/$1 break;
    
    proxy_pass http://wordpress:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    add_header X-Served-By "wordpress-proxy";
}
```

#### 选项B: 直接代理（更简单）

```nginx
location /uploads/ {
    # 直接代理到WordPress，让WordPress处理路径映射
    rewrite ^/uploads/product_lines/(.*)$ /frontend/public/uploads/product-lines/images/$1 break;
    rewrite ^/uploads/(.*)$ /frontend/public/uploads/$1 break;
    
    proxy_pass http://wordpress:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    add_header X-Served-By "wordpress-proxy";
    
    # 静态文件缓存
    expires 1d;
    add_header Cache-Control "public, max-age=86400";
}
```

### 方案2: 确保Apache配置生效

**步骤**：
1. 确认 `docker/wordpress/apache.conf` 已包含 Alias 配置
2. 重新构建 WordPress 镜像
3. 重启 WordPress 容器

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml build wordpress
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml up -d wordpress
```

### 方案3: 完整修复（推荐组合）

**同时修复Nginx和Apache配置**：

1. **修改Nginx配置**（使用选项B - 直接代理）
2. **确保Apache配置已部署**
3. **重新加载服务**

## 📝 实施步骤

### 步骤1: 修改Nginx配置

编辑 `nginx/conf.d/production.conf`：

```nginx
# 上传文件目录 - 直接代理到WordPress
location /uploads/ {
    # 重写URL路径，处理路径差异
    # 1. product_lines -> product-lines/images
    rewrite ^/uploads/product_lines/(.*)$ /frontend/public/uploads/product-lines/images/$1 break;
    
    # 2. 其他uploads路径
    rewrite ^/uploads/(.*)$ /frontend/public/uploads/$1 break;
    
    # 代理到WordPress
    proxy_pass http://wordpress:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    add_header X-Served-By "wordpress-proxy";
    
    # 静态文件缓存
    expires 1d;
    add_header Cache-Control "public, max-age=86400";
    
    # 安全设置 - 禁止执行脚本文件
    location ~* \.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$ {
        deny all;
    }
}
```

### 步骤2: 确认Apache配置

确认 `docker/wordpress/apache.conf` 包含：

```apache
Alias /uploads /var/www/html/frontend/public/uploads

<Directory /var/www/html/frontend/public/uploads>
    Options -Indexes +FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
```

### 步骤3: 部署修复

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system

# 1. 重新构建WordPress镜像（包含Apache配置）
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml build wordpress

# 2. 重启服务
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml up -d wordpress nginx

# 3. 重新加载Nginx配置（不中断服务）
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml exec nginx nginx -s reload

# 4. 验证修复
curl -I https://eorder.lockedair.com/uploads/product_lines/Paper%20Cushioning%20Machine.jpg
```

### 步骤4: 验证修复

```bash
# 1. 检查Nginx配置
$COMPOSE exec nginx nginx -t

# 2. 测试请求
curl -v https://eorder.lockedair.com/uploads/product_lines/Paper%20Cushioning%20Machine.jpg 2>&1 | grep -E "HTTP|X-Served-By"

# 应该看到：
# HTTP/1.1 200 OK
# X-Served-By: wordpress-proxy
```

## 🎯 为什么这个方案有效

1. **直接代理**：避免了 `try_files` 在 alias location 中的复杂行为
2. **路径重写**：在Nginx层面处理路径差异（`product_lines` → `product-lines/images`）
3. **Apache Alias**：作为双重保障，即使Nginx rewrite有问题，Apache也能处理
4. **立即生效**：Nginx配置修改后只需reload，不需要重建镜像

## ⚠️ 注意事项

1. **性能**：直接代理会绕过Nginx的静态文件服务，所有请求都经过WordPress
   - 如果文件很多，考虑将文件同步到volume以提高性能

2. **路径一致性**：建议统一使用 `product-lines`（连字符）而不是 `product_lines`（下划线）

3. **文件位置**：文件在 `frontend/public/uploads/`，不在volume中
   - 容器重建时可能丢失
   - 建议定期备份或迁移到volume

---

**最后更新**: 2024-01-13
