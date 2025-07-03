#!/bin/bash

# BJT Product System - 生产环境配置验证脚本
# 使用方法: ./validate-production-config.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

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

# 检查环境文件是否存在
check_env_files() {
    print_header "检查配置文件"
    
    if [ -f ".env.production" ]; then
        print_success "生产环境配置文件存在: .env.production"
    else
        print_error "生产环境配置文件不存在: .env.production"
        print_info "请从 env.production.example 复制并配置"
        return 1
    fi
    
    if [ -f "docker/prod/docker-compose.prod.yml" ]; then
        print_success "生产环境Docker配置存在"
    else
        print_error "生产环境Docker配置不存在"
        return 1
    fi
    
    if [ -f "deploy-production.sh" ]; then
        print_success "部署脚本存在"
        if [ -x "deploy-production.sh" ]; then
            print_success "部署脚本可执行"
        else
            print_warning "部署脚本不可执行，运行: chmod +x deploy-production.sh"
        fi
    else
        print_error "部署脚本不存在"
        return 1
    fi
}

# 加载并验证环境变量
load_and_validate_env() {
    print_header "验证环境变量"
    
    # 加载环境变量
    if [ -f ".env.production" ]; then
        source .env.production
    else
        print_error "无法加载 .env.production"
        return 1
    fi
    
    # 必需的后端环境变量
    local required_backend_vars=(
        "DOMAIN_NAME"
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_PASSWORD"
        "JWT_AUTH_SECRET_KEY"
        "WP_HOME"
        "WP_SITEURL"
        "WORDPRESS_AUTH_KEY"
        "WORDPRESS_SECURE_AUTH_KEY"
        "WORDPRESS_LOGGED_IN_KEY"
        "WORDPRESS_NONCE_KEY"
    )
    
    # 必需的前端环境变量
    local required_frontend_vars=(
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
    )
    
    local missing_vars=0
    
    print_info "检查后端环境变量..."
    for var in "${required_backend_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "缺少后端环境变量: $var"
            ((missing_vars++))
        else
            print_success "后端变量已设置: $var"
        fi
    done
    
    print_info "检查前端环境变量..."
    for var in "${required_frontend_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "缺少前端环境变量: $var"
            ((missing_vars++))
        else
            print_success "前端变量已设置: $var = ${!var}"
        fi
    done
    
    if [ $missing_vars -gt 0 ]; then
        print_error "发现 $missing_vars 个缺失的环境变量"
        return 1
    else
        print_success "所有必需的环境变量都已设置"
    fi
}

# 检查前端构建目录
check_frontend_build() {
    print_header "检查前端构建"
    
    if [ -d "frontend/dist" ]; then
        print_success "前端构建目录存在: frontend/dist"
        
        if [ -f "frontend/dist/index.html" ]; then
            print_success "前端构建文件存在"
        else
            print_warning "前端构建不完整，需要运行构建"
            print_info "运行: cd frontend && npm run build"
        fi
    else
        print_warning "前端构建目录不存在，需要构建"
        print_info "运行: cd frontend && npm run build"
    fi
}

# 检查数据库文件
check_database_files() {
    print_header "检查数据库初始化文件"
    
    local db_files=(
        "docker/dev/mysql/init.sql"
        "generated_sql_imports/_设备.sql"
        "generated_sql_imports/_耗材.sql"
    )
    
    for file in "${db_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "数据库文件存在: $file"
        else
            print_error "数据库文件缺失: $file"
        fi
    done
}

# 检查SSL证书
check_ssl_certificates() {
    print_header "检查SSL证书"
    
    if [ -n "$SSL_CERT_PATH" ] && [ -n "$SSL_KEY_PATH" ]; then
        print_info "SSL证书路径已配置:"
        print_info "  证书: $SSL_CERT_PATH"
        print_info "  私钥: $SSL_KEY_PATH"
        
        # 检查证书文件是否存在（如果路径不是绝对路径）
        if [[ "$SSL_CERT_PATH" != /* ]]; then
            if [ -f "$SSL_CERT_PATH" ]; then
                print_success "SSL证书文件存在"
            else
                print_warning "SSL证书文件不存在: $SSL_CERT_PATH"
            fi
        fi
        
        if [[ "$SSL_KEY_PATH" != /* ]]; then
            if [ -f "$SSL_KEY_PATH" ]; then
                print_success "SSL私钥文件存在"
            else
                print_warning "SSL私钥文件不存在: $SSL_KEY_PATH"
            fi
        fi
    else
        print_warning "SSL证书路径未配置"
    fi
}

# 检查Docker环境
check_docker_environment() {
    print_header "检查Docker环境"
    
    if command -v docker &> /dev/null; then
        print_success "Docker已安装"
        
        if docker --version | grep -q "Docker version"; then
            print_success "Docker版本: $(docker --version)"
        fi
    else
        print_error "Docker未安装"
        return 1
    fi
    
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose已安装"
        print_success "Docker Compose版本: $(docker-compose --version)"
    else
        print_error "Docker Compose未安装"
        return 1
    fi
}

# 生成修复建议
generate_fix_suggestions() {
    print_header "修复建议"
    
    if [ ! -f ".env.production" ]; then
        print_info "1. 创建生产环境配置文件:"
        echo "   cp env.production.example .env.production"
        echo "   nano .env.production  # 编辑配置"
    fi
    
    # 检查是否缺少前端配置
    if [ -f ".env.production" ]; then
        source .env.production
        if [ -z "$VITE_API_URL" ]; then
            print_info "2. 在 .env.production 中添加前端配置:"
            echo "   # 前端配置"
            echo "   VITE_API_URL=/wp-json/bjt/v1"
            echo "   VITE_USE_PROXY=false"
            echo "   VITE_DEBUG=false"
            echo "   "
            echo "   # 功能开关"
            echo "   VITE_ENABLE_SMART_UNITS=false"
            echo "   VITE_ENABLE_CART_ENHANCEMENT=false"
            echo "   VITE_ENABLE_STANDARD_FIELDS=false"
            echo "   VITE_ENABLE_MULTILANG=true"
            echo "   VITE_USE_STANDARDIZED_FIELDS=false"
            echo "   VITE_ENABLE_SMART_UNIT_SYSTEM=false"
            echo "   VITE_USE_MOCK_CART=false"
        fi
    fi
    
    if [ ! -d "frontend/dist" ]; then
        print_info "3. 构建前端应用:"
        echo "   cd frontend"
        echo "   npm ci"
        echo "   npm run build"
        echo "   cd .."
    fi
    
    print_info "4. 部署应用:"
    echo "   ./deploy-production.sh"
    
    print_info "5. 验证部署:"
    echo "   # 检查服务状态"
    echo "   docker-compose -f docker/prod/docker-compose.prod.yml ps"
    echo "   "
    echo "   # 检查日志"
    echo "   docker-compose -f docker/prod/docker-compose.prod.yml logs --tail=50"
    echo "   "
    echo "   # 访问网站"
    echo "   curl -I https://$DOMAIN_NAME"
}

# 主函数
main() {
    print_header "BJT Product System - 生产环境配置验证"
    
    local validation_passed=true
    
    # 执行各项检查
    if ! check_env_files; then
        validation_passed=false
    fi
    
    if ! check_docker_environment; then
        validation_passed=false
    fi
    
    if ! load_and_validate_env; then
        validation_passed=false
    fi
    
    check_frontend_build
    check_database_files
    check_ssl_certificates
    
    # 总结
    print_header "验证总结"
    
    if [ "$validation_passed" = true ]; then
        print_success "✅ 生产环境配置验证通过！"
        print_info "可以运行部署脚本: ./deploy-production.sh"
    else
        print_error "❌ 生产环境配置验证失败"
        print_info "请根据以下建议修复问题："
        generate_fix_suggestions
    fi
}

# 运行主函数
main "$@" 