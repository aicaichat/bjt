#!/bin/bash

# =============================================================================
# WordPress 服务重启脚本
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

# 检查服务状态
check_service_status() {
    local service="$1"
    log_info "检查 $service 服务状态..."
    
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" ps "$service" | grep -q "Up"; then
        log_success "$service 服务正在运行"
        return 0
    else
        log_warning "$service 服务未运行"
        return 1
    fi
}

# 重启 WordPress 服务
restart_wordpress() {
    log_info "重启 WordPress 服务..."
    
    # 检查当前状态
    if check_service_status "wordpress"; then
        log_info "WordPress 服务正在运行，执行重启..."
    else
        log_info "WordPress 服务未运行，执行启动..."
    fi
    
    # 重启 WordPress
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" restart wordpress
    
    # 等待服务启动
    log_info "等待 WordPress 服务启动..."
    sleep 15
    
    # 检查服务状态
    if check_service_status "wordpress"; then
        log_success "WordPress 服务重启成功"
    else
        log_error "WordPress 服务重启失败"
        return 1
    fi
}

# 检查依赖服务
check_dependencies() {
    log_info "检查依赖服务..."
    
    # 检查 MySQL
    if ! check_service_status "mysql"; then
        log_warning "MySQL 服务未运行，尝试启动..."
        sudo docker-compose -f "$DOCKER_COMPOSE_FILE" start mysql
        sleep 30
    fi
    
    # 检查 Redis
    if ! check_service_status "redis"; then
        log_warning "Redis 服务未运行，尝试启动..."
        sudo docker-compose -f "$DOCKER_COMPOSE_FILE" start redis
        sleep 10
    fi
}

# 验证 WordPress 功能
verify_wordpress() {
    log_info "验证 WordPress 功能..."
    
    # 检查 WordPress 健康状态
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress curl -f http://localhost:80/ > /dev/null 2>&1; then
        log_success "WordPress HTTP 连接正常"
    else
        log_warning "WordPress HTTP 连接失败"
    fi
    
    # 检查数据库连接
    if sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp db check --allow-root > /dev/null 2>&1; then
        log_success "WordPress 数据库连接正常"
    else
        log_warning "WordPress 数据库连接失败"
    fi
    
    # 检查 WordPress 配置
    log_info "WordPress 配置信息:"
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" exec wordpress wp config list --allow-root
}

# 显示服务日志
show_logs() {
    local lines="${1:-20}"
    log_info "显示 WordPress 服务日志 (最近 $lines 行):"
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" logs wordpress --tail="$lines"
}

# 强制重启（删除并重新创建容器）
force_restart() {
    log_warning "执行强制重启（删除并重新创建容器）..."
    
    # 停止并删除 WordPress 容器
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" down wordpress
    
    # 重新创建并启动容器
    sudo docker-compose -f "$DOCKER_COMPOSE_FILE" up -d wordpress
    
    # 等待服务启动
    log_info "等待 WordPress 服务启动..."
    sleep 30
    
    # 检查服务状态
    if check_service_status "wordpress"; then
        log_success "WordPress 服务强制重启成功"
    else
        log_error "WordPress 服务强制重启失败"
        return 1
    fi
}

# 主函数
main() {
    local action="$1"
    
    echo "========================================"
    echo "WordPress 服务管理脚本"
    echo "========================================"
    
    # 进入项目目录
    cd "$PROJECT_ROOT"
    
    case "$action" in
        "restart")
            check_dependencies
            restart_wordpress
            verify_wordpress
            ;;
        "force-restart")
            check_dependencies
            force_restart
            verify_wordpress
            ;;
        "status")
            check_service_status "wordpress"
            check_service_status "mysql"
            check_service_status "redis"
            ;;
        "logs")
            show_logs "${2:-20}"
            ;;
        "verify")
            verify_wordpress
            ;;
        *)
            echo "用法: $0 [restart|force-restart|status|logs|verify]"
            echo ""
            echo "命令说明:"
            echo "  restart      - 正常重启 WordPress 服务"
            echo "  force-restart - 强制重启（删除并重新创建容器）"
            echo "  status       - 检查服务状态"
            echo "  logs [行数]   - 显示服务日志"
            echo "  verify       - 验证 WordPress 功能"
            echo ""
            echo "示例:"
            echo "  $0 restart"
            echo "  $0 force-restart"
            echo "  $0 status"
            echo "  $0 logs 50"
            echo "  $0 verify"
            exit 1
            ;;
    esac
    
    log_success "操作完成！"
}

# 运行主函数
main "$@"


