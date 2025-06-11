#!/bin/bash

# 前端页面多语言和单位显示问题全量发现脚本
# 使用方法: ./scripts/find-all-i18n-issues.sh [目标目录]

TARGET_DIR=${1:-"frontend/src/pages"}
OUTPUT_FILE="i18n-issues-report.txt"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "🔍 前端页面问题全量扫描开始..."
echo "📁 扫描目录: $TARGET_DIR"
echo "📄 报告文件: $OUTPUT_FILE"
echo "🕐 扫描时间: $TIMESTAMP"
echo "=================================================="

# 清空输出文件
> $OUTPUT_FILE

echo "🔍 前端页面多语言和单位显示问题扫描报告" >> $OUTPUT_FILE
echo "扫描时间: $TIMESTAMP" >> $OUTPUT_FILE
echo "扫描目录: $TARGET_DIR" >> $OUTPUT_FILE
echo "================================================" >> $OUTPUT_FILE

# 1. 硬编码中文文本扫描
echo ""
echo "1️⃣ 正在扫描硬编码中文文本..."
echo ""
echo "【1. 硬编码中文文本问题】" >> $OUTPUT_FILE
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> $OUTPUT_FILE

# 常见硬编码模式
HARDCODED_PATTERNS=(
    "型号:"
    "电压\(V\):"
    "电压:"
    "包装尺寸:"
    "单件净重:"
    "单件毛重:"
    "打托高度:"
    "整托毛重:"
    "单箱数量:"
    "托盘尺寸:"
    "一托数量:"
    "频率\(Hz\):"
    "价格:"
    "库存:"
    "加载.*失败"
    "处理.*失败"
    "添加.*成功"
    "删除.*成功"
    "更新.*成功"
    "保存.*成功"
    "操作.*失败"
    "请.*选择"
    "确认.*删除"
    "暂无.*数据"
    "正在.*加载"
    "加载.*中\.\.\."
)

HARDCODED_COUNT=0
for pattern in "${HARDCODED_PATTERNS[@]}"; do
    echo "  🔍 搜索模式: $pattern"
    results=$(grep -rn "$pattern" $TARGET_DIR --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null)
    if [ ! -z "$results" ]; then
        echo "📍 模式: $pattern" >> $OUTPUT_FILE
        echo "$results" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
        count=$(echo "$results" | wc -l)
        HARDCODED_COUNT=$((HARDCODED_COUNT + count))
        echo "    ❌ 发现 $count 处"
    else
        echo "    ✅ 未发现"
    fi
done

echo "总计硬编码中文文本: $HARDCODED_COUNT 处" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# 2. 单位重复显示扫描
echo ""
echo "2️⃣ 正在扫描单位重复显示问题..."
echo ""
echo "【2. 单位重复显示问题】" >> $OUTPUT_FILE
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> $OUTPUT_FILE

# 单位重复模式
UNIT_DUPLICATE_PATTERNS=(
    "\\\$\{.*kg\} kg"
    "\\\$\{.*lbs\} lbs" 
    "\\\$\{.*cm\} cm"
    "\\\$\{.*inch\} inch"
    "\\\$\{.*V\} V"
    "\\\$\{.*Hz\} Hz"
    "\\\$\{.*\}.*kg"
    "\\\$\{.*\}.*lbs"
    "\\\$\{.*\}.*cm"
    "\\\$\{.*\}.*inch"
)

UNIT_DUPLICATE_COUNT=0
for pattern in "${UNIT_DUPLICATE_PATTERNS[@]}"; do
    echo "  🔍 搜索单位重复: $pattern"
    results=$(grep -rn "$pattern" $TARGET_DIR --include="*.tsx" --include="*.ts" 2>/dev/null)
    if [ ! -z "$results" ]; then
        echo "📍 单位重复模式: $pattern" >> $OUTPUT_FILE
        echo "$results" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
        count=$(echo "$results" | wc -l)
        UNIT_DUPLICATE_COUNT=$((UNIT_DUPLICATE_COUNT + count))
        echo "    ❌ 发现 $count 处"
    else
        echo "    ✅ 未发现"
    fi
done

echo "总计单位重复显示: $UNIT_DUPLICATE_COUNT 处" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# 3. 缺失翻译文件扫描
echo ""
echo "3️⃣ 正在扫描翻译文件完整性..."
echo ""
echo "【3. 翻译文件完整性检查】" >> $OUTPUT_FILE  
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> $OUTPUT_FILE

MISSING_I18N_FILES=0
page_files=$(find $TARGET_DIR -name "*.tsx" -o -name "*.ts" | grep -E "(Page|index)" | head -20)

for page_file in $page_files; do
    page_name=$(basename $(dirname $page_file))
    zh_file="frontend/src/i18n/locales/zh/${page_name,,}.json"
    en_file="frontend/src/i18n/locales/en/${page_name,,}.json"
    
    echo "  📄 检查页面: $page_name"
    
    if [ ! -f "$zh_file" ]; then
        echo "❌ 缺失中文翻译: $zh_file" >> $OUTPUT_FILE
        MISSING_I18N_FILES=$((MISSING_I18N_FILES + 1))
        echo "    ❌ 缺失中文翻译文件"
    else
        echo "    ✅ 中文翻译文件存在"
    fi
    
    if [ ! -f "$en_file" ]; then
        echo "❌ 缺失英文翻译: $en_file" >> $OUTPUT_FILE
        MISSING_I18N_FILES=$((MISSING_I18N_FILES + 1))
        echo "    ❌ 缺失英文翻译文件"
    else
        echo "    ✅ 英文翻译文件存在"
    fi
done

echo "总计缺失翻译文件: $MISSING_I18N_FILES 个" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# 4. 未使用翻译函数扫描
echo ""
echo "4️⃣ 正在扫描未使用翻译函数的文件..."
echo ""
echo "【4. 未使用翻译函数的文件】" >> $OUTPUT_FILE
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> $OUTPUT_FILE

NO_I18N_COUNT=0
for file in $(find $TARGET_DIR -name "*.tsx" -o -name "*.ts"); do
    if ! grep -q "useTranslation\|t(" "$file" 2>/dev/null; then
        if grep -q "[\u4e00-\u9fff]" "$file" 2>/dev/null; then
            echo "❌ 文件包含中文但未使用翻译: $file" >> $OUTPUT_FILE
            NO_I18N_COUNT=$((NO_I18N_COUNT + 1))
        fi
    fi
done

echo "总计未使用翻译函数: $NO_I18N_COUNT 个文件" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# 5. 混合字符串扫描
echo ""
echo "5️⃣ 正在扫描中英文混合字符串..."
echo ""
echo "【5. 中英文混合字符串问题】" >> $OUTPUT_FILE
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> $OUTPUT_FILE

MIXED_STRING_COUNT=0
mixed_results=$(grep -rn "[a-zA-Z].*[\u4e00-\u9fff]\|[\u4e00-\u9fff].*[a-zA-Z]" $TARGET_DIR --include="*.tsx" --include="*.ts" 2>/dev/null | head -50)
if [ ! -z "$mixed_results" ]; then
    echo "$mixed_results" >> $OUTPUT_FILE
    MIXED_STRING_COUNT=$(echo "$mixed_results" | wc -l)
else
    echo "✅ 未发现中英文混合字符串问题" >> $OUTPUT_FILE
fi

echo "总计中英文混合字符串: $MIXED_STRING_COUNT 处" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# 6. 总结报告
echo ""
echo "6️⃣ 生成问题汇总..."
echo ""
echo "【📊 问题汇总统计】" >> $OUTPUT_FILE
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> $OUTPUT_FILE
echo "🔥 硬编码中文文本: $HARDCODED_COUNT 处" >> $OUTPUT_FILE
echo "⚠️  单位重复显示: $UNIT_DUPLICATE_COUNT 处" >> $OUTPUT_FILE  
echo "📁 缺失翻译文件: $MISSING_I18N_FILES 个" >> $OUTPUT_FILE
echo "🌐 未使用翻译函数: $NO_I18N_COUNT 个文件" >> $OUTPUT_FILE
echo "🔀 中英文混合字符串: $MIXED_STRING_COUNT 处" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

TOTAL_ISSUES=$((HARDCODED_COUNT + UNIT_DUPLICATE_COUNT + MISSING_I18N_FILES + NO_I18N_COUNT + MIXED_STRING_COUNT))
echo "📋 总计问题数量: $TOTAL_ISSUES 个" >> $OUTPUT_FILE

# 7. 优先级建议
echo "【🎯 修复优先级建议】" >> $OUTPUT_FILE
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> $OUTPUT_FILE
echo "🔴 高优先级 - 硬编码中文文本: $HARDCODED_COUNT 处" >> $OUTPUT_FILE
echo "🟡 中优先级 - 单位重复显示: $UNIT_DUPLICATE_COUNT 处" >> $OUTPUT_FILE
echo "🔵 低优先级 - 翻译文件完善: $MISSING_I18N_FILES 个" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# 控制台输出汇总
echo ""
echo "=================================================="
echo "📊 扫描完成！问题汇总:"
echo "🔥 硬编码中文文本: $HARDCODED_COUNT 处"
echo "⚠️  单位重复显示: $UNIT_DUPLICATE_COUNT 处"
echo "📁 缺失翻译文件: $MISSING_I18N_FILES 个"  
echo "🌐 未使用翻译函数: $NO_I18N_COUNT 个文件"
echo "🔀 中英文混合字符串: $MIXED_STRING_COUNT 处"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 总计问题: $TOTAL_ISSUES 个"
echo "📄 详细报告: $OUTPUT_FILE"

if [ $TOTAL_ISSUES -gt 0 ]; then
    echo ""
    echo "🔧 建议修复顺序:"
    echo "1. 优先修复硬编码中文文本 ($HARDCODED_COUNT 处)"
    echo "2. 修复单位重复显示问题 ($UNIT_DUPLICATE_COUNT 处)"
    echo "3. 完善翻译文件 ($MISSING_I18N_FILES 个)"
else
    echo ""
    echo "🎉 恭喜！未发现多语言问题。"
fi

echo ""
echo "🔍 使用以下命令查看详细报告:"
echo "cat $OUTPUT_FILE" 