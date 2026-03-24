# 为什么之前没问题，现在出现Uploads 404？

## 🔍 问题发生的可能原因

### 原因1: 阿里云CDN缓存了404响应 ⚠️ **最可能的原因**

#### 问题描述
如果之前文件不存在或路径错误，CDN可能缓存了404响应。即使现在文件存在了，CDN仍然返回缓存的404。

#### 验证方法
```bash
# 1. 直接访问源站（绕过CDN）
curl -I http://<服务器IP>/uploads/product_lines/Paper%20Cushioning%20Machine.jpg

# 2. 通过CDN访问
curl -I https://eorder.lockedair.com/uploads/product_lines/Paper%20Cushioning%20Machine.jpg

# 3. 检查响应头
# 如果看到以下头部，说明是CDN缓存：
# - X-Cache: HIT from xxx
# - Via: cache.xxx
# - Server: AliYun
```

#### 解决方案
1. **刷新CDN缓存**（最重要！）
   - 登录阿里云CDN控制台
   - 进入：刷新预热 → URL刷新
   - 输入需要刷新的URL：
     ```
     https://eorder.lockedair.com/uploads/product_lines/Paper%20Cushioning%20Machine.jpg
     ```
   - 或使用目录刷新：
     ```
     https://eorder.lockedair.com/uploads/product_lines/
     ```

2. **配置CDN不缓存404响应**
   - 进入：缓存配置 → 缓存规则
   - 添加规则：
     ```
     规则类型: HTTP状态码
     规则内容: 404
     缓存时间: 0秒（不缓存）
     ```

### 原因2: 上传路径变更（代码层面）

#### 问题描述
从代码分析发现，存在路径不一致：

**旧路径**（代码引用）：
```typescript
// frontend/src/services/sql-mock-generator.ts
image_url: '/uploads/product_lines/Water Activated Tape Dispenser.jpg'
```
- 使用下划线：`product_lines`
- 直接在 `product_lines/` 下，没有 `images/` 子目录

**新路径**（上传配置）：
```typescript
// frontend/src/admin/pages/product-lines/ProductLineEditPage.tsx
uploadPath="/uploads/product-lines/images/"
```
- 使用连字符：`product-lines`
- 有 `images/` 子目录

#### 可能的时间线
1. **之前**：文件可能直接上传到 `/uploads/product_lines/`（下划线，无images子目录）
2. **后来**：代码修改，新上传的文件保存到 `/uploads/product-lines/images/`（连字符，有images子目录）
3. **现在**：旧文件路径和新代码路径不匹配

#### 验证方法
```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system
COMPOSE=$(test -f .env.production && echo "docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml" || echo "docker compose -f docker/prod/docker-compose.prod.yml")

# 检查旧路径
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/ 2>/dev/null

# 检查新路径
$COMPOSE exec wordpress ls -la /var/www/html/frontend/public/uploads/product-lines/images/ 2>/dev/null
```

### 原因3: 容器重建导致文件丢失

#### 问题描述
文件保存在 `frontend/public/uploads/`，这个目录是**本地目录挂载**，不在Docker volume中。

**如果容器重建**：
- Volume中的数据会保留
- 但 `frontend/public/uploads/` 中的文件可能丢失（如果本地目录被清理）

#### 验证方法
```bash
# 检查文件是否在volume中
docker volume inspect bjt-product-system_uploads_data | grep Mountpoint
docker run --rm -v bjt-product-system_uploads_data:/data alpine ls -la /data/product_lines/ 2>/dev/null

# 检查文件是否在本地目录
ls -la frontend/public/uploads/product_lines/ 2>/dev/null
```

### 原因4: 部署脚本变更

#### 问题描述
`deploy-production.sh` 脚本可能最近修改了，导致文件没有正确同步。

#### 检查部署脚本历史
```bash
# 查看部署脚本的git历史
git log --oneline --all -- deploy-production.sh | head -10

# 查看最近的修改
git diff HEAD~5 HEAD -- deploy-production.sh | grep -i "upload\|image\|public"
```

### 原因5: Nginx配置变更

#### 问题描述
如果最近修改了Nginx配置，可能导致路由失效。

#### 验证方法
```bash
# 检查Nginx配置历史
git log --oneline --all -- nginx/conf.d/production.conf | head -10

# 检查当前配置
$COMPOSE exec nginx cat /etc/nginx/conf.d/production.conf | grep -A 20 "location /uploads/"
```

## 🎯 最可能的原因组合

基于分析，最可能的情况是：

1. **主要原因：CDN缓存了404响应**
   - 之前文件可能不存在或路径错误
   - CDN缓存了404响应
   - 即使现在修复了，CDN仍然返回缓存的404

2. **次要原因：路径变更**
   - 代码从 `product_lines` 改为 `product-lines/images/`
   - 旧文件在旧路径，新代码期望新路径
   - 导致路径不匹配

## ✅ 完整解决方案

### 步骤1: 刷新CDN缓存（最重要！）

```bash
# 方法1: 通过阿里云控制台
# 1. 登录 https://cdn.console.aliyun.com/
# 2. 找到域名 eorder.lockedair.com
# 3. 进入：刷新预热 → URL刷新
# 4. 输入：
#    https://eorder.lockedair.com/uploads/product_lines/
# 5. 点击刷新

# 方法2: 使用API（如果有配置）
# 需要配置阿里云CLI
```

### 步骤2: 验证文件是否存在

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system
./scripts/diagnose-uploads-root-cause.sh
```

### 步骤3: 如果文件不存在，迁移文件

```bash
# 如果文件在旧路径，迁移到新路径
$COMPOSE exec wordpress bash -c "
  if [ -d '/var/www/html/frontend/public/uploads/product_lines' ]; then
    mkdir -p /var/www/html/frontend/public/uploads/product-lines/images
    cp -r /var/www/html/frontend/public/uploads/product_lines/* \
          /var/www/html/frontend/public/uploads/product-lines/images/ 2>/dev/null || true
  fi
"
```

### 步骤4: 部署Nginx和Apache修复

```bash
# 1. 重新构建WordPress镜像（包含Apache Alias配置）
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml build wordpress

# 2. 重启服务
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml up -d wordpress nginx

# 3. 重新加载Nginx配置
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml exec nginx nginx -s reload
```

### 步骤5: 验证修复

```bash
# 1. 直接访问源站（绕过CDN）
curl -I http://<服务器IP>/uploads/product_lines/Paper%20Cushioning%20Machine.jpg

# 2. 通过CDN访问（应该返回200，如果CDN缓存已刷新）
curl -I https://eorder.lockedair.com/uploads/product_lines/Paper%20Cushioning%20Machine.jpg

# 3. 检查响应头
# 应该看到：
# HTTP/1.1 200 OK
# X-Served-By: wordpress-proxy
```

## 📊 问题时间线推测

```
时间点1: 之前
├── 文件路径: /uploads/product_lines/xxx.jpg
├── 文件存在: ✅
├── CDN缓存: 200 OK
└── 状态: 正常工作

时间点2: 代码变更（可能）
├── 上传路径改为: /uploads/product-lines/images/
├── 旧文件仍在: /uploads/product_lines/
├── 新上传文件到: /uploads/product-lines/images/
└── 状态: 新旧路径并存

时间点3: 容器重建或部署（可能）
├── 文件可能丢失（如果不在volume中）
├── 或文件路径不匹配
└── 状态: 开始出现404

时间点4: CDN缓存404
├── CDN缓存了404响应
├── 即使源站修复，CDN仍返回404
└── 状态: 持续404（当前状态）
```

## 🔧 预防措施

1. **统一路径命名**
   - 建议统一使用 `product-lines`（连字符）
   - 更新数据库中的旧路径引用

2. **文件存储到Volume**
   - 修改Plugin，让文件保存到volume
   - 确保容器重建时文件不丢失

3. **CDN配置优化**
   - 配置404状态码不缓存
   - 配置 `/uploads/` 路径的缓存规则

4. **部署脚本改进**
   - 确保 `public/uploads` 同步到 `dist/uploads`
   - 确保文件同步到volume

---

**总结**：最可能的原因是**CDN缓存了404响应**，加上可能的**路径变更**。首先刷新CDN缓存，然后验证文件是否存在，最后部署配置修复。
