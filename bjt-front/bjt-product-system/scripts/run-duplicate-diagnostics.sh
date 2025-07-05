#!/bin/bash

# 关联关系重复记录诊断脚本执行器
# 用于快速运行诊断并生成报告

echo "🔧 BJT 关联关系重复记录诊断工具"
echo "=================================="

# 设置参数
HOST_PART_NUMBER=${1:-"60A01113"}
PRODUCT_LINE_ID=${2:-1}

echo "诊断参数:"
echo "  主机料号: $HOST_PART_NUMBER"
echo "  产品线ID: $PRODUCT_LINE_ID"
echo ""

# 检查PHP是否可用
if ! command -v php &> /dev/null; then
    echo "❌ 错误: 未找到PHP，请先安装PHP"
    exit 1
fi

# 检查诊断脚本是否存在
SCRIPT_PATH="$(dirname "$0")/diagnose-duplicate-relations.php"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ 错误: 诊断脚本不存在: $SCRIPT_PATH"
    exit 1
fi

# 运行诊断
echo "🔍 开始运行诊断..."
echo ""

# 执行PHP诊断脚本
php "$SCRIPT_PATH" "$HOST_PART_NUMBER" "$PRODUCT_LINE_ID"

# 检查执行结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 诊断完成"
    echo ""
    echo "💡 接下来的步骤："
    echo "1. 查看上述诊断结果"
    echo "2. 根据发现的问题进行修复"
    echo "3. 重新运行诊断验证修复结果"
    echo ""
    echo "如需诊断其他主机，请运行："
    echo "  $0 <主机料号> <产品线ID>"
else
    echo ""
    echo "❌ 诊断执行失败"
    echo "请检查WordPress配置和数据库连接"
fi 