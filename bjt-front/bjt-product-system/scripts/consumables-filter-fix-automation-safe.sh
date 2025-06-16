#!/bin/bash

# =============================================================================
# 耗材筛选功能安全修复脚本 - 生产环境版本
# 增加更多安全检查和人工确认步骤
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

# 检查是否为生产环境
check_production_environment() {
    log_warning "🚨 生产环境安全检查"
    
    # 检查环境标识
    if [[ "$NODE_ENV" == "production" ]] || [[ "$ENVIRONMENT" == "production" ]]; then
        log_error "检测到生产环境，需要额外确认"
        echo
        echo "⚠️  您即将在生产环境执行修复操作，这可能导致："
        echo "   1. 服务短暂中断"
        echo "   2. API响应格式变化"
        echo "   3. 用户体验临时受影响"
        echo
        read -p "🔴 确认在生产环境执行？请输入 'CONFIRM-PRODUCTION' 继续: " -r
        if [[ "$REPLY" != "CONFIRM-PRODUCTION" ]]; then
            log_error "生产环境确认失败，退出执行"
            exit 1
        fi
    fi
}

# 预检查阶段
pre_flight_check() {
    log_info "🔍 执行预检查..."
    
    # 1. 检查服务状态
    if ! curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" > /dev/null; then
        log_error "API服务不可用，请先确保服务正常运行"
        exit 1
    fi
    
    # 2. 检查磁盘空间
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 90 ]; then
        log_error "磁盘空间不足 ($DISK_USAGE%)，请清理后重试"
        exit 1
    fi
    
    # 3. 检查必需文件
    REQUIRED_FILES=(
        "plugins/bjt-core-entities/controllers/class-consumable-controller.php"
        "scripts/fix-consumables-mapping.sh"
        "scripts/fix-consumables-filter-options.sh"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "缺少必需文件: $file"
            exit 1
        fi
    done
    
    # 4. 检查Docker服务
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose 未安装或不可用"
        exit 1
    fi
    
    log_success "预检查通过"
}

# 安全备份
safe_backup() {
    local BACKUP_DIR="/tmp/consumables_safe_fix_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    log_info "📦 创建安全备份: $BACKUP_DIR"
    
    # 备份关键文件
    cp "plugins/bjt-core-entities/controllers/class-consumable-controller.php" "$BACKUP_DIR/"
    
    # 记录当前API状态
    curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" > "$BACKUP_DIR/api_before.json"
    
    # 记录系统信息
    cat > "$BACKUP_DIR/system_info.txt" << EOF
备份时间: $(date)
系统信息: $(uname -a)
Docker版本: $(docker --version)
磁盘使用: $(df -h /)
EOF
    
    echo "$BACKUP_DIR" > /tmp/latest_backup_path.txt
    log_success "备份完成: $BACKUP_DIR"
}

# 分步执行修复
step_by_step_fix() {
    local BACKUP_DIR=$(cat /tmp/latest_backup_path.txt)
    
    log_info "🔧 开始分步修复..."
    
    # Step 1: 字段映射修复
    echo
    log_info "Step 1: API字段映射修复"
    echo "即将修改: plugins/bjt-core-entities/controllers/class-consumable-controller.php"
    read -p "继续执行字段映射修复？[y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        chmod +x scripts/fix-consumables-mapping.sh
        ./scripts/fix-consumables-mapping.sh
        log_success "字段映射修复完成"
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
        ./scripts/fix-consumables-filter-options.sh
        log_success "筛选选项修复完成"
    else
        log_warning "跳过筛选选项修复"
    fi
    
    # Step 3: 服务重启确认
    echo
    log_warning "Step 3: 服务重启"
    echo "⚠️  即将重启后端服务，这会导致短暂的服务中断"
    read -p "确认重启后端服务？[y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "重启后端服务..."
        docker-compose restart backend
        log_info "等待服务启动..."
        sleep 15
        
        # 验证服务状态
        if curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" > /dev/null; then
            log_success "服务重启成功"
        else
            log_error "服务重启后不可用，请检查"
            echo "回滚命令: cp $BACKUP_DIR/class-consumable-controller.php plugins/bjt-core-entities/controllers/"
        fi
    else
        log_warning "跳过服务重启 - 请手动重启以使更改生效"
    fi
}

# 验证修复结果
validate_fix() {
    log_info "🧪 验证修复结果..."
    
    # 基本API测试
    if curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" > /dev/null; then
        log_success "API基本功能正常"
    else
        log_error "API不可用"
        return 1
    fi
    
    # 筛选选项测试
    local FILTER_OPTIONS=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | jq '.data.filterOptions' 2>/dev/null)
    if [ "$FILTER_OPTIONS" != "null" ] && [ "$FILTER_OPTIONS" != "" ]; then
        log_success "筛选选项正常"
    else
        log_error "筛选选项异常"
        return 1
    fi
    
    # 功能测试
    local SHAPE_TEST=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?shape=Pillow&limit=5" | jq '.data.items | length' 2>/dev/null || echo "0")
    if [ "$SHAPE_TEST" -gt 0 ]; then
        log_success "形状筛选功能正常 ($SHAPE_TEST 条结果)"
    else
        log_warning "形状筛选可能异常"
    fi
    
    log_success "验证完成"
}

# 主执行流程
main() {
    echo "🛡️  耗材筛选功能安全修复脚本 - 生产环境版本"
    echo "================================================"
    
    # 安全检查
    check_production_environment
    pre_flight_check
    
    # 执行修复
    safe_backup
    step_by_step_fix
    validate_fix
    
    # 最终报告
    local BACKUP_DIR=$(cat /tmp/latest_backup_path.txt)
    echo
    log_success "🎉 修复流程完成"
    log_info "📁 备份目录: $BACKUP_DIR"
    log_info "🔧 如需回滚: cp $BACKUP_DIR/class-consumable-controller.php plugins/bjt-core-entities/controllers/"
    
    # 清理临时文件
    rm -f /tmp/latest_backup_path.txt
}

# 错误处理
trap 'log_error "脚本执行中断，请检查备份目录进行回滚"' ERR

# 执行主流程
main "$@" 