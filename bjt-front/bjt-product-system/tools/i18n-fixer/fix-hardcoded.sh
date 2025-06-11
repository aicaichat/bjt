#!/bin/bash

# 硬编码中文文本修复工具
# 使用方法: ./tools/i18n-fixer/fix-hardcoded.sh <文件路径> [语言namespace]

TARGET_FILE="$1"
NAMESPACE="${2:-common}"

if [ -z "$TARGET_FILE" ]; then
    echo "用法: $0 <文件路径> [语言namespace]"
    echo "示例: $0 frontend/src/pages/Profile/index.tsx profile"
    exit 1
fi

if [ ! -f "$TARGET_FILE" ]; then
    echo "❌ 文件不存在: $TARGET_FILE"
    exit 1
fi

echo "🔧 开始修复硬编码中文文本..."
echo "📄 目标文件: $TARGET_FILE"
echo "🌐 语言命名空间: $NAMESPACE"
echo "=================================================="

# 创建备份
BACKUP_FILE="${TARGET_FILE}.i18n-backup"
cp "$TARGET_FILE" "$BACKUP_FILE"
echo "💾 已创建备份: $BACKUP_FILE"

# 定义常见的硬编码模式和对应的翻译key
declare -A PATTERNS=(
    ["型号:"]="fields.model"
    ["电压:"]="fields.voltage"
    ["价格:"]="fields.price"
    ["库存:"]="fields.inventory"
    ["包装尺寸:"]="fields.packageSize"
    ["单件净重:"]="fields.netWeight"
    ["加载.*失败"]="messages.loadFailed"
    ["处理.*失败"]="messages.processFailed"
    ["添加.*成功"]="messages.addSuccess"
    ["更新.*成功"]="messages.updateSuccess"
    ["请.*选择"]="prompts.pleaseSelect"
    ["正在.*加载"]="messages.loading"
)

# 应用修复
FIXED_COUNT=0
for pattern in "${!PATTERNS[@]}"; do
    key="${PATTERNS[$pattern]}"
    
    # 检查是否存在该模式
    if grep -q "$pattern" "$TARGET_FILE"; then
        echo "🔍 发现模式: $pattern"
        echo "🔄 替换为: t('${key}')"
        
        # 执行替换 (简化版本，实际需要更复杂的逻辑)
        sed -i.tmp "s|${pattern}|{t('${key}')}|g" "$TARGET_FILE"
        rm "${TARGET_FILE}.tmp"
        
        ((FIXED_COUNT++))
    fi
done

echo ""
echo "📊 修复统计:"
echo "  🔧 修复项目: $FIXED_COUNT 处"
echo "  💾 备份文件: $BACKUP_FILE"
echo ""

if [ $FIXED_COUNT -gt 0 ]; then
    echo "✅ 修复完成！请检查修复结果："
    echo "   1. 查看修复后的文件: $TARGET_FILE"
    echo "   2. 确保添加对应的翻译key到语言文件"
    echo "   3. 如有问题可恢复备份: mv $BACKUP_FILE $TARGET_FILE"
else
    echo "ℹ️ 未发现需要修复的硬编码文本"
    rm "$BACKUP_FILE"  # 删除不必要的备份
fi 