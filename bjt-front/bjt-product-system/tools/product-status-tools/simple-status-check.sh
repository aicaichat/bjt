#!/bin/bash

# 产品状态简单检查工具
echo "🔍 产品上下线状态检查"
echo "=================================="
echo ""

# 检查主要文件中的API调用
echo "📋 检查前端API调用状态参数..."
echo ""

files=(
    "../../frontend/src/pages/Machines/index.tsx"
    "../../frontend/index.tsx"
    "../../frontend/src/utils/authTest.ts"
    "../../frontend/src/tests/real-api/pages/machines-page.real-api.test.ts"
)

passed=0
total=0

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "检查: ${file#../../}"
        
        # 检查machineparts API调用
        if grep -q "machineparts" "$file"; then
            ((total++))
            if grep -q "machineparts.*status=publish" "$file"; then
                echo "  ✅ machineparts API包含status=publish参数"
                ((passed++))
            else
                echo "  ❌ machineparts API缺少status=publish参数"
            fi
        fi
        
        # 检查其他API
        for api in "accessories" "consumables" "host-models"; do
            if grep -q "$api" "$file"; then
                ((total++))
                if grep -q "$api.*status=publish" "$file"; then
                    echo "  ✅ $api API包含status=publish参数"
                    ((passed++))
                else
                    echo "  ⚠️  $api API可能缺少status=publish参数"
                fi
            fi
        done
        echo ""
    else
        echo "⚠️  文件不存在: ${file#../../}"
        echo ""
    fi
done

echo "📊 检查结果"
echo "=================================="
echo "总检查项: $total"
echo "通过项: $passed"
echo "失败项: $((total - passed))"

if [ $total -eq $passed ]; then
    echo ""
    echo "🎉 所有检查都通过了！"
    exit 0
else
    echo ""
    echo "🚨 发现 $((total - passed)) 个问题需要修复"
    echo ""
    echo "💡 修复建议:"
    echo "1. 运行修复工具: ./quick-fix-status.sh api-params"
    echo "2. 手动在API调用中添加 status=publish 参数"
    echo "3. 参考文档: ./product-status-checklist.md"
    exit 1
fi 