#!/bin/bash

# BJT系统CDN缓存修复验证脚本
# 使用方法: ./scripts/verify-cdn-cache-fix.sh [域名]

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
RELATIONS_URL="${API_BASE_URL}/relations"

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

print_message "🔍 BJT系统CDN缓存修复验证工具"
print_info "目标域名: ${DOMAIN_NAME}"
print_info "API基础URL: ${API_BASE_URL}"
echo

# 检查curl是否可用
if ! command -v curl &> /dev/null; then
    print_error "curl命令不可用，请先安装curl"
    exit 1
fi

# 检查jq是否可用（可选）
if command -v jq &> /dev/null; then
    HAS_JQ=true
    print_info "✅ jq可用，将提供详细的JSON解析"
else
    HAS_JQ=false
    print_warning "⚠️  jq不可用，将使用简化输出"
fi

echo "===================="
print_message "🧪 开始验证CDN缓存修复"
echo "===================="

# 1. 测试不存在的主机料号
print_info "1️⃣  测试不存在的主机料号（应该返回空结果）..."
NONEXISTENT_URL="${RELATIONS_URL}?host_part_number=NONEXISTENT123"
print_info "请求: ${NONEXISTENT_URL}"

nonexistent_response=$(curl -s -w "%{http_code}" "${NONEXISTENT_URL}")
nonexistent_http_code="${nonexistent_response: -3}"
nonexistent_body="${nonexistent_response%???}"

if [ "$nonexistent_http_code" = "200" ]; then
    print_info "✅ HTTP状态码: 200"
    
    if [ "$HAS_JQ" = true ]; then
        nonexistent_count=$(echo "$nonexistent_body" | jq -r '.items | length // 0' 2>/dev/null || echo "0")
        print_info "返回项目数量: $nonexistent_count"
        
        if [ "$nonexistent_count" = "0" ]; then
            print_info "✅ 不存在的主机料号正确返回空结果"
            TEST1_PASS=true
        else
            print_error "❌ 不存在的主机料号返回了 $nonexistent_count 个项目（应该为0）"
            TEST1_PASS=false
        fi
    else
        if echo "$nonexistent_body" | grep -q '"items":\[\]' || echo "$nonexistent_body" | grep -q '"total":0'; then
            print_info "✅ 不存在的主机料号正确返回空结果"
            TEST1_PASS=true
        else
            print_error "❌ 不存在的主机料号返回了非空结果"
            TEST1_PASS=false
        fi
    fi
else
    print_error "❌ HTTP状态码: $nonexistent_http_code（应该为200）"
    TEST1_PASS=false
fi

echo

# 2. 测试存在的主机料号
print_info "2️⃣  测试存在的主机料号（应该返回数据）..."
EXISTING_URL="${RELATIONS_URL}?host_part_number=60A01113"
print_info "请求: ${EXISTING_URL}"

existing_response=$(curl -s -w "%{http_code}" "${EXISTING_URL}")
existing_http_code="${existing_response: -3}"
existing_body="${existing_response%???}"

if [ "$existing_http_code" = "200" ]; then
    print_info "✅ HTTP状态码: 200"
    
    if [ "$HAS_JQ" = true ]; then
        existing_count=$(echo "$existing_body" | jq -r '.items | length // 0' 2>/dev/null || echo "0")
        print_info "返回项目数量: $existing_count"
        
        if [ "$existing_count" -gt "0" ]; then
            print_info "✅ 存在的主机料号正确返回数据"
            TEST2_PASS=true
        else
            print_error "❌ 存在的主机料号返回了空结果（应该有数据）"
            TEST2_PASS=false
        fi
    else
        if echo "$existing_body" | grep -q '"items":\[' && ! echo "$existing_body" | grep -q '"items":\[\]'; then
            print_info "✅ 存在的主机料号正确返回数据"
            TEST2_PASS=true
        else
            print_error "❌ 存在的主机料号返回了空结果"
            TEST2_PASS=false
        fi
    fi
else
    print_error "❌ HTTP状态码: $existing_http_code（应该为200）"
    TEST2_PASS=false
fi

echo

# 3. 检查缓存头信息
print_info "3️⃣  检查缓存头信息..."
print_info "请求: ${EXISTING_URL}"

cache_headers=$(curl -I -s "${EXISTING_URL}")
echo "$cache_headers" | while read -r line; do
    if echo "$line" | grep -i -E "(cache-control|age|x-cache|pragma|expires)" | grep -v "^$" >/dev/null; then
        print_info "🔍 $line"
    fi
done

# 检查是否有缓存命中标识
if echo "$cache_headers" | grep -i "x-cache.*hit" >/dev/null; then
    print_warning "⚠️  检测到缓存命中，可能还有缓存问题"
    TEST3_PASS=false
elif echo "$cache_headers" | grep -i "cache-control.*no-cache" >/dev/null; then
    print_info "✅ 检测到no-cache头，缓存配置正确"
    TEST3_PASS=true
else
    print_info "ℹ️  无明显缓存问题标识"
    TEST3_PASS=true
fi

echo

# 4. 比较响应内容
print_info "4️⃣  比较响应内容（确保不同查询返回不同结果）..."

if [ "$TEST1_PASS" = true ] && [ "$TEST2_PASS" = true ]; then
    if [ "$nonexistent_body" != "$existing_body" ]; then
        print_info "✅ 不同查询返回不同响应，API过滤正常工作"
        TEST4_PASS=true
    else
        print_error "❌ 不同查询返回相同响应，缓存问题未解决"
        TEST4_PASS=false
    fi
else
    print_warning "⚠️  前面的测试未通过，跳过内容比较"
    TEST4_PASS=false
fi

echo

# 5. 生成详细报告
echo "===================="
print_message "📊 验证结果摘要"
echo "===================="

test_results=(
    "不存在主机料号测试|$TEST1_PASS"
    "存在主机料号测试|$TEST2_PASS"
    "缓存头检查|$TEST3_PASS"
    "响应内容比较|$TEST4_PASS"
)

all_passed=true
for result in "${test_results[@]}"; do
    test_name=$(echo "$result" | cut -d'|' -f1)
    test_status=$(echo "$result" | cut -d'|' -f2)
    
    if [ "$test_status" = "true" ]; then
        print_info "✅ $test_name: 通过"
    else
        print_error "❌ $test_name: 失败"
        all_passed=false
    fi
done

echo

if [ "$all_passed" = true ]; then
    print_message "🎉 所有测试通过！CDN缓存问题已解决"
    echo
    print_info "💡 建议："
    echo "  1. 在前端测试关系管理页面的过滤功能"
    echo "  2. 尝试不同的主机料号筛选"
    echo "  3. 验证树状结构显示正确"
    echo
    exit 0
else
    print_error "❌ 部分测试失败，CDN缓存问题可能未完全解决"
    echo
    print_info "🔧 建议的修复步骤："
    echo "  1. 检查CDN配置是否正确应用"
    echo "  2. 清理CDN缓存（URL刷新和目录刷新）"
    echo "  3. 等待CDN配置生效（可能需要几分钟）"
    echo "  4. 重新运行此验证脚本"
    echo
    print_info "📖 详细修复指南请查看: CDN_CACHE_FIX_GUIDE.md"
    echo
    exit 1
fi 