#!/bin/bash
# 搜索所有可能的图片备份位置

echo "========================================="
echo "   搜索图片备份 - 完整扫描"
echo "========================================="
echo ""

# 定义图片扩展名
IMAGE_EXTENSIONS=("jpg" "jpeg" "png" "gif" "webp" "svg" "bmp")

echo "🔍 1. 检查项目目录中的图片"
echo "========================================="
PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"

if [ -d "$PROJECT_DIR" ]; then
    echo "搜索目录: $PROJECT_DIR"
    echo ""
    
    for ext in "${IMAGE_EXTENSIONS[@]}"; do
        COUNT=$(find "$PROJECT_DIR" -type f -iname "*.$ext" 2>/dev/null | wc -l)
        if [ "$COUNT" -gt 0 ]; then
            echo "  ✅ .$ext 文件: $COUNT 个"
        fi
    done
    
    echo ""
    echo "详细列表（前20个图片文件）:"
    find "$PROJECT_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" \) 2>/dev/null | head -20
fi

echo ""
echo ""
echo "📁 2. 检查备份目录"
echo "========================================="

BACKUP_LOCATIONS=(
    "/var/bjt/backups"
    "/var/bjt/backups/recovery-20251015_135529"
    "/var/bjt/backups/code-backup-20251015-231036"
    "$PROJECT_DIR/frontend/public/uploads"
    "$PROJECT_DIR/backend/wp-content/uploads"
)

for backup_dir in "${BACKUP_LOCATIONS[@]}"; do
    if [ -d "$backup_dir" ]; then
        echo ""
        echo "📂 检查: $backup_dir"
        echo "-------------------"
        
        IMAGE_COUNT=$(find "$backup_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" \) 2>/dev/null | wc -l)
        DIR_SIZE=$(du -sh "$backup_dir" 2>/dev/null | cut -f1)
        
        echo "  大小: $DIR_SIZE"
        echo "  图片文件: $IMAGE_COUNT 个"
        
        if [ "$IMAGE_COUNT" -gt 0 ]; then
            echo "  ✅ 找到图片！"
            echo ""
            echo "  最近的图片文件（前5个）:"
            find "$backup_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | head -5
        fi
    else
        echo "  ⏭️  $backup_dir - 不存在"
    fi
done

echo ""
echo ""
echo "🐳 3. 检查其他 Docker Volumes"
echo "========================================="

echo "所有 Docker volumes:"
docker volume ls | grep -E "(bjt|prod|upload|wordpress)"

echo ""
echo "检查每个 volume 的图片..."

for volume in $(docker volume ls --format '{{.Name}}' | grep -E "(bjt|prod|upload|wordpress)"); do
    echo ""
    echo "📦 Volume: $volume"
    MOUNTPOINT=$(docker volume inspect "$volume" 2>/dev/null | grep Mountpoint | cut -d'"' -f4)
    
    if [ -n "$MOUNTPOINT" ]; then
        IMAGE_COUNT=$(sudo find "$MOUNTPOINT" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" \) 2>/dev/null | wc -l)
        SIZE=$(sudo du -sh "$MOUNTPOINT" 2>/dev/null | cut -f1)
        
        echo "  路径: $MOUNTPOINT"
        echo "  大小: $SIZE"
        echo "  图片: $IMAGE_COUNT 个"
        
        if [ "$IMAGE_COUNT" -gt 0 ]; then
            echo "  ✅ 找到图片文件！"
            sudo find "$MOUNTPOINT" -type f \( -iname "*.jpg" -o -iname "*.png" \) 2>/dev/null | head -3
        fi
    fi
done

echo ""
echo ""
echo "🗄️  4. 检查 WordPress uploads 目录"
echo "========================================="

WP_UPLOAD_PATHS=(
    "/var/www/html/wp-content/uploads"
    "$PROJECT_DIR/backend/wp-content/uploads"
    "$PROJECT_DIR/wordpress/wp-content/uploads"
)

for wp_path in "${WP_UPLOAD_PATHS[@]}"; do
    if [ -d "$wp_path" ]; then
        echo ""
        echo "📂 $wp_path"
        IMAGE_COUNT=$(find "$wp_path" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | wc -l)
        SIZE=$(du -sh "$wp_path" 2>/dev/null | cut -f1)
        
        echo "  大小: $SIZE"
        echo "  图片: $IMAGE_COUNT 个"
        
        if [ "$IMAGE_COUNT" -gt 0 ]; then
            echo "  ✅ 找到 WordPress 上传的图片！"
            find "$wp_path" -type f \( -iname "*.jpg" -o -iname "*.png" \) 2>/dev/null | head -5
        fi
    fi
done

echo ""
echo ""
echo "💾 5. 检查数据库中的图片路径记录"
echo "========================================="

echo "查询数据库中记录的图片路径..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T mysql mysql -u root -pbjtpassword123 -e "
USE bjt;

-- 检查产品图片
SELECT '产品图片' as 类型, COUNT(*) as 数量 
FROM wp_bjt_machines 
WHERE image_url IS NOT NULL AND image_url != '';

-- 检查配件图片  
SELECT '配件图片' as 类型, COUNT(*) as 数量
FROM wp_bjt_parts
WHERE image_url IS NOT NULL AND image_url != '';

-- 检查耗材图片
SELECT '耗材图片' as 类型, COUNT(*) as 数量
FROM wp_bjt_consumables  
WHERE image_url IS NOT NULL AND image_url != '';

-- 显示一些图片URL示例
SELECT '示例URL' as 类型, image_url 
FROM wp_bjt_machines 
WHERE image_url IS NOT NULL AND image_url != '' 
LIMIT 5;
" 2>/dev/null || echo "❌ 无法查询数据库"

echo ""
echo ""
echo "🌐 6. 检查 Nginx 静态文件目录"
echo "========================================="

NGINX_PATHS=(
    "/usr/share/nginx/html/uploads"
    "/var/www/html/frontend/public/uploads"
)

echo "在运行的容器中检查..."
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec nginx sh -c '
    echo "Nginx 容器内 uploads 目录:"
    ls -lh /usr/share/nginx/html/uploads 2>/dev/null || echo "  目录不存在或为空"
    
    echo ""
    echo "图片文件数:"
    find /usr/share/nginx/html/uploads -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.gif" \) 2>/dev/null | wc -l
' 2>/dev/null || echo "❌ 无法访问 Nginx 容器"

echo ""
echo ""
echo "📊 7. 总结 - 可能的图片来源"
echo "========================================="

echo "
可能找到图片的位置（按优先级）:

1. ✅ 本地开发环境
   - frontend/public/uploads/
   - 检查您本地电脑上的项目副本

2. ✅ Git 仓库历史
   - 检查 Git 历史中是否提交过图片文件
   - git log --all --pretty=format: --name-only --diff-filter=A | grep -E '\.(jpg|png|gif)$' | sort -u

3. ✅ 备份目录
   - /var/bjt/backups/*/uploads/
   - /var/bjt/backups/*/frontend/public/uploads/

4. ✅ 其他服务器
   - 测试服务器
   - 开发服务器
   - 如果有的话

5. ✅ 云存储
   - 阿里云 OSS（如果配置过）
   - CDN 缓存（如果有）

6. ✅ 数据库记录
   - 即使文件丢失，数据库中还记录着图片的 URL
   - 可以根据 URL 重新上传对应的图片

7. ✅ 业务团队
   - 产品经理可能有原始图片
   - 设计师可能有设计稿
   - 供应商可能提供过产品图片
"

echo ""
echo "========================================="
echo "         搜索完成"
echo "========================================="
echo ""

echo "💡 建议的恢复步骤:"
echo "1. 首先检查本地开发环境的 frontend/public/uploads/ 目录"
echo "2. 检查 Git 历史是否有图片文件"
echo "3. 联系业务团队获取原始图片"
echo "4. 根据数据库中的图片URL，重新上传对应图片"

