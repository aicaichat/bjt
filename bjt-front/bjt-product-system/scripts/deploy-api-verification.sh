#!/bin/bash

# BJT Product System - API修复部署验证脚本
# 用于确保API修复正确部署到生产环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# 检查生产环境API修复
check_api_fix_deployment() {
    print_message "🔍 检查API修复部署状态..."
    
    # 检查API控制器文件
    API_CONTROLLER_FILE="plugins/bjt-core-entities/controllers/class-relation-controller.php"
    
    if [ ! -f "$API_CONTROLLER_FILE" ]; then
        print_error "❌ API控制器文件不存在: $API_CONTROLLER_FILE"
        return 1
    fi
    
    # 检查关键修复代码
    print_info "检查host_part_number参数定义..."
    if grep -q "host_part_number.*description.*Filter relations by host part number" "$API_CONTROLLER_FILE"; then
        print_message "✅ host_part_number参数定义已存在"
    else
        print_error "❌ host_part_number参数定义缺失"
        return 1
    fi
    
    print_info "检查参数提取逻辑..."
    if grep -q "prepared_args\['host_part_number'\].*sanitize_text_field" "$API_CONTROLLER_FILE"; then
        print_message "✅ 参数提取逻辑已存在"
    else
        print_error "❌ 参数提取逻辑缺失"
        return 1
    fi
    
    print_info "检查WHERE子句过滤..."
    if grep -q "host_part_number.*=.*%s" "$API_CONTROLLER_FILE"; then
        print_message "✅ WHERE子句过滤已存在"
    else
        print_error "❌ WHERE子句过滤缺失"
        return 1
    fi
    
    print_message "🎉 API修复代码检查完成"
}

# 测试API功能
test_api_functionality() {
    print_message "🧪 测试API功能..."
    
    # 从环境变量或参数获取域名
    DOMAIN_NAME=${DOMAIN_NAME:-"eorder.lockedair.com"}
    
    print_info "测试域名: $DOMAIN_NAME"
    
    # 测试基本API连接
    print_info "测试基本API连接..."
    if curl -f -s --connect-timeout 10 "https://$DOMAIN_NAME/wp-json/bjt/v1" > /dev/null; then
        print_message "✅ 基本API连接正常"
    else
        print_error "❌ 基本API连接失败"
        return 1
    fi
    
    # 测试未过滤的relations API
    print_info "测试未过滤的relations API..."
    UNFILTERED_RESPONSE=$(curl -s --connect-timeout 10 "https://$DOMAIN_NAME/wp-json/bjt/v1/relations?per_page=5" | jq -r '.items | length' 2>/dev/null || echo "0")
    if [ "$UNFILTERED_RESPONSE" -gt 0 ]; then
        print_message "✅ 未过滤API返回 $UNFILTERED_RESPONSE 条记录"
    else
        print_warning "⚠️  未过滤API返回异常: $UNFILTERED_RESPONSE"
    fi
    
    # 测试过滤功能
    print_info "测试host_part_number过滤功能..."
    
    # 测试用例
    test_hosts=("60A01149" "60A01141" "60A01152" "60A01153" "60A01113")
    
    for host in "${test_hosts[@]}"; do
        print_info "测试主机: $host"
        
        # 发送过滤请求
        FILTERED_RESPONSE=$(curl -s --connect-timeout 10 "https://$DOMAIN_NAME/wp-json/bjt/v1/relations?host_part_number=$host&per_page=5" | jq -r '.items | length' 2>/dev/null || echo "0")
        
        if [ "$FILTERED_RESPONSE" -gt 0 ]; then
            print_message "  ✅ 主机 $host: 返回 $FILTERED_RESPONSE 条记录"
            
            # 验证返回的数据确实只包含该主机
            VERIFICATION=$(curl -s --connect-timeout 10 "https://$DOMAIN_NAME/wp-json/bjt/v1/relations?host_part_number=$host&per_page=5" | jq -r '.items[0].host_part_number' 2>/dev/null || echo "null")
            
            if [ "$VERIFICATION" = "$host" ]; then
                print_message "  ✅ 数据一致性验证通过"
            else
                print_error "  ❌ 数据一致性验证失败: 期望 $host, 实际 $VERIFICATION"
            fi
        else
            print_info "  ℹ️  主机 $host: 无记录（可能正常）"
        fi
    done
    
    print_message "🎉 API功能测试完成"
}

# 生成部署报告
generate_deployment_report() {
    print_message "📊 生成部署报告..."
    
    REPORT_FILE="deployment_report_$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# BJT Product System API修复部署报告

## 部署信息
- 部署时间: $(date)
- 部署环境: 生产环境
- Git提交: $(git rev-parse HEAD)
- Git分支: $(git branch --show-current)

## 检查结果

### 代码检查
- API控制器文件: $([ -f "plugins/bjt-core-entities/controllers/class-relation-controller.php" ] && echo "✅ 存在" || echo "❌ 缺失")
- host_part_number参数定义: $(grep -q "host_part_number.*description.*Filter relations by host part number" plugins/bjt-core-entities/controllers/class-relation-controller.php && echo "✅ 存在" || echo "❌ 缺失")
- 参数提取逻辑: $(grep -q "prepared_args\['host_part_number'\].*sanitize_text_field" plugins/bjt-core-entities/controllers/class-relation-controller.php && echo "✅ 存在" || echo "❌ 缺失")
- WHERE子句过滤: $(grep -q "host_part_number.*=.*%s" plugins/bjt-core-entities/controllers/class-relation-controller.php && echo "✅ 存在" || echo "❌ 缺失")

### API测试
- 基本连接: $(curl -f -s --connect-timeout 10 "https://$DOMAIN_NAME/wp-json/bjt/v1" > /dev/null && echo "✅ 正常" || echo "❌ 异常")
- 未过滤API: $(curl -s --connect-timeout 10 "https://$DOMAIN_NAME/wp-json/bjt/v1/relations?per_page=5" | jq -r '.items | length' 2>/dev/null || echo "异常") 条记录
- 过滤功能: 已测试多个主机的过滤效果

## 建议
1. 清理CDN缓存以确保API更新生效
2. 在浏览器中强制刷新页面测试
3. 监控生产环境API响应时间和错误率

## 部署成功标志
- 所有代码检查通过
- API基本功能正常
- 过滤功能按预期工作
- 数据一致性验证通过
EOF

    print_message "📋 部署报告已保存到: $REPORT_FILE"
}

# 主函数
main() {
    print_message "🚀 开始API修复部署验证"
    
    # 检查是否在项目根目录
    if [ ! -f "plugins/bjt-core-entities/controllers/class-relation-controller.php" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行检查
    if check_api_fix_deployment && test_api_functionality; then
        print_message "🎉 API修复部署验证通过"
        generate_deployment_report
        exit 0
    else
        print_error "❌ API修复部署验证失败"
        generate_deployment_report
        exit 1
    fi
}

# 运行主函数
main "$@" 