#!/bin/bash

# BJT 关联关系API问题诊断脚本
# 快速诊断和修复关联关系API的JWT认证问题

set -e

echo "🔍 BJT 关联关系API问题诊断工具"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检测环境
detect_environment() {
    if [[ "$PWD" == *"bjt-product-system"* ]]; then
        echo "development"
    else
        echo "production"
    fi
}

# 1. 基础API连通性测试
test_basic_connectivity() {
    log_info "测试基础API连通性..."
    
    local base_url="https://eorder.lockedair.com"
    if [ "$(detect_environment)" = "development" ]; then
        base_url="http://localhost:8080"
    fi
    
    # 测试关联关系API端点
    log_info "测试 GET $base_url/wp-json/bjt/v1/relations"
    
    local response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -X GET "$base_url/wp-json/bjt/v1/relations?page=1&page_size=5" \
        -H "Content-Type: application/json")
    
    local http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    local response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    if [ "$http_status" = "200" ]; then
        log_success "API端点可访问 (HTTP $http_status)"
        echo "$response_body" | jq '.items | length' 2>/dev/null && log_success "数据格式正确" || log_warning "JSON格式可能有问题"
    else
        log_error "API端点访问失败 (HTTP $http_status)"
        echo "Response: $response_body"
        return 1
    fi
}

# 2. JWT认证诊断
test_jwt_auth() {
    log_info "诊断JWT认证问题..."
    
    local base_url="https://eorder.lockedair.com"
    if [ "$(detect_environment)" = "development" ]; then
        base_url="http://localhost:8080"
    fi
    
    # 检查是否有测试用户凭据
    if [ -z "$BJT_TEST_USERNAME" ] || [ -z "$BJT_TEST_PASSWORD" ]; then
        log_warning "需要设置测试用户凭据："
        echo "export BJT_TEST_USERNAME='your_admin_username'"
        echo "export BJT_TEST_PASSWORD='your_password'"
        echo "然后重新运行此脚本"
        return 1
    fi
    
    # 尝试登录获取JWT token
    log_info "尝试登录获取JWT token..."
    
    local login_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
        -X POST "$base_url/wp-json/bjt/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$BJT_TEST_USERNAME\",\"password\":\"$BJT_TEST_PASSWORD\"}")
    
    local login_status=$(echo "$login_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
    local login_body=$(echo "$login_response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    if [ "$login_status" = "200" ]; then
        log_success "JWT登录成功"
        
        # 提取token
        local token=$(echo "$login_body" | jq -r '.data.token // .token // empty' 2>/dev/null)
        
        if [ -n "$token" ] && [ "$token" != "null" ]; then
            log_success "JWT token获取成功"
            
            # 使用token测试关联关系API
            log_info "使用JWT token测试关联关系API..."
            
            local auth_response=$(curl -s -w "HTTP_STATUS:%{http_code}" \
                -X GET "$base_url/wp-json/bjt/v1/relations?page=1&page_size=5" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json")
            
            local auth_status=$(echo "$auth_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
            local auth_body=$(echo "$auth_response" | sed 's/HTTP_STATUS:[0-9]*$//')
            
            if [ "$auth_status" = "200" ]; then
                log_success "JWT认证API调用成功！"
                log_info "问题可能在前端JWT token传递"
            else
                log_error "JWT认证API调用失败 (HTTP $auth_status)"
                echo "Response: $auth_body"
                log_info "问题在服务器端JWT认证逻辑"
            fi
        else
            log_error "无法从登录响应中提取JWT token"
            echo "Login response: $login_body"
        fi
    else
        log_error "JWT登录失败 (HTTP $login_status)"
        echo "Response: $login_body"
    fi
}

# 3. 前端配置检查
check_frontend_config() {
    log_info "检查前端API配置..."
    
    if [ ! -f "frontend/src/services/api.ts" ]; then
        log_warning "前端API配置文件不存在"
        return 1
    fi
    
    # 检查Authorization头配置
    if grep -q "Authorization.*Bearer" frontend/src/services/*.ts 2>/dev/null; then
        log_success "找到Authorization头配置"
    else
        log_warning "未找到Authorization头配置"
        log_info "可能需要在前端API服务中添加JWT token传递"
    fi
    
    # 检查JWT token存储
    if grep -q "jwt.*token\|bjt.*token" frontend/src/services/*.ts frontend/src/utils/*.ts 2>/dev/null; then
        log_success "找到JWT token相关代码"
    else
        log_warning "未找到JWT token存储/获取逻辑"
    fi
}

# 4. 服务器日志检查
check_server_logs() {
    log_info "检查服务器日志（如果可访问）..."
    
    if command -v docker &> /dev/null; then
        if docker ps | grep -q "prod_wordpress_1"; then
            log_info "找到WordPress容器，检查日志..."
            
            # 检查最近的PHP错误日志
            local recent_errors=$(docker exec prod_wordpress_1 find /var/log -name "*error*" -type f 2>/dev/null | head -3)
            
            if [ -n "$recent_errors" ]; then
                log_info "PHP错误日志文件："
                echo "$recent_errors"
                
                # 检查关联关系相关的错误
                local relation_errors=$(docker exec prod_wordpress_1 bash -c "
                    find /var/log -name '*error*' -type f -exec grep -l 'BJT_Relation_Controller\|relations' {} \; 2>/dev/null | head -3
                " 2>/dev/null)
                
                if [ -n "$relation_errors" ]; then
                    log_warning "发现关联关系相关错误，建议检查："
                    echo "$relation_errors"
                else
                    log_info "未发现关联关系相关的错误日志"
                fi
            else
                log_info "未找到标准PHP错误日志文件"
            fi
        else
            log_info "未找到WordPress Docker容器"
        fi
    else
        log_info "Docker不可用，跳过日志检查"
    fi
}

# 5. 生成修复建议
generate_fix_recommendations() {
    log_info "生成修复建议..."
    
    echo
    echo "📋 修复建议基于诊断结果："
    echo "=================================="
    
    # 基于诊断结果生成具体建议
    echo "1. 如果基础API可访问但JWT认证失败："
    echo "   → 检查前端JWT token传递逻辑"
    echo "   → 验证token格式和有效期"
    echo
    
    echo "2. 如果JWT登录失败："
    echo "   → 检查用户凭据和权限"
    echo "   → 验证JWT secret配置"
    echo
    
    echo "3. 如果服务器日志显示认证错误："
    echo "   → 应用临时权限修复补丁"
    echo "   → 统一认证系统配置"
    echo
    
    echo "4. 立即可执行的修复："
    echo "   → 运行: ./scripts/fix-api-config.sh"
    echo "   → 或查看: ./API_TARGETED_FIX_GUIDE.md"
}

# 主函数
main() {
    log_info "开始诊断关联关系API问题..."
    echo
    
    # 执行诊断步骤
    test_basic_connectivity
    echo
    
    test_jwt_auth
    echo
    
    check_frontend_config
    echo
    
    check_server_logs
    echo
    
    generate_fix_recommendations
    
    echo
    log_info "诊断完成！请查看上述结果和建议。"
    echo "详细修复指南请查看: ./API_TARGETED_FIX_GUIDE.md"
}

# 运行主函数
main "$@" 