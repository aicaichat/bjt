# Docker Compose Upload配置问题详细分析

## 🔍 问题诊断

### 当前配置分析

#### 1. Nginx容器挂载配置（第16-23行）

```yaml
volumes:
  - ../../frontend/dist:/usr/share/nginx/html          # 前端构建输出
  - ../../frontend:/var/www/html/frontend:ro           # 前端源码（只读）
  - uploads_data:/usr/share/nginx/html/uploads:rw     # uploads volume（读写）
```

**路径映射**：
- Nginx容器内：`/usr/share/nginx/html/uploads/` → Docker volume `uploads_data`
- Nginx容器内：`/usr/share/nginx/html/` → 本地 `frontend/dist/`

#### 2. WordPress容器挂载配置（第86-92行）

```yaml
volumes:
  - ../../backend:/var/www/html                        # WordPress根目录（ABSPATH）
  - ../../frontend:/var/www/html/frontend             # 前端源码（读写）
  - uploads_data:/var/www/html/wp-content/uploads     # uploads volume
```

**路径映射**：
- WordPress容器内：`/var/www/html/` → 本地 `backend/`（**ABSPATH**）
- WordPress容器内：`/var/www/html/frontend/` → 本地 `frontend/`
- WordPress容器内：`/var/www/html/wp-content/uploads/` → Docker volume `uploads_data`

### 问题根源

#### Plugin保存路径流程

1. **前端发送**（ProductLineEditPage.tsx:459）：
   ```typescript
   uploadPath="/uploads/product-lines/images/"
   ```
   发送到后端：`upload_dir: "uploads/product-lines/images"`

2. **Plugin处理**（class-upload-controller.php:643-757）：
   ```php
   // 规范化路径
   $upload_dir = 'frontend/public/' . ltrim($upload_dir, '/');
   // 结果: "frontend/public/uploads/product-lines/images"
   
   // 构建完整路径
   $base_dir = ABSPATH . $upload_dir;
   // ABSPATH = /var/www/html/
   // 结果: /var/www/html/frontend/public/uploads/product-lines/images/
   ```

3. **实际保存位置**：
   ```
   WordPress容器: /var/www/html/frontend/public/uploads/product-lines/images/
   ↓ (挂载映射)
   本地: frontend/public/uploads/product-lines/images/
   ```

#### Nginx访问路径

```
Nginx容器: /usr/share/nginx/html/uploads/product-lines/images/
↓ (volume挂载)
Docker volume: uploads_data
```

### ❌ 核心问题

**路径不匹配**：

| 组件 | 路径 | 类型 |
|------|------|------|
| **Plugin保存** | `/var/www/html/frontend/public/uploads/` | 本地目录挂载 (`../../frontend`) |
| **Nginx访问** | `/usr/share/nginx/html/uploads/` | Docker volume (`uploads_data`) |
| **WordPress volume** | `/var/www/html/wp-content/uploads/` | Docker volume (`uploads_data`) |

**结果**：
- ✅ Plugin成功保存文件到 `frontend/public/uploads/`
- ❌ Nginx从volume读取，找不到文件
- ❌ 两个路径完全不共享！

## 📊 路径映射关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    WordPress容器                              │
│                                                               │
│  ABSPATH = /var/www/html/                                    │
│  ├── backend/ (挂载: ../../backend)                          │
│  ├── frontend/ (挂载: ../../frontend)                        │
│  │   └── public/                                             │
│  │       └── uploads/  ← Plugin保存到这里                    │
│  │           └── product-lines/images/                       │
│  └── wp-content/                                             │
│      └── uploads/ (挂载: uploads_data volume)               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
                   本地文件系统
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Nginx容器                                  │
│                                                               │
│  /usr/share/nginx/html/                                      │
│  ├── (挂载: ../../frontend/dist)                              │
│  └── uploads/ (挂载: uploads_data volume)                    │
│      └── product-lines/images/  ← Nginx从这里读取，但为空！   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## ✅ 解决方案

### 方案1: 修改Plugin保存到volume（推荐）

修改 `class-upload-controller.php`，让文件保存到volume挂载点：

```php
// 修改 prepare_generic_upload_directory() 函数
private function prepare_generic_upload_directory($upload_dir) {
    // 如果路径以 uploads/ 开头，保存到 wp-content/uploads
    if (strpos($upload_dir, 'uploads/') === 0 || strpos($upload_dir, '/uploads/') === 0) {
        // 移除 uploads/ 前缀
        $relative_path = preg_replace('#^/?uploads/#', '', $upload_dir);
        $base_dir = ABSPATH . 'wp-content/uploads/' . $relative_path;
        $base_url = '/wp-content/uploads/' . $relative_path;
    } else {
        // 保持原有逻辑（用于其他路径）
        // ... 现有代码 ...
    }
}
```

**优点**：
- ✅ 文件直接保存到volume，Nginx可以立即访问
- ✅ 不需要修改Docker配置
- ✅ 符合WordPress标准uploads目录结构

**缺点**：
- ⚠️ 需要修改Plugin代码
- ⚠️ URL路径会从 `/uploads/` 变为 `/wp-content/uploads/`

### 方案2: 修改Docker挂载，让frontend/public/uploads也挂载到volume

修改 `docker-compose.prod.yml`：

```yaml
wordpress:
  volumes:
    - ../../backend:/var/www/html
    - ../../frontend:/var/www/html/frontend
    # 新增：让frontend/public/uploads也挂载到volume
    - uploads_data:/var/www/html/frontend/public/uploads:rw
    - uploads_data:/var/www/html/wp-content/uploads
```

**优点**：
- ✅ 不需要修改Plugin代码
- ✅ URL路径保持不变

**缺点**：
- ⚠️ 需要修改Docker配置
- ⚠️ 可能影响现有文件结构

### 方案3: 创建符号链接（临时方案）

在WordPress容器启动时创建符号链接：

```yaml
wordpress:
  command: >
    bash -c "
      mkdir -p /var/www/html/wp-content/uploads/product-lines/images &&
      ln -sf /var/www/html/wp-content/uploads/product-lines/images /var/www/html/frontend/public/uploads/product-lines/images &&
      chown -R www-data:www-data /var/www/html/wp-content && 
      exec apache2-foreground
    "
```

**优点**：
- ✅ 快速修复，不需要大改动

**缺点**：
- ⚠️ 符号链接可能在某些情况下失效
- ⚠️ 不是最佳实践

### 方案4: 同步文件到volume（临时方案）

定期同步 `frontend/public/uploads` 到volume：

```bash
# 在部署脚本中添加同步步骤
rsync -av frontend/public/uploads/ <volume_mount_point>/product-lines/images/
```

**优点**：
- ✅ 不需要修改代码

**缺点**：
- ⚠️ 需要定期同步，可能延迟
- ⚠️ 不是实时同步

## 🎯 推荐方案

**推荐使用方案1**，原因：
1. 符合WordPress标准目录结构
2. 文件直接保存到volume，Nginx可以立即访问
3. 不需要修改Docker配置
4. 更符合最佳实践

**但需要注意**：
- URL路径会从 `/uploads/` 变为 `/wp-content/uploads/`
- 需要更新Nginx配置，确保 `/wp-content/uploads/` 可以访问
- 需要更新前端代码中的URL引用（如果有硬编码）

## 🔧 实施检查清单

- [ ] 修改Plugin代码，保存到 `wp-content/uploads`
- [ ] 更新Nginx配置，确保 `/wp-content/uploads/` 路由正确
- [ ] 检查前端代码，更新所有 `/uploads/` 引用为 `/wp-content/uploads/`
- [ ] 迁移现有文件从 `frontend/public/uploads/` 到volume
- [ ] 测试上传功能
- [ ] 测试文件访问（通过Nginx）

---

**最后更新**: 2024-01-13
