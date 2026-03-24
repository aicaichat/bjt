# 快速Docker文件检查指南

## 🚀 快速命令（可在任何目录运行）

### 方法1: 使用快速检查脚本（推荐）

```bash
# 在任何目录运行，自动查找项目根目录
cd /var/bjt/bjt/bjt-front/bjt-product-admin
/path/to/bjt-product-system/scripts/quick-check-uploads.sh

# 或指定路径
/path/to/bjt-product-system/scripts/quick-check-uploads.sh /uploads/product_lines
```

### 方法2: 先切换到项目根目录

```bash
# 切换到项目根目录
cd /var/bjt/bjt/bjt-front/bjt-product-system

# 然后运行检查
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"
$COMPOSE exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/
```

### 方法3: 使用绝对路径

```bash
# 从任何目录运行
cd /var/bjt/bjt/bjt-front/bjt-product-admin

# 使用绝对路径指定项目根目录
PROJECT_ROOT="/var/bjt/bjt/bjt-front/bjt-product-system"
COMPOSE="docker compose --env-file $PROJECT_ROOT/.env.production -f $PROJECT_ROOT/docker/prod/docker-compose.prod.yml"

# 检查文件
$COMPOSE exec nginx test -f "/usr/share/nginx/html/uploads/product_lines/Water Activated Tape Dispenser.jpg" && echo "✅ 存在" || echo "❌ 不存在"

# 列出目录
$COMPOSE exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/
```

## 📍 正确的项目路径

根据你的错误信息，正确的项目根目录应该是：

```bash
/var/bjt/bjt/bjt-front/bjt-product-system
```

而不是：
```
/var/bjt/bjt/bjt-front/bjt-product-admin  # ❌ 错误
```

## 🔧 修正后的完整命令

```bash
# 1. 切换到正确的项目根目录
cd /var/bjt/bjt/bjt-front/bjt-product-system

# 2. 定义Compose命令
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

# 3. 检查文件是否存在
$COMPOSE exec nginx test -f "/usr/share/nginx/html/uploads/product_lines/Water Activated Tape Dispenser.jpg" && echo "✅ 存在" || echo "❌ 不存在"

# 4. 列出目录内容
$COMPOSE exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/

# 5. 查找包含"Water"的文件
$COMPOSE exec nginx find /usr/share/nginx/html/uploads/product_lines -iname "*water*" -type f
```

## 🎯 一键检查脚本

创建一个简单的检查脚本：

```bash
#!/bin/bash
# 保存为: /var/bjt/bjt/bjt-front/bjt-product-system/check-uploads.sh

PROJECT_ROOT="/var/bjt/bjt/bjt-front/bjt-product-system"
cd "$PROJECT_ROOT"

COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

echo "=== 检查 product_lines 目录 ==="
$COMPOSE exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/ 2>/dev/null || echo "目录不存在或无法访问"

echo ""
echo "=== 查找 Water Activated Tape Dispenser.jpg ==="
if $COMPOSE exec -T nginx test -f "/usr/share/nginx/html/uploads/product_lines/Water Activated Tape Dispenser.jpg" 2>/dev/null; then
    echo "✅ 文件存在"
    $COMPOSE exec -T nginx ls -lh "/usr/share/nginx/html/uploads/product_lines/Water Activated Tape Dispenser.jpg"
else
    echo "❌ 文件不存在"
    echo ""
    echo "查找相似文件:"
    $COMPOSE exec -T nginx find /usr/share/nginx/html/uploads/product_lines -iname "*water*" -type f 2>/dev/null | head -5
fi
```

然后运行：
```bash
chmod +x /var/bjt/bjt/bjt-front/bjt-product-system/check-uploads.sh
/var/bjt/bjt/bjt-front/bjt-product-system/check-uploads.sh
```

## 🔍 验证项目根目录

```bash
# 检查是否正确
ls -la /var/bjt/bjt/bjt-front/bjt-product-system/docker/prod/docker-compose.prod.yml

# 如果文件存在，说明路径正确
```

## ⚠️ 常见错误

### 错误1: 找不到.env.production文件

```bash
# 检查文件是否存在
ls -la /var/bjt/bjt/bjt-front/bjt-product-system/.env.production

# 如果不存在，可以不使用--env-file参数
COMPOSE="docker compose -f docker/prod/docker-compose.prod.yml"
```

### 错误2: 找不到docker-compose.yml

```bash
# 确认项目根目录
pwd
# 应该显示: /var/bjt/bjt/bjt-front/bjt-product-system

# 检查文件
ls -la docker/prod/docker-compose.prod.yml
```

### 错误3: 容器未运行

```bash
# 检查容器状态
cd /var/bjt/bjt/bjt-front/bjt-product-system
docker compose -f docker/prod/docker-compose.prod.yml ps

# 如果容器未运行，先启动
docker compose -f docker/prod/docker-compose.prod.yml up -d
```

## 📝 最简化的检查命令

```bash
# 一行命令检查（假设在项目根目录）
cd /var/bjt/bjt/bjt-front/bjt-product-system && docker compose -f docker/prod/docker-compose.prod.yml exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/
```

---

**提示**: 如果经常需要检查，建议创建一个别名：

```bash
# 添加到 ~/.bashrc
alias check-uploads='cd /var/bjt/bjt/bjt-front/bjt-product-system && docker compose -f docker/prod/docker-compose.prod.yml exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/'

# 然后就可以直接运行
check-uploads
```
