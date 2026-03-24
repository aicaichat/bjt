# 生产环境Upload配置详细分析

## 📋 配置概览

### 1. Docker Compose 挂载配置

#### Nginx容器挂载
```yaml
volumes:
  - ../../frontend/dist:/usr/share/nginx/html          # 前端构建输出
  - ../../frontend:/var/www/html/frontend:ro           # 前端源码（只读）
  - uploads_data:/usr/share/nginx/html/uploads:rw     # uploads volume（读写）
```

**实际路径映射**：
- 容器内：`/usr/share/nginx/html/uploads/` → Docker volume `uploads_data`
- 容器内：`/usr/share/nginx/html/` → 本地 `frontend/dist/`

#### WordPress容器挂载
```yaml
volumes:
  - ../../backend:/var/www/html                         # WordPress根目录
  - ../../frontend:/var/www/html/frontend              # 前端源码（读写）
  - uploads_data:/var/www/html/wp-content/uploads      # uploads volume
```

**实际路径映射**：
- 容器内：`/var/www/html/` → 本地 `backend/`（ABSPATH）
- 容器内：`/var/www/html/frontend/` → 本地 `frontend/`
- 容器内：`/var/www/html/wp-content/uploads/` → Docker volume `uploads_data`

### 2. Plugin上传代码逻辑

#### 文件位置
`plugins/bjt-core-entities/controllers/class-upload-controller.php`

#### 关键函数：`prepare_generic_upload_directory()`

```php
// 第643-661行
private function prepare_generic_upload_directory($upload_dir) {
    // 1. 规范化路径：确保以 frontend/public/ 开头
    if (strpos($upload_dir, 'frontend/public/') !== 0) {
        $upload_dir = 'frontend/public/' . ltrim($upload_dir, '/');
    }
    // 输入: "uploads/product-lines/images"
    // 输出: "frontend/public/uploads/product-lines/images"
    
    // 2. 构建完整路径
    $base_dir = ABSPATH . $upload_dir;
    // ABSPATH = /var/www/html/
    // 结果: /var/www/html/frontend/public/uploads/product-lines/images
    
    // 3. 生成URL路径
    $relative_path = str_replace('frontend/public/', '', $upload_dir);
    // 输入: "frontend/public/uploads/product-lines/images"
    // 输出: "uploads/product-lines/images"
    
    $base_url = '/' . ltrim($relative_path, '/');
    // 结果: "/uploads/product-lines/images"
    
    return [
        'upload_path' => $base_dir,  // 实际保存路径
        'upload_url' => $base_url,   // 访问URL路径
    ];
}
```

#### 上传流程

1. **前端发送**：
   ```typescript
   uploadPath="/uploads/product-lines/images/"
   upload_dir: "uploads/product-lines/images"  // 去掉首尾斜杠
   ```

2. **Plugin处理**：
   ```
   upload_dir: "uploads/product-lines/images"
     ↓
   规范化: "frontend/public/uploads/product-lines/images"
     ↓
   完整路径: ABSPATH + "frontend/public/uploads/product-lines/images"
     ↓
   实际保存: /var/www/html/frontend/public/uploads/product-lines/images/
     ↓
   生成URL: /uploads/product-lines/images/
   ```

3. **文件保存位置**：
   - WordPress容器：`/var/www/html/frontend/public/uploads/product-lines/images/`
   - 对应本地：`frontend/public/uploads/product-lines/images/`
   - **注意**：这个路径不在 `uploads_data` volume中！

### 3. Nginx配置

#### 文件位置
`nginx/conf.d/production.conf`

#### Uploads路由配置
```nginx
location /uploads/ {
    alias /usr/share/nginx/html/uploads/;  # 指向volume挂载点
    try_files $uri @wordpress_uploads;       # 如果不存在，代理到WordPress
}
```

**问题**：
- Nginx查找：`/usr/share/nginx/html/uploads/`（volume挂载点）
- Plugin保存：`/var/www/html/frontend/public/uploads/`（WordPress容器中的frontend目录）
- **这两个路径不匹配！**

## 🔍 问题根源

### 路径不匹配问题

1. **Plugin保存路径**：
   ```
   WordPress容器: /var/www/html/frontend/public/uploads/product-lines/images/
   本地映射: frontend/public/uploads/product-lines/images/
   ```

2. **Nginx访问路径**：
   ```
   Nginx容器: /usr/share/nginx/html/uploads/product-lines/images/
   Volume挂载: uploads_data volume
   ```

3. **问题**：
   - Plugin保存到 `frontend/public/uploads/`（WordPress容器）
   - Nginx从 `uploads_data` volume读取
   - **这两个位置不共享！**

### 为什么之前OK现在不行？

可能的原因：
1. **之前**：文件可能直接放在volume中，或通过其他方式同步
2. **现在**：Plugin保存到 `frontend/public/uploads/`，但volume中没有
3. **部署脚本**：只同步了 `public/uploads` 到 `dist/uploads`，但没有同步到volume

## ✅ 解决方案

### 方案1: 修改Plugin，保存到volume（推荐）

修改 `prepare_generic_upload_directory()`，让文件保存到volume挂载点：

```php
// 修改保存路径，直接保存到volume
$base_dir = '/var/www/html/wp-content/uploads/' . ltrim(str_replace('uploads/', '', $upload_dir), '/');
// 或者
$base_dir = '/var/www/html/wp-content/uploads/' . str_replace('frontend/public/uploads/', '', $upload_dir);
```

### 方案2: 修改Docker挂载，让两个容器共享

在docker-compose.prod.yml中，让WordPress的frontend/public/uploads也挂载到volume：

```yaml
wordpress:
  volumes:
    - uploads_data:/var/www/html/frontend/public/uploads:rw
```

### 方案3: 同步文件到volume（临时方案）

定期同步 `frontend/public/uploads` 到volume。

## 🔧 检查命令

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system && \
COMPOSE=$(test -f .env.production && echo "docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml" || echo "docker compose -f docker/prod/docker-compose.prod.yml") && \
echo "=== 完整路径映射检查 ===" && \
echo "" && \
echo "1. WordPress容器ABSPATH:" && \
$COMPOSE exec wordpress php -r "require '/var/www/html/wp-load.php'; echo ABSPATH;" 2>/dev/null || echo "无法获取" && \
echo "" && \
echo "2. Plugin实际保存路径:" && \
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product-lines/images/ 2>/dev/null | head -5 && \
echo "" && \
echo "3. Nginx容器访问路径:" && \
$COMPOSE exec nginx ls -la /usr/share/nginx/html/uploads/product-lines/images/ 2>/dev/null | head -5 && \
echo "" && \
echo "4. Volume挂载点:" && \
docker volume inspect bjt-product-system_uploads_data 2>/dev/null | grep -A 5 Mountpoint && \
echo "" && \
echo "5. 检查volume中的文件:" && \
docker run --rm -v bjt-product-system_uploads_data:/data alpine ls -la /data/product-lines/images/ 2>/dev/null | head -5 || echo "volume中不存在"
```

---

**最后更新**: 2024-01-13
