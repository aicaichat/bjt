#!/bin/bash

# 快速检查Docker容器中的上传文件
# 自动检测项目根目录，可在任何子目录运行

# 查找项目根目录
find_project_root() {
    local current_dir=$(pwd)
    local check_dir="$current_dir"
    
    while [ "$check_dir" != "/" ]; do
        if [ -f "$check_dir/docker/prod/docker-compose.prod.yml" ]; then
            echo "$check_dir"
            return 0
        fi
        check_dir=$(dirname "$check_dir")
    done
    
    return 1
}

# 查找项目根目录
PROJECT_ROOT=$(find_project_root)

if [ -z "$PROJECT_ROOT" ]; then
    echo "❌ 错误: 无法找到项目根目录"
    echo "   请确保在项目目录或其子目录中运行此脚本"
    exit 1
fi

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 检查.env.production文件
if [ ! -f ".env.production" ]; then
    echo "⚠️  警告: .env.production 文件不存在"
    echo "   尝试使用默认配置..."
    COMPOSE="docker compose -f docker/prod/docker-compose.prod.yml"
else
    COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"
fi

echo "✅ 项目根目录: $PROJECT_ROOT"
echo ""

# 检查服务是否运行
if ! $COMPOSE ps | grep -q "nginx.*Up"; then
    echo "❌ Nginx容器未运行"
    echo "   运行: $COMPOSE ps"
    exit 1
fi

# 检查文件路径参数
FILE_PATH="${1:-/uploads/product_lines}"

echo "🔍 检查路径: $FILE_PATH"
echo ""

# 检查Nginx容器
echo "=== Nginx容器 ==="
if $COMPOSE exec -T nginx test -d "/usr/share/nginx/html$FILE_PATH" 2>/dev/null; then
    echo "✅ 目录存在"
    echo ""
    echo "目录内容:"
    $COMPOSE exec -T nginx ls -lah "/usr/share/nginx/html$FILE_PATH" 2>/dev/null | head -20
elif $COMPOSE exec -T nginx test -f "/usr/share/nginx/html$FILE_PATH" 2>/dev/null; then
    echo "✅ 文件存在"
    $COMPOSE exec -T nginx ls -lh "/usr/share/nginx/html$FILE_PATH" 2>/dev/null
else
    echo "❌ 路径不存在"
    echo ""
    echo "查找相似路径:"
    $COMPOSE exec -T nginx find /usr/share/nginx/html/uploads -type d -name "*product*" 2>/dev/null | head -5
fi

echo ""
echo "=== 统计信息 ==="
file_count=$($COMPOSE exec -T nginx find "/usr/share/nginx/html$FILE_PATH" -type f 2>/dev/null | wc -l)
dir_count=$($COMPOSE exec -T nginx find "/usr/share/nginx/html$FILE_PATH" -type d 2>/dev/null | wc -l)
echo "文件数: $file_count"
echo "目录数: $dir_count"
