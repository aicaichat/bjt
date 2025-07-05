#!/bin/bash

# 快速测试API修复效果
echo "🧪 测试关联关系API过滤修复效果"
echo "============================================"

# 配置
BASE_URL="http://localhost:8080"
TEST_HOST="60A01113"
PRODUCT_LINE_ID="1"

# 测试1：修复前的问题 - 没有host_part_number参数
echo "📋 测试1: 不使用host_part_number参数（修复前的情况）"
echo "URL: $BASE_URL/wp-json/bjt/v1/relations?product_line_id=$PRODUCT_LINE_ID&per_page=5"
echo ""

RESPONSE1=$(curl -s -X GET "$BASE_URL/wp-json/bjt/v1/relations?product_line_id=$PRODUCT_LINE_ID&per_page=5")
echo "返回的记录数: $(echo "$RESPONSE1" | jq -r '.total // "N/A"')"
echo "主机分布:"
echo "$RESPONSE1" | jq -r '.items[]?.host_part_number // "N/A"' | sort | uniq -c

echo ""
echo "============================================"

# 测试2：修复后的效果 - 使用host_part_number参数
echo "📋 测试2: 使用host_part_number参数（修复后的情况）"
echo "URL: $BASE_URL/wp-json/bjt/v1/relations?host_part_number=$TEST_HOST&product_line_id=$PRODUCT_LINE_ID&per_page=5"
echo ""

RESPONSE2=$(curl -s -X GET "$BASE_URL/wp-json/bjt/v1/relations?host_part_number=$TEST_HOST&product_line_id=$PRODUCT_LINE_ID&per_page=5")
echo "返回的记录数: $(echo "$RESPONSE2" | jq -r '.total // "N/A"')"
echo "主机分布:"
echo "$RESPONSE2" | jq -r '.items[]?.host_part_number // "N/A"' | sort | uniq -c

echo ""
echo "详细记录:"
echo "$RESPONSE2" | jq -r '.items[]? | "ID: \(.id), Host: \(.host_part_number), Child: \(.child_part_number)"'

echo ""
echo "============================================"

# 分析结果
echo "🔍 修复效果分析"
TOTAL1=$(echo "$RESPONSE1" | jq -r '.total // 0')
TOTAL2=$(echo "$RESPONSE2" | jq -r '.total // 0')

echo "修复前总记录数: $TOTAL1"
echo "修复后总记录数: $TOTAL2"

if [ "$TOTAL2" -lt "$TOTAL1" ]; then
    echo "✅ 修复成功！API现在正确过滤了host_part_number参数"
    echo "📊 过滤效果: 从 $TOTAL1 条减少到 $TOTAL2 条"
else
    echo "❌ 修复可能未生效，记录数没有减少"
fi

# 检查是否所有记录都属于指定主机
echo ""
echo "🎯 数据一致性检查"
WRONG_HOST_COUNT=$(echo "$RESPONSE2" | jq -r ".items[]? | select(.host_part_number != \"$TEST_HOST\") | .id" | wc -l)

if [ "$WRONG_HOST_COUNT" -eq 0 ]; then
    echo "✅ 所有返回的记录都属于主机 $TEST_HOST"
else
    echo "❌ 发现 $WRONG_HOST_COUNT 条记录不属于主机 $TEST_HOST"
fi

echo ""
echo "============================================"
echo "💡 如果修复未生效，请检查："
echo "   1. Docker容器是否正在运行"
echo "   2. 修复的文件是否正确复制到容器中"
echo "   3. Apache服务是否已重启"
echo "   4. 是否有其他缓存需要清除" 