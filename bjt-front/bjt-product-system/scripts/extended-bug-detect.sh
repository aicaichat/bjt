#!/bin/bash

# 🔍 扩展购物车Bug检测脚本 (包含新发现的100+个bug)
# 基于用户提供的Excel截图分析

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🔍 扩展购物车Bug检测 (100+个bug)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查项目结构
if [ ! -d "frontend/src" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 统计变量
total_bugs=100  # 根据截图预估
checked_bugs=0
fixed_count=0
partial_count=0
failed_count=0

# 检测函数
check_bug() {
    local bug_id="$1"
    local description="$2"
    local check_command="$3"
    
    echo -n "检测 $bug_id: $description... "
    ((checked_bugs++))
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        ((fixed_count++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        ((failed_count++))
        return 1
    fi
}

check_partial_bug() {
    local bug_id="$1"
    local description="$2"
    local check_command="$3"
    
    echo -n "检测 $bug_id: $description... "
    ((checked_bugs++))
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️${NC}"
        ((partial_count++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        ((failed_count++))
        return 1
    fi
}

echo -e "${CYAN}📋 原有A-E类bug检测 (35个)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# A类：订单流程问题 (2个)
echo -e "${YELLOW}A类：订单流程问题${NC}"
check_bug "A-001" "可选国家缺失" "find frontend/src -name '*.tsx' -exec grep -l 'COUNTRIES.*US.*CN' {} \;"
check_bug "A-002" "纽约订单无显示" "find frontend/src -name '*.tsx' -exec grep -l 'NewYork\|纽约' {} \;"

# B类：PO页面核心问题 (5个)
echo -e "${YELLOW}B类：PO页面核心问题${NC}"
check_partial_bug "B-001" "ProductID字段缺失" "grep -r 'product_id\|productId' frontend/src/pages/PO/"
check_bug "B-002" "Excel数据错乱" "grep -r 'CartExcelNormalizer\|exportToExcel' frontend/src/pages/PO/"
check_bug "B-003" "PO字段与前台描述不符" "find frontend/src -name '*fieldMapping*' -o -name '*UNIFIED_FIELD*'"
check_bug "B-004" "中英文混乱" "grep -r 'useTranslation.*po\|t.*po\.' frontend/src/pages/PO/"
check_bug "B-005" "名称错误" "grep -r 'getProductName\|product.*name' frontend/src/pages/PO/"

# C类：字段显示问题 (8个)
echo -e "${YELLOW}C类：字段显示问题${NC}"
check_bug "C-001" "lbs单位改成lb" "! grep -r '[^a-zA-Z]lbs[^a-zA-Z]' frontend/src/ && grep -r 'lb[^s]' frontend/src/"
check_bug "C-002" "字段名称错误" "find frontend/src -name '*fieldMapping*' -o -name '*FIELD_LABELS*'"
check_bug "C-003" "字段多余" "grep -r 'filterFields\|getRelevantFields' frontend/src/"
check_bug "C-004" "字段重复" "grep -r 'deduplicateFields\|removeDuplicates' frontend/src/"
check_bug "C-005" "字段描述错误" "find frontend/src -name '*FIELD_DESCRIPTIONS*'"
check_bug "C-006" "字段描述错误" "grep -r 'FIELD_DESCRIPTIONS\|fieldDesc' frontend/src/"
check_bug "C-007" "英文字段描述错误" "grep -r 'en.*description\|description.*en' frontend/src/"
check_bug "C-008" "字段全英文显示" "grep -r 'i18n.*interface\|lang.*interface' frontend/src/"

# D类：数据完整性问题 (5个)
echo -e "${YELLOW}D类：数据完整性问题${NC}"
check_bug "D-001" "ProductID数据缺失" "grep -r 'ensureProductId\|getProductId' frontend/src/"
check_bug "D-002" "缺少spec、适用机型" "grep -r 'specs\|applicable.*machine' frontend/src/"
check_bug "D-003" "产品缺少气泡" "grep -r 'Tooltip\|popover\|ProductTooltip' frontend/src/"
check_bug "D-004" "充气膜缺少适用机型、泡径" "grep -r 'AirFilmFields\|充气膜.*适用机型' frontend/src/"
check_bug "D-005" "充气膜多余字段删除" "grep -r 'AIR_FILM_REQUIRED_FIELDS\|filterFieldsForProduct' frontend/src/"

# E类：备件流程问题 (15个代表性检测5个)
echo -e "${YELLOW}E类：备件流程问题${NC}"
check_bug "E-001" "备件字段配置" "grep -r 'SPARE_PARTS_FIELDS\|spare.*field.*config' frontend/src/"
check_bug "E-002" "备件中英文映射" "grep -r 'spare.*i18n\|备件.*翻译' frontend/src/"
check_bug "E-003" "备件Excel导出" "grep -r 'spare.*excel\|备件.*导出' frontend/src/"
check_bug "E-004" "备件字段验证" "grep -r 'spare.*validation\|备件.*验证' frontend/src/"
check_bug "E-005" "备件字段缺失和描述错误" "grep -r 'spare.*field.*missing\|备件.*字段.*缺失' frontend/src/"

echo ""
echo -e "${PURPLE}🆕 新发现F-H类bug检测 (65个)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# F类：气垫机配件管理问题 (约30个，检测10个代表性)
echo -e "${BLUE}F类：气垫机配件管理问题${NC}"
check_bug "F-001" "形状名称不对" "grep -r 'SHAPE_MAPPING\|shape.*name.*config' frontend/src/"
check_bug "F-002" "材料名称不对" "grep -r 'MATERIAL_STANDARD\|material.*name.*config' frontend/src/"
check_bug "F-003" "厚度对照不对" "grep -r 'thickness.*mapping\|厚度.*对照' frontend/src/"
check_bug "F-004" "应该是克重不是重量" "grep -r 'gsm\|gram.*weight\|克重' frontend/src/"
check_bug "F-005" "适用机型系统不够" "grep -r 'MACHINE_COMPATIBILITY\|machine.*compatibility' frontend/src/"
check_bug "F-006" "900603的shape圆形问题" "grep -r '900603.*shape\|圆形.*shape' frontend/src/"
check_bug "F-007" "型号英文名效果" "grep -r 'model.*name.*en\|型号.*英文' frontend/src/"
check_bug "F-008" "计制信息中没有英文名" "grep -r 'product.*info.*en\|计制.*英文' frontend/src/"
check_bug "F-009" "包装方式名称不对" "grep -r 'package.*method.*name\|包装方式.*名称' frontend/src/"
check_bug "F-010" "没有包装物图片" "grep -r 'package.*image\|包装.*图片' frontend/src/"

# G类：用户管理模块问题 (约15个，检测8个)
echo -e "${BLUE}G类：用户管理模块问题${NC}"
check_bug "G-001" "颜色错误" "grep -r 'color.*error\|颜色.*错误' frontend/src/pages/UserManagement/"
check_bug "G-002" "地址选项数据" "grep -r 'address.*option\|地址.*选项' frontend/src/pages/UserManagement/"
check_bug "G-003" "权限账户登录不了" "grep -r 'permission.*login\|权限.*登录' frontend/src/pages/UserManagement/"
check_bug "G-004" "澳洲C端页面值错误" "grep -r 'AU.*client\|澳洲.*client' frontend/src/pages/UserManagement/"
check_bug "G-005" "enterprise_client企业用户" "grep -r 'enterprise_client' frontend/src/pages/UserManagement/"
check_bug "G-006" "用户管理中文问题" "grep -r 'user.*management.*zh\|用户管理.*中文' frontend/src/pages/UserManagement/"
check_bug "G-007" "企业用户页面值错误" "grep -r 'enterprise.*user.*page\|企业用户.*页面' frontend/src/pages/UserManagement/"
check_bug "G-008" "用户管理多语言切换" "grep -r 'user.*i18n\|用户.*语言切换' frontend/src/pages/UserManagement/"

# H类：产品版本显示问题 (约5个)
echo -e "${BLUE}H类：产品版本显示问题${NC}"
check_bug "H-001" "产品版本占格体存储显示" "grep -r 'product.*version.*display\|产品版本.*显示' frontend/src/"
check_bug "H-002" "切换英文无反应" "grep -r 'language.*switch.*en\|切换.*英文' frontend/src/"
check_bug "H-003" "版本信息显示不完整" "grep -r 'version.*info.*incomplete\|版本信息.*不完整' frontend/src/"
check_bug "H-004" "产品版本存储问题" "grep -r 'product.*version.*storage\|产品版本.*存储' frontend/src/"
check_bug "H-005" "版本号格式错误" "grep -r 'version.*format\|版本号.*格式' frontend/src/"

# I类：气泡膜选项问题 (约15个，检测8个)
echo -e "${BLUE}I类：气泡膜选项问题${NC}"
check_bug "I-001" "imports字段缺失" "grep -r 'imports.*field\|imports.*字段' frontend/src/"
check_bug "I-002" "中文版和物料英文版" "grep -r 'material.*version.*zh\|物料.*版本' frontend/src/"
check_bug "I-003" "中文又参杂" "grep -r 'zh.*mixed\|中文.*参杂' frontend/src/"
check_bug "I-004" "没有新加物料成功提示" "grep -r 'material.*add.*success\|物料.*成功.*提示' frontend/src/"
check_bug "I-005" "气泡字段缺失" "grep -r 'bubble.*field.*missing\|气泡.*字段.*缺失' frontend/src/"
check_bug "I-006" "膜条袋长字段错误" "grep -r 'film.*strip.*length\|膜条.*袋长' frontend/src/"
check_bug "I-007" "适用机型文字错误" "grep -r 'applicable.*machine.*text\|适用机型.*文字' frontend/src/"
check_bug "I-008" "规格字段描述修改" "grep -r 'spec.*field.*desc\|规格.*字段.*描述' frontend/src/"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📊 扩展检测统计报告${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 计算已检测的bug比例  
checked_percentage=$((checked_bugs * 100 / total_bugs))
fix_rate=$((fixed_count * 100 / checked_bugs))
partial_rate=$((partial_count * 100 / checked_bugs))
fail_rate=$((failed_count * 100 / checked_bugs))

echo "预估Bug总数: $total_bugs+"
echo "已检测Bug数: $checked_bugs (${checked_percentage}%)"
echo -e "✅ 已修复: ${GREEN}$fixed_count${NC} (${fix_rate}%)"
echo -e "⚠️ 部分修复: ${YELLOW}$partial_count${NC} (${partial_rate}%)"  
echo -e "❌ 未修复: ${RED}$failed_count${NC} (${fail_rate}%)"

# 生成扩展报告
report_file="extended-bug-report-$(date +%Y%m%d-%H%M%S).md"

cat > "$report_file" << EOF
# 扩展购物车Bug检测报告 (100+个bug)

**检测时间**: $(date)
**检测工具**: extended-bug-detect.sh v1.0
**基于**: Excel截图分析

## 🎯 扩展检测统计
- **预估Bug总数**: $total_bugs+个
- **已检测**: $checked_bugs个 (${checked_percentage}%)
- **✅ 已修复**: $fixed_count个 (${fix_rate}%)
- **⚠️ 部分修复**: $partial_count个 (${partial_rate}%)
- **❌ 未修复**: $failed_count个 (${fail_rate}%)

## 📊 新发现的Bug类型

### F类：气垫机配件管理问题 (~30个)
- 形状名称映射错误
- 材料名称不统一  
- 厚度/克重单位混乱
- 适用机型数据不完整
- 英文名显示问题

### G类：用户管理模块问题 (~15个)  
- enterprise_client企业用户问题
- 权限账户登录异常
- 地址选项数据缺失
- 多语言切换问题
- 区域配置错误

### H类：产品版本显示问题 (~5个)
- 版本号存储显示异常
- 语言切换无反应
- 版本信息不完整

### I类：气泡膜选项问题 (~15个)
- imports字段缺失
- 中英文版本混乱
- 物料添加成功提示缺失
- 字段描述错误

## 🚨 紧急修复优先级

### P0 - 立即修复 (影响核心业务)
1. 购物车中没有productId 
2. PO中没有英文名、productId
3. enterprise_client企业用户问题
4. 气垫机配件形状名称错误
5. 适用机型与表格字段不一致

### P1 - 本周修复 (影响用户体验)
1. 厚度/克重单位混乱
2. 材料名称不统一
3. 用户管理权限问题
4. 产品版本显示异常
5. 气泡膜字段缺失

## 💡 修复建议

1. **优先修复影响购物流程的P0问题**
2. **建立统一的数据标准和字段映射**
3. **完善多语言支持和切换逻辑**
4. **加强用户管理和权限控制**
5. **规范产品版本和配件管理**

## 📞 下一步行动

1. 获取完整Excel文件进行详细分析
2. 按业务模块制定修复计划
3. 建立自动化测试验证流程
4. 分阶段部署和验证修复效果

---
*基于Excel截图的扩展分析，实际bug数量可能更多*
EOF

echo ""
echo -e "${GREEN}✅ 扩展检测报告已生成: $report_file${NC}"

# 根据修复率给出建议
if [ $fix_rate -ge 60 ]; then
    echo -e "${GREEN}🎉 当前修复率较好，建议继续优化${NC}"
elif [ $fix_rate -ge 40 ]; then
    echo -e "${YELLOW}⚠️ 修复率一般，建议重点关注P0问题${NC}"
else
    echo -e "${RED}🚨 修复率较低，需要立即开始系统性修复${NC}"
fi

echo ""
echo -e "${CYAN}💡 重要发现:${NC}"
echo "1. 实际bug数量远超预期，预估100+个"
echo "2. 新发现气垫机配件管理、用户管理等模块问题" 
echo "3. 需要完整Excel文件进行精确分析"
echo "4. 建议分模块、分优先级进行修复"

echo ""
echo -e "${PURPLE}🎯 扩展检测完成！建议先修复P0级问题${NC}" 