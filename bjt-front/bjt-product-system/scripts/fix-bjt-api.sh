#!/bin/bash

# =============================================================================
# BJT API 修复脚本
# =============================================================================

set -e

# 配置变量
PROJECT_ROOT="/var/bjt/www/bjt/bjt-front/bjt-product-system"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker/prod/docker-compose.prod.yml"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 WordPress 服务状态
check_wordpress_status() {
    log_info "检查 WordPress 服务状态..."
    
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" ps wordpress | grep -q "Up"; then
        log_success "WordPress 服务正在运行"
        return 0
    else
        log_error "WordPress 服务未运行"
        return 1
    fi
}

# 检查插件状态
check_plugin_status() {
    log_info "检查 BJT 插件状态..."
    
    # 检查插件是否激活
    local plugin_status=$(sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp plugin list --status=active --allow-root | grep bjt-core-entities || echo "")
    
    if [[ -n "$plugin_status" ]]; then
        log_success "BJT 插件已激活"
        return 0
    else
        log_warning "BJT 插件未激活"
        return 1
    fi
}

# 检查插件文件
check_plugin_files() {
    log_info "检查插件文件..."
    
    # 检查插件目录
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress test -d /var/www/html/wp-content/plugins/bjt-core-entities; then
        log_success "插件目录存在"
    else
        log_error "插件目录不存在"
        return 1
    fi
    
    # 检查主文件
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress test -f /var/www/html/wp-content/plugins/bjt-core-entities/bjt-product-api.php; then
        log_success "插件主文件存在"
    else
        log_error "插件主文件不存在"
        return 1
    fi
}

# 修复插件权限
fix_plugin_permissions() {
    log_info "修复插件文件权限..."
    
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress chown -R www-data:www-data /var/www/html/wp-content/plugins/bjt-core-entities/
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress chmod -R 755 /var/www/html/wp-content/plugins/bjt-core-entities/
    
    log_success "插件权限已修复"
}

# 重新激活插件
reactivate_plugin() {
    log_info "重新激活 BJT 插件..."
    
    # 停用插件
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp plugin deactivate bjt-core-entities --allow-root
    
    # 等待一下
    sleep 2
    
    # 重新激活插件
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp plugin activate bjt-core-entities --allow-root
    
    log_success "插件已重新激活"
}

# 刷新重写规则
flush_rewrite_rules() {
    log_info "刷新重写规则..."
    
    # 设置永久链接结构
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp rewrite structure '/%postname%/' --allow-root
    
    # 刷新重写规则
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp rewrite flush --allow-root
    
    log_success "重写规则已刷新"
}

# 测试 API 路由
test_api_routes() {
    log_info "测试 API 路由..."
    
    # 测试 WordPress REST API
    if curl -s http://localhost:8080/wp-json/ > /dev/null; then
        log_success "WordPress REST API 正常"
    else
        log_error "WordPress REST API 异常"
        return 1
    fi
    
    # 测试 BJT API
    local api_response=$(curl -s http://localhost:8080/wp-json/bjt/v1/product-lines/ | head -1)
    if [[ "$api_response" == *"success"* ]] || [[ "$api_response" == *"data"* ]]; then
        log_success "BJT API 路由正常"
        return 0
    else
        log_warning "BJT API 路由异常，返回: $api_response"
        return 1
    fi
}

# 显示调试信息
show_debug_info() {
    log_info "显示调试信息..."
    
    echo ""
    echo "=== WordPress 配置 ==="
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp config list --allow-root
    
    echo ""
    echo "=== 插件列表 ==="
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp plugin list --allow-root
    
    echo ""
    echo "=== 重写规则 ==="
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp rewrite list --allow-root
    
    echo ""
    echo "=== 插件文件 ==="
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress ls -la /var/www/html/wp-content/plugins/bjt-core-entities/
}

# 主函数
main() {
    local action="$1"
    
    echo "========================================"
    echo "BJT API 修复脚本"
    echo "========================================"
    
    # 进入项目目录
    cd "$PROJECT_ROOT"
    
    case "$action" in
        "check")
            check_wordpress_status
            check_plugin_status
            check_plugin_files
            test_api_routes
            ;;
        "fix")
            check_wordpress_status
            check_plugin_files
            fix_plugin_permissions
            reactivate_plugin
            flush_rewrite_rules
            test_api_routes
            ;;
        "debug")
            show_debug_info
            ;;
        "test")
            test_api_routes
            ;;
        *)
            echo "用法: $0 [check|fix|debug|test]"
            echo ""
            echo "命令说明:"
            echo "  check - 检查服务状态和插件状态"
            echo "  fix   - 修复插件和 API 路由"
            echo "  debug - 显示调试信息"
            echo "  test  - 测试 API 路由"
            echo ""
            echo "示例:"
            echo "  $0 check"
            echo "  $0 fix"
            echo "  $0 debug"
            echo "  $0 test"
            exit 1
            ;;
    esac
    
    log_success "操作完成！"
}

# 运行主函数
main "$@"


