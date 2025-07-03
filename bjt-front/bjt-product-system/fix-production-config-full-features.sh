#!/bin/bash

# BJT Product System - 生产环境配置修复脚本（完整功能启用版本）
# 自动添加所有功能开关都设为 true 的前端环境变量到 .env.production

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# 检查 .env.production 是否存在
check_production_env() {
    if [ ! -f ".env.production" ]; then
        print_error ".env.production 文件不存在"
        print_info "请先创建 .env.production 文件"
        return 1
    fi
    
    print_success "找到 .env.production 文件"
    return 0
}

# 备份原配置文件
backup_config() {
    local backup_file=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env.production "$backup_file"
    print_success "已备份原配置文件到: $backup_file"
}

# 检查是否已存在前端配置
check_existing_frontend_config() {
    if grep -q "VITE_API_URL" .env.production; then
        print_warning "检测到已存在前端配置，将跳过重复添加"
        return 0
    else
        print_info "未检测到前端配置，将添加完整功能启用的前端配置"
        return 1
    fi
}

# 添加完整功能启用的前端配置到 .env.production
add_full_features_config() {
    print_header "添加完整功能启用的前端配置到 .env.production"
    
    # 检查是否已存在配置
    if check_existing_frontend_config; then
        print_info "前端配置已存在，跳过添加"
        return 0
    fi
    
    # 添加完整功能启用的前端配置
    cat >> .env.production << 'EOF'

# ========== 前端配置 (完整功能启用版本) ==========

# 前端API配置（生产环境）
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=false
VITE_DEBUG=false

# 购物车系统功能开关（全部启用）
VITE_ENABLE_SMART_UNITS=true
VITE_ENABLE_CART_ENHANCEMENT=true
VITE_ENABLE_STANDARD_FIELDS=true
VITE_ENABLE_MULTILANG=true
VITE_USE_STANDARDIZED_FIELDS=true
VITE_ENABLE_SMART_UNIT_SYSTEM=true
VITE_USE_MOCK_CART=false

# 生产环境性能优化
VITE_ENABLE_COMPRESSION=true
VITE_ENABLE_CACHE=true
VITE_LOG_LEVEL=error

# WordPress数据库配置补充
WORDPRESS_DB_CHARSET=utf8mb4
WORDPRESS_DB_COLLATE=utf8mb4_unicode_ci

# MySQL配置补充
MYSQL_HOST=mysql
MYSQL_PORT=3306
EOF
    
    print_success "已添加完整功能启用的前端配置到 .env.production"
}

# 验证配置是否正确添加
verify_config() {
    print_header "验证配置"
    
    local required_vars=(
        "VITE_API_URL"
        "VITE_USE_PROXY"
        "VITE_DEBUG"
        "VITE_ENABLE_SMART_UNITS"
        "VITE_ENABLE_CART_ENHANCEMENT"
        "VITE_ENABLE_STANDARD_FIELDS"
        "VITE_ENABLE_MULTILANG"
        "VITE_USE_STANDARDIZED_FIELDS"
        "VITE_ENABLE_SMART_UNIT_SYSTEM"
        "VITE_USE_MOCK_CART"
        "VITE_ENABLE_COMPRESSION"
        "VITE_ENABLE_CACHE"
        "VITE_LOG_LEVEL"
    )
    
    local missing_count=0
    local enabled_features=0
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env.production; then
            local value=$(grep "^${var}=" .env.production | cut -d'=' -f2)
            if [[ "$var" == VITE_ENABLE_* ]] && [[ "$value" == "true" ]]; then
                print_success "$var = $value ✅ 功能已启用"
                ((enabled_features++))
            elif [[ "$var" == "VITE_USE_MOCK_CART" ]] && [[ "$value" == "false" ]]; then
                print_success "$var = $value ✅ 生产环境正确设置"
            else
                print_success "$var = $value"
            fi
        else
            print_error "缺失: $var"
            ((missing_count++))
        fi
    done
    
    print_info "已启用功能数量: $enabled_features/6"
    
    if [ $missing_count -eq 0 ]; then
        print_success "✅ 所有前端配置都已正确添加，完整功能已启用"
        return 0
    else
        print_error "❌ 仍有 $missing_count 个配置缺失"
        return 1
    fi
}

# 显示启用的功能列表
show_enabled_features() {
    print_header "已启用的功能列表"
    
    local features=(
        "VITE_ENABLE_SMART_UNITS:智能单位系统"
        "VITE_ENABLE_CART_ENHANCEMENT:购物车增强功能"
        "VITE_ENABLE_STANDARD_FIELDS:标准字段显示"
        "VITE_ENABLE_MULTILANG:多语言支持"
        "VITE_USE_STANDARDIZED_FIELDS:标准化字段"
        "VITE_ENABLE_SMART_UNIT_SYSTEM:智能单位系统"
    )
    
    for feature in "${features[@]}"; do
        local var_name=$(echo $feature | cut -d':' -f1)
        local description=$(echo $feature | cut -d':' -f2)
        
        if grep -q "^${var_name}=true" .env.production; then
            print_success "✅ $description ($var_name)"
        else
            print_warning "❌ $description ($var_name) - 未启用"
        fi
    done
}

# 显示配置内容摘要
show_config_summary() {
    print_header "配置摘要"
    
    print_info "域名配置:"
    grep "DOMAIN_NAME\|WP_HOME\|WP_SITEURL" .env.production | while read line; do
        echo "  $line"
    done
    
    print_info "前端配置:"
    grep "^VITE_" .env.production | while read line; do
        echo "  $line"
    done
    
    print_info "数据库配置:"
    grep "MYSQL_" .env.production | head -4 | while read line; do
        echo "  $line"
    done
}

# 生成部署建议
generate_deployment_suggestions() {
    print_header "部署建议"
    
    print_info "完整功能配置完成！接下来的步骤："
    echo ""
    echo "1. 验证配置:"
    echo "   ./validate-production-config.sh"
    echo ""
    echo "2. 构建前端应用:"
    echo "   cd frontend"
    echo "   npm ci"
    echo "   npm run build"
    echo "   cd .."
    echo ""
    echo "3. 部署到生产环境:"
    echo "   ./deploy-production.sh"
    echo ""
    echo "4. 检查部署状态:"
    echo "   docker-compose -f docker/prod/docker-compose.prod.yml ps"
    echo "   docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=50"
    echo ""
    echo "5. 访问网站验证:"
    echo "   https://eorder.lockedair.com"
    echo ""
    
    print_warning "重要提醒:"
    echo "- 所有新功能已启用，请充分测试各项功能"
    echo "- 监控系统性能，确保用户体验良好"
    echo "- 如发现问题，可使用备份文件快速回滚"
    echo "- 建议在低峰期部署，并密切监控"
    
    print_info "启用的功能包括:"
    echo "- ✅ 智能单位换算系统"
    echo "- ✅ 购物车增强功能"
    echo "- ✅ 标准字段显示"
    echo "- ✅ 多语言支持"
    echo "- ✅ 标准化字段处理"
    echo "- ✅ 智能单位系统"
}

# 主函数
main() {
    print_header "BJT Product System - 生产环境完整功能配置"
    
    # 检查前置条件
    if ! check_production_env; then
        exit 1
    fi
    
    # 备份原配置
    backup_config
    
    # 添加完整功能配置
    add_full_features_config
    
    # 验证配置
    if verify_config; then
        show_enabled_features
        show_config_summary
        generate_deployment_suggestions
        print_success "🎉 生产环境完整功能配置完成！所有功能已启用！"
    else
        print_error "配置修复失败，请检查 .env.production 文件"
        exit 1
    fi
}

# 运行主函数
main "$@" 