# Docker容器文件检查指南

## 📋 概述

本文档介绍如何在生产环境的Docker容器中检查文件和目录。

## 🚀 快速使用

### 使用检查脚本（推荐）

```bash
# 检查特定文件
./scripts/check-docker-uploads.sh -p "/uploads/product_lines/Water Activated Tape Dispenser.jpg"

# 列出目录内容
./scripts/check-docker-uploads.sh -p "/uploads/product_lines" -l

# 查找所有jpg文件
./scripts/check-docker-uploads.sh -f "*.jpg" -p "/uploads"

# 检查所有相关位置
./scripts/check-docker-uploads.sh -p "/uploads/product_lines" -a

# 显示目录树
./scripts/check-docker-uploads.sh -p "/uploads" -t

# 检查特定图片文件（自动处理空格和编码）
./scripts/check-docker-uploads.sh -i "Water Activated Tape Dispenser.jpg"
```

## 🔧 直接使用Docker命令

### 1. 检查文件是否存在

```bash
# 定义Compose命令
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

# 检查Nginx容器中的文件
$COMPOSE exec nginx test -f "/usr/share/nginx/html/uploads/product_lines/Water Activated Tape Dispenser.jpg" && echo "文件存在" || echo "文件不存在"

# 检查WordPress容器中的文件
$COMPOSE exec wordpress test -f "/var/www/html/wp-content/uploads/product_lines/Water Activated Tape Dispenser.jpg" && echo "文件存在" || echo "文件不存在"
```

### 2. 列出目录内容

```bash
# 列出Nginx容器中的uploads目录
$COMPOSE exec nginx ls -lah /usr/share/nginx/html/uploads/

# 列出product_lines目录
$COMPOSE exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/

# 列出WordPress容器中的uploads目录
$COMPOSE exec wordpress ls -lah /var/www/html/wp-content/uploads/
```

### 3. 查找文件

```bash
# 在Nginx容器中查找所有jpg文件
$COMPOSE exec nginx find /usr/share/nginx/html/uploads -name "*.jpg" -type f

# 查找包含"Water"的文件
$COMPOSE exec nginx find /usr/share/nginx/html/uploads -name "*Water*" -type f

# 在WordPress容器中查找
$COMPOSE exec wordpress find /var/www/html/wp-content/uploads -name "*.jpg" -type f
```

### 4. 查看文件详细信息

```bash
# 查看文件大小、权限等
$COMPOSE exec nginx ls -lh /usr/share/nginx/html/uploads/product_lines/Water\ Activated\ Tape\ Dispenser.jpg

# 使用stat命令查看详细信息
$COMPOSE exec nginx stat /usr/share/nginx/html/uploads/product_lines/Water\ Activated\ Tape\ Dispenser.jpg

# 查看文件类型
$COMPOSE exec nginx file /usr/share/nginx/html/uploads/product_lines/Water\ Activated\ Tape\ Dispenser.jpg
```

### 5. 统计文件数量

```bash
# 统计目录中的文件数量
$COMPOSE exec nginx find /usr/share/nginx/html/uploads/product_lines -type f | wc -l

# 统计目录大小
$COMPOSE exec nginx du -sh /usr/share/nginx/html/uploads/product_lines

# 列出所有子目录
$COMPOSE exec nginx find /usr/share/nginx/html/uploads -type d
```

## 📍 常用路径

### Nginx容器路径

```bash
# 主要uploads目录
/usr/share/nginx/html/uploads/

# 产品线图片
/usr/share/nginx/html/uploads/product_lines/

# 设备相关
/usr/share/nginx/html/uploads/machines/
/usr/share/nginx/html/uploads/machines/pdfs/
/usr/share/nginx/html/uploads/machines/images/

# 耗材相关
/usr/share/nginx/html/uploads/consumables/

# 配件相关
/usr/share/nginx/html/uploads/accessory/

# 备件相关
/usr/share/nginx/html/uploads/spare_parts/
```

### WordPress容器路径

```bash
# WordPress标准uploads目录
/var/www/html/wp-content/uploads/

# 前端uploads目录
/var/www/html/frontend/public/uploads/

# 前端dist目录（构建输出）
/var/www/html/frontend/dist/uploads/
```

## 🔍 检查特定图片文件

### 方法1: 直接检查（处理空格）

```bash
# 使用引号处理空格
$COMPOSE exec nginx ls -lh "/usr/share/nginx/html/uploads/product_lines/Water Activated Tape Dispenser.jpg"

# 或使用转义
$COMPOSE exec nginx ls -lh /usr/share/nginx/html/uploads/product_lines/Water\ Activated\ Tape\ Dispenser.jpg
```

### 方法2: 使用通配符

```bash
# 查找匹配的文件
$COMPOSE exec nginx ls -lh /usr/share/nginx/html/uploads/product_lines/*Water*Tape*Dispenser*

# 查找所有jpg文件
$COMPOSE exec nginx ls -lh /usr/share/nginx/html/uploads/product_lines/*.jpg
```

### 方法3: 使用find命令

```bash
# 查找包含特定关键词的文件
$COMPOSE exec nginx find /usr/share/nginx/html/uploads/product_lines -iname "*water*tape*dispenser*" -type f

# 查找所有产品线图片
$COMPOSE exec nginx find /usr/share/nginx/html/uploads/product_lines -name "*.jpg" -o -name "*.jpeg" -o -name "*.png"
```

## 📊 完整检查示例

### 检查product_lines目录

```bash
#!/bin/bash
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

echo "=== 检查Nginx容器 ==="
echo "1. 检查目录是否存在:"
$COMPOSE exec nginx test -d /usr/share/nginx/html/uploads/product_lines && echo "✅ 目录存在" || echo "❌ 目录不存在"

echo ""
echo "2. 列出目录内容:"
$COMPOSE exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/ 2>/dev/null || echo "无法列出目录"

echo ""
echo "3. 统计文件数量:"
file_count=$($COMPOSE exec nginx find /usr/share/nginx/html/uploads/product_lines -type f 2>/dev/null | wc -l)
echo "文件数量: $file_count"

echo ""
echo "4. 目录大小:"
$COMPOSE exec nginx du -sh /usr/share/nginx/html/uploads/product_lines/ 2>/dev/null || echo "无法获取大小"

echo ""
echo "=== 检查WordPress容器 ==="
echo "1. 检查目录是否存在:"
$COMPOSE exec wordpress test -d /var/www/html/wp-content/uploads/product_lines && echo "✅ 目录存在" || echo "❌ 目录不存在"
```

## 🛠️ 故障排查

### 问题1: 文件不存在

```bash
# 检查文件是否在其他位置
$COMPOSE exec nginx find /usr/share/nginx/html -name "*Water*Tape*Dispenser*" -type f

# 检查所有uploads相关目录
$COMPOSE exec nginx find /usr/share/nginx/html -type d -name "uploads" -exec ls -lah {} \;
```

### 问题2: 权限问题

```bash
# 检查文件权限
$COMPOSE exec nginx ls -lah /usr/share/nginx/html/uploads/product_lines/

# 检查Nginx用户
$COMPOSE exec nginx id

# 测试文件可读性
$COMPOSE exec nginx cat /usr/share/nginx/html/uploads/product_lines/Water\ Activated\ Tape\ Dispenser.jpg > /dev/null && echo "可读" || echo "不可读"
```

### 问题3: 挂载问题

```bash
# 检查Docker挂载
$COMPOSE exec nginx mount | grep uploads

# 检查volume
docker volume inspect bjt-product-system_uploads_data 2>/dev/null || echo "Volume不存在"

# 检查挂载点
$COMPOSE exec nginx df -h | grep uploads
```

## 📝 实用命令组合

### 快速检查脚本

```bash
#!/bin/bash
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"
FILE_PATH="/uploads/product_lines/Water Activated Tape Dispenser.jpg"

echo "检查文件: $FILE_PATH"
echo ""

# Nginx容器
echo "=== Nginx容器 ==="
if $COMPOSE exec -T nginx test -f "/usr/share/nginx/html$FILE_PATH" 2>/dev/null; then
    echo "✅ 文件存在"
    $COMPOSE exec -T nginx ls -lh "/usr/share/nginx/html$FILE_PATH"
else
    echo "❌ 文件不存在"
    echo "查找相似文件:"
    $COMPOSE exec -T nginx find /usr/share/nginx/html/uploads/product_lines -iname "*water*" -type f 2>/dev/null | head -5
fi

echo ""
echo "=== WordPress容器 ==="
if $COMPOSE exec -T wordpress test -f "/var/www/html/wp-content$FILE_PATH" 2>/dev/null; then
    echo "✅ 文件存在"
    $COMPOSE exec -T wordpress ls -lh "/var/www/html/wp-content$FILE_PATH"
else
    echo "❌ 文件不存在"
fi
```

### 批量检查多个文件

```bash
#!/bin/bash
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

files=(
    "/uploads/product_lines/Water Activated Tape Dispenser.jpg"
    "/uploads/product_lines/Air Cushioning System.jpg"
    "/uploads/product_lines/Paper Cushioning Machine.jpg"
)

for file in "${files[@]}"; do
    echo "检查: $file"
    if $COMPOSE exec -T nginx test -f "/usr/share/nginx/html$file" 2>/dev/null; then
        echo "  ✅ 存在"
    else
        echo "  ❌ 不存在"
    fi
done
```

## 🔐 注意事项

1. **文件路径中的空格**: 使用引号或转义字符处理
2. **权限问题**: 确保Nginx用户有读取权限
3. **挂载问题**: 检查Docker volume是否正确挂载
4. **路径大小写**: Linux系统区分大小写

## 📞 获取帮助

如果遇到问题：

1. 使用检查脚本: `./scripts/check-docker-uploads.sh -h`
2. 查看容器日志: `./scripts/view-production-logs.sh -e nginx`
3. 检查服务状态: `docker compose -f docker/prod/docker-compose.prod.yml ps`

---

**最后更新**: 2024-01-13
