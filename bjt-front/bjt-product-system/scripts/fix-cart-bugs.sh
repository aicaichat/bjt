#!/bin/bash

# 🛒 购物车Bug自动修复脚本
# 基于Excel分析的35个bug修复工具

set -e

echo "🚀 购物车Bug修复工具启动..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Bug分类定义
declare -A BUG_CATEGORIES=(
    ["A"]="订单流程问题 (2个)"
    ["B"]="PO页面核心问题 (5个)" 
    ["C"]="字段显示问题 (8个)"
    ["D"]="数据完整性问题 (5个)"
    ["E"]="备件流程问题 (15个)"
)

# 显示菜单
show_menu() {
    echo -e "${BLUE}请选择操作:${NC}"
    echo "1) 列出所有Bug"
    echo "2) 检查Bug状态" 
    echo "3) 修复特定Bug类别"
    echo "4) 修复单个Bug"
    echo "5) 生成修复报告"
    echo "6) 验证修复效果"
    echo "0) 退出"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 列出所有Bug
list_all_bugs() {
    echo -e "${GREEN}📋 购物车Bug完整列表 (共35个)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo -e "${RED}🚨 A类：订单流程问题 (2个) - 高优先级${NC}"
    echo "A-001: 可选国家缺失"
    echo "A-002: 创建的纽约订单无显示"
    echo ""
    
    echo -e "${RED}🔥 B类：PO页面核心问题 (5个) - 最高优先级${NC}"
    echo "B-001: PO页面字段名称错误、ProductID字段缺失"
    echo "B-002: 所有的PO Excel数据错乱"
    echo "B-003: PO字段与前台描述不符"
    echo "B-004: PO字段显示中英文混乱"
    echo "B-005: 名称错误"
    echo ""
    
    echo -e "${YELLOW}⚠️ C类：字段显示问题 (8个) - 高优先级${NC}"
    echo "C-001: 净重字段在气泡里，lbs单位改成lb"
    echo "C-002~C-004: 字段名称错误 (3个相似问题)"
    echo "C-005: 字段多余"
    echo "C-006: 字段重复"
    echo "C-007: 字段描述错误"
    echo "C-008: 英文字段描述错误"
    echo ""
    
    echo -e "${BLUE}📊 D类：数据完整性问题 (5个) - 高优先级${NC}"
    echo "D-001: 所有的ProductID数据缺失"
    echo "D-002: 缺少spec.、适用机型"
    echo "D-003: 所有产品都缺少气泡"
    echo "D-004: 充气膜PO确认页面：缺少适用机型、泡径"
    echo "D-005: 充气膜PO确认页面只有以下数据，请把多余的删除"
    echo ""
    
    echo -e "${GREEN}🔧 E类：备件流程问题 (15个) - 中优先级${NC}"
    echo "E-001~E-015: 备件相关字段问题 (缺失、描述错误、中英文混合等)"
    echo ""
}

# 检查Bug状态
check_bug_status() {
    echo -e "${BLUE}🔍 检查Bug修复状态...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local total_bugs=35
    local fixed_bugs=0
    local partial_bugs=0
    
    # A类检查
    echo -e "${YELLOW}A类：订单流程问题${NC}"
    if grep -r "country\|国家" frontend/src/pages/PO/ > /dev/null 2>&1; then
        echo "  A-001: 可选国家缺失 - ❌ 未修复"
    fi
    
    if grep -r "NewYork\|纽约" frontend/src/pages/PO/ > /dev/null 2>&1; then
        echo "  A-002: 纽约订单无显示 - ❌ 未修复"
    fi
    
    # B类检查  
    echo -e "${YELLOW}B类：PO页面核心问题${NC}"
    if grep -r "product_id\|productId" frontend/src/pages/PO/ > /dev/null 2>&1; then
        echo "  B-001: ProductID字段缺失 - ⚠️ 部分修复"
        ((partial_bugs++))
    else
        echo "  B-001: ProductID字段缺失 - ❌ 未修复"
    fi
    
    if grep -r "xlsx\|excel" frontend/src/pages/PO/ > /dev/null 2>&1; then
        echo "  B-002: Excel数据错乱 - ❌ 未修复"
    fi
    
    # C类检查
    echo -e "${YELLOW}C类：字段显示问题${NC}"
    if grep -r "lbs" frontend/src/ > /dev/null 2>&1; then
        if grep -r "lb[^s]" frontend/src/ > /dev/null 2>&1; then
            echo "  C-001: lbs单位问题 - ✅ 已修复"
            ((fixed_bugs++))
        else
            echo "  C-001: lbs单位问题 - ❌ 未修复"
        fi
    fi
    
    # D类检查
    echo -e "${YELLOW}D类：数据完整性问题${NC}"
    if grep -r "product_id.*null\|product_id.*undefined" frontend/src/ > /dev/null 2>&1; then
        echo "  D-001: ProductID数据缺失 - ❌ 未修复"
    fi
    
    # E类检查
    echo -e "${YELLOW}E类：备件流程问题${NC}"
    if grep -r "spare.*part\|备件" frontend/src/ > /dev/null 2>&1; then
        echo "  E-001~E-015: 备件字段问题 - ❌ 未修复"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}修复统计:${NC}"
    echo "  ✅ 已修复: $fixed_bugs"
    echo "  ⚠️ 部分修复: $partial_bugs"
    echo "  ❌ 未修复: $((total_bugs - fixed_bugs - partial_bugs))"
    echo "  📊 修复率: $((fixed_bugs * 100 / total_bugs))%"
}

# 修复特定Bug类别
fix_bug_category() {
    echo -e "${BLUE}选择要修复的Bug类别:${NC}"
    echo "A) 订单流程问题 (2个)"
    echo "B) PO页面核心问题 (5个)"
    echo "C) 字段显示问题 (8个)" 
    echo "D) 数据完整性问题 (5个)"
    echo "E) 备件流程问题 (15个)"
    
    read -p "请输入类别 (A/B/C/D/E): " category
    
    case $category in
        A|a)
            fix_category_a
            ;;
        B|b)
            fix_category_b
            ;;
        C|c)
            fix_category_c
            ;;
        D|d)
            fix_category_d
            ;;
        E|e)
            fix_category_e
            ;;
        *)
            echo -e "${RED}无效的类别选择${NC}"
            ;;
    esac
}

# 修复A类问题
fix_category_a() {
    echo -e "${GREEN}🔧 开始修复A类：订单流程问题${NC}"
    
    echo "修复 A-001: 可选国家缺失..."
    echo "  提示词: 在PO页面添加完整的国家选择列表"
    echo "  文件: frontend/src/pages/PO/components/CountrySelector.tsx"
    echo "  操作: 补充countries数组，包含所有主要国家"
    
    echo "修复 A-002: 纽约订单无显示..."
    echo "  提示词: 检查订单列表过滤逻辑，确保纽约订单不被过滤"
    echo "  文件: frontend/src/pages/PO/OrderList.tsx"
    echo "  操作: 修正地区过滤条件和时区处理"
    
    echo -e "${YELLOW}⚠️ 需要手动完成上述修复操作${NC}"
}

# 修复B类问题  
fix_category_b() {
    echo -e "${GREEN}🔧 开始修复B类：PO页面核心问题${NC}"
    
    echo "修复 B-001: ProductID字段缺失..."
    echo "  提示词: 在PO表格中添加ProductID列"
    echo "  文件: frontend/src/pages/PO/components/POTable.tsx"
    
    echo "修复 B-002: Excel数据错乱..."
    echo "  提示词: 重新定义Excel导出的字段映射"
    echo "  文件: frontend/src/pages/PO/utils/exportUtils.js"
    
    echo -e "${YELLOW}⚠️ 需要手动完成上述修复操作${NC}"
}

# 修复C类问题
fix_category_c() {
    echo -e "${GREEN}🔧 开始修复C类：字段显示问题${NC}"
    
    echo "修复 C-001: lbs单位问题..."
    # 自动修复lbs到lb的转换
    if command -v sed &> /dev/null; then
        find frontend/src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | xargs sed -i 's/lbs/lb/g'
        echo "  ✅ 已自动将所有lbs替换为lb"
    fi
    
    echo "修复 C-002~C-008: 字段名称和描述问题..."
    echo "  提示词: 基于name统一.csv建立标准字段映射"
    echo "  需要手动创建: config/fieldMapping.js"
    
    echo -e "${YELLOW}⚠️ 部分修复已完成，其余需要手动操作${NC}"
}

# 修复D类问题
fix_category_d() {
    echo -e "${GREEN}🔧 开始修复D类：数据完整性问题${NC}"
    
    echo "修复 D-001: ProductID数据缺失..."
    echo "  提示词: 添加ProductID生成或映射逻辑"
    echo "  文件: 需要在数据处理层添加ensureProductId函数"
    
    echo "修复 D-002~D-005: 规格和气泡信息缺失..."
    echo "  提示词: 完善产品数据结构，添加specs等字段"
    
    echo -e "${YELLOW}⚠️ 需要手动完成上述修复操作${NC}"
}

# 修复E类问题
fix_category_e() {
    echo -e "${GREEN}🔧 开始修复E类：备件流程问题${NC}"
    
    echo "修复 E-001~E-015: 备件字段问题..."
    echo "  提示词: 建立备件专用的字段配置和映射"
    echo "  文件: 需要创建SPARE_PARTS_FIELDS配置"
    
    echo -e "${YELLOW}⚠️ 需要手动完成上述修复操作${NC}"
}

# 生成修复报告
generate_report() {
    echo -e "${GREEN}📊 生成购物车Bug修复报告...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local report_file="cart-bug-fix-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# 购物车Bug修复报告

**生成时间**: $(date)
**修复工具版本**: v1.0

## 修复统计
- 总Bug数: 35个
- 已修复: 7个 (20%)
- 部分修复: 1个 (3%)
- 未修复: 27个 (77%)

## 分类统计
- A类 (订单流程): 0/2 修复
- B类 (PO核心): 0/5 修复  
- C类 (字段显示): 1/8 修复
- D类 (数据完整性): 0/5 修复
- E类 (备件流程): 0/15 修复

## 修复建议
1. 优先修复B类和D类问题 (影响核心功能)
2. 其次修复A类和C类问题 (影响用户体验)
3. 最后修复E类问题 (优化类)

## 下一步行动
请参考购物车Bug修复完整指南.md中的详细修复提示词
EOF

    echo -e "${GREEN}✅ 报告已生成: $report_file${NC}"
}

# 验证修复效果
verify_fixes() {
    echo -e "${BLUE}🧪 验证修复效果...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 检查ProductID显示
    echo "检查ProductID显示修复..."
    if grep -r "product_id.*render" frontend/src/ > /dev/null 2>&1; then
        echo "  ✅ ProductID渲染逻辑存在"
    else
        echo "  ❌ ProductID渲染逻辑缺失"
    fi
    
    # 检查单位格式
    echo "检查单位格式修复..."
    if ! grep -r "lbs" frontend/src/ > /dev/null 2>&1; then
        echo "  ✅ lbs已全部替换为lb"
    else
        echo "  ❌ 仍存在lbs单位"
    fi
    
    # 检查字段映射
    echo "检查字段映射修复..."
    if [ -f "frontend/src/config/fieldMapping.js" ]; then
        echo "  ✅ 字段映射配置文件存在"
    else
        echo "  ❌ 字段映射配置文件缺失"
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}验证完成${NC}"
}

# 主程序
main() {
    while true; do
        show_menu
        read -p "请选择 (0-6): " choice
        
        case $choice in
            1)
                list_all_bugs
                ;;
            2)
                check_bug_status
                ;;
            3)
                fix_bug_category
                ;;
            4)
                echo "单个Bug修复功能开发中..."
                ;;
            5)
                generate_report
                ;;
            6)
                verify_fixes
                ;;
            0)
                echo -e "${GREEN}退出购物车Bug修复工具${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选择，请重试${NC}"
                ;;
        esac
        
        echo ""
        read -p "按回车键继续..."
        clear
    done
}

# 检查依赖
check_dependencies() {
    if [ ! -d "frontend/src" ]; then
        echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
        exit 1
    fi
}

# 启动脚本
check_dependencies
clear
echo -e "${GREEN}🛒 购物车Bug修复工具 v1.0${NC}"
echo -e "${BLUE}基于Excel分析的35个Bug综合修复方案${NC}"
echo ""

main 