# Nginx路由问题分析

## ✅ 你的观察很对！

**是的，Nginx在Docker里，而且配置了备用路由！**

## 📋 当前配置分析

### 1. Nginx在Docker中

从 `docker-compose.prod.yml` 可以看到：
```yaml
nginx:
  build:
    context: ../../
    dockerfile: docker/nginx/Dockerfile.prod
  ports:
    - "80:80"
    - "443:443"
```

**Nginx确实运行在Docker容器中。**

### 2. Nginx配置了备用路由

从 `nginx/conf.d/production.conf` 第106-140行：

```nginx
location /uploads/ {
    # 优先从nginx的uploads目录提供文件
    alias /usr/share/nginx/html/uploads/;
    
    # 如果nginx目录中没有，尝试从WordPress目录
    try_files $uri @wordpress_uploads;
    ...
}

# 备用路由：通过WordPress提供上传文件
location @wordpress_uploads {
    proxy_pass http://wordpress:80;
    ...
}
```

**配置逻辑**：
1. 首先尝试从 `/usr/share/nginx/html/uploads/` 提供文件
2. 如果找不到，使用 `try_files` 代理到WordPress

## ⚠️ 但是有个问题！

### `try_files` 在 `alias` location中的行为

**关键问题**：在Nginx中，当 `location` 块使用 `alias` 时，`try_files` 的行为可能不符合预期。

#### 问题1: `try_files` 和 `alias` 的路径处理

```nginx
location /uploads/ {
    alias /usr/share/nginx/html/uploads/;  # alias会改变路径
    try_files $uri @wordpress_uploads;     # $uri是原始请求路径
}
```

**当请求 `/uploads/product_lines/file.jpg` 时**：
- `$uri` = `/uploads/product_lines/file.jpg`
- `alias` 会将路径映射为 `/usr/share/nginx/html/uploads/product_lines/file.jpg`
- 如果文件不存在，`try_files` 会尝试查找 `$uri`，但 `$uri` 仍然是原始路径
- 然后跳转到 `@wordpress_uploads`，代理请求到 `http://wordpress:80/uploads/product_lines/file.jpg`

#### 问题2: WordPress容器内的路径映射

**WordPress容器内的文件位置**：
```
/var/www/html/frontend/public/uploads/product-lines/images/file.jpg
```

**但WordPress的web服务器（Apache）的DocumentRoot通常是**：
```
/var/www/html/
```

**所以当Nginx代理请求到WordPress时**：
- 请求：`http://wordpress:80/uploads/product_lines/file.jpg`
- WordPress查找：`/var/www/html/uploads/product_lines/file.jpg`
- **但实际文件在**：`/var/www/html/frontend/public/uploads/product-lines/images/file.jpg`

**路径不匹配！**

## 🔍 验证步骤

运行诊断脚本检查实际情况：

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system && \
./scripts/check-nginx-uploads-routing.sh
```

或者手动检查：

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system && \
COMPOSE=$(test -f .env.production && echo "docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml" || echo "docker compose -f docker/prod/docker-compose.prod.yml") && \
echo "=== 1. 检查Nginx容器内的文件 ===" && \
$COMPOSE exec nginx ls -la /usr/share/nginx/html/uploads/product_lines/ 2>/dev/null || echo "不存在" && \
echo "" && \
echo "=== 2. 检查WordPress容器内的文件 ===" && \
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product-lines/images/ 2>/dev/null | head -5 && \
echo "" && \
echo "=== 3. 检查WordPress的DocumentRoot ===" && \
$COMPOSE exec wordpress cat /etc/apache2/sites-enabled/000-default.conf 2>/dev/null | grep -i "DocumentRoot" && \
echo "" && \
echo "=== 4. 测试Nginx代理到WordPress ===" && \
$COMPOSE exec nginx curl -I http://wordpress:80/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg 2>/dev/null | head -3
```

## ✅ 解决方案

### 方案1: 修复Nginx的try_files配置（推荐）

修改 `nginx/conf.d/production.conf`：

```nginx
location /uploads/ {
    # 先尝试从nginx的uploads目录提供文件
    alias /usr/share/nginx/html/uploads/;
    
    # 修复：使用正确的try_files语法
    try_files $uri $uri/ @wordpress_uploads;
    
    # 或者更明确的方式：
    # try_files $uri =404;
    # error_page 404 = @wordpress_uploads;
}

location @wordpress_uploads {
    # 代理到WordPress，但需要处理路径
    # 因为WordPress中的文件在 /var/www/html/frontend/public/uploads/
    # 需要重写URL或配置WordPress的Alias
    rewrite ^/uploads/(.*)$ /frontend/public/uploads/$1 break;
    proxy_pass http://wordpress:80;
    ...
}
```

### 方案2: 在WordPress容器中配置Alias

修改WordPress的Apache配置，添加Alias：

```apache
Alias /uploads /var/www/html/frontend/public/uploads
```

这样当Nginx代理 `/uploads/...` 到WordPress时，Apache会正确映射到 `frontend/public/uploads/`。

### 方案3: 修改Nginx直接代理到WordPress的frontend目录

```nginx
location /uploads/ {
    # 直接代理到WordPress的frontend目录
    rewrite ^/uploads/(.*)$ /frontend/public/uploads/$1 break;
    proxy_pass http://wordpress:80;
    ...
}
```

## 🎯 最可能的原因

**你的判断很可能是对的！** 问题可能是：

1. ✅ **文件确实存在** - 在WordPress容器的 `frontend/public/uploads/` 中
2. ✅ **Nginx配置了备用路由** - `try_files` 应该会代理到WordPress
3. ❌ **但路径映射不对** - WordPress的web服务器找不到文件，因为：
   - 请求路径：`/uploads/product_lines/file.jpg`
   - 实际文件：`/var/www/html/frontend/public/uploads/product-lines/images/file.jpg`
   - WordPress的DocumentRoot：`/var/www/html/`
   - **路径不匹配！**

## 📝 下一步

1. **运行诊断脚本**，确认文件位置
2. **检查WordPress的Apache配置**，确认DocumentRoot和Alias
3. **修复路径映射**，让Nginx代理时能正确找到文件

---

**总结**：你的观察很准确！问题很可能是Nginx路由配置，而不是文件不存在。需要修复路径映射。
