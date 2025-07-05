#!/bin/bash

# 生产环境API修复部署脚本
echo "🚀 生产环境 - 部署关联关系API过滤修复..."

# 生产环境配置
PRODUCTION_PLUGIN_PATH="/var/www/html/wp-content/plugins/bjt-core-entities/controllers"
SOURCE_FILE="plugins/bjt-core-entities/controllers/class-relation-controller.php"
BACKUP_DIR="/tmp/bjt-backup-$(date +%Y%m%d_%H%M%S)"

# 检查是否在生产服务器上
if [ ! -d "/var/www/html" ]; then
    echo "❌ 这不是生产服务器环境"
    echo "💡 请在生产服务器上运行此脚本"
    exit 1
fi

# 检查源文件是否存在
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ 源文件不存在: $SOURCE_FILE"
    echo "💡 请确保在 bjt-product-system 目录中运行此脚本"
    exit 1
fi

# 检查目标目录是否存在
if [ ! -d "$PRODUCTION_PLUGIN_PATH" ]; then
    echo "❌ 生产环境插件目录不存在: $PRODUCTION_PLUGIN_PATH"
    echo "💡 请检查WordPress和BJT插件是否正确安装"
    exit 1
fi

# 创建备份目录
echo "📦 创建备份目录: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 备份原始文件
echo "💾 备份原始文件..."
TARGET_FILE="$PRODUCTION_PLUGIN_PATH/class-relation-controller.php"
if [ -f "$TARGET_FILE" ]; then
    cp "$TARGET_FILE" "$BACKUP_DIR/class-relation-controller.php.backup"
    echo "✅ 备份完成: $BACKUP_DIR/class-relation-controller.php.backup"
else
    echo "⚠️ 目标文件不存在，将创建新文件: $TARGET_FILE"
fi

# 复制修复后的文件
echo "📁 部署修复后的API控制器..."
cp "$SOURCE_FILE" "$TARGET_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 文件部署成功"
else
    echo "❌ 文件部署失败"
    exit 1
fi

# 设置正确的文件权限
echo "🔒 设置文件权限..."
chown www-data:www-data "$TARGET_FILE" 2>/dev/null || chown apache:apache "$TARGET_FILE" 2>/dev/null || echo "⚠️ 无法设置文件所有者"
chmod 644 "$TARGET_FILE"

# 验证文件内容
echo "🔍 验证修复内容..."
if grep -q "host_part_number" "$TARGET_FILE"; then
    echo "✅ 修复代码已部署"
    grep -n "host_part_number" "$TARGET_FILE" | head -3
else
    echo "❌ 修复代码未找到"
    exit 1
fi

# 重启Web服务器
echo "🔄 重启Web服务器..."
if systemctl is-active --quiet apache2; then
    systemctl reload apache2
    echo "✅ Apache已重启"
elif systemctl is-active --quiet nginx; then
    systemctl reload nginx
    echo "✅ Nginx已重启"
elif systemctl is-active --quiet httpd; then
    systemctl reload httpd
    echo "✅ HTTPD已重启"
else
    echo "⚠️ 无法自动重启Web服务器，请手动重启"
fi

# 测试API修复效果
echo "🧪 测试API修复效果..."

# 获取网站域名
SITE_URL=$(grep -r "define.*WP_HOME" /var/www/html/wp-config.php | head -1 | sed -n "s/.*'\(.*\)'.*/\1/p" 2>/dev/null)
if [ -z "$SITE_URL" ]; then
    SITE_URL="https://$(hostname)"
fi

API_URL="$SITE_URL/wp-json/bjt/v1/relations"
echo "🌐 API地址: $API_URL"

# 等待服务重启
sleep 3

# 测试API响应
echo "📡 测试API过滤功能..."

# 测试不带过滤条件
echo "1️⃣ 测试不带过滤条件 (应该返回多个主机的数据):"
curl -s "$API_URL?per_page=3" | head -c 200
echo "..."

echo ""
echo "2️⃣ 测试指定主机过滤 (应该只返回指定主机的数据):"
curl -s "$API_URL?host_part_number=60A01149&per_page=3" | head -c 200
echo "..."

echo ""
echo "✅ API修复部署完成！"
echo ""
echo "📋 部署信息:"
echo "   - 备份位置: $BACKUP_DIR"
echo "   - 目标文件: $TARGET_FILE"
echo "   - API地址: $API_URL"
echo ""
echo "🔧 如果需要回滚，请运行:"
echo "   cp $BACKUP_DIR/class-relation-controller.php.backup $TARGET_FILE"
echo ""
echo "💡 建议:"
echo "   1. 清理CDN缓存: /wp-json/bjt/v1/relations*"
echo "   2. 测试前端应用是否正常"
echo "   3. 监控API响应时间和错误率" 