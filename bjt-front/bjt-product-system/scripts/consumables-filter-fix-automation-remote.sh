#!/bin/bash

# =============================================================================
# 耗材筛选功能远程服务器修复脚本
# 自动检测API端点，适配不同部署环境
# =============================================================================

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 自动检测API端点
detect_api_endpoint() {
    log_info "🔍 自动检测API端点..."
    
    # 可能的API端点列表
    local ENDPOINTS=(
        "http://localhost:8080/wp-json/bjt/v1/consumables"
        "http://127.0.0.1:8080/wp-json/bjt/v1/consumables"
        "http://0.0.0.0:8080/wp-json/bjt/v1/consumables"
        "http://$(hostname -I | awk '{print $1}'):8080/wp-json/bjt/v1/consumables"
        "http://$(curl -s ifconfig.me):8080/wp-json/bjt/v1/consumables"
    )
    
    # 如果有Docker，尝试获取容器IP
    if command -v docker &> /dev/null; then
        local WORDPRESS_IP=$(docker inspect dev-wordpress-1 2>/dev/null | jq -r '.[0].NetworkSettings.IPAddress' 2>/dev/null || echo "")
        if [ ! -z "$WORDPRESS_IP" ] && [ "$WORDPRESS_IP" != "null" ]; then
            ENDPOINTS+=("http://$WORDPRESS_IP/wp-json/bjt/v1/consumables")
        fi
        
        # 尝试获取网络中的IP
        local NETWORK_IP=$(docker inspect dev-wordpress-1 2>/dev/null | jq -r '.[0].NetworkSettings.Networks[].IPAddress' 2>/dev/null | head -1 || echo "")
        if [ ! -z "$NETWORK_IP" ] && [ "$NETWORK_IP" != "null" ]; then
            ENDPOINTS+=("http://$NETWORK_IP/wp-json/bjt/v1/consumables")
        fi
    fi
    
    # 测试每个端点
    for endpoint in "${ENDPOINTS[@]}"; do
        log_info "测试端点: $endpoint"
        local HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$endpoint?limit=1" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            API_ENDPOINT="$endpoint"
            log_success "✅ 找到可用的API端点: $API_ENDPOINT"
            return 0
        else
            log_warning "❌ 端点不可用 (HTTP $HTTP_CODE): $endpoint"
        fi
    done
    
    log_error "❌ 未找到可用的API端点"
    return 1
}

# 检查Docker服务状态
check_docker_services() {
    log_info "🐳 检查Docker服务状态..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装"
        return 1
    fi
    
    # 检查WordPress容器
    if ! docker ps | grep -q "dev-wordpress-1"; then
        log_warning "WordPress容器未运行，尝试启动..."
        if [ -f "docker/dev/docker-compose.nginx.yml" ]; then
            docker-compose -f docker/dev/docker-compose.nginx.yml up -d wordpress
            sleep 10
        else
            log_error "找不到docker-compose配置文件"
            return 1
        fi
    fi
    
    # 检查容器健康状态
    local HEALTH_STATUS=$(docker inspect dev-wordpress-1 --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    log_info "WordPress容器健康状态: $HEALTH_STATUS"
    
    if [ "$HEALTH_STATUS" = "unhealthy" ]; then
        log_warning "容器状态不健康，等待恢复..."
        sleep 15
    fi
    
    return 0
}

# 环境检查
environment_check() {
    log_info "🔍 环境检查..."
    
    # 检查操作系统
    local OS_INFO=$(uname -a)
    log_info "操作系统: $OS_INFO"
    
    # 检查网络连接
    if ping -c 1 8.8.8.8 &> /dev/null; then
        log_success "网络连接正常"
    else
        log_warning "网络连接可能有问题"
    fi
    
    # 检查磁盘空间
    local DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        log_error "磁盘空间不足 ($DISK_USAGE%)"
        return 1
    else
        log_success "磁盘空间充足 ($DISK_USAGE%)"
    fi
    
    # 检查必需文件
    local REQUIRED_FILES=(
        "plugins/bjt-core-entities/controllers/class-consumable-controller.php"
        "scripts/fix-consumables-mapping.sh"
        "scripts/fix-consumables-filter-options.sh"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "缺少必需文件: $file"
            return 1
        fi
    done
    
    log_success "环境检查通过"
    return 0
}

# 安全备份
create_backup() {
    local BACKUP_DIR="/tmp/consumables_remote_fix_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    log_info "📦 创建备份: $BACKUP_DIR"
    
    # 备份关键文件
    cp "plugins/bjt-core-entities/controllers/class-consumable-controller.php" "$BACKUP_DIR/"
    
    # 记录当前API状态
    if [ ! -z "$API_ENDPOINT" ]; then
        curl -s "$API_ENDPOINT?limit=1" > "$BACKUP_DIR/api_before.json" 2>/dev/null || log_warning "API状态记录失败"
    fi
    
    # 记录系统信息
    cat > "$BACKUP_DIR/system_info.txt" << EOF
备份时间: $(date)
主机名: $(hostname)
系统信息: $(uname -a)
Docker版本: $(docker --version 2>/dev/null || echo "未安装")
API端点: $API_ENDPOINT
磁盘使用: $(df -h / | tail -1)
内存使用: $(free -h 2>/dev/null || echo "N/A")
EOF
    
    echo "$BACKUP_DIR" > /tmp/latest_backup_path.txt
    log_success "备份完成: $BACKUP_DIR"
}

# 执行修复
execute_fix() {
    local BACKUP_DIR=$(cat /tmp/latest_backup_path.txt)
    
    log_info "🔧 开始执行修复..."
    
    # Step 1: 字段映射修复
    echo
    log_info "Step 1: API字段映射修复"
    read -p "继续执行字段映射修复？[y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        chmod +x scripts/fix-consumables-mapping.sh
        if ./scripts/fix-consumables-mapping.sh; then
            log_success "字段映射修复完成"
        else
            log_error "字段映射修复失败"
            return 1
        fi
    else
        log_warning "跳过字段映射修复"
    fi
    
    # Step 2: 筛选选项修复
    echo
    log_info "Step 2: 筛选选项动态生成修复"
    read -p "继续执行筛选选项修复？[y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        chmod +x scripts/fix-consumables-filter-options.sh
        if ./scripts/fix-consumables-filter-options.sh; then
            log_success "筛选选项修复完成"
        else
            log_error "筛选选项修复失败"
            return 1
        fi
    else
        log_warning "跳过筛选选项修复"
    fi
    
    # Step 3: 服务重启
    echo
    log_warning "Step 3: 服务重启"
    read -p "确认重启WordPress服务？[y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "重启WordPress服务..."
        if docker restart dev-wordpress-1; then
            log_info "等待服务启动..."
            sleep 20
            
            # 重新检测API端点
            if detect_api_endpoint; then
                log_success "服务重启成功，API可用"
            else
                log_error "服务重启后API不可用"
                echo "回滚命令: cp $BACKUP_DIR/class-consumable-controller.php plugins/bjt-core-entities/controllers/"
                return 1
            fi
        else
            log_error "服务重启失败"
            return 1
        fi
    else
        log_warning "跳过服务重启"
    fi
    
    return 0
}

# 验证修复结果
validate_fix() {
    log_info "🧪 验证修复结果..."
    
    if [ -z "$API_ENDPOINT" ]; then
        log_error "API端点未设置，无法验证"
        return 1
    fi
    
    # 基本API测试
    local HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT?limit=1")
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "API基本功能正常 (HTTP $HTTP_CODE)"
    else
        log_error "API不可用 (HTTP $HTTP_CODE)"
        return 1
    fi
    
    # 筛选选项测试
    local FILTER_OPTIONS=$(curl -s "$API_ENDPOINT?limit=1" | jq '.data.filterOptions' 2>/dev/null)
    if [ "$FILTER_OPTIONS" != "null" ] && [ "$FILTER_OPTIONS" != "" ]; then
        log_success "筛选选项正常"
        
        # 统计筛选选项数量
        local SHAPES_COUNT=$(echo "$FILTER_OPTIONS" | jq '.shapes | length' 2>/dev/null || echo "0")
        local MATERIALS_COUNT=$(echo "$FILTER_OPTIONS" | jq '.materials | length' 2>/dev/null || echo "0")
        local MODELS_COUNT=$(echo "$FILTER_OPTIONS" | jq '.models | length' 2>/dev/null || echo "0")
        
        log_info "筛选选项统计: 形状($SHAPES_COUNT) 材质($MATERIALS_COUNT) 机型($MODELS_COUNT)"
    else
        log_error "筛选选项异常"
        return 1
    fi
    
    # 功能测试
    local SHAPE_TEST=$(curl -s "$API_ENDPOINT?shape=Pillow&limit=5" | jq '.data.items | length' 2>/dev/null || echo "0")
    if [ "$SHAPE_TEST" -gt 0 ]; then
        log_success "形状筛选功能正常 ($SHAPE_TEST 条结果)"
    else
        log_warning "形状筛选可能异常"
    fi
    
    log_success "验证完成"
    return 0
}

# 主执行流程
main() {
    echo "🌐 耗材筛选功能远程服务器修复脚本"
    echo "========================================"
    
    # 环境检查
    if ! environment_check; then
        log_error "环境检查失败"
        exit 1
    fi
    
    # 检查Docker服务
    if ! check_docker_services; then
        log_error "Docker服务检查失败"
        exit 1
    fi
    
    # 检测API端点
    if ! detect_api_endpoint; then
        log_error "无法找到可用的API端点，请检查服务状态"
        exit 1
    fi
    
    # 创建备份
    create_backup
    
    # 执行修复
    if execute_fix; then
        # 验证结果
        if validate_fix; then
            local BACKUP_DIR=$(cat /tmp/latest_backup_path.txt)
            echo
            log_success "🎉 修复完成！"
            log_info "📁 备份目录: $BACKUP_DIR"
            log_info "🌐 API端点: $API_ENDPOINT"
            log_info "🔧 如需回滚: cp $BACKUP_DIR/class-consumable-controller.php plugins/bjt-core-entities/controllers/"
        else
            log_error "验证失败，请检查修复结果"
            exit 1
        fi
    else
        log_error "修复失败"
        exit 1
    fi
    
    # 清理临时文件
    rm -f /tmp/latest_backup_path.txt
}

# 错误处理
trap 'log_error "脚本执行中断，请检查备份目录进行回滚"' ERR

# 执行主流程
main "$@" 