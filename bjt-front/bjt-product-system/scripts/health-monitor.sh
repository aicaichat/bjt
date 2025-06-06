#!/bin/bash

# BJT产品管理系统 - 健康监控脚本
# 使用方法: ./scripts/health-monitor.sh
# 建议加入crontab: */5 * * * * /path/to/bjt-product-system/scripts/health-monitor.sh

# 配置项
DOMAIN="${DOMAIN_NAME:-bjt.nh.cool}"  # 从环境变量获取或使用默认值
EMAIL="${ADMIN_EMAIL:-admin@company.com}"
LOG_FILE="/var/log/bjt-monitor.log"
COMPOSE_FILE="docker/prod/docker-compose.prod.yml"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# 阈值配置
DISK_THRESHOLD=85
MEMORY_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=5
MIN_CONTAINERS=3

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否在项目根目录
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 加载环境变量
if [ -f ".env.production" ]; then
    source .env.production
fi

# 日志函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 发送告警
send_alert() {
    local message="$1"
    local severity="$2"  # INFO, WARNING, CRITICAL
    
    log_message "ALERT [$severity]: $message"
    
    # 发送邮件 (如果配置了邮件)
    if command -v mail >/dev/null 2>&1 && [ ! -z "$EMAIL" ]; then
        echo "$message" | mail -s "BJT系统告警 [$severity]" "$EMAIL"
    fi
    
    # 发送Telegram消息 (如果配置了)
    if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
        local telegram_message="🚨 BJT系统告警 [$severity]%0A%0A$message"
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID&text=$telegram_message" >/dev/null
    fi
    
    # 输出到控制台
    if [ "$severity" = "CRITICAL" ]; then
        echo -e "${RED}🚨 CRITICAL: $message${NC}"
    elif [ "$severity" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  WARNING: $message${NC}"
    else
        echo -e "${GREEN}ℹ️  INFO: $message${NC}"
    fi
}

# 检查网站可访问性
check_website() {
    log_message "检查网站可访问性..."
    
    local start_time=$(date +%s.%N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" -m $RESPONSE_TIME_THRESHOLD "https://$DOMAIN" 2>/dev/null)
    local end_time=$(date +%s.%N)
    local response_time=$(echo "$end_time - $start_time" | bc)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "302" ]; then
        log_message "✅ 网站正常访问 (响应时间: ${response_time}s)"
        
        # 检查响应时间
        if (( $(echo "$response_time > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
            send_alert "网站响应时间过长: ${response_time}s (阈值: ${RESPONSE_TIME_THRESHOLD}s)" "WARNING"
        fi
    else
        send_alert "网站无法访问: https://$DOMAIN (HTTP状态码: $http_code)" "CRITICAL"
        return 1
    fi
}

# 检查API接口
check_api() {
    log_message "检查API接口..."
    
    local api_url="https://$DOMAIN/wp-json/bjt/v1/"
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$api_url" 2>/dev/null)
    
    if [ "$http_code" = "200" ]; then
        log_message "✅ API接口正常"
    else
        send_alert "API接口异常: $api_url (HTTP状态码: $http_code)" "CRITICAL"
        return 1
    fi
}

# 检查容器状态
check_containers() {
    log_message "检查容器状态..."
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        send_alert "Docker Compose未安装或不可用" "CRITICAL"
        return 1
    fi
    
    # 检查运行中的容器数量
    local running_containers=$(docker-compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -c "Up" || echo "0")
    
    if [ "$running_containers" -lt "$MIN_CONTAINERS" ]; then
        send_alert "容器状态异常，运行中容器数: $running_containers (期望: 至少$MIN_CONTAINERS个)" "CRITICAL"
        
        # 列出异常容器
        local failed_containers=$(docker-compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -v "Up" | tail -n +2 | awk '{print $1}')
        if [ ! -z "$failed_containers" ]; then
            send_alert "异常容器列表: $failed_containers" "INFO"
        fi
        return 1
    else
        log_message "✅ 容器状态正常 ($running_containers 个运行中)"
    fi
}

# 检查磁盘空间
check_disk_space() {
    log_message "检查磁盘空间..."
    
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    local disk_avail=$(df -h / | tail -1 | awk '{print $4}')
    
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        send_alert "磁盘空间不足: 使用率${disk_usage}%, 可用${disk_avail}" "WARNING"
        return 1
    else
        log_message "✅ 磁盘空间充足: 使用率${disk_usage}%, 可用${disk_avail}"
    fi
}

# 检查内存使用
check_memory() {
    log_message "检查内存使用..."
    
    if command -v free >/dev/null 2>&1; then
        local memory_usage=$(free | grep Mem | awk '{printf("%.1f"), $3/$2 * 100.0}')
        local memory_avail=$(free -h | grep Mem | awk '{print $7}')
        
        if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
            send_alert "内存使用过高: ${memory_usage}%, 可用${memory_avail}" "WARNING"
            return 1
        else
            log_message "✅ 内存使用正常: ${memory_usage}%, 可用${memory_avail}"
        fi
    else
        log_message "⚠️  无法检查内存状态"
    fi
}

# 检查数据库连接
check_database() {
    log_message "检查数据库连接..."
    
    if docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqladmin ping -u root -p"${MYSQL_ROOT_PASSWORD}" >/dev/null 2>&1; then
        log_message "✅ 数据库连接正常"
    else
        send_alert "数据库连接失败" "CRITICAL"
        return 1
    fi
}

# 检查SSL证书过期
check_ssl_certificate() {
    log_message "检查SSL证书..."
    
    if [ -f "nginx/ssl/cert.pem" ]; then
        if command -v openssl >/dev/null 2>&1; then
            local expire_date=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2)
            if [ $? -eq 0 ]; then
                local expire_timestamp=$(date -d "$expire_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expire_date" +%s 2>/dev/null)
                local current_timestamp=$(date +%s)
                
                if [ ! -z "$expire_timestamp" ]; then
                    local days_to_expire=$(( (expire_timestamp - current_timestamp) / 86400 ))
                    
                    if [ $days_to_expire -lt 7 ]; then
                        send_alert "SSL证书即将过期，剩余天数: $days_to_expire" "CRITICAL"
                    elif [ $days_to_expire -lt 30 ]; then
                        send_alert "SSL证书即将过期，剩余天数: $days_to_expire" "WARNING"
                    else
                        log_message "✅ SSL证书有效，剩余 $days_to_expire 天"
                    fi
                else
                    log_message "⚠️  无法解析SSL证书过期时间"
                fi
            else
                log_message "⚠️  无法读取SSL证书信息"
            fi
        else
            log_message "⚠️  openssl命令不可用，无法检查SSL证书"
        fi
    else
        log_message "⚠️  SSL证书文件不存在: nginx/ssl/cert.pem"
    fi
}

# 检查Docker系统资源
check_docker_resources() {
    log_message "检查Docker系统资源..."
    
    if command -v docker >/dev/null 2>&1; then
        # 检查Docker磁盘使用
        local docker_disk=$(docker system df | grep "Total" | awk '{print $3}' | sed 's/GB//' | sed 's/MB//')
        
        # 清理无用镜像和容器（如果使用超过10GB）
        if [ ! -z "$docker_disk" ] && (( $(echo "$docker_disk > 10" | bc -l) )); then
            log_message "⚠️  Docker磁盘使用量较大: ${docker_disk}GB，建议清理"
            send_alert "Docker磁盘使用量: ${docker_disk}GB，建议执行 docker system prune" "INFO"
        fi
    fi
}

# 自动修复尝试
auto_repair() {
    log_message "尝试自动修复..."
    
    # 重启异常容器
    local failed_containers=$(docker-compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -v "Up" | tail -n +2 | awk '{print $1}')
    if [ ! -z "$failed_containers" ]; then
        log_message "重启异常容器: $failed_containers"
        docker-compose -f "$COMPOSE_FILE" restart $failed_containers
        sleep 30
        
        # 再次检查
        local still_failed=$(docker-compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -v "Up" | tail -n +2 | awk '{print $1}')
        if [ -z "$still_failed" ]; then
            send_alert "自动修复成功: 重启容器后服务恢复正常" "INFO"
        else
            send_alert "自动修复失败: 容器重启后仍有异常" "CRITICAL"
        fi
    fi
    
    # 清理磁盘空间（如果使用率超过90%）
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        log_message "磁盘空间严重不足，开始清理..."
        docker system prune -f >/dev/null 2>&1
        docker volume prune -f >/dev/null 2>&1
        log_message "磁盘清理完成"
    fi
}

# 生成健康报告
generate_health_report() {
    local report_file="/tmp/bjt-health-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
BJT产品管理系统健康报告
生成时间: $(date)
监控域名: $DOMAIN

=== 系统资源 ===
磁盘使用: $(df -h / | tail -1 | awk '{print $5}') (可用: $(df -h / | tail -1 | awk '{print $4}'))
内存使用: $(free | grep Mem | awk '{printf("%.1f%%"), $3/$2 * 100.0}') (可用: $(free -h | grep Mem | awk '{print $7}'))
负载平均: $(uptime | awk -F'load average:' '{print $2}')

=== 容器状态 ===
$(docker-compose -f "$COMPOSE_FILE" ps 2>/dev/null)

=== 最近日志 ===
$(tail -20 "$LOG_FILE" 2>/dev/null || echo "日志文件不存在")

EOF
    
    echo "$report_file"
}

# 主函数
main() {
    log_message "========================================"
    log_message "开始健康检查..."
    log_message "监控域名: $DOMAIN"
    
    local check_passed=true
    
    # 执行各项检查
    check_website || check_passed=false
    check_api || check_passed=false
    check_containers || check_passed=false
    check_database || check_passed=false
    check_disk_space || check_passed=false
    check_memory || check_passed=false
    check_ssl_certificate
    check_docker_resources
    
    if [ "$check_passed" = true ]; then
        log_message "✅ 所有检查通过，系统运行正常"
    else
        log_message "❌ 发现系统异常，已发送告警"
        
        # 尝试自动修复
        auto_repair
    fi
    
    log_message "健康检查完成"
    log_message "========================================"
    
    # 每天9点生成详细报告
    local hour=$(date +%H)
    if [ "$hour" = "09" ]; then
        local report_file=$(generate_health_report)
        send_alert "每日健康报告已生成: $report_file" "INFO"
    fi
}

# 显示使用帮助
show_help() {
    echo "BJT产品管理系统 - 健康监控脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -q, --quiet    静默模式，只记录错误"
    echo "  -v, --verbose  详细模式，显示所有检查"
    echo "  -r, --report   生成详细健康报告"
    echo ""
    echo "配置环境变量:"
    echo "  DOMAIN_NAME        - 监控的域名"
    echo "  ADMIN_EMAIL        - 告警接收邮箱"
    echo "  TELEGRAM_BOT_TOKEN - Telegram机器人令牌"
    echo "  TELEGRAM_CHAT_ID   - Telegram聊天ID"
    echo ""
    echo "示例:"
    echo "  $0                # 执行健康检查"
    echo "  $0 -r            # 生成健康报告"
    echo "  $0 -q            # 静默执行"
    echo ""
    echo "添加到crontab进行定期监控:"
    echo "  */5 * * * * /path/to/scripts/health-monitor.sh -q"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -r|--report)
            REPORT_ONLY=true
            shift
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 如果只生成报告
if [ "$REPORT_ONLY" = true ]; then
    report_file=$(generate_health_report)
    echo "健康报告已生成: $report_file"
    cat "$report_file"
    exit 0
fi

# 执行主函数
if [ "$QUIET" = true ]; then
    main >/dev/null 2>&1
else
    main
fi 