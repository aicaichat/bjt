# 修复缺失的uploads文件

## 🔍 问题确认

**服务器上文件不存在**：
- ❌ `/var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines/` - 不存在
- ❌ 容器内：`/var/www/html/frontend/public/uploads/product_lines/` - 不存在

**但开发机器上文件存在**：
- ✅ `frontend/public/uploads/product_lines/Paper Cushioning Machine.jpg`
- ✅ `frontend/dist/uploads/product_lines/Paper Cushioning Machine.jpg`

## ✅ 解决方案

### 方案1: 从开发机器同步文件到服务器（推荐）

#### 步骤1: 在开发机器上准备文件

```bash
# 在开发机器上（你的Mac）
cd /Users/mac/bjt/bjt-front/bjt-product-system

# 创建压缩包
tar -czf uploads-product_lines.tar.gz frontend/public/uploads/product_lines/

# 或者只复制必要的文件
mkdir -p /tmp/uploads-sync
cp -r frontend/public/uploads/product_lines /tmp/uploads-sync/
```

#### 步骤2: 传输到服务器

```bash
# 方法1: 使用scp
scp frontend/public/uploads/product_lines/* root@47.90.251.35:/var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines/

# 方法2: 使用rsync（推荐）
rsync -avz frontend/public/uploads/product_lines/ root@47.90.251.35:/var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines/

# 方法3: 先创建目录，再传输
ssh root@47.90.251.35 "mkdir -p /var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines"
scp frontend/public/uploads/product_lines/* root@47.90.251.35:/var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines/
```

#### 步骤3: 在服务器上验证

```bash
# SSH到服务器
ssh root@47.90.251.35

# 检查文件
ls -la /var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines/

# 检查容器内文件（应该自动出现，因为挂载）
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/
```

### 方案2: 在服务器上从dist目录恢复（如果dist目录有文件）

```bash
# 在服务器上
cd /var/bjt/bjt/bjt-front/bjt-product-system

# 检查dist目录
ls -la frontend/dist/uploads/product_lines/ 2>/dev/null

# 如果dist目录有文件，复制到public目录
if [ -d "frontend/dist/uploads/product_lines" ]; then
    mkdir -p frontend/public/uploads/product_lines
    cp -r frontend/dist/uploads/product_lines/* frontend/public/uploads/product_lines/
    echo "✅ 文件已从dist目录复制到public目录"
fi
```

### 方案3: 重新上传文件

如果文件丢失且没有备份，需要通过管理后台重新上传：

1. 登录管理后台
2. 进入产品线编辑页面
3. 重新上传图片

## 🚀 快速修复命令（在服务器上执行）

```bash
cd /var/bjt/bjt/bjt-front/bjt-product-system

# 1. 创建目录
mkdir -p frontend/public/uploads/product_lines

# 2. 检查dist目录是否有文件
if [ -d "frontend/dist/uploads/product_lines" ]; then
    echo "从dist目录复制文件..."
    cp -r frontend/dist/uploads/product_lines/* frontend/public/uploads/product_lines/
fi

# 3. 设置权限
chmod -R 755 frontend/public/uploads/product_lines/
chown -R www-data:www-data frontend/public/uploads/product_lines/ 2>/dev/null || true

# 4. 验证容器内文件
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/

# 5. 测试访问
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml exec nginx curl -I "http://wordpress:80/frontend/public/uploads/product_lines/Paper%20Cushioning%20Machine.jpg" 2>/dev/null | head -3
```

## 📋 完整同步脚本（从开发机器到服务器）

在开发机器上运行：

```bash
#!/bin/bash
# sync-uploads-to-server.sh

SERVER="root@47.90.251.35"
REMOTE_PATH="/var/bjt/bjt/bjt-front/bjt-product-system"
LOCAL_PATH="/Users/mac/bjt/bjt-front/bjt-product-system"

echo "=== 同步uploads文件到服务器 ==="
echo ""

# 1. 检查本地文件
if [ ! -d "$LOCAL_PATH/frontend/public/uploads/product_lines" ]; then
    echo "❌ 本地文件不存在"
    exit 1
fi

echo "✅ 本地文件存在"
ls -lh "$LOCAL_PATH/frontend/public/uploads/product_lines/" | head -5

# 2. 在服务器上创建目录
echo ""
echo "在服务器上创建目录..."
ssh $SERVER "mkdir -p $REMOTE_PATH/frontend/public/uploads/product_lines"

# 3. 同步文件
echo ""
echo "同步文件..."
rsync -avz --progress \
    "$LOCAL_PATH/frontend/public/uploads/product_lines/" \
    "$SERVER:$REMOTE_PATH/frontend/public/uploads/product_lines/"

# 4. 验证
echo ""
echo "验证服务器上的文件..."
ssh $SERVER "ls -la $REMOTE_PATH/frontend/public/uploads/product_lines/"

echo ""
echo "✅ 同步完成！"
```

## ⚠️ 注意事项

1. **文件权限**：确保文件权限正确（755目录，644文件）
2. **文件所有者**：如果容器内需要特定用户，可能需要调整
3. **路径一致性**：确保使用 `product_lines`（下划线）而不是 `product-lines`（连字符）
4. **同步后验证**：同步后要验证容器内能看到文件

## 🔧 验证修复

同步文件后，运行：

```bash
# 1. 检查本地文件
ls -la /var/bjt/bjt/bjt-front/bjt-product-system/frontend/public/uploads/product_lines/

# 2. 检查容器内文件
docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml exec wordpress ls -la /var/www/html/frontend/public/uploads/product_lines/

# 3. 测试访问
curl -I http://localhost/uploads/product_lines/Paper%20Cushioning%20Machine.jpg

# 4. 如果Nginx配置已修复，应该能访问
```

---

**下一步**：选择方案1（从开发机器同步）或方案2（从dist目录恢复），然后验证文件是否出现在容器中。
