#!/bin/bash

# BJT API No-Cache 头测试脚本
# 使用方法: ./scripts/test-api-no-cache-headers.sh [域名]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
DOMAIN_NAME="${1:-bjt.gzbjt.com}"
API_BASE_URL="https://${DOMAIN_NAME}/wp-json/bjt/v1"

print_message() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO:${NC} $1"
}

print_header() {
    echo -e "${BLUE}🔍 $1${NC}"
}

# 检查no-cache头的函数
check_no_cache_headers() {
    local url="$1"
    local test_name="$2"
    
    print_header "测试: $test_name"
    print_info "URL: $url"
    
    # 获取响应头
    local headers=$(curl -I -s "$url" 2>/dev/null)
    
    if [ -z "$headers" ]; then
        print_error "❌ 无法获取响应头"
        return 1
    fi
    
    # 检查关键的no-cache头
    local cache_control=$(echo "$headers" | grep -i "cache-control" | head -1)
    local pragma=$(echo "$headers" | grep -i "pragma" | head -1)
    local expires=$(echo "$headers" | grep -i "expires" | head -1)
    local bjt_cache=$(echo "$headers" | grep -i "x-bjt-cache-control" | head -1)
    
    print_info "📋 响应头信息:"
    
    # 检查 Cache-Control
    if [[ "$cache_control" == *"no-cache"* ]] && [[ "$cache_control" == *"no-store"* ]]; then
        print_info "✅ Cache-Control: $cache_control"
        local cache_control_ok=true
    else
        print_error "❌ Cache-Control: $cache_control"
        local cache_control_ok=false
    fi
    
    # 检查 Pragma
    if [[ "$pragma" == *"no-cache"* ]]; then
        print_info "✅ Pragma: $pragma"
        local pragma_ok=true
    else
        print_error "❌ Pragma: $pragma"
        local pragma_ok=false
    fi
    
    # 检查 Expires
    if [[ "$expires" == *"1970"* ]]; then
        print_info "✅ Expires: $expires"
        local expires_ok=true
    else
        print_error "❌ Expires: $expires"
        local expires_ok=false
    fi
    
    # 检查自定义BJT头
    if [[ "$bjt_cache" == *"no-cache"* ]]; then
        print_info "✅ X-BJT-Cache-Control: $bjt_cache"
        local bjt_cache_ok=true
    else
        print_warning "⚠️  X-BJT-Cache-Control: $bjt_cache"
        local bjt_cache_ok=false
    fi
    
    # 显示其他相关头
    local content_type=$(echo "$headers" | grep -i "content-type" | head -1)
    if [[ "$content_type" == *"application/json"* ]]; then
        print_info "✅ Content-Type: $content_type"
    else
        print_warning "⚠️  Content-Type: $content_type"
    fi
    
    # 检查CDN相关头
    local x_cache=$(echo "$headers" | grep -i "x-cache" | head -1)
    if [[ -n "$x_cache" ]]; then
        if [[ "$x_cache" == *"MISS"* ]]; then
            print_info "✅ X-Cache: $x_cache (缓存未命中)"
        else
            print_warning "⚠️  X-Cache: $x_cache (可能有缓存)"
        fi
    fi
    
    echo
    
    # 判断整体结果
    if [[ "$cache_control_ok" == true ]] && [[ "$pragma_ok" == true ]] && [[ "$expires_ok" == true ]]; then
        print_message "✅ $test_name - No-Cache头设置正确"
        return 0
    else
        print_error "❌ $test_name - No-Cache头设置不完整"
        return 1
    fi
}

# 主测试函数
main() {
    print_message "🚀 BJT API No-Cache 头测试工具"
    print_info "目标域名: $DOMAIN_NAME"
    print_info "API基础URL: $API_BASE_URL"
    echo
    
    # 检查curl是否可用
    if ! command -v curl &> /dev/null; then
        print_error "curl命令不可用，请先安装curl"
        exit 1
    fi
    
    # 测试的API端点
    local test_endpoints=(
        "$API_BASE_URL/relations|Relations API"
        "$API_BASE_URL/accessories|Accessories API"
        "$API_BASE_URL/consumables|Consumables API"
        "$API_BASE_URL/host-models|Host Models API"
        "$API_BASE_URL/auth/login|Auth API"
    )
    
    local all_passed=true
    local test_count=0
    local passed_count=0
    
    echo "===================="
    print_message "🧪 开始测试API No-Cache头"
    echo "===================="
    
    for endpoint in "${test_endpoints[@]}"; do
        local url=$(echo "$endpoint" | cut -d'|' -f1)
        local name=$(echo "$endpoint" | cut -d'|' -f2)
        
        ((test_count++))
        
        if check_no_cache_headers "$url" "$name"; then
            ((passed_count++))
        else
            all_passed=false
        fi
        
        echo "--------------------"
    done
    
    # 生成测试报告
    echo "===================="
    print_message "📊 测试结果摘要"
    echo "===================="
    
    print_info "总测试数: $test_count"
    print_info "通过测试: $passed_count"
    print_info "失败测试: $((test_count - passed_count))"
    
    if [[ "$all_passed" == true ]]; then
        print_message "🎉 所有测试通过！No-Cache头设置正确"
        echo
        print_info "💡 接下来可以："
        echo "  1. 部署到生产环境"
        echo "  2. 清理CDN缓存"
        echo "  3. 验证前端功能是否正常"
        echo
        exit 0
    else
        print_error "❌ 部分测试失败"
        echo
        print_info "🔧 故障排查建议："
        echo "  1. 检查代码是否正确部署"
        echo "  2. 确认WordPress插件已激活"
        echo "  3. 检查PHP错误日志"
        echo "  4. 验证API端点是否正常工作"
        echo
        exit 1
    fi
}

# 运行主函数
main "$@" 