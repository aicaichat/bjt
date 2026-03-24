#!/bin/bash

# BJT产品管理系统 - 生产环境日志查看工具
# 使用方法: ./scripts/view-production-logs.sh [选项]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Docker Compose 命令
COMPOSE="docker compose --env-file .env.production -f docker/prod/docker-compose.prod.yml"

# 打印带颜色的消息
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
    echo -e "${CYAN}[INFO]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
${GREEN}BJT产品管理系统 - 生产环境日志查看工具${NC}

${YELLOW}使用方法:${NC}
  ./scripts/view-production-logs.sh [选项] [服务名]

${YELLOW}选项:${NC}
  -a, --all              查看所有服务的日志
  -f, --follow           实时跟踪日志（类似 tail -f）
  -t, --tail N           显示最后 N 行日志（默认: 100）
  -s, --since TIME       显示指定时间之后的日志（例如: 1h, 30m, 2024-01-01T10:00:00）
  -e, --errors           只显示错误日志
  -w, --warnings         只显示警告和错误日志
  -g, --grep PATTERN     过滤包含指定模式的日志
  -o, --output FILE      将日志导出到文件
  -h, --help             显示此帮助信息

${YELLOW}服务名:${NC}
  nginx                  查看 Nginx 日志
  wordpress              查看 WordPress 日志
  mysql                  查看 MySQL 日志
  redis                  查看 Redis 日志
  db-init                查看数据库初始化日志
  mysql-backup           查看数据库备份日志

${YELLOW}示例:${NC}
  # 查看所有服务的最新日志
  ./scripts/view-production-logs.sh -a

  # 实时跟踪 WordPress 日志
  ./scripts/view-production-logs.sh -f wordpress

  # 查看最近 50 行 Nginx 错误日志
  ./scripts/view-production-logs.sh -t 50 -e nginx

  # 查看最近 1 小时的 MySQL 日志
  ./scripts/view-production-logs.sh -s 1h mysql

  # 搜索包含 "error" 的日志
  ./scripts/view-production-logs.sh -g "error" -a

  # 导出所有日志到文件
  ./scripts/view-production-logs.sh -a -o logs/export-$(date +%Y%m%d-%H%M%S).log

${YELLOW}容器内日志位置:${NC}
  Nginx:
    - 访问日志: /var/log/nginx/access.log
    - 错误日志: /var/log/nginx/error.log
  
  WordPress:
    - PHP 错误日志: /var/www/html/wp-content/debug.log
    - Apache 错误日志: /var/log/apache2/error.log
  
  MySQL:
    - 错误日志: /var/log/mysql/error.log
    - 慢查询日志: /var/log/mysql/slow-query.log

${YELLOW}Docker 日志位置:${NC}
  /var/lib/docker/containers/<container-id>/*-json.log

EOF
}

# 检查是否在项目根目录
check_project_root() {
    if [ ! -f "docker/prod/docker-compose.prod.yml" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
}

# 检查服务是否运行
check_service_running() {
    local service=$1
    if ! $COMPOSE ps | grep -q "$service.*Up"; then
        print_warning "服务 $service 可能未运行"
        return 1
    fi
    return 0
}

# 查看 Docker Compose 日志
view_compose_logs() {
    local service=$1
    local follow=$2
    local tail_lines=$3
    local since_time=$4
    local errors_only=$5
    local warnings_only=$6
    local grep_pattern=$7
    
    local cmd="$COMPOSE logs"
    
    if [ "$follow" = "true" ]; then
        cmd="$cmd -f"
    fi
    
    if [ -n "$tail_lines" ]; then
        cmd="$cmd --tail=$tail_lines"
    fi
    
    if [ -n "$since_time" ]; then
        cmd="$cmd --since=$since_time"
    fi
    
    if [ -n "$service" ]; then
        cmd="$cmd $service"
    fi
    
    if [ "$errors_only" = "true" ]; then
        eval "$cmd" 2>&1 | grep -iE "(error|exception|fatal|critical)" || true
    elif [ "$warnings_only" = "true" ]; then
        eval "$cmd" 2>&1 | grep -iE "(error|exception|fatal|critical|warning)" || true
    elif [ -n "$grep_pattern" ]; then
        eval "$cmd" 2>&1 | grep -iE "$grep_pattern" || true
    else
        eval "$cmd"
    fi
}

# 查看容器内应用日志
view_app_logs() {
    local service=$1
    local log_path=$2
    local follow=$3
    local tail_lines=$4
    
    if ! check_service_running "$service"; then
        return 1
    fi
    
    local cmd="$COMPOSE exec -T $service"
    
    if [ "$follow" = "true" ]; then
        cmd="$cmd tail -f"
    else
        cmd="$cmd tail -n ${tail_lines:-100}"
    fi
    
    cmd="$cmd $log_path"
    
    print_info "查看 $service 的 $log_path 日志..."
    eval "$cmd" 2>&1 || print_warning "无法访问 $service 的日志文件: $log_path"
}

# 查看 Nginx 日志
view_nginx_logs() {
    local follow=$1
    local tail_lines=$2
    local errors_only=$3
    
    print_message "=== Nginx 日志 ==="
    
    if [ "$errors_only" = "true" ]; then
        print_info "查看 Nginx 错误日志..."
        view_app_logs "nginx" "/var/log/nginx/error.log" "$follow" "$tail_lines"
    else
        print_info "查看 Nginx 访问日志..."
        view_app_logs "nginx" "/var/log/nginx/access.log" "$follow" "$tail_lines"
        echo ""
        print_info "查看 Nginx 错误日志..."
        view_app_logs "nginx" "/var/log/nginx/error.log" "$follow" "$tail_lines"
    fi
}

# 查看 WordPress 日志
view_wordpress_logs() {
    local follow=$1
    local tail_lines=$2
    local errors_only=$3
    
    print_message "=== WordPress 日志 ==="
    
    # WordPress debug.log
    if check_service_running "wordpress"; then
        print_info "查看 WordPress debug.log..."
        view_app_logs "wordpress" "/var/www/html/wp-content/debug.log" "$follow" "$tail_lines" || print_warning "debug.log 可能不存在或为空"
        
        echo ""
        print_info "查看 Apache 错误日志..."
        view_app_logs "wordpress" "/var/log/apache2/error.log" "$follow" "$tail_lines" || print_warning "Apache 错误日志可能不存在"
    fi
}

# 查看 MySQL 日志
view_mysql_logs() {
    local follow=$1
    local tail_lines=$2
    local errors_only=$3
    
    print_message "=== MySQL 日志 ==="
    
    if check_service_running "mysql"; then
        print_info "查看 MySQL 错误日志..."
        view_app_logs "mysql" "/var/log/mysql/error.log" "$follow" "$tail_lines" || print_warning "MySQL 错误日志可能不存在"
        
        echo ""
        print_info "查看 MySQL 慢查询日志..."
        view_app_logs "mysql" "/var/log/mysql/slow-query.log" "$follow" "$tail_lines" || print_warning "慢查询日志可能未启用"
    fi
}

# 查看 Redis 日志
view_redis_logs() {
    local follow=$1
    local tail_lines=$2
    
    print_message "=== Redis 日志 ==="
    view_compose_logs "redis" "$follow" "$tail_lines" "" "" "" ""
}

# 显示服务状态
show_service_status() {
    print_message "=== 服务状态 ==="
    $COMPOSE ps
    echo ""
    print_message "=== 容器资源使用 ==="
    docker stats --no-stream $($COMPOSE ps -q) 2>/dev/null || print_warning "无法获取容器资源使用情况"
}

# 导出日志到文件
export_logs() {
    local output_file=$1
    local service=$2
    local tail_lines=$3
    local since_time=$4
    
    print_message "导出日志到: $output_file"
    mkdir -p "$(dirname "$output_file")"
    
    {
        echo "=== BJT产品管理系统日志导出 ==="
        echo "导出时间: $(date)"
        echo "服务: ${service:-all}"
        echo "=================================="
        echo ""
        
        if [ -n "$service" ]; then
            view_compose_logs "$service" "false" "$tail_lines" "$since_time" "" "" ""
        else
            view_compose_logs "" "false" "$tail_lines" "$since_time" "" "" ""
        fi
    } > "$output_file"
    
    print_message "✅ 日志已导出到: $output_file"
    print_info "文件大小: $(du -h "$output_file" | cut -f1)"
}

# 主函数
main() {
    local service=""
    local follow=false
    local tail_lines=100
    local since_time=""
    local errors_only=false
    local warnings_only=false
    local grep_pattern=""
    local output_file=""
    local show_all=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -a|--all)
                show_all=true
                shift
                ;;
            -f|--follow)
                follow=true
                shift
                ;;
            -t|--tail)
                tail_lines="$2"
                shift 2
                ;;
            -s|--since)
                since_time="$2"
                shift 2
                ;;
            -e|--errors)
                errors_only=true
                shift
                ;;
            -w|--warnings)
                warnings_only=true
                shift
                ;;
            -g|--grep)
                grep_pattern="$2"
                shift 2
                ;;
            -o|--output)
                output_file="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            nginx|wordpress|mysql|redis|db-init|mysql-backup)
                service="$1"
                shift
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    check_project_root
    
    # 如果指定了输出文件，直接导出
    if [ -n "$output_file" ]; then
        export_logs "$output_file" "$service" "$tail_lines" "$since_time"
        exit 0
    fi
    
    # 显示服务状态
    if [ "$show_all" = "true" ] || [ -z "$service" ]; then
        show_service_status
        echo ""
    fi
    
    # 根据服务类型查看日志
    if [ "$show_all" = "true" ]; then
        # 查看所有服务
        view_compose_logs "" "$follow" "$tail_lines" "$since_time" "$errors_only" "$warnings_only" "$grep_pattern"
    elif [ -z "$service" ]; then
        # 默认显示所有服务的 Docker Compose 日志
        print_message "=== 所有服务日志 (Docker Compose) ==="
        view_compose_logs "" "$follow" "$tail_lines" "$since_time" "$errors_only" "$warnings_only" "$grep_pattern"
    else
        case $service in
            nginx)
                if [ "$errors_only" = "true" ] || [ "$warnings_only" = "true" ]; then
                    view_nginx_logs "$follow" "$tail_lines" "true"
                else
                    view_nginx_logs "$follow" "$tail_lines" "false"
                fi
                ;;
            wordpress)
                view_wordpress_logs "$follow" "$tail_lines" "$errors_only"
                ;;
            mysql)
                view_mysql_logs "$follow" "$tail_lines" "$errors_only"
                ;;
            redis)
                view_redis_logs "$follow" "$tail_lines"
                ;;
            db-init|mysql-backup)
                view_compose_logs "$service" "$follow" "$tail_lines" "$since_time" "$errors_only" "$warnings_only" "$grep_pattern"
                ;;
            *)
                print_error "未知服务: $service"
                show_help
                exit 1
                ;;
        esac
    fi
}

# 运行主函数
main "$@"
