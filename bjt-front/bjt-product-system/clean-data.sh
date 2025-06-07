#!/bin/bash

# BJT产品管理系统 - 数据清理工具
# 自动清理CSV文件中的常见问题

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 清理CSV文件中的常见问题
clean_csv_data() {
    local file=$1
    local backup_file="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ ! -f "$file" ]; then
        print_error "文件不存在: $file"
        exit 1
    fi
    
    print_info "开始清理数据文件: $file"
    
    # 创建备份
    cp "$file" "$backup_file"
    print_info "已创建备份文件: $backup_file"
    
    # 创建临时文件
    local temp_file=$(mktemp)
    
    # 1. 去除首尾空格
    print_info "去除首尾空格..."
    sed 's/^[[:space:]]*//g; s/[[:space:]]*$//g' "$file" > "$temp_file"
    cp "$temp_file" "$file"
    
    # 2. 替换多个连续空格为单个空格
    print_info "合并多个连续空格..."
    sed 's/[[:space:]]\+/ /g' "$file" > "$temp_file"
    cp "$temp_file" "$file"
    
    # 3. 移除危险字符（谨慎操作）
    print_info "移除危险字符..."
    # 移除单引号、双引号、分号
    sed "s/['\";]//g" "$file" > "$temp_file"
    cp "$temp_file" "$file"
    
    # 4. 移除HTML标签
    print_info "移除HTML标签..."
    sed 's/<[^>]*>//g' "$file" > "$temp_file"
    cp "$temp_file" "$file"
    
    # 5. 替换全角字符为半角字符（除中文外）
    print_info "转换全角标点为半角..."
    sed 's/，/,/g; s/。/./g; s/：/:/g; s/；/;/g' "$file" > "$temp_file"
    cp "$temp_file" "$file"
    
    # 6. 移除空行
    print_info "移除空行..."
    sed '/^$/d' "$file" > "$temp_file"
    cp "$temp_file" "$file"
    
    # 7. 确保UTF-8编码（如果iconv可用）
    if command -v iconv >/dev/null 2>&1; then
        print_info "转换为UTF-8编码..."
        iconv -f UTF-8 -t UTF-8 "$file" > "$temp_file" 2>/dev/null || cp "$file" "$temp_file"
        cp "$temp_file" "$file"
    fi
    
    # 清理临时文件
    rm -f "$temp_file"
    
    print_success "数据清理完成！"
    echo "原始文件: $file"
    echo "备份文件: $backup_file"
    
    # 显示清理前后的对比
    local original_lines=$(wc -l < "$backup_file")
    local cleaned_lines=$(wc -l < "$file")
    
    echo ""
    echo "清理统计:"
    echo "原始行数: $original_lines"
    echo "清理后行数: $cleaned_lines"
    echo "删除行数: $((original_lines - cleaned_lines))"
    
    if [ $cleaned_lines -lt $original_lines ]; then
        print_warning "删除了 $((original_lines - cleaned_lines)) 行数据，请检查是否符合预期"
    fi
}

# 验证清理结果
validate_cleaned_data() {
    local file=$1
    
    print_info "验证清理结果..."
    
    # 检查是否还有危险字符
    if grep -q "['\";]" "$file"; then
        print_warning "仍然存在危险字符，可能需要手动处理"
    fi
    
    # 检查是否还有HTML标签
    if grep -q "<.*>" "$file"; then
        print_warning "仍然存在HTML标签，可能需要手动处理"
    fi
    
    # 检查首尾空格
    if grep -q "^[[:space:]]" "$file" || grep -q "[[:space:]]$" "$file"; then
        print_warning "仍然存在首尾空格，可能需要进一步处理"
    fi
    
    print_success "清理验证完成"
}

# 显示帮助信息
show_help() {
    echo "BJT产品管理系统 - 数据清理工具"
    echo ""
    echo "用法:"
    echo "  $0 <CSV文件>              # 清理指定的CSV文件"
    echo "  $0 --help                 # 显示帮助信息"
    echo ""
    echo "清理功能:"
    echo "  ✅ 去除首尾空格"
    echo "  ✅ 合并多个连续空格"
    echo "  ✅ 移除危险字符 (', \", ;)"
    echo "  ✅ 移除HTML标签"
    echo "  ✅ 转换全角标点为半角"
    echo "  ✅ 移除空行"
    echo "  ✅ 确保UTF-8编码"
    echo ""
    echo "示例:"
    echo "  $0 products.csv           # 清理products.csv文件"
    echo ""
    echo "注意:"
    echo "  - 原始文件会被自动备份"
    echo "  - 清理后建议使用 validate-data.sh 进行验证"
    echo "  - 请在清理前确认数据已备份"
}

# 主函数
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    case "$1" in
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            clean_csv_data "$1"
            validate_cleaned_data "$1"
            
            echo ""
            print_info "建议清理后进行数据验证:"
            echo "  ./validate-data.sh $1"
            ;;
    esac
}

# 执行主函数
main "$@" 