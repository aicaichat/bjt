#!/bin/bash

# BJT产品管理系统 - Docker容器内上传文件检查工具
# 用于检查生产环境Docker容器中的文件和目录
# 使用方法: ./scripts/check-docker-uploads.sh [选项]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
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
${GREEN}BJT产品管理系统 - Docker容器内上传文件检查工具${NC}

${YELLOW}使用方法:${NC}
  ./scripts/check-docker-uploads.sh [选项] [文件路径]

${YELLOW}选项:${NC}
  -p, --path PATH         要检查的文件或目录路径
  -s, --service SERVICE   指定服务名（nginx/wordpress，默认: nginx）
  -l, --list              列出目录内容
  -f, --find PATTERN      查找匹配模式的文件
  -t, --tree              以树状结构显示目录
  -d, --detail            显示详细信息（权限、大小等）
  -a, --all               检查所有相关位置
  -h, --help              显示此帮助信息

${YELLOW}示例:${NC}
  # 检查特定文件
  ./scripts/check-docker-uploads.sh -p "/uploads/product_lines/Water Activated Tape Dispenser.jpg"

  # 列出product_lines目录内容
  ./scripts/check-docker-uploads.sh -p "/uploads/product_lines" -l

  # 查找所有jpg文件
  ./scripts/check-docker-uploads.sh -f "*.jpg" -p "/uploads"

  # 检查所有相关位置
  ./scripts/check-docker-uploads.sh -p "/uploads/product_lines" -a

  # 显示目录树
  ./scripts/check-docker-uploads.sh -p "/uploads" -t

${YELLOW}常用路径:${NC}
  Nginx容器:
    - /usr/share/nginx/html/uploads/
    - /usr/share/nginx/html/uploads/product_lines/
    - /usr/share/nginx/html/uploads/machines/
    - /usr/share/nginx/html/uploads/consumables/
  
  WordPress容器:
    - /var/www/html/wp-content/uploads/
    - /var/www/html/frontend/public/uploads/

EOF
}

# 检查服务是否运行
check_service_running() {
    local service=$1
    if ! $COMPOSE ps | grep -q "$service.*Up"; then
        print_error "服务 $service 未运行"
        return 1
    fi
    return 0
}

# 检查文件或目录是否存在
check_path() {
    local service=$1
    local path=$2
    local detail=$3
    
    print_info "检查 $service 容器中的路径: $path"
    
    if ! check_service_running "$service"; then
        return 1
    fi
    
    # 检查路径是否存在
    if $COMPOSE exec -T "$service" test -e "$path" 2>/dev/null; then
        print_message "✅ 路径存在: $path"
        
        if [ "$detail" = "true" ]; then
            # 显示详细信息
            if $COMPOSE exec -T "$service" test -f "$path" 2>/dev/null; then
                # 文件信息
                local size=$($COMPOSE exec -T "$service" stat -c "%s" "$path" 2>/dev/null || echo "N/A")
                local perms=$($COMPOSE exec -T "$service" stat -c "%a" "$path" 2>/dev/null || echo "N/A")
                local owner=$($COMPOSE exec -T "$service" stat -c "%U:%G" "$path" 2>/dev/null || echo "N/A")
                
                echo "  类型: 文件"
                echo "  大小: $size 字节"
                echo "  权限: $perms"
                echo "  所有者: $owner"
            elif $COMPOSE exec -T "$service" test -d "$path" 2>/dev/null; then
                # 目录信息
                local file_count=$($COMPOSE exec -T "$service" find "$path" -type f 2>/dev/null | wc -l || echo "0")
                local dir_count=$($COMPOSE exec -T "$service" find "$path" -type d 2>/dev/null | wc -l || echo "0")
                local perms=$($COMPOSE exec -T "$service" stat -c "%a" "$path" 2>/dev/null || echo "N/A")
                local owner=$($COMPOSE exec -T "$service" stat -c "%U:%G" "$path" 2>/dev/null || echo "N/A")
                
                echo "  类型: 目录"
                echo "  文件数: $file_count"
                echo "  子目录数: $dir_count"
                echo "  权限: $perms"
                echo "  所有者: $owner"
            fi
        fi
        
        return 0
    else
        print_error "❌ 路径不存在: $path"
        return 1
    fi
}

# 列出目录内容
list_directory() {
    local service=$1
    local path=$2
    local detail=$3
    
    print_info "列出 $service 容器中的目录内容: $path"
    
    if ! check_service_running "$service"; then
        return 1
    fi
    
    if $COMPOSE exec -T "$service" test -d "$path" 2>/dev/null; then
        if [ "$detail" = "true" ]; then
            # 详细列表
            print_message "目录内容（详细信息）:"
            $COMPOSE exec -T "$service" ls -lah "$path" 2>/dev/null || print_error "无法列出目录内容"
        else
            # 简单列表
            print_message "目录内容:"
            $COMPOSE exec -T "$service" ls -la "$path" 2>/dev/null || print_error "无法列出目录内容"
        fi
    else
        print_error "路径不是目录或不存在: $path"
        return 1
    fi
}

# 查找文件
find_files() {
    local service=$1
    local path=$2
    local pattern=$3
    
    print_info "在 $service 容器中查找文件: $pattern (路径: $path)"
    
    if ! check_service_running "$service"; then
        return 1
    fi
    
    if $COMPOSE exec -T "$service" test -d "$path" 2>/dev/null; then
        print_message "找到的文件:"
        $COMPOSE exec -T "$service" find "$path" -name "$pattern" -type f 2>/dev/null | while read -r file; do
            local size=$($COMPOSE exec -T "$service" stat -c "%s" "$file" 2>/dev/null || echo "N/A")
            echo "  - $file ($size 字节)"
        done
    else
        print_error "路径不存在: $path"
        return 1
    fi
}

# 显示目录树
show_tree() {
    local service=$1
    local path=$2
    
    print_info "显示 $service 容器中的目录树: $path"
    
    if ! check_service_running "$service"; then
        return 1
    fi
    
    if $COMPOSE exec -T "$service" test -d "$path" 2>/dev/null; then
        # 使用tree命令（如果可用）或find模拟
        if $COMPOSE exec -T "$service" which tree >/dev/null 2>&1; then
            $COMPOSE exec -T "$service" tree -L 3 "$path" 2>/dev/null || true
        else
            # 使用find模拟tree
            print_message "目录结构:"
            $COMPOSE exec -T "$service" find "$path" -type d 2>/dev/null | sort | sed 's|[^/]*/| |g' | sed 's|^ ||' || true
            echo ""
            print_message "文件列表:"
            $COMPOSE exec -T "$service" find "$path" -type f 2>/dev/null | head -20 || true
        fi
    else
        print_error "路径不存在: $path"
        return 1
    fi
}

# 检查所有相关位置
check_all_locations() {
    local path=$1
    local detail=$2
    
    print_message "🔍 检查所有相关位置..."
    echo ""
    
    # Nginx容器位置
    local nginx_paths=(
        "/usr/share/nginx/html/uploads$path"
        "/usr/share/nginx/html/uploads$path"
    )
    
    # WordPress容器位置
    local wordpress_paths=(
        "/var/www/html/wp-content/uploads$path"
        "/var/www/html/frontend/public/uploads$path"
    )
    
    print_info "=== Nginx 容器 ==="
    for nginx_path in "${nginx_paths[@]}"; do
        check_path "nginx" "$nginx_path" "$detail"
        echo ""
    done
    
    print_info "=== WordPress 容器 ==="
    for wp_path in "${wordpress_paths[@]}"; do
        check_path "wordpress" "$wp_path" "$detail"
        echo ""
    done
}

# 检查特定图片文件
check_image_file() {
    local filename=$1
    
    print_message "🔍 检查图片文件: $filename"
    echo ""
    
    # 尝试不同的路径变体（处理空格和编码）
    local variants=(
        "$filename"
        "$(echo "$filename" | sed 's|%20| |g')"
        "$(echo "$filename" | sed 's| |_|g')"
        "$(echo "$filename" | sed 's|%20|_|g')"
    )
    
    local search_paths=(
        "/usr/share/nginx/html/uploads/product_lines"
        "/var/www/html/wp-content/uploads/product_lines"
        "/var/www/html/frontend/public/uploads/product_lines"
    )
    
    for search_path in "${search_paths[@]}"; do
        print_info "在 $search_path 中搜索..."
        
        for variant in "${variants[@]}"; do
            local full_path="$search_path/$variant"
            
            # 检查Nginx容器
            if check_service_running "nginx"; then
                if $COMPOSE exec -T nginx test -f "$full_path" 2>/dev/null; then
                    print_message "✅ 在Nginx容器中找到: $full_path"
                    $COMPOSE exec -T nginx ls -lh "$full_path" 2>/dev/null || true
                    return 0
                fi
            fi
            
            # 检查WordPress容器
            if check_service_running "wordpress"; then
                if $COMPOSE exec -T wordpress test -f "$full_path" 2>/dev/null; then
                    print_message "✅ 在WordPress容器中找到: $full_path"
                    $COMPOSE exec -T wordpress ls -lh "$full_path" 2>/dev/null || true
                    return 0
                fi
            fi
        done
    done
    
    print_error "❌ 未找到文件: $filename"
    return 1
}

# 主函数
main() {
    local path=""
    local service="nginx"
    local list_mode=false
    local find_pattern=""
    local tree_mode=false
    local detail_mode=false
    local all_locations=false
    local image_file=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--path)
                path="$2"
                shift 2
                ;;
            -s|--service)
                service="$2"
                shift 2
                ;;
            -l|--list)
                list_mode=true
                shift
                ;;
            -f|--find)
                find_pattern="$2"
                shift 2
                ;;
            -t|--tree)
                tree_mode=true
                shift
                ;;
            -d|--detail)
                detail_mode=true
                shift
                ;;
            -a|--all)
                all_locations=true
                shift
                ;;
            -i|--image)
                image_file="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$path" ] && [[ "$1" =~ ^/ ]]; then
                    path="$1"
                elif [ -z "$image_file" ] && [[ "$1" =~ \.(jpg|jpeg|png|gif) ]]; then
                    image_file="$1"
                else
                    print_error "未知参数: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 检查是否在项目根目录，如果不是则自动查找
    if [ ! -f "docker/prod/docker-compose.prod.yml" ]; then
        # 尝试查找项目根目录
        local current_dir=$(pwd)
        local project_root=""
        
        # 向上查找项目根目录
        local check_dir="$current_dir"
        while [ "$check_dir" != "/" ]; do
            if [ -f "$check_dir/docker/prod/docker-compose.prod.yml" ]; then
                project_root="$check_dir"
                break
            fi
            check_dir=$(dirname "$check_dir")
        done
        
        if [ -n "$project_root" ]; then
            print_warning "当前不在项目根目录，自动切换到: $project_root"
            cd "$project_root"
            # 更新COMPOSE命令以使用新的工作目录
            COMPOSE="docker compose --env-file $project_root/.env.production -f $project_root/docker/prod/docker-compose.prod.yml"
        else
            print_error "请在项目根目录运行此脚本，或确保在项目子目录中"
            print_info "项目根目录应该包含: docker/prod/docker-compose.prod.yml"
            exit 1
        fi
    fi
    
    # 如果没有提供路径，使用默认路径
    if [ -z "$path" ] && [ -z "$image_file" ]; then
        path="/uploads"
    fi
    
    print_message "🔍 BJT产品管理系统 - Docker容器文件检查工具"
    echo ""
    
    # 显示服务状态
    print_info "服务状态:"
    $COMPOSE ps | grep -E "(nginx|wordpress)" || true
    echo ""
    
    # 如果指定了图片文件，优先检查图片
    if [ -n "$image_file" ]; then
        check_image_file "$image_file"
        exit $?
    fi
    
    # 根据模式执行操作
    if [ "$all_locations" = "true" ]; then
        check_all_locations "$path" "$detail_mode"
    elif [ "$tree_mode" = "true" ]; then
        show_tree "$service" "$path"
    elif [ -n "$find_pattern" ]; then
        find_files "$service" "$path" "$find_pattern"
    elif [ "$list_mode" = "true" ]; then
        list_directory "$service" "$path" "$detail_mode"
    else
        check_path "$service" "$path" "$detail_mode"
    fi
    
    print_message "✅ 检查完成"
}

# 运行主函数
main "$@"
