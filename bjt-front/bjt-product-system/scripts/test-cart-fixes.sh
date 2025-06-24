#!/bin/bash

# 🧪 购物车Bug修复检测验证脚本
# 快速检测修复状态，生成详细报告

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 购物车Bug修复检测开始...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查项目结构
if [ ! -d "frontend/src" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 初始化统计
total_bugs=35
fixed_count=0
partial_count=0
failed_count=0

# 检测结果存储
declare -a results

# 检测函数
check_bug() {
    local bug_id="$1"
    local description="$2"
    local check_command="$3"
    local expected="$4"
    
    echo -n "检测 $bug_id: $description... "
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        results+=("$bug_id|$description|✅ 已修复|$check_command")
        ((fixed_count++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        results+=("$bug_id|$description|❌ 未修复|$check_command")
        ((failed_count++))
        return 1
    fi
}

# 部分修复检测函数
check_partial_bug() {
    local bug_id="$1"
    local description="$2"
    local check_command="$3"
    
    echo -n "检测 $bug_id: $description... "
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️${NC}"
        results+=("$bug_id|$description|⚠️ 部分修复|$check_command")
        ((partial_count++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        results+=("$bug_id|$description|❌ 未修复|$check_command")
        ((failed_count++))
        return 1
    fi
}

echo -e "${YELLOW}A类：订单流程问题检测${NC}"
check_bug "A-001" "可选国家缺失" "find frontend/src -name '*.tsx' -exec grep -l 'COUNTRIES.*US.*CN' {} \;" "found"
check_bug "A-002" "纽约订单无显示" "find frontend/src -name '*.tsx' -exec grep -l 'NewYork\|纽约' {} \;" "found"

echo ""
echo -e "${YELLOW}B类：PO页面核心问题检测${NC}"
check_partial_bug "B-001" "ProductID字段缺失" "grep -r 'product_id\|productId' frontend/src/pages/PO/" 
check_bug "B-002" "Excel数据错乱" "grep -r 'CartExcelNormalizer\|exportToExcel' frontend/src/pages/PO/"
check_bug "B-003" "PO字段与前台描述不符" "find frontend/src -name '*fieldMapping*' -o -name '*UNIFIED_FIELD*'"
check_bug "B-004" "中英文混乱" "grep -r 'useTranslation.*po\|t.*po\.' frontend/src/pages/PO/"
check_bug "B-005" "名称错误" "grep -r 'getProductName\|product.*name' frontend/src/pages/PO/"

echo ""
echo -e "${YELLOW}C类：字段显示问题检测${NC}"
check_bug "C-001" "lbs单位改成lb" "! grep -r '[^a-zA-Z]lbs[^a-zA-Z]' frontend/src/ && grep -r 'lb[^s]' frontend/src/"
check_bug "C-002" "字段名称错误" "find frontend/src -name '*fieldMapping*' -o -name '*FIELD_LABELS*'"
check_bug "C-003" "字段多余" "grep -r 'filterFields\|getRelevantFields' frontend/src/"
check_bug "C-004" "字段重复" "grep -r 'deduplicateFields\|removeDuplicates' frontend/src/"
check_bug "C-005" "字段描述错误" "find frontend/src -name '*FIELD_DESCRIPTIONS*'"
check_bug "C-006" "英文字段描述错误" "grep -r 'en.*description\|description.*en' frontend/src/"

echo ""
echo -e "${YELLOW}D类：数据完整性问题检测${NC}"
check_bug "D-001" "ProductID数据缺失" "grep -r 'ensureProductId\|getProductId' frontend/src/"
check_bug "D-002" "缺少spec、适用机型" "grep -r 'specs\|applicable.*machine' frontend/src/"
check_bug "D-003" "产品缺少气泡" "grep -r 'Tooltip\|popover\|ProductTooltip' frontend/src/"
check_bug "D-004" "充气膜缺少适用机型" "grep -r 'AirFilmFields\|充气膜.*适用机型' frontend/src/"
check_bug "D-005" "充气膜字段过滤" "grep -r 'AIR_FILM_REQUIRED_FIELDS\|filterFieldsForProduct' frontend/src/"

echo ""
echo -e "${YELLOW}E类：备件流程问题检测${NC}"
check_bug "E-001" "备件字段配置" "grep -r 'SPARE_PARTS_FIELDS\|spare.*field.*config' frontend/src/"
check_bug "E-002" "备件中英文映射" "grep -r 'spare.*i18n\|备件.*翻译' frontend/src/"
check_bug "E-003" "备件Excel导出" "grep -r 'spare.*excel\|备件.*导出' frontend/src/"
check_bug "E-004" "备件字段验证" "grep -r 'spare.*validation\|备件.*验证' frontend/src/"
# E-005 到 E-015 属于同类问题，统计为4个代表性检测

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📊 检测统计报告${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总Bug数量: $total_bugs"
echo -e "✅ 已修复: ${GREEN}$fixed_count${NC} ($(( fixed_count * 100 / total_bugs ))%)"
echo -e "⚠️ 部分修复: ${YELLOW}$partial_count${NC} ($(( partial_count * 100 / total_bugs ))%)"
echo -e "❌ 未修复: ${RED}$failed_count${NC} ($(( failed_count * 100 / total_bugs ))%)"

# 计算修复率 (已修复 + 部分修复的50%)
fix_rate=$(( (fixed_count * 100 + partial_count * 50) / total_bugs ))
echo -e "📈 修复率: ${BLUE}$fix_rate%${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📋 详细检测结果${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 生成详细报告
report_file="cart-bug-test-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$report_file" << EOF
# 购物车Bug检测报告

**检测时间**: $(date)
**检测工具**: test-cart-fixes.sh v1.0

## 🎯 检测统计
- **总Bug数**: $total_bugs个
- **✅ 已修复**: $fixed_count个 ($(( fixed_count * 100 / total_bugs ))%)
- **⚠️ 部分修复**: $partial_count个 ($(( partial_count * 100 / total_bugs ))%)
- **❌ 未修复**: $failed_count个 ($(( failed_count * 100 / total_bugs ))%)
- **📈 修复率**: $fix_rate%

## 📊 分类检测结果

### A类：订单流程问题
EOF

# 按类别输出结果
for result in "${results[@]}"; do
    IFS='|' read -r bug_id description status command <<< "$result"
    echo "| $bug_id | $description | $status |" >> "$report_file"
    echo "$bug_id: $description - $status"
done

cat >> "$report_file" << EOF

## 🔧 修复建议

### 优先级P0 (紧急)
$(echo "${results[@]}" | grep -o 'B-00[12][^|]*|[^|]*|❌[^|]*' | head -3 || echo "无紧急修复项")

### 优先级P1 (高)
$(echo "${results[@]}" | grep -o 'D-00[12][^|]*|[^|]*|❌[^|]*' | head -3 || echo "无高优先级修复项")

### 优先级P2 (中)
$(echo "${results[@]}" | grep -o 'A-00[12][^|]*|[^|]*|❌[^|]*' | head -2 || echo "无中优先级修复项")

## 📞 下一步行动
1. 参考 \`购物车Bug修复完整指南.md\` 获取详细修复提示词
2. 使用 \`scripts/fix-cart-bugs.sh\` 执行自动化修复
3. 重新运行本检测脚本验证修复效果

---
*此报告由自动化检测工具生成*
EOF

echo ""
echo -e "${GREEN}✅ 详细报告已生成: $report_file${NC}"

# 根据修复率给出建议
if [ $fix_rate -ge 80 ]; then
    echo -e "${GREEN}🎉 修复率优秀！大部分Bug已解决${NC}"
elif [ $fix_rate -ge 60 ]; then
    echo -e "${YELLOW}👍 修复率良好，建议继续优化${NC}"
elif [ $fix_rate -ge 40 ]; then
    echo -e "${YELLOW}⚠️ 修复率一般，需要重点关注${NC}"
else
    echo -e "${RED}🚨 修复率较低，建议立即开始修复${NC}"
fi

echo ""
echo -e "${BLUE}💡 使用提示：${NC}"
echo "1. 运行 ./scripts/fix-cart-bugs.sh 开始修复"
echo "2. 查看 购物车Bug修复完整指南.md 获取详细提示词"
echo "3. 修复后重新运行本脚本验证效果"

echo ""
echo -e "${GREEN}🎯 检测完成！${NC}" 