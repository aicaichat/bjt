#!/bin/bash

# 产品状态问题快速修复工具
# 使用方法: ./tools/quick-fix-status.sh [fix-type]
# fix-type: api-params|mock-data|typescript|all

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

log_header() {
    echo -e "\n${BLUE}🔧 $1${NC}"
    echo "----------------------------------------"
}

# 备份文件
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "$file.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "已备份: $file"
    fi
}

# 修复API参数
fix_api_parameters() {
    log_header "修复API调用中缺少的status参数"
    
    local files=(
        "frontend/src/pages/Machines/index.tsx"
        "frontend/index.tsx"
        "frontend/src/utils/authTest.ts"
        "frontend/src/tests/real-api/pages/machines-page.real-api.test.ts"
    )
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            log_warning "文件不存在: $file"
            continue
        fi
        
        log_info "检查文件: $file"
        
        # 备份文件
        backup_file "$file"
        
        # 检查并修复machineparts API调用
        if grep -q "machineparts" "$file" && ! grep -q "machineparts.*status=publish" "$file"; then
            log_info "修复 machineparts API调用..."
            
            # 替换模式：在machineparts URL中添加status=publish参数
            sed -i.tmp -E 's|(/machineparts\?[^"]*)|&status=publish|g; s|(/machineparts)"|\1?status=publish"|g' "$file"
            
            # 清理可能的重复参数
            sed -i.tmp -E 's|status=publish&status=publish|status=publish|g' "$file"
            
            rm -f "$file.tmp"
            log_success "✓ 已修复 $file 中的 machineparts API调用"
        fi
        
        # 检查其他API调用
        for api in "accessories" "consumables"; do
            if grep -q "$api" "$file" && ! grep -q "$api.*status=publish" "$file"; then
                log_info "修复 $api API调用..."
                sed -i.tmp -E "s|(/$api\\?[^\"]*)|&status=publish|g; s|(/$api)\"|\\1?status=publish\"|g" "$file"
                sed -i.tmp -E 's|status=publish&status=publish|status=publish|g' "$file"
                rm -f "$file.tmp"
                log_success "✓ 已修复 $file 中的 $api API调用"
            fi
        done
    done
}

# 修复TypeScript类型定义
fix_typescript_types() {
    log_header "检查并修复TypeScript类型定义"
    
    local types_file="frontend/src/types/machines.ts"
    
    if [ ! -f "$types_file" ]; then
        log_error "类型定义文件不存在: $types_file"
        return 1
    fi
    
    backup_file "$types_file"
    
    # 检查是否已有status字段
    if grep -q "status.*string" "$types_file"; then
        log_success "✓ 类型定义已包含status字段"
    else
        log_info "添加status字段到类型定义..."
        
        # 在接口中添加status字段
        sed -i.tmp '/created_at.*string/a\
    status?: string;' "$types_file"
        
        rm -f "$types_file.tmp"
        log_success "✓ 已添加status字段到类型定义"
    fi
}

# 修复Mock数据
fix_mock_data() {
    log_header "检查并修复Mock数据状态"
    
    # 查找包含status字段的JSON文件
    local mock_files=$(find frontend/src -name "*.json" -exec grep -l "status" {} \; 2>/dev/null)
    
    if [ -z "$mock_files" ]; then
        log_info "未发现包含status字段的Mock数据文件"
        return 0
    fi
    
    echo "$mock_files" | while read -r file; do
        if [ -f "$file" ]; then
            log_info "检查Mock数据文件: $file"
            backup_file "$file"
            
            # 将所有draft状态改为publish
            if grep -q '"status".*"draft"' "$file"; then
                sed -i.tmp 's/"status".*"draft"/"status": "publish"/g' "$file"
                rm -f "$file.tmp"
                log_success "✓ 已修复 $file 中的draft状态"
            else
                log_info "✓ $file 状态设置正确"
            fi
        fi
    done
}

# 验证修复结果
verify_fixes() {
    log_header "验证修复结果"
    
    log_info "运行状态检查工具验证修复..."
    if [ -f "tools/product-status-checker.sh" ]; then
        ./tools/product-status-checker.sh frontend
    else
        log_warning "状态检查工具不存在，请手动验证"
    fi
}

# 显示修复建议
show_manual_steps() {
    log_header "需要手动检查的项目"
    
    echo "以下项目需要手动验证和修复："
    echo ""
    echo "1. 🗄️  数据库状态检查"
    echo "   - 运行SQL检查各表状态分布"
    echo "   - 确保测试数据标记为draft"
    echo ""
    echo "2. 🌐 API服务检查"
    echo "   - 启动后端服务"
    echo "   - 测试API响应是否正确过滤"
    echo ""
    echo "3. 🧪 功能测试"
    echo "   - 启动前端服务: cd frontend && npm run dev"
    echo "   - 验证页面不显示草稿数据"
    echo "   - 测试产品线切换功能"
    echo ""
    echo "4. 📚 文档更新"
    echo "   - 更新API文档说明status参数"
    echo "   - 记录修复日志"
}

# 主函数
main() {
    local fix_type="${1:-all}"
    
    echo -e "${BLUE}🚀 产品状态问题快速修复工具${NC}"
    echo "========================================"
    echo "修复类型: $fix_type"
    echo "时间: $(date)"
    echo ""
    
    # 检查工作目录
    if [ ! -d "frontend/src" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    case $fix_type in
        "api-params"|"all")
            fix_api_parameters
            ;;&
        "typescript"|"all")
            fix_typescript_types
            ;;&
        "mock-data"|"all")
            fix_mock_data
            ;;&
        "all")
            verify_fixes
            show_manual_steps
            ;;
        *)
            echo "使用方法: $0 [all|api-params|typescript|mock-data]"
            echo ""
            echo "修复类型:"
            echo "  all        - 执行所有自动修复（默认）"
            echo "  api-params - 只修复API参数问题"
            echo "  typescript - 只修复TypeScript类型"
            echo "  mock-data  - 只修复Mock数据状态"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 自动修复完成！${NC}"
    echo -e "${YELLOW}💡 请参考上述手动检查项目完成剩余修复${NC}"
    echo -e "${BLUE}📖 详细指南: docs/product-status-checklist.md${NC}"
}

# 脚本入口
main "$@" 