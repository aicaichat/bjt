#!/bin/bash

# 一键修复耗材筛选功能脚本
# 简单直接，无需复杂交互

set -e

echo "🔧 开始一键修复耗材筛选功能..."

# 1. 备份关键文件
BACKUP_DIR="/tmp/quick_fix_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 创建备份: $BACKUP_DIR"

if [ -f "plugins/bjt-core-entities/controllers/class-consumable-controller.php" ]; then
    cp "plugins/bjt-core-entities/controllers/class-consumable-controller.php" "$BACKUP_DIR/"
    echo "✅ 备份完成"
else
    echo "❌ 找不到控制器文件，请确保在正确的项目目录中运行"
    exit 1
fi

# 2. 检测API端点
echo "🔍 检测API端点..."
API_ENDPOINT=""

# 尝试不同的端点
ENDPOINTS=(
    "http://localhost:8080/wp-json/bjt/v1/consumables"
    "http://127.0.0.1:8080/wp-json/bjt/v1/consumables"
)

# 如果有Docker，获取容器IP
if command -v docker &> /dev/null; then
    CONTAINER_IP=$(docker inspect dev-wordpress-1 2>/dev/null | grep -o '"IPAddress": "[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    if [ ! -z "$CONTAINER_IP" ]; then
        ENDPOINTS+=("http://$CONTAINER_IP/wp-json/bjt/v1/consumables")
    fi
fi

for endpoint in "${ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$endpoint?limit=1" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        API_ENDPOINT="$endpoint"
        echo "✅ 找到API端点: $API_ENDPOINT"
        break
    fi
done

if [ -z "$API_ENDPOINT" ]; then
    echo "❌ API不可用，尝试启动Docker服务..."
    if command -v docker-compose &> /dev/null && [ -f "docker/dev/docker-compose.nginx.yml" ]; then
        docker-compose -f docker/dev/docker-compose.nginx.yml up -d
        sleep 15
        # 重新检测
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            API_ENDPOINT="http://localhost:8080/wp-json/bjt/v1/consumables"
            echo "✅ 服务启动成功: $API_ENDPOINT"
        else
            echo "❌ 无法启动API服务，请手动检查Docker状态"
            exit 1
        fi
    else
        echo "❌ 找不到docker-compose配置文件"
        exit 1
    fi
fi

# 3. 应用修复补丁
echo "🔧 应用修复补丁..."

# 创建修复补丁
cat > /tmp/consumables_fix.patch << 'EOF'
--- a/plugins/bjt-core-entities/controllers/class-consumable-controller.php
+++ b/plugins/bjt-core-entities/controllers/class-consumable-controller.php
@@ -200,6 +200,12 @@
         'shape' => $item_db_object->bag_type ?? null,
         'material' => $item_db_object->material ?? null,
         
+        // 新增：前端期望的直接字段映射
+        'part_number' => $item_db_object->part_number ?? null,
+        'app_model' => $item_db_object->app_model ?? null,
+        'thickness_met' => $item_db_object->thickness_met ?? null,
+        'bubble_diameter_met' => $item_db_object->bubble_diameter_met ?? null,
+        
         // 规格数值字段（纯数值，不加单位）
         'thickness_met' => $item_db_object->thickness_met ?? null,
         'thickness_imp' => $item_db_object->thickness_imp ?? null,
EOF

# 直接修改控制器文件
CONTROLLER_FILE="plugins/bjt-core-entities/controllers/class-consumable-controller.php"

# 检查是否已经修复过
if grep -q "前端期望的直接字段映射" "$CONTROLLER_FILE" 2>/dev/null; then
    echo "✅ 文件已经修复过，跳过修改"
else
    echo "🔧 修改控制器文件..."
    
    # 简单的字符串替换修复
    sed -i.bak '/shape.*bag_type/a\
        \
        // 新增：前端期望的直接字段映射\
        '\''part_number'\'' => $item_db_object->part_number ?? null,\
        '\''app_model'\'' => $item_db_object->app_model ?? null,\
        '\''thickness_met'\'' => $item_db_object->thickness_met ?? null,\
        '\''bubble_diameter_met'\'' => $item_db_object->bubble_diameter_met ?? null,
    ' "$CONTROLLER_FILE" 2>/dev/null || {
        echo "⚠️ 自动修改失败，使用手动修复..."
        
        # 手动添加字段映射
        python3 -c "
import re
with open('$CONTROLLER_FILE', 'r') as f:
    content = f.read()

# 查找插入点
pattern = r'([\s]*[\'\"]\s*shape[\'\"]\s*=>\s*\$item_db_object->bag_type[^,]*,)'
replacement = r'\1\n\n        // 新增：前端期望的直接字段映射\n        '\''part_number'\'' => \$item_db_object->part_number ?? null,\n        '\''app_model'\'' => \$item_db_object->app_model ?? null,\n        '\''thickness_met'\'' => \$item_db_object->thickness_met ?? null,\n        '\''bubble_diameter_met'\'' => \$item_db_object->bubble_diameter_met ?? null,'

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content)
    with open('$CONTROLLER_FILE', 'w') as f:
        f.write(content)
    print('✅ 手动修复成功')
else:
    print('❌ 找不到插入点')
" 2>/dev/null || echo "❌ Python修复也失败，请手动修改"
    fi
fi

# 4. 重启服务
echo "🔄 重启WordPress服务..."
if command -v docker &> /dev/null; then
    docker restart dev-wordpress-1 >/dev/null 2>&1 || echo "⚠️ 重启失败，请手动重启"
    sleep 10
fi

# 5. 验证修复
echo "🧪 验证修复结果..."
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT?limit=1" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API服务正常"
    
    # 检查筛选选项
    FILTER_CHECK=$(curl -s "$API_ENDPOINT?limit=1" | grep -o '"filterOptions"' | wc -l)
    if [ "$FILTER_CHECK" -gt 0 ]; then
        echo "✅ 筛选选项正常"
        
        # 测试筛选功能
        SHAPE_TEST=$(curl -s "$API_ENDPOINT?shape=Pillow&limit=5" 2>/dev/null | grep -o '"id"' | wc -l)
        if [ "$SHAPE_TEST" -gt 0 ]; then
            echo "✅ 筛选功能正常"
        else
            echo "⚠️ 筛选功能可能异常"
        fi
    else
        echo "⚠️ 筛选选项可能异常"
    fi
else
    echo "❌ API服务异常 (HTTP $HTTP_CODE)"
fi

# 6. 完成
echo ""
echo "🎉 修复完成！"
echo "📁 备份目录: $BACKUP_DIR"
echo "🌐 API端点: $API_ENDPOINT"
echo ""
echo "🔧 如需回滚："
echo "cp $BACKUP_DIR/class-consumable-controller.php plugins/bjt-core-entities/controllers/"
echo "docker restart dev-wordpress-1"
echo ""
echo "�� 请在浏览器中测试耗材页面的筛选功能" 