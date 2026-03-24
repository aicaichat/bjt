#!/bin/bash

# BJT产品管理系统 - 本地开发环境上传文件检查工具
# 检查本地开发环境是否有类似生产环境的uploads问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置 - 使用开发环境配置
COMPOSE="docker-compose -f docker/dev/docker-compose.nginx.yml"

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_message "🔍 BJT产品管理系统 - 本地开发环境上传文件检查"
echo ""

# 1. 检查容器状态
print_info "=== 1. 检查容器状态 ==="
$COMPOSE ps | grep -E "(nginx|wordpress|frontend)" || print_warning "部分容器未运行"
echo ""

# 2. 检查本地文件系统中的uploads目录
print_info "=== 2. 检查本地文件系统中的uploads目录 ==="

upload_dirs=(
    "frontend/public/uploads"
    "frontend/dist/uploads"
    "frontend/public/uploads/machines"
    "frontend/public/uploads/machines/pdfs"
    "frontend/public/uploads/machines/images"
    "frontend/public/uploads/host"
    "frontend/public/uploads/accessory"
    "frontend/public/uploads/spare_parts"
    "frontend/public/uploads/consumables"
    "frontend/public/uploads/documents"
    "frontend/public/uploads/product_lines"
)

for dir in "${upload_dirs[@]}"; do
    if [ -d "$dir" ]; then
        file_count=$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')
        dir_count=$(find "$dir" -type d 2>/dev/null | wc -l | tr -d ' ')
        print_message "✅ $dir 存在 (文件: $file_count, 目录: $dir_count)"
        
        # 检查权限
        if [ -w "$dir" ]; then
            print_info "   权限: 可写"
        else
            print_warning "   权限: 不可写"
        fi
    else
        print_warning "❌ $dir 不存在"
    fi
done
echo ""

# 3. 检查Docker容器内的uploads目录
print_info "=== 3. 检查Docker容器内的uploads目录 ==="

# 检查Nginx容器
if $COMPOSE ps | grep -q "nginx.*Up"; then
    print_info "3.1 检查Nginx容器中的uploads目录:"
    
    nginx_paths=(
        "/usr/share/nginx/html/uploads"
        "/var/www/html/frontend/public/uploads"
    )
    
    for path in "${nginx_paths[@]}"; do
        if $COMPOSE exec -T nginx test -d "$path" 2>/dev/null; then
            file_count=$($COMPOSE exec -T nginx find "$path" -type f 2>/dev/null | wc -l | tr -d ' ')
            print_message "✅ $path 存在 (文件: $file_count)"
            
            # 列出部分文件
            print_info "   示例文件:"
            $COMPOSE exec -T nginx ls -la "$path" 2>/dev/null | head -5 || true
        else
            print_warning "❌ $path 不存在"
        fi
    done
else
    print_warning "Nginx容器未运行，跳过检查"
fi
echo ""

# 检查WordPress容器
if $COMPOSE ps | grep -q "wordpress.*Up"; then
    print_info "3.2 检查WordPress容器中的uploads目录:"
    
    wp_paths=(
        "/var/www/html/wp-content/uploads"
        "/var/www/html/frontend/public/uploads"
    )
    
    for path in "${wp_paths[@]}"; do
        if $COMPOSE exec -T wordpress test -d "$path" 2>/dev/null; then
            file_count=$($COMPOSE exec -T wordpress find "$path" -type f 2>/dev/null | wc -l | tr -d ' ')
            print_message "✅ $path 存在 (文件: $file_count)"
            
            # 列出部分文件
            print_info "   示例文件:"
            $COMPOSE exec -T wordpress ls -la "$path" 2>/dev/null | head -5 || true
        else
            print_warning "❌ $path 不存在"
        fi
    done
else
    print_warning "WordPress容器未运行，跳过检查"
fi
echo ""

# 4. 检查Docker volume挂载
print_info "=== 4. 检查Docker volume挂载 ==="

if $COMPOSE ps | grep -q "nginx.*Up"; then
    print_info "4.1 Nginx容器挂载点:"
    $COMPOSE exec -T nginx mount | grep -E "(uploads|frontend)" || print_warning "未找到uploads相关挂载"
fi

if $COMPOSE ps | grep -q "wordpress.*Up"; then
    print_info "4.2 WordPress容器挂载点:"
    $COMPOSE exec -T wordpress mount | grep -E "(uploads|frontend)" || print_warning "未找到uploads相关挂载"
fi
echo ""

# 5. 检查文件权限
print_info "=== 5. 检查文件权限 ==="

if [ -d "frontend/public/uploads" ]; then
    print_info "5.1 本地uploads目录权限:"
    ls -ld frontend/public/uploads
    echo ""
    
    print_info "5.2 检查关键目录权限:"
    for dir in "frontend/public/uploads/machines" "frontend/public/uploads/product_lines"; do
        if [ -d "$dir" ]; then
            perms=$(stat -f "%OLp" "$dir" 2>/dev/null || stat -c "%a" "$dir" 2>/dev/null || echo "N/A")
            owner=$(stat -f "%Su:%Sg" "$dir" 2>/dev/null || stat -c "%U:%G" "$dir" 2>/dev/null || echo "N/A")
            print_info "   $dir: 权限=$perms, 所有者=$owner"
        fi
    done
fi
echo ""

# 6. 检查Nginx配置
print_info "=== 6. 检查Nginx配置 ==="

if [ -f "docker/nginx/conf.d/default.conf" ]; then
    if grep -q "location.*uploads" docker/nginx/conf.d/default.conf; then
        print_message "✅ 找到uploads location配置"
        print_info "配置内容:"
        grep -A 5 "location.*uploads" docker/nginx/conf.d/default.conf | head -10
    else
        print_warning "❌ 未找到uploads location配置"
    fi
else
    print_warning "Nginx配置文件不存在: docker/nginx/conf.d/default.conf"
fi
echo ""

# 7. 测试HTTP访问
print_info "=== 7. 测试HTTP访问 ==="

# 测试本地文件访问
if [ -d "frontend/public/uploads/product_lines" ]; then
    test_file=$(find frontend/public/uploads/product_lines -type f -name "*.jpg" -o -name "*.png" 2>/dev/null | head -1)
    if [ -n "$test_file" ]; then
        filename=$(basename "$test_file")
        print_info "测试文件: $filename"
        
        # 测试通过Nginx访问
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost/uploads/product_lines/$filename" | grep -q "200"; then
            print_message "✅ HTTP访问成功: http://localhost/uploads/product_lines/$filename"
        else
            print_warning "❌ HTTP访问失败: http://localhost/uploads/product_lines/$filename"
        fi
    else
        print_warning "未找到测试图片文件"
    fi
else
    print_warning "product_lines目录不存在"
fi
echo ""

# 8. 检查常见问题
print_info "=== 8. 检查常见问题 ==="

issues=0

# 检查目录是否存在
if [ ! -d "frontend/public/uploads" ]; then
    print_error "❌ 问题1: frontend/public/uploads 目录不存在"
    issues=$((issues + 1))
fi

# 检查权限
if [ -d "frontend/public/uploads" ] && [ ! -w "frontend/public/uploads" ]; then
    print_error "❌ 问题2: frontend/public/uploads 目录不可写"
    issues=$((issues + 1))
fi

# 检查Docker挂载
if $COMPOSE ps | grep -q "nginx.*Up"; then
    if ! $COMPOSE exec -T nginx test -d "/usr/share/nginx/html/uploads" 2>/dev/null; then
        print_error "❌ 问题3: Nginx容器中uploads目录不存在"
        issues=$((issues + 1))
    fi
fi

# 检查Nginx配置
if [ -f "docker/nginx/conf.d/default.conf" ]; then
    if ! grep -q "location.*uploads" docker/nginx/conf.d/default.conf; then
        print_error "❌ 问题4: Nginx配置中缺少uploads location"
        issues=$((issues + 1))
    fi
fi

if [ $issues -eq 0 ]; then
    print_message "✅ 未发现常见问题"
else
    print_warning "⚠️  发现 $issues 个潜在问题"
fi
echo ""

# 9. 生成修复建议
if [ $issues -gt 0 ]; then
    print_info "=== 9. 修复建议 ==="
    echo ""
    
    if [ ! -d "frontend/public/uploads" ]; then
        echo "1. 创建uploads目录结构:"
        echo "   mkdir -p frontend/public/uploads/{machines/{pdfs,images},host,accessory,spare_parts,consumables,documents,product_lines}"
    fi
    
    if [ -d "frontend/public/uploads" ] && [ ! -w "frontend/public/uploads" ]; then
        echo "2. 修复目录权限:"
        echo "   chmod -R 755 frontend/public/uploads"
        echo "   find frontend/public/uploads -type f -exec chmod 644 {} \\;"
    fi
    
    if [ -f "docker/nginx/conf.d/default.conf" ] && ! grep -q "location.*uploads" docker/nginx/conf.d/default.conf; then
        echo "3. 添加Nginx配置:"
        echo "   在 docker/nginx/conf.d/default.conf 中添加:"
        echo "   location /uploads/ {"
        echo "       alias /usr/share/nginx/html/uploads/;"
        echo "   }"
    fi
    
    echo ""
fi

print_message "✅ 检查完成"