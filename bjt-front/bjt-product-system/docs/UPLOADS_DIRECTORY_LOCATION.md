# Uploads目录位置说明

## 📍 本地代码中的位置

根据代码检查和部署脚本，uploads目录应该位于以下位置：

### 1. 源代码位置（开发时）
```
frontend/public/uploads/
├── product_lines/          # 产品线图片（注意：下划线）
│   └── Water Activated Tape Dispenser.jpg
├── machines/
│   ├── pdfs/
│   └── images/
├── consumables/
├── accessory/
└── spare_parts/
```

### 2. 构建输出位置（生产部署）
```
frontend/dist/uploads/      # 构建后同步到这里
├── product_lines/
└── ...
```

### 3. Docker容器中的位置
```
/usr/share/nginx/html/uploads/    # Nginx容器
├── product_lines/
└── ...
```

## 🔍 路径不一致问题

### 问题1: 命名不一致

代码中发现两种命名方式：

1. **下划线命名** (`product_lines`) - 在代码引用中使用
   ```typescript
   // frontend/src/services/sql-mock-generator.ts
   image_url: '/uploads/product_lines/Water Activated Tape Dispenser.jpg'
   ```

2. **横线命名** (`product-lines`) - 在上传配置中使用
   ```typescript
   // frontend/src/admin/pages/product-lines/ProductLineEditPage.tsx
   uploadPath="/uploads/product-lines/images/"
   ```

### 问题2: 子目录不一致

- 代码引用：`/uploads/product_lines/文件名.jpg` (直接在product_lines下)
- 上传配置：`/uploads/product-lines/images/` (在product-lines/images下)

## ✅ 正确的目录结构

根据部署脚本和Nginx配置，正确的结构应该是：

```
frontend/public/uploads/
└── product_lines/              # 使用下划线，与代码引用一致
    ├── Water Activated Tape Dispenser.jpg
    ├── Air Cushioning System.jpg
    └── Paper Cushioning Machine.jpg
```

## 🔧 检查命令

### 检查本地文件

```bash
# 检查public目录
ls -la frontend/public/uploads/product_lines/

# 检查dist目录（构建后）
ls -la frontend/dist/uploads/product_lines/

# 查找特定文件
find frontend/public/uploads -name "*Water*Tape*Dispenser*"
```

### 检查Docker容器

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system

# 设置Compose命令
if [ -f ".env.production" ]; then
    COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"
else
    COMPOSE="docker compose -f docker/prod/docker-compose.prod.yml"
fi

# 检查容器中的目录
$COMPOSE exec nginx ls -la /usr/share/nginx/html/uploads/product_lines/
```

## 🚨 常见问题

### 问题1: 目录不存在

**症状**: `ls: /usr/share/nginx/html/uploads/product_lines/: No such file or directory`

**原因**:
1. 文件在 `public/uploads` 但未同步到 `dist/uploads`
2. Docker volume未正确挂载
3. 部署脚本未执行文件同步

**解决**:
```bash
# 1. 检查本地文件
ls -la frontend/public/uploads/product_lines/

# 2. 如果存在，同步到dist
mkdir -p frontend/dist/uploads/product_lines
cp -r frontend/public/uploads/product_lines/* frontend/dist/uploads/product_lines/

# 3. 重新部署或重启容器
```

### 问题2: 路径命名不一致

**症状**: 文件存在但URL访问404

**原因**: 代码引用路径和实际上传路径不一致

**解决**:
- 统一使用 `product_lines` (下划线)
- 或统一使用 `product-lines` (横线)
- 确保代码引用和实际上传路径一致

### 问题3: 文件在public但不在dist

**症状**: 本地有文件，但容器中找不到

**原因**: 部署脚本未正确同步文件

**解决**:
```bash
# 手动同步
cd frontend
mkdir -p dist/uploads
cp -r public/uploads/* dist/uploads/

# 或运行部署脚本（会自动同步）
cd ..
./deploy-production.sh
```

## 📝 部署脚本中的处理

根据 `deploy-production.sh`，部署时会：

1. **保护现有uploads**:
   ```bash
   if [ -d "public/uploads" ]; then
       cp -r public/uploads "$temp_uploads_backup"
   fi
   ```

2. **构建后恢复**:
   ```bash
   mkdir -p dist/uploads
   cp -r "$temp_uploads_backup"/* dist/uploads/
   ```

3. **Docker挂载**:
   - `frontend/dist:/usr/share/nginx/html` - 整个dist目录
   - `uploads_data:/usr/share/nginx/html/uploads` - uploads volume

## 🎯 推荐做法

1. **统一命名**: 使用 `product_lines` (下划线)
2. **文件位置**: 存储在 `frontend/public/uploads/product_lines/`
3. **部署同步**: 确保部署脚本同步到 `dist/uploads/product_lines/`
4. **URL路径**: 使用 `/uploads/product_lines/文件名.jpg`

---

**最后更新**: 2024-01-13
