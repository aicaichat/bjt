#!/bin/bash

# BJT产品系统 - 环境配置对比工具
# 对比本地开发环境和生产环境的配置差异

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
    echo "$(printf '=%.0s' {1..50})"
}

# 检查配置文件是否存在
check_config_files() {
    local missing_files=()
    
    [ ! -f ".env.production" ] && missing_files+=(".env.production")
    [ ! -f "frontend/.env.local" ] && missing_files+=("frontend/.env.local")
    [ ! -f "frontend/env.development" ] && missing_files+=("frontend/env.development")
    [ ! -f "frontend/env.production" ] && missing_files+=("frontend/env.production")
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        print_error "以下配置文件缺失:"
        for file in "${missing_files[@]}"; do
            echo "  ❌ $file"
        done
        return 1
    fi
    
    print_info "所有配置文件存在"
    return 0
}

# 提取环境变量值
extract_env_value() {
    local file="$1"
    local key="$2"
    
    if [ -f "$file" ]; then
        grep "^$key=" "$file" 2>/dev/null | cut -d'=' -f2- | sed 's/^["'\'']//' | sed 's/["'\'']$//' || echo "未设置"
    else
        echo "文件不存在"
    fi
}

# 对比功能开关配置
compare_feature_flags() {
    print_header "功能开关配置对比"
    
    local flags=(
        "VITE_ENABLE_SMART_UNITS"
        "VITE_ENABLE_CART_ENHANCEMENT"
        "VITE_ENABLE_STANDARD_FIELDS"
        "VITE_ENABLE_MULTILANG"
        "VITE_USE_STANDARDIZED_FIELDS"
        "VITE_ENABLE_SMART_UNIT_SYSTEM"
        "VITE_USE_MOCK_CART"
    )
    
    printf "%-30s %-15s %-15s %-15s %-10s\n" "功能开关" "生产环境" "本地配置" "开发配置" "状态"
    printf "%-30s %-15s %-15s %-15s %-10s\n" "$(printf '=%.0s' {1..30})" "$(printf '=%.0s' {1..15})" "$(printf '=%.0s' {1..15})" "$(printf '=%.0s' {1..15})" "$(printf '=%.0s' {1..10})"
    
    for flag in "${flags[@]}"; do
        local prod_value=$(extract_env_value ".env.production" "$flag")
        local local_value=$(extract_env_value "frontend/.env.local" "$flag")
        local dev_value=$(extract_env_value "frontend/env.development" "$flag")
        
        local status="✅"
        if [ "$prod_value" != "$local_value" ]; then
            status="❌"
        fi
        
        printf "%-30s %-15s %-15s %-15s %-10s\n" "$flag" "$prod_value" "$local_value" "$dev_value" "$status"
    done
    
    echo ""
}

# 对比API配置
compare_api_config() {
    print_header "API配置对比"
    
    local api_configs=(
        "VITE_API_URL"
        "VITE_USE_PROXY"
        "VITE_WORDPRESS_HOST"
        "VITE_DEBUG"
    )
    
    printf "%-25s %-20s %-20s %-20s %-10s\n" "API配置" "生产环境" "本地配置" "开发配置" "状态"
    printf "%-25s %-20s %-20s %-20s %-10s\n" "$(printf '=%.0s' {1..25})" "$(printf '=%.0s' {1..20})" "$(printf '=%.0s' {1..20})" "$(printf '=%.0s' {1..20})" "$(printf '=%.0s' {1..10})"
    
    for config in "${api_configs[@]}"; do
        local prod_value=$(extract_env_value ".env.production" "$config")
        local local_value=$(extract_env_value "frontend/.env.local" "$config")
        local dev_value=$(extract_env_value "frontend/env.development" "$config")
        
        local status="✅"
        # API配置可能因环境而异，主要检查关键配置
        if [ "$config" = "VITE_API_URL" ] && [ "$prod_value" != "$local_value" ] && [ "$local_value" != "/wp-json/bjt/v1" ]; then
            status="❌"
        fi
        
        printf "%-25s %-20s %-20s %-20s %-10s\n" "$config" "$prod_value" "$local_value" "$dev_value" "$status"
    done
    
    echo ""
}

# 对比数据库配置
compare_database_config() {
    print_header "数据库配置对比"
    
    local db_configs=(
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_HOST"
        "MYSQL_PORT"
        "WORDPRESS_DB_CHARSET"
    )
    
    printf "%-25s %-20s %-20s %-10s\n" "数据库配置" "生产环境" "本地生产配置" "状态"
    printf "%-25s %-20s %-20s %-10s\n" "$(printf '=%.0s' {1..25})" "$(printf '=%.0s' {1..20})" "$(printf '=%.0s' {1..20})" "$(printf '=%.0s' {1..10})"
    
    for config in "${db_configs[@]}"; do
        local prod_value=$(extract_env_value ".env.production" "$config")
        local local_prod_value=$(extract_env_value ".env.local-production" "$config")
        
        local status="✅"
        if [ "$prod_value" != "$local_prod_value" ] && [ "$local_prod_value" != "未设置" ]; then
            status="❌"
        elif [ "$local_prod_value" = "未设置" ]; then
            status="⚠️"
        fi
        
        printf "%-25s %-20s %-20s %-10s\n" "$config" "$prod_value" "$local_prod_value" "$status"
    done
    
    echo ""
}

# 检查环境一致性
check_consistency() {
    print_header "环境一致性检查"
    
    local issues=0
    
    # 检查关键功能开关
    local critical_flags=(
        "VITE_ENABLE_SMART_UNITS"
        "VITE_ENABLE_CART_ENHANCEMENT"
        "VITE_USE_STANDARDIZED_FIELDS"
    )
    
    for flag in "${critical_flags[@]}"; do
        local prod_value=$(extract_env_value ".env.production" "$flag")
        local local_value=$(extract_env_value "frontend/.env.local" "$flag")
        
        if [ "$prod_value" != "$local_value" ] && [ "$local_value" != "未设置" ]; then
            print_error "关键功能开关不一致: $flag (生产: $prod_value, 本地: $local_value)"
            ((issues++))
        fi
    done
    
    # 检查API配置
    local api_url_prod=$(extract_env_value ".env.production" "VITE_API_URL")
    local api_url_local=$(extract_env_value "frontend/.env.local" "VITE_API_URL")
    
    if [ "$api_url_prod" != "$api_url_local" ] && [ "$api_url_local" != "/wp-json/bjt/v1" ]; then
        print_error "API URL配置不一致: (生产: $api_url_prod, 本地: $api_url_local)"
        ((issues++))
    fi
    
    if [ $issues -eq 0 ]; then
        print_info "✅ 环境配置基本一致，可以有效重现生产环境问题"
    else
        print_warning "⚠️  发现 $issues 个配置不一致问题，可能影响问题重现"
    fi
    
    echo ""
}

# 生成配置同步建议
generate_sync_suggestions() {
    print_header "配置同步建议"
    
    if [ ! -f "frontend/.env.local" ]; then
        print_info "建议运行以下命令同步生产配置到本地:"
        echo "  ./start-local-production-env.sh"
        echo ""
        return
    fi
    
    # 检查需要同步的配置
    local sync_needed=false
    
    local flags=(
        "VITE_ENABLE_SMART_UNITS"
        "VITE_ENABLE_CART_ENHANCEMENT"
        "VITE_ENABLE_STANDARD_FIELDS"
        "VITE_USE_STANDARDIZED_FIELDS"
    )
    
    for flag in "${flags[@]}"; do
        local prod_value=$(extract_env_value ".env.production" "$flag")
        local local_value=$(extract_env_value "frontend/.env.local" "$flag")
        
        if [ "$prod_value" != "$local_value" ] && [ "$prod_value" != "未设置" ]; then
            if [ "$sync_needed" = false ]; then
                print_info "建议更新以下配置以保持与生产环境一致:"
                sync_needed=true
            fi
            echo "  $flag: $local_value → $prod_value"
        fi
    done
    
    if [ "$sync_needed" = true ]; then
        echo ""
        print_info "快速同步命令:"
        echo "  ./start-local-production-env.sh  # 重新同步所有配置"
        echo "  ./scripts/sync-production-config.sh  # 完整同步"
    else
        print_info "✅ 当前配置已与生产环境保持一致"
    fi
    
    echo ""
}

# 显示当前运行环境状态
show_runtime_status() {
    print_header "当前运行环境状态"
    
    # 检查端口占用
    local frontend_running=false
    local backend_running=false
    
    if lsof -ti:5173 &>/dev/null; then
        frontend_running=true
        print_info "✅ 前端服务运行中 (端口5173)"
    else
        print_warning "❌ 前端服务未运行"
    fi
    
    if lsof -ti:8080 &>/dev/null; then
        backend_running=true
        print_info "✅ 后端服务运行中 (端口8080)"
    else
        print_warning "❌ 后端服务未运行"
    fi
    
    # 检查Docker服务
    if docker-compose -f docker/dev/docker-compose.nginx.yml ps | grep -q "Up"; then
        print_info "✅ Docker开发服务运行中"
    else
        print_warning "❌ Docker开发服务未运行"
    fi
    
    # 检查API连通性
    if curl -s http://localhost:8080/wp-json/bjt/v1 > /dev/null 2>&1; then
        print_info "✅ API连接正常"
    else
        print_warning "❌ API连接失败"
    fi
    
    echo ""
    
    if [ "$frontend_running" = true ] && [ "$backend_running" = true ]; then
        print_info "🎉 本地环境正在运行，可以进行测试"
        echo "  前端: http://localhost:5173"
        echo "  后端: http://localhost:8080"
        echo "  API:  http://localhost:8080/wp-json/bjt/v1"
    else
        print_info "💡 启动本地生产环境:"
        echo "  ./start-local-production-env.sh"
    fi
    
    echo ""
}

# 主函数
main() {
    print_info "BJT产品系统 - 环境配置对比工具"
    print_info "对比本地开发环境和生产环境的配置差异"
    echo ""
    
    if ! check_config_files; then
        print_info "请先运行以下命令创建配置文件:"
        echo "  cp env.production.example .env.production"
        echo "  ./start-local-production-env.sh"
        exit 1
    fi
    
    compare_feature_flags
    compare_api_config
    compare_database_config
    check_consistency
    generate_sync_suggestions
    show_runtime_status
}

# 显示帮助信息
show_help() {
    echo "BJT产品系统 - 环境配置对比工具"
    echo ""
    echo "用法:"
    echo "  $0                    # 执行完整的配置对比"
    echo "  $0 --help            # 显示帮助信息"
    echo "  $0 --features        # 只对比功能开关"
    echo "  $0 --api             # 只对比API配置"
    echo "  $0 --database        # 只对比数据库配置"
    echo "  $0 --status          # 显示运行状态"
    echo ""
    echo "功能:"
    echo "  - 对比生产环境和本地环境的配置差异"
    echo "  - 检查功能开关是否一致"
    echo "  - 验证API和数据库配置"
    echo "  - 提供配置同步建议"
    echo "  - 显示当前运行环境状态"
}

# 处理命令行参数
case "${1:-}" in
    "--help"|"-h")
        show_help
        exit 0
        ;;
    "--features")
        check_config_files && compare_feature_flags
        ;;
    "--api")
        check_config_files && compare_api_config
        ;;
    "--database")
        check_config_files && compare_database_config
        ;;
    "--status")
        show_runtime_status
        ;;
    "")
        main
        ;;
    *)
        print_error "未知参数: $1"
        show_help
        exit 1
        ;;
esac 