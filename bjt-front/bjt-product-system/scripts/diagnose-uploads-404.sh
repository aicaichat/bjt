#!/bin/bash

# BJT产品管理系统 - 上传文件404问题诊断工具
# 用于诊断CDN和文件路径配置问题
# 使用方法: ./scripts/diagnose-uploads-404.sh [文件URL]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
DOMAIN_NAME="${DOMAIN_NAME:-eorder.lockedair.com}"
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

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

# 显示帮助信息
show_help() {
    cat << EOF
${GREEN}BJT产品管理系统 - 上传文件404问题诊断工具${NC}

${YELLOW}使用方法:${NC}
  ./scripts/diagnose-uploads-404.sh [选项] [文件URL]

${YELLOW}选项:${NC}
  -u, --url URL           要诊断的文件URL
  -d, --domain DOMAIN     域名（默认: eorder.lockedair.com）
  -c, --check-path        检查文件实际存储路径
  -f, --fix               尝试修复问题
  -h, --help              显示此帮助信息

${YELLOW}示例:${NC}
  # 诊断特定文件
  ./scripts/diagnose-uploads-404.sh -u "https://eorder.lockedair.com/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"

  # 检查文件路径
  ./scripts/diagnose-uploads-404.sh -c

  # 诊断并尝试修复
  ./scripts/diagnose-uploads-404.sh -u "..." -f

${YELLOW}常见问题:${NC}
  1. CDN回源路径配置错误
  2. 文件实际存储位置和Nginx配置不匹配
  3. URL编码问题（空格被编码为%20）
  4. CDN缓存了404响应

EOF
}

# 从URL提取文件路径
extract_path_from_url() {
    local url=$1
    # 移除协议和域名
    local path=$(echo "$url" | sed -E 's|https?://[^/]+||')
    # URL解码
    echo "$path" | sed 's|%20| |g' | sed 's|%2F|/|g'
}

# 检查文件是否存在
check_file_exists() {
    local file_path=$1
    local found=false
    local locations=()
    
    print_info "检查文件: $file_path"
    
    # 检查位置1: frontend/public/uploads
    if [ -f "frontend/public/uploads$file_path" ]; then
        locations+=("frontend/public/uploads$file_path")
        found=true
    fi
    
    # 检查位置2: frontend/dist/uploads
    if [ -f "frontend/dist/uploads$file_path" ]; then
        locations+=("frontend/dist/uploads$file_path")
        found=true
    fi
    
    # 检查位置3: Docker volume (通过容器)
    if $COMPOSE exec -T nginx test -f "/usr/share/nginx/html/uploads$file_path" 2>/dev/null; then
        locations+=("Docker volume: /usr/share/nginx/html/uploads$file_path")
        found=true
    fi
    
    # 检查位置4: WordPress uploads
    if $COMPOSE exec -T wordpress test -f "/var/www/html/wp-content/uploads$file_path" 2>/dev/null; then
        locations+=("WordPress: /var/www/html/wp-content/uploads$file_path")
        found=true
    fi
    
    if [ "$found" = true ]; then
        print_message "✅ 文件存在于以下位置:"
        for loc in "${locations[@]}"; do
            echo "   - $loc"
        done
        return 0
    else
        print_error "❌ 文件不存在于任何已知位置"
        return 1
    fi
}

# 检查Nginx配置
check_nginx_config() {
    print_info "检查Nginx配置..."
    
    if $COMPOSE exec -T nginx nginx -t 2>&1 | grep -q "successful"; then
        print_message "✅ Nginx配置语法正确"
    else
        print_error "❌ Nginx配置有错误"
        $COMPOSE exec -T nginx nginx -t
        return 1
    fi
    
    # 检查uploads location配置
    if $COMPOSE exec -T nginx cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -q "location /uploads/"; then
        print_message "✅ 找到 /uploads/ location 配置"
        
        # 显示配置
        print_info "Nginx uploads配置:"
        $COMPOSE exec -T nginx cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -A 10 "location /uploads/" | head -15
    else
        print_error "❌ 未找到 /uploads/ location 配置"
        return 1
    fi
}

# 检查CDN配置（通过HTTP头）
check_cdn_headers() {
    local url=$1
    
    if [ -z "$url" ]; then
        print_warning "未提供URL，跳过CDN检查"
        return
    fi
    
    print_info "检查CDN配置（通过HTTP头）..."
    
    local headers=$(curl -I -s "$url" 2>&1)
    
    # 检查CDN相关头
    if echo "$headers" | grep -iE "(x-cache|cdn|aliyun|ali)" > /dev/null; then
        print_info "检测到CDN相关HTTP头:"
        echo "$headers" | grep -iE "(x-cache|cdn|aliyun|ali|via|server)" || true
    else
        print_warning "未检测到明显的CDN标识"
    fi
    
    # 检查缓存头
    if echo "$headers" | grep -i "cache-control" > /dev/null; then
        print_info "缓存控制头:"
        echo "$headers" | grep -i "cache-control"
    fi
    
    # 检查状态码
    local status_code=$(echo "$headers" | head -1 | grep -oE "[0-9]{3}")
    if [ "$status_code" = "404" ]; then
        print_error "❌ HTTP状态码: 404 Not Found"
        
        # 检查是否是CDN缓存的404
        if echo "$headers" | grep -i "x-cache.*hit" > /dev/null; then
            print_warning "⚠️  检测到CDN缓存命中，可能是CDN缓存了404响应"
            print_info "建议: 在阿里云CDN控制台刷新该URL的缓存"
        fi
    elif [ "$status_code" = "200" ]; then
        print_message "✅ HTTP状态码: 200 OK"
    else
        print_warning "HTTP状态码: $status_code"
    fi
}

# 测试直接访问（绕过CDN）
test_direct_access() {
    local file_path=$1
    
    print_info "测试直接访问（绕过CDN）..."
    
    # 获取服务器IP（如果有配置）
    if [ -f ".env.production" ]; then
        local server_ip=$(grep "SERVER_IP" .env.production 2>/dev/null | cut -d'=' -f2 | tr -d '"' | tr -d "'" || echo "")
        
        if [ -n "$server_ip" ]; then
            print_info "尝试直接访问服务器: http://$server_ip$file_path"
            local response=$(curl -I -s "http://$server_ip$file_path" 2>&1 | head -1)
            print_info "响应: $response"
        fi
    fi
    
    # 测试容器内访问
    print_info "测试容器内访问..."
    if $COMPOSE exec -T nginx curl -I -s "http://localhost$file_path" 2>&1 | head -1 | grep -q "200\|404"; then
        local container_response=$($COMPOSE exec -T nginx curl -I -s "http://localhost$file_path" 2>&1 | head -1)
        print_info "容器内响应: $container_response"
    fi
}

# 查找相似文件
find_similar_files() {
    local file_path=$1
    local filename=$(basename "$file_path" | sed 's|%20| |g')
    local dirname=$(dirname "$file_path" | sed 's|^/uploads||')
    
    print_info "查找相似文件..."
    
    # 在多个位置查找
    local search_paths=(
        "frontend/public/uploads$dirname"
        "frontend/dist/uploads$dirname"
    )
    
    for search_path in "${search_paths[@]}"; do
        if [ -d "$search_path" ]; then
            print_info "在 $search_path 中查找:"
            find "$search_path" -type f -iname "*$(echo "$filename" | sed 's|\.jpg||' | sed 's|\.jpeg||' | sed 's|\.png||')*" 2>/dev/null | head -10 || true
        fi
    done
}

# 生成修复建议
generate_fix_suggestions() {
    local file_path=$1
    local filename=$(basename "$file_path")
    
    echo ""
    print_message "🔧 修复建议:"
    echo ""
    
    echo "1. ${CYAN}检查文件实际存储位置${NC}"
    echo "   - 检查 frontend/public/uploads/product_lines/"
    echo "   - 检查 frontend/dist/uploads/product_lines/"
    echo "   - 检查 Docker volume: uploads_data"
    echo ""
    
    echo "2. ${CYAN}检查阿里云CDN配置${NC}"
    echo "   - 登录阿里云CDN控制台"
    echo "   - 检查回源配置: 确保回源路径正确"
    echo "   - 检查缓存规则: /uploads/ 路径应该配置合适的缓存策略"
    echo "   - 刷新CDN缓存: 在CDN控制台刷新该URL"
    echo ""
    
    echo "3. ${CYAN}检查Nginx配置${NC}"
    echo "   - 确认 /uploads/ location 配置正确"
    echo "   - 确认 alias 路径指向正确的目录"
    echo "   - 检查文件权限: 确保Nginx可以读取文件"
    echo ""
    
    echo "4. ${CYAN}URL编码问题${NC}"
    echo "   - 文件名包含空格，确保URL正确编码"
    echo "   - 尝试访问: https://${DOMAIN_NAME}/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"
    echo "   - 或使用下划线: Water_Activated_Tape_Dispenser.jpg"
    echo ""
    
    echo "5. ${CYAN}同步文件到正确位置${NC}"
    echo "   如果文件存在于 frontend/public/uploads，需要同步到:"
    echo "   - frontend/dist/uploads (构建输出)"
    echo "   - Docker volume (生产环境)"
    echo ""
}

# 主函数
main() {
    local file_url=""
    local check_path=false
    local fix_mode=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--url)
                file_url="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN_NAME="$2"
                shift 2
                ;;
            -c|--check-path)
                check_path=true
                shift
                ;;
            -f|--fix)
                fix_mode=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$file_url" ] && [[ "$1" =~ ^https?:// ]]; then
                    file_url="$1"
                else
                    print_error "未知参数: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 如果没有提供URL，使用默认测试URL
    if [ -z "$file_url" ] && [ "$check_path" = false ]; then
        file_url="https://${DOMAIN_NAME}/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"
        print_info "使用默认测试URL: $file_url"
    fi
    
    print_message "🔍 BJT产品管理系统 - 上传文件404问题诊断"
    print_info "域名: ${DOMAIN_NAME}"
    echo ""
    
    # 提取文件路径
    local file_path=""
    if [ -n "$file_url" ]; then
        file_path=$(extract_path_from_url "$file_url")
        print_info "文件路径: $file_path"
        echo ""
    fi
    
    # 执行诊断
    if [ "$check_path" = true ] || [ -n "$file_path" ]; then
        if [ -n "$file_path" ]; then
            check_file_exists "$file_path"
            echo ""
        fi
        
        # 检查所有可能的product_lines文件
        if echo "$file_path" | grep -q "product_lines"; then
            print_info "检查 product_lines 目录..."
            for dir in "frontend/public/uploads/product_lines" "frontend/dist/uploads/product_lines"; do
                if [ -d "$dir" ]; then
                    local count=$(find "$dir" -type f 2>/dev/null | wc -l)
                    print_info "  $dir: $count 个文件"
                    if [ "$count" -gt 0 ]; then
                        find "$dir" -type f | head -5 | while read f; do
                            echo "    - $(basename "$f")"
                        done
                    fi
                fi
            done
            echo ""
        fi
    fi
    
    # 检查Nginx配置
    check_nginx_config
    echo ""
    
    # 检查CDN配置
    if [ -n "$file_url" ]; then
        check_cdn_headers "$file_url"
        echo ""
        
        # 测试直接访问
        test_direct_access "$file_path"
        echo ""
        
        # 查找相似文件
        find_similar_files "$file_path"
        echo ""
    fi
    
    # 生成修复建议
    if [ -n "$file_path" ]; then
        generate_fix_suggestions "$file_path"
    fi
    
    print_message "✅ 诊断完成"
}

# 运行主函数
main "$@"
