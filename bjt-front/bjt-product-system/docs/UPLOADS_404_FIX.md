# Uploads 404问题修复方案

## 问题描述

访问 `/uploads/product_lines/Paper%20Cushioning%20Machine.jpg` 时返回 404。

## 根本原因

1. **文件实际位置**：`/var/www/html/frontend/public/uploads/product-lines/images/`
2. **请求路径**：`/uploads/product_lines/...`（注意：下划线 vs 连字符）
3. **Nginx代理到WordPress时**：WordPress的Apache在 `/var/www/html/uploads/` 查找，但文件不在那里

## 修复方案

### 1. Nginx配置修复（已完成）

修改了 `nginx/conf.d/production.conf` 中的 `@wordpress_uploads` location：

```nginx
location @wordpress_uploads {
    # 1. 处理 product_lines -> product-lines/images 的映射
    rewrite ^/uploads/product_lines/(.*)$ /frontend/public/uploads/product-lines/images/$1 break;
    
    # 2. 处理其他 uploads 路径
    rewrite ^/uploads/(.*)$ /frontend/public/uploads/$1 break;
    
    proxy_pass http://wordpress:80;
    ...
}
```

**作用**：
- 将 `/uploads/product_lines/xxx.jpg` 重写为 `/frontend/public/uploads/product-lines/images/xxx.jpg`
- 将其他 `/uploads/xxx` 重写为 `/frontend/public/uploads/xxx`

### 2. Apache配置修复（已完成）

修改了 `docker/wordpress/apache.conf`，添加了Alias：

```apache
# 映射 /uploads/ 到 frontend/public/uploads/ 目录
Alias /uploads /var/www/html/frontend/public/uploads

<Directory /var/www/html/frontend/public/uploads>
    Options -Indexes +FollowSymLinks
    AllowOverride None
    Require all granted
    ...
</Directory>
```

**作用**：
- 当请求 `/uploads/...` 时，Apache会从 `/var/www/html/frontend/public/uploads/` 提供文件
- 作为Nginx rewrite的备用方案

## 部署步骤

### 1. 重新构建WordPress镜像（包含Apache配置修改）

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system
docker compose -f docker/prod/docker-compose.prod.yml build wordpress
```

### 2. 重新加载Nginx配置

```bash
# 方法1：重启Nginx容器
docker compose -f docker/prod/docker-compose.prod.yml restart nginx

# 方法2：重新加载配置（不中断服务）
docker compose -f docker/prod/docker-compose.prod.yml exec nginx nginx -s reload
```

### 3. 验证修复

```bash
# 测试URL访问
curl -I https://eorder.lockedair.com/uploads/product_lines/Paper%20Cushioning%20Machine.jpg

# 应该返回 200 OK
```

## 路径映射关系

### 请求流程

```
用户请求: /uploads/product_lines/Paper%20Cushioning%20Machine.jpg
    ↓
Nginx: 检查 /usr/share/nginx/html/uploads/product_lines/... (volume，可能为空)
    ↓ (文件不存在)
Nginx: try_files 触发 @wordpress_uploads
    ↓
Nginx rewrite: /frontend/public/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg
    ↓
代理到: http://wordpress:80/frontend/public/uploads/product-lines/images/...
    ↓
Apache: 通过Alias /uploads -> /var/www/html/frontend/public/uploads
    ↓
实际文件: /var/www/html/frontend/public/uploads/product-lines/images/Paper Cushioning Machine.jpg
    ↓
返回文件 ✅
```

### 路径转换表

| 请求路径 | Nginx Rewrite后 | Apache Alias后 | 实际文件路径 |
|---------|----------------|----------------|-------------|
| `/uploads/product_lines/xxx.jpg` | `/frontend/public/uploads/product-lines/images/xxx.jpg` | `/var/www/html/frontend/public/uploads/product-lines/images/xxx.jpg` | ✅ |
| `/uploads/product-lines/images/xxx.jpg` | `/frontend/public/uploads/product-lines/images/xxx.jpg` | `/var/www/html/frontend/public/uploads/product-lines/images/xxx.jpg` | ✅ |
| `/uploads/other/xxx.jpg` | `/frontend/public/uploads/other/xxx.jpg` | `/var/www/html/frontend/public/uploads/other/xxx.jpg` | ✅ |

## 注意事项

1. **路径命名不一致**：
   - 旧数据使用 `product_lines`（下划线）
   - 新上传使用 `product-lines`（连字符）
   - 修复方案同时支持两种格式

2. **文件位置**：
   - 文件保存在 `frontend/public/uploads/`，不在volume中
   - 这可能导致容器重建时文件丢失（需要备份）

3. **性能考虑**：
   - Nginx优先从volume提供文件（更快）
   - 如果volume中没有，才代理到WordPress
   - 建议将文件同步到volume以提高性能

## 后续优化建议

1. **统一路径命名**：将数据库中的 `product_lines` 更新为 `product-lines`
2. **文件同步**：定期将 `frontend/public/uploads/` 同步到volume
3. **修改Plugin**：让新上传的文件直接保存到volume

---

**修复完成时间**: 2024-01-13
