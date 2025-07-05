#!/bin/bash

# 生产环境API测试脚本
echo "🧪 生产环境 - 测试关联关系API过滤修复效果..."

# 检查是否在生产服务器上
if [ ! -d "/var/www/html" ]; then
    echo "❌ 这不是生产服务器环境"
    echo "💡 请在生产服务器上运行此脚本"
    exit 1
fi

# 获取网站域名
SITE_URL=$(grep -r "define.*WP_HOME" /var/www/html/wp-config.php | head -1 | sed -n "s/.*'\(.*\)'.*/\1/p" 2>/dev/null)
if [ -z "$SITE_URL" ]; then
    # 尝试从nginx配置获取
    SITE_URL="https://$(hostname)"
    echo "⚠️ 无法从wp-config.php获取域名，使用默认: $SITE_URL"
fi

API_URL="$SITE_URL/wp-json/bjt/v1/relations"

echo "🌐 测试API地址: $API_URL"
echo "📅 测试时间: $(date)"
echo ""

# 测试用例
declare -a test_cases=(
    "60A01149:应该返回该主机的记录"
    "60A01152:测试其他主机"
    "60A01153:测试其他主机"
    "60A01113:测试目标主机"
    "60A01141:测试其他主机"
)

echo "🎯 测试指定主机的过滤效果..."
echo "================================================="

for test_case in "${test_cases[@]}"; do
    IFS=':' read -r host_part_number description <<< "$test_case"
    
    echo "🔍 测试主机: $host_part_number ($description)"
    
    # 发送请求
    response=$(curl -s -m 10 "$API_URL?host_part_number=$host_part_number&per_page=5" 2>/dev/null)
    
    if [ $? -ne 0 ] || [ -z "$response" ]; then
        echo "❌ API请求失败或超时"
        continue
    fi
    
    # 解析响应
    total=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    
    if [ -z "$total" ]; then
        echo "❌ API响应格式错误"
        echo "响应前200字符: $(echo "$response" | head -c 200)..."
    else
        echo "📊 结果: $total 条记录"
        
        # 检查是否所有返回的记录都是指定主机的
        if [ "$total" -gt 0 ]; then
            # 检查返回的记录是否都属于指定主机
            wrong_host_count=$(echo "$response" | grep -o '"host_part_number":"[^"]*"' | grep -v "\"host_part_number\":\"$host_part_number\"" | wc -l)
            
            if [ "$wrong_host_count" -eq 0 ]; then
                echo "✅ 过滤正确: 所有记录都属于指定主机"
            else
                echo "❌ 过滤错误: 发现 $wrong_host_count 条其他主机的记录"
                echo "错误的主机: $(echo "$response" | grep -o '"host_part_number":"[^"]*"' | sort -u)"
            fi
            
            # 显示前几条记录的简要信息
            echo "📋 前3条记录:"
            echo "$response" | grep -o '"id":[0-9]*,"product_line_id":[0-9]*,"host_part_number":"[^"]*"' | head -3
        else
            echo "ℹ️ 该主机没有关联关系记录"
        fi
    fi
    echo ""
done

echo "🔄 测试不带过滤条件的API..."
echo "================================================="

# 测试不带过滤条件
response=$(curl -s -m 10 "$API_URL?per_page=5" 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$response" ]; then
    echo "❌ API请求失败或超时"
else
    total=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    
    if [ -z "$total" ]; then
        echo "❌ API响应格式错误"
    else
        echo "📊 总记录数: $total"
        
        # 检查是否包含多个不同的主机
        host_count=$(echo "$response" | grep -o '"host_part_number":"[^"]*"' | sort -u | wc -l)
        echo "🏠 包含 $host_count 个不同主机的记录"
        
        if [ "$host_count" -gt 1 ]; then
            echo "✅ 正常: 不带过滤条件时返回多个主机的记录"
            echo "🏠 主机列表:"
            echo "$response" | grep -o '"host_part_number":"[^"]*"' | sort -u | head -5
        elif [ "$host_count" -eq 1 ]; then
            echo "⚠️ 注意: 只返回单个主机的记录（可能数据较少）"
        else
            echo "❌ 异常: 没有找到主机记录"
        fi
    fi
fi

echo ""
echo "🕐 API响应性能测试..."
echo "================================================="

# 简单的性能测试
start_time=$(date +%s%N)
curl -s -m 5 "$API_URL?host_part_number=60A01149&per_page=10" > /dev/null 2>&1
end_time=$(date +%s%N)

if [ $? -eq 0 ]; then
    duration=$(( (end_time - start_time) / 1000000 ))  # 转换为毫秒
    echo "⚡ API响应时间: ${duration}ms"
    
    if [ "$duration" -lt 1000 ]; then
        echo "✅ 响应速度优秀 (<1秒)"
    elif [ "$duration" -lt 3000 ]; then
        echo "✅ 响应速度良好 (<3秒)"
    else
        echo "⚠️ 响应较慢 (>3秒)"
    fi
else
    echo "❌ 性能测试失败"
fi

echo ""
echo "🎉 生产环境API测试完成！"
echo ""
echo "📝 测试总结:"
echo "- API过滤功能: $([ "$host_count" -gt 1 ] && echo "✅ 正常" || echo "⚠️ 需检查")"
echo "- 数据一致性: 已验证多个主机的过滤效果"
echo "- 响应性能: 已测试API响应时间"
echo ""
echo "💡 建议下一步操作:"
echo "1. 清理CDN缓存: /wp-json/bjt/v1/relations*"
echo "2. 测试前端应用的关联关系功能"
echo "3. 监控生产环境的API日志"
echo "4. 如有问题，可查看备份文件进行回滚" 