#!/bin/bash

# ============================================================================
# BJT产品管理系统 - 部署前文件验证脚本
# 目标: 确保所有必要的文件都存在且格式正确
# 版本: v1.0
# ============================================================================

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 验证计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check_file() {
    local file_path="$1"
    local description="$2"
    local required="$3"  # true/false
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file_path" ]; then
        log_success "$description: $file_path"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        if [ "$required" = "true" ]; then
            log_error "$description: $file_path (必需文件缺失)"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        else
            log_warning "$description: $file_path (可选文件缺失)"
            return 0
        fi
    fi
}

check_sql_syntax() {
    local file_path="$1"
    local description="$2"
    
    if [ -f "$file_path" ]; then
        # 基本SQL语法检查
        if grep -q "START TRANSACTION\|BEGIN" "$file_path" && grep -q "COMMIT" "$file_path"; then
            log_success "$description: SQL事务结构正确"
        else
            log_warning "$description: 缺少事务控制语句"
        fi
        
        # 检查是否有明显的语法错误
        if grep -q ";" "$file_path"; then
            log_success "$description: SQL语句格式正确"
        else
            log_warning "$description: 可能缺少SQL语句终止符"
        fi
    fi
}

echo "============================================================================"
echo "  BJT产品管理系统 - 部署前文件验证"
echo "  时间: $(date)"
echo "============================================================================"
echo

log_info "🔍 开始验证部署所需文件..."

# ============================================================================
# 1. 验证基础数据库文件
# ============================================================================
echo
log_info "📁 验证基础数据库文件..."

check_file "generated_sql_imports/init.sql" "数据库初始化脚本" "true"
check_file "generated_sql_imports/_耗材.sql" "耗材数据文件" "true"

# ============================================================================
# 2. 验证修复脚本
# ============================================================================
echo
log_info "🔧 验证数据修复脚本..."

check_file "scripts/fix-bag-type-data-consistency.sql" "bag_type数据一致性修复脚本" "true"
check_file "scripts/fix-consumables-mapping.sh" "耗材字段映射修复脚本" "false"
check_file "scripts/fix-consumables-filter-options.sh" "筛选选项修复脚本" "false"

# 验证SQL脚本语法
if [ -f "scripts/fix-bag-type-data-consistency.sql" ]; then
    check_sql_syntax "scripts/fix-bag-type-data-consistency.sql" "bag_type修复脚本语法"
fi

# ============================================================================
# 3. 验证部署脚本
# ============================================================================
echo
log_info "🚀 验证部署脚本..."

check_file "deploy-production-with-bag-type-fix.sh" "生产环境部署脚本" "true"
check_file "scripts/validate-deployment-files.sh" "部署前验证脚本" "true"

# ============================================================================
# 4. 验证前端构建文件
# ============================================================================
echo
log_info "🌐 验证前端文件..."

check_file "frontend/package.json" "前端包配置文件" "true"
check_file "frontend/src/pages/Consumables/index.tsx" "耗材页面主文件" "true"
check_file "frontend/vite.config.ts" "Vite配置文件" "false"

# ============================================================================
# 5. 验证后端文件
# ============================================================================
echo
log_info "⚙️ 验证后端文件..."

check_file "plugins/bjt-core-entities/controllers/class-consumable-controller.php" "耗材控制器" "true"
check_file "plugins/bjt-core-entities/controllers/class-dictionary-controller.php" "字典控制器" "false"

# ============================================================================
# 6. 验证配置文件
# ============================================================================
echo
log_info "📋 验证配置文件..."

check_file ".env" "环境配置文件" "false"
check_file "docker-compose.yml" "Docker配置文件" "false"

# ============================================================================
# 7. 验证文档文件
# ============================================================================
echo
log_info "📚 验证文档文件..."

check_file "TOOLTIP_LOADING_OPTIMIZATION_SUMMARY.md" "Tooltip优化文档" "false"
check_file "CONSUMABLES_QUANTITY_SELECTOR_FIX_SUMMARY.md" "数量选择器修复文档" "false"

# ============================================================================
# 8. 特殊检查
# ============================================================================
echo
log_info "🔍 执行特殊检查..."

# 检查bag_type修复脚本的关键内容
if [ -f "scripts/fix-bag-type-data-consistency.sql" ]; then
    if grep -q "UPDATE wp_bjt_consumables" "scripts/fix-bag-type-data-consistency.sql"; then
        log_success "bag_type修复脚本包含必要的UPDATE语句"
    else
        log_error "bag_type修复脚本缺少UPDATE语句"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    if grep -q "wp_bjt_shapes" "scripts/fix-bag-type-data-consistency.sql"; then
        log_success "bag_type修复脚本包含shapes表更新"
    else
        log_warning "bag_type修复脚本可能缺少shapes表更新"
    fi
fi

# 检查前端耗材页面的关键修复
if [ -f "frontend/src/pages/Consumables/index.tsx" ]; then
    if grep -q "tooltipDataCache" "frontend/src/pages/Consumables/index.tsx"; then
        log_success "前端包含tooltip缓存优化"
    else
        log_warning "前端可能缺少tooltip缓存优化"
    fi
    
    if grep -q "destroyTooltipOnHide.*false" "frontend/src/pages/Consumables/index.tsx"; then
        log_success "前端包含tooltip配置优化"
    else
        log_warning "前端可能缺少tooltip配置优化"
    fi
fi

# ============================================================================
# 9. 生成验证报告
# ============================================================================
echo
echo "============================================================================"
echo "  验证结果汇总"
echo "============================================================================"

echo "📊 检查统计:"
echo "   总检查项: $TOTAL_CHECKS"
echo "   通过检查: $PASSED_CHECKS"
echo "   失败检查: $FAILED_CHECKS"

if [ $FAILED_CHECKS -eq 0 ]; then
    log_success "🎉 所有必需文件验证通过！可以继续部署。"
    echo
    echo "📋 部署建议:"
    echo "   1. 确保数据库连接正常"
    echo "   2. 备份现有数据库"
    echo "   3. 在测试环境先验证修复脚本"
    echo "   4. 监控部署过程中的日志"
    echo
    exit 0
else
    log_error "❌ 发现 $FAILED_CHECKS 个必需文件缺失，请先解决这些问题。"
    echo
    echo "🔧 解决建议:"
    echo "   1. 检查上述失败的文件路径"
    echo "   2. 确保所有必需的脚本都已创建"
    echo "   3. 验证文件权限和路径正确性"
    echo "   4. 重新运行此验证脚本"
    echo
    exit 1
fi

# ============================================================================
# 10. 创建验证报告文件
# ============================================================================
REPORT_FILE="deployment-validation-report-$(date +%Y%m%d_%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
BJT产品管理系统 - 部署前验证报告
生成时间: $(date)

验证统计:
- 总检查项: $TOTAL_CHECKS
- 通过检查: $PASSED_CHECKS  
- 失败检查: $FAILED_CHECKS

验证状态: $([ $FAILED_CHECKS -eq 0 ] && echo "✅ 通过" || echo "❌ 失败")

详细检查结果请查看控制台输出。

下一步操作:
$([ $FAILED_CHECKS -eq 0 ] && echo "可以继续执行部署脚本" || echo "请先解决失败的检查项")
EOF

log_info "📄 验证报告已保存到: $REPORT_FILE" 