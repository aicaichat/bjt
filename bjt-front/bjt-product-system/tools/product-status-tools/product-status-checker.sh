#!/bin/bash

# 产品上下线状态自动检查工具
# 使用方法: ./tools/product-status-checker.sh [check-type]
# check-type: all|api|frontend|database

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查结果统计
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

log_header() {
    echo -e "\n${BLUE}🔍 $1${NC}"
    echo "----------------------------------------"
}

# 增加检查计数
check_count() {
    ((TOTAL_CHECKS++))
}

# 显示最终结果
show_results() {
    echo -e "\n${BLUE}📊 检查结果统计${NC}"
    echo "========================================"
    echo -e "总检查项: ${TOTAL_CHECKS}"
    echo -e "通过: ${GREEN}${PASSED_CHECKS}${NC}"
    echo -e "失败: ${RED}${FAILED_CHECKS}${NC}"
    echo -e "警告: ${YELLOW}${WARNINGS}${NC}"
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 所有关键检查都通过了！${NC}"
        exit 0
    else
        echo -e "\n${RED}🚨 发现 $FAILED_CHECKS 个问题需要修复${NC}"
        exit 1
    fi
}

# 检查前端API调用
check_frontend_api_calls() {
    log_header "检查前端API调用状态参数"
    
    # 检查主要文件中的API调用
    local files=(
        "../../frontend/src/pages/Machines/index.tsx"
        "../../frontend/index.tsx"
        "../../frontend/src/utils/authTest.ts"
        "../../frontend/src/tests/real-api/pages/machines-page.real-api.test.ts"
    )
    
    for file in "${files[@]}"; do
        check_count
        if [ ! -f "$file" ]; then
            log_warning "文件不存在: ${file#../../}"
            continue
        fi
        
        # 检查machineparts API调用是否包含status参数
        if grep -q "machineparts" "$file"; then
            if grep -q "machineparts.*status=publish" "$file"; then
                log_success "✓ ${file#../../} - machineparts API包含status=publish参数"
            else
                log_error "✗ ${file#../../} - machineparts API缺少status=publish参数"
            fi
        fi
        
        # 检查其他产品API
        for api in "accessories" "consumables" "host-models"; do
            if grep -q "$api" "$file"; then
                check_count
                if grep -q "$api.*status=publish" "$file"; then
                    log_success "✓ ${file#../../} - $api API包含status=publish参数"
                else
                    log_warning "⚠ ${file#../../} - $api API可能缺少status=publish参数"
                fi
            fi
        done
    done
}

# 检查硬编码状态过滤
check_hardcoded_filters() {
    log_header "检查硬编码状态过滤逻辑"
    
    check_count
    local filter_count=$(grep -r "\.status.*===.*['\"]publish['\"]" ../../frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
    
    if [ "$filter_count" -gt 0 ]; then
        log_warning "发现 $filter_count 处硬编码状态过滤，建议通过API参数过滤"
        grep -rn "\.status.*===.*['\"]publish['\"]" ../../frontend/src --include="*.ts" --include="*.tsx" 2>/dev/null | head -3
    else
        log_success "未发现硬编码状态过滤"
    fi
}

# 检查Mock数据状态
check_mock_data() {
    log_header "检查Mock数据状态设置"
    
    check_count
    local mock_files=$(find ../../frontend/src -name "*.json" -exec grep -l "status" {} \; 2>/dev/null)
    
    if [ -n "$mock_files" ]; then
        log_info "发现包含status字段的Mock数据文件："
        echo "$mock_files" | sed 's|../../||g'
        
        # 检查是否包含draft状态
        local draft_count=$(find ../../frontend/src -name "*.json" -exec grep -l "draft" {} \; 2>/dev/null | wc -l)
        if [ "$draft_count" -gt 0 ]; then
            log_warning "发现 $draft_count 个Mock数据文件包含draft状态"
        else
            log_success "Mock数据文件状态设置正确"
        fi
    else
        log_info "未发现包含状态字段的Mock数据文件"
    fi
}

# 检查API响应格式
check_api_response() {
    log_header "检查API响应状态（需要API服务运行）"
    
    # 获取API基础URL
    local api_url="http://localhost:8080/wp-json/bjt/v1"
    
    # 尝试获取token（如果可用）
    local token=$(curl -s -X POST "$api_url/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"password"}' 2>/dev/null | \
        jq -r '.data.token // empty' 2>/dev/null)
    
    local auth_header=""
    if [ -n "$token" ]; then
        auth_header="Authorization: Bearer $token"
        log_info "✓ 获取到认证token"
    else
        log_warning "无法获取认证token，将尝试匿名访问"
    fi
    
    # 检查machineparts API
    check_count
    local response=$(curl -s -H "$auth_header" "$api_url/machineparts?status=publish" 2>/dev/null)
    if [ $? -eq 0 ] && echo "$response" | jq -e '.data.items' >/dev/null 2>&1; then
        local draft_count=$(echo "$response" | jq '[.data.items[] | select(.status == "draft")] | length' 2>/dev/null)
        if [ "$draft_count" = "0" ]; then
            log_success "✓ machineparts API正确过滤草稿状态"
        else
            log_error "✗ machineparts API返回了 $draft_count 个草稿状态数据"
        fi
    else
        log_warning "⚠ 无法访问machineparts API或API服务未运行"
    fi
    
    # 检查host-models API
    check_count
    response=$(curl -s -H "$auth_header" "$api_url/host-models?status=publish" 2>/dev/null)
    if [ $? -eq 0 ] && echo "$response" | jq -e '.data.items' >/dev/null 2>&1; then
        log_success "✓ host-models API可访问"
    else
        log_warning "⚠ 无法访问host-models API"
    fi
}

# 检查TypeScript类型定义
check_typescript_types() {
    log_header "检查TypeScript类型定义"
    
    check_count
    if [ -f "../../frontend/src/types/machines.ts" ]; then
        if grep -q "status.*string" "../../frontend/src/types/machines.ts"; then
            log_success "✓ 类型定义包含status字段"
        else
            log_warning "⚠ 类型定义可能缺少status字段"
        fi
    else
        log_error "✗ 类型定义文件不存在"
    fi
}

# 快速修复建议
suggest_fixes() {
    log_header "修复建议"
    
    echo "基于检查结果，以下是修复建议："
    echo ""
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        echo "🔧 立即修复："
        echo "1. 在API调用中添加 status=publish 参数"
        echo "2. 检查并修复类型定义"
        echo "3. 验证API服务正常运行"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  建议改进："
        echo "1. 移除硬编码状态过滤，使用API参数"
        echo "2. 确保Mock数据与真实API一致"
        echo "3. 添加API服务健康检查"
        echo ""
    fi
    
    echo "📖 详细指南请参考: ./product-status-checklist.md"
}

# 主函数
main() {
    local check_type="${1:-all}"
    
    echo -e "${BLUE}🚀 产品上下线状态检查工具${NC}"
    echo "========================================"
    echo "检查类型: $check_type"
    echo "时间: $(date)"
    echo ""
    
    case $check_type in
        "frontend")
            check_frontend_api_calls
            check_hardcoded_filters
            check_mock_data
            check_typescript_types
            ;;
        "api")
            check_api_response
            ;;
        "all")
            check_frontend_api_calls
            check_hardcoded_filters
            check_mock_data
            check_typescript_types
            check_api_response
            suggest_fixes
            ;;
        *)
            echo "使用方法: $0 [all|frontend|api]"
            echo ""
            echo "检查类型:"
            echo "  all      - 执行所有检查（默认）"
            echo "  frontend - 只检查前端代码"
            echo "  api      - 只检查API响应"
            exit 1
            ;;
    esac
    
    show_results
}

# 脚本入口
main "$@" 