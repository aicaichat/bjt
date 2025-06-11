#!/bin/bash
# 一键扫描指定文件的多语言问题
# 用法: ./scripts/scan-file.sh <文件路径>

TARGET_FILE="$1"

if [ -z "$TARGET_FILE" ]; then
    echo "用法: $0 <文件路径>"
    echo "示例: $0 frontend/src/pages/Machines/index.tsx"
    exit 1
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo "❌ 文件不存在: $TARGET_FILE"
    exit 1
fi

echo "🔍 扫描文件: $TARGET_FILE"
echo "=================================================="

# 1. 硬编码中文文本
echo "🔥 硬编码中文文本:"
hardcoded_result=$(grep -n "型号:\|电压(V):\|包装尺寸:\|单件净重:\|价格:\|库存:\|加载.*失败\|处理.*失败\|添加.*成功\|更新.*成功" "$TARGET_FILE" 2>/dev/null)
if [ ! -z "$hardcoded_result" ]; then
    echo "$hardcoded_result"
else
    echo "✅ 未发现硬编码中文文本"
fi

echo ""

# 2. 单位重复显示
echo "⚠️ 单位重复显示:"
unit_result=$(grep -n "\${.*kg} kg\|\${.*lbs} lbs\|\${.*cm} cm\|\${.*inch} inch" "$TARGET_FILE" 2>/dev/null)
if [ ! -z "$unit_result" ]; then
    echo "$unit_result"
else
    echo "✅ 未发现单位重复显示"
fi

echo ""

# 3. 统计信息
hardcoded_count=$(echo "$hardcoded_result" | grep -c "." 2>/dev/null || echo "0")
unit_count=$(echo "$unit_result" | grep -c "." 2>/dev/null || echo "0")
t_count=$(grep -c "t(" "$TARGET_FILE" 2>/dev/null || echo "0")

echo "📊 统计信息:"
echo "  🔥 硬编码中文: $hardcoded_count 处"
echo "  ⚠️ 单位重复: $unit_count 处"
echo "  🌐 翻译函数: $t_count 处"

total_issues=$((hardcoded_count + unit_count))
if [ $total_issues -gt 0 ]; then
    echo ""
    echo "🔧 需要修复 $total_issues 个问题"
else
    echo ""
    echo "🎉 该文件没有多语言问题！"
fi 