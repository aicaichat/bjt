#!/bin/bash

# BJT Product System - 上传文件权限设置脚本
# 确保nginx和WordPress容器都能正确访问上传文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# 配置变量
UPLOADS_DIR="frontend/public/uploads"
COMPOSE_FILE="docker/prod/docker-compose.prod.yml"
NGINX_USER_ID=101
NGINX_GROUP_ID=101
WWW_DATA_ID=33

# 显示帮助
show_help() {
    echo "BJT Product System - 上传文件权限设置"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help           显示此帮助信息"
    echo "  -f, --compose-file   指定docker-compose文件 (默认: $COMPOSE_FILE)"
    echo "  -d, --uploads-dir    指定上传目录 (默认: $UPLOADS_DIR)"
    echo "  -c, --create         创建缺失的目录结构"
    echo "  -r, --repair         修复权限问题"
    echo "  -v, --verify         验证权限设置"
    echo ""
    echo "示例:"
    echo "  $0 -c                创建上传目录结构"
    echo "  $0 -r                修复权限问题"
    echo "  $0 -v                验证当前权限"
}

# 解析命令行参数
CREATE_DIRS=false
REPAIR_PERMISSIONS=false
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--compose-file)
            COMPOSE_FILE="$2"
            shift 2
            ;;
        -d|--uploads-dir)
            UPLOADS_DIR="$2"
            shift 2
            ;;
        -c|--create)
            CREATE_DIRS=true
            shift
            ;;
        -r|--repair)
            REPAIR_PERMISSIONS=true
            shift
            ;;
        -v|--verify)
            VERIFY_ONLY=true
            shift
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 检查前置条件
check_prerequisites() {
    print_info "检查前置条件..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker Compose文件不存在: $COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -d "frontend/public" ]; then
        print_error "frontend/public 目录不存在"
        exit 1
    fi
    
    print_message "前置条件检查通过"
}

# 创建上传目录结构
create_uploads_structure() {
    print_info "创建上传目录结构..."
    
    local dirs=(
        "$UPLOADS_DIR"
        "$UPLOADS_DIR/specifications"
        "$UPLOADS_DIR/machines" 
        "$UPLOADS_DIR/parts"
        "$UPLOADS_DIR/consumables"
        "$UPLOADS_DIR/spare-parts"
        "$UPLOADS_DIR/accessory"
        "$UPLOADS_DIR/host"
        "$UPLOADS_DIR/product_lines"
        "$UPLOADS_DIR/spare_parts"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_info "创建目录: $dir"
        else
            print_info "目录已存在: $dir"
        fi
    done
    
    print_message "上传目录结构创建完成"
}

# 设置目录权限
setup_permissions() {
    print_info "设置上传目录权限..."
    
    # 设置目录权限为755，文件权限为644
    find "$UPLOADS_DIR" -type d -exec chmod 755 {} \;
    find "$UPLOADS_DIR" -type f -exec chmod 644 {} \;
    
    # 如果运行在支持chown的环境中
    if command -v chown &> /dev/null; then
        # 尝试设置所有权为www-data (nginx和php-fpm都能访问)
        if id -u www-data &>/dev/null; then
            print_info "设置所有权为 www-data:www-data"
            chown -R www-data:www-data "$UPLOADS_DIR" || print_warning "无法设置所有权，权限可能不足"
        else
            print_warning "www-data 用户不存在，跳过所有权设置"
        fi
    else
        print_warning "chown 命令不可用，跳过所有权设置"
    fi
    
    print_message "权限设置完成"
}

# 修复容器内权限
fix_container_permissions() {
    print_info "修复容器内权限..."
    
    # 检查容器是否运行
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q nginx; then
        print_warning "Nginx容器未运行，跳过容器内权限修复"
        return 0
    fi
    
    # 修复nginx容器内的权限
    print_info "修复nginx容器内权限..."
    docker-compose -f "$COMPOSE_FILE" exec nginx sh -c "
        chown -R nginx:nginx /usr/share/nginx/html/uploads 2>/dev/null || true
        chmod -R 755 /usr/share/nginx/html/uploads 2>/dev/null || true
        echo 'Nginx容器权限修复完成'
    " || print_warning "nginx容器权限修复失败"
    
    # 修复WordPress容器内的权限
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q wordpress; then
        print_info "修复WordPress容器内权限..."
        docker-compose -f "$COMPOSE_FILE" exec wordpress sh -c "
            chown -R www-data:www-data /var/www/html/frontend/public/uploads 2>/dev/null || true
            chmod -R 755 /var/www/html/frontend/public/uploads 2>/dev/null || true
            echo 'WordPress容器权限修复完成'
        " || print_warning "WordPress容器权限修复失败"
    fi
    
    print_message "容器内权限修复完成"
}

# 验证权限设置
verify_permissions() {
    print_info "验证权限设置..."
    
    # 检查目录是否存在
    if [ ! -d "$UPLOADS_DIR" ]; then
        print_error "上传目录不存在: $UPLOADS_DIR"
        return 1
    fi
    
    # 检查主要目录的权限
    local perms=$(stat -c "%a" "$UPLOADS_DIR" 2>/dev/null || stat -f "%OLp" "$UPLOADS_DIR" 2>/dev/null)
    if [ "$perms" = "755" ] || [ "$perms" = "775" ]; then
        print_message "上传目录权限正确: $perms"
    else
        print_warning "上传目录权限可能有问题: $perms"
    fi
    
    # 检查子目录
    local subdirs=(specifications machines parts consumables spare-parts accessory host)
    for subdir in "${subdirs[@]}"; do
        if [ -d "$UPLOADS_DIR/$subdir" ]; then
            print_info "✓ $subdir 目录存在"
        else
            print_warning "✗ $subdir 目录缺失"
        fi
    done
    
    # 测试写入权限
    local test_file="$UPLOADS_DIR/.permission_test"
    if touch "$test_file" 2>/dev/null; then
        rm -f "$test_file"
        print_message "写入权限测试通过"
    else
        print_warning "写入权限测试失败"
    fi
    
    print_message "权限验证完成"
}

# 测试容器访问
test_container_access() {
    print_info "测试容器访问权限..."
    
    # 测试nginx容器访问
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q nginx; then
        print_info "测试nginx容器访问..."
        local nginx_test=$(docker-compose -f "$COMPOSE_FILE" exec nginx sh -c "
            ls -la /usr/share/nginx/html/uploads/ 2>/dev/null | wc -l
        " || echo "0")
        
        if [ "$nginx_test" -gt 1 ]; then
            print_message "✓ Nginx容器可以访问上传目录"
        else
            print_warning "✗ Nginx容器无法访问上传目录"
        fi
    fi
    
    # 测试WordPress容器访问
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q wordpress; then
        print_info "测试WordPress容器访问..."
        local wp_test=$(docker-compose -f "$COMPOSE_FILE" exec wordpress sh -c "
            ls -la /var/www/html/frontend/public/uploads/ 2>/dev/null | wc -l
        " || echo "0")
        
        if [ "$wp_test" -gt 1 ]; then
            print_message "✓ WordPress容器可以访问上传目录"
        else
            print_warning "✗ WordPress容器无法访问上传目录"
        fi
    fi
}

# 主函数
main() {
    print_message "开始设置上传文件权限..."
    print_info "上传目录: $UPLOADS_DIR"
    print_info "Docker Compose: $COMPOSE_FILE"
    echo
    
    check_prerequisites
    
    if [ "$CREATE_DIRS" = true ]; then
        create_uploads_structure
    fi
    
    if [ "$REPAIR_PERMISSIONS" = true ]; then
        setup_permissions
        fix_container_permissions
    fi
    
    verify_permissions
    test_container_access
    
    echo
    print_message "权限设置完成！"
    echo
    print_info "下一步操作建议："
    echo "  1. 重启nginx容器: docker-compose -f $COMPOSE_FILE restart nginx"
    echo "  2. 测试文件上传功能"
    echo "  3. 检查nginx日志: docker-compose -f $COMPOSE_FILE logs nginx"
    echo
}

# 运行主函数
main "$@" 