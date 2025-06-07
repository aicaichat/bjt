#!/bin/bash

# BJT产品管理系统 - 数据验证工具
# 用于验证CSV文件中的数据质量和格式

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 统计信息
TOTAL_ROWS=0
ERROR_COUNT=0
WARNING_COUNT=0

print_header() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}    BJT产品管理系统 - 数据验证工具${NC}"
    echo -e "${BLUE}===========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNING_COUNT++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERROR_COUNT++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查危险字符
check_dangerous_characters() {
    local file=$1
    local line_num=0
    
    print_info "检查危险字符..."
    
    while IFS= read -r line; do
        ((line_num++))
        
        # 检查SQL注入风险字符
        if [[ $line =~ [\'\"\;\-\-] ]]; then
            print_error "第${line_num}行包含SQL危险字符: $line"
        fi
        
        # 检查HTML/XSS风险
        if [[ $line =~ \<.*\> ]]; then
            print_error "第${line_num}行包含HTML标签: $line"
        fi
        
        # 检查脚本代码
        if [[ $line =~ (script|javascript|onclick|onload) ]]; then
            print_error "第${line_num}行包含脚本代码: $line"
        fi
        
    done < "$file"
}

# 检查空格问题
check_whitespace_issues() {
    local file=$1
    local line_num=0
    
    print_info "检查空格问题..."
    
    while IFS= read -r line; do
        ((line_num++))
        
        # 检查首尾空格
        if [[ $line =~ ^[[:space:]] ]] || [[ $line =~ [[:space:]]$ ]]; then
            print_warning "第${line_num}行有首尾空格: $line"
        fi
        
        # 检查多个连续空格
        if [[ $line =~ [[:space:]]{2,} ]]; then
            print_warning "第${line_num}行有多个连续空格: $line"
        fi
        
        # 检查制表符
        if [[ $line =~ $'\t' ]]; then
            print_warning "第${line_num}行包含制表符: $line"
        fi
        
    done < "$file"
}

# 检查价格格式
check_price_format() {
    local file=$1
    local price_column=$2
    local line_num=0
    
    print_info "检查价格格式（第${price_column}列）..."
    
    while IFS=',' read -ra FIELDS; do
        ((line_num++))
        
        if [ $line_num -eq 1 ]; then
            continue  # 跳过标题行
        fi
        
        if [ ${#FIELDS[@]} -ge $price_column ]; then
            local price="${FIELDS[$((price_column-1))]}"
            price=$(echo "$price" | tr -d '"' | tr -d ' ')  # 移除引号和空格
            
            # 检查是否为空
            if [ -z "$price" ]; then
                continue
            fi
            
            # 检查价格格式
            if ! [[ $price =~ ^[0-9]+(\.[0-9]{1,2})?$ ]]; then
                print_error "第${line_num}行价格格式错误: $price"
            fi
            
            # 检查是否包含货币符号
            if [[ $price =~ [￥$€£] ]]; then
                print_error "第${line_num}行价格包含货币符号: $price"
            fi
            
            # 检查是否包含千位分隔符
            if [[ $price =~ , ]]; then
                print_error "第${line_num}行价格包含千位分隔符: $price"
            fi
        fi
        
    done < "$file"
}

# 检查字段长度
check_field_length() {
    local file=$1
    local line_num=0
    
    print_info "检查字段长度..."
    
    while IFS=',' read -ra FIELDS; do
        ((line_num++))
        
        if [ $line_num -eq 1 ]; then
            continue  # 跳过标题行
        fi
        
        # 检查产品名称长度（假设第1列）
        if [ ${#FIELDS[@]} -ge 1 ]; then
            local name="${FIELDS[0]}"
            name=$(echo "$name" | tr -d '"')
            if [ ${#name} -gt 100 ]; then
                print_error "第${line_num}行产品名称过长（${#name}字符）: ${name:0:50}..."
            fi
        fi
        
        # 检查型号长度（假设第2列）
        if [ ${#FIELDS[@]} -ge 2 ]; then
            local model="${FIELDS[1]}"
            model=$(echo "$model" | tr -d '"')
            if [ ${#model} -gt 50 ]; then
                print_error "第${line_num}行型号过长（${#model}字符）: ${model:0:30}..."
            fi
        fi
        
    done < "$file"
}

# 检查电话号码格式
check_phone_format() {
    local file=$1
    local phone_column=$2
    local line_num=0
    
    if [ -z "$phone_column" ]; then
        return
    fi
    
    print_info "检查电话号码格式（第${phone_column}列）..."
    
    while IFS=',' read -ra FIELDS; do
        ((line_num++))
        
        if [ $line_num -eq 1 ]; then
            continue  # 跳过标题行
        fi
        
        if [ ${#FIELDS[@]} -ge $phone_column ]; then
            local phone="${FIELDS[$((phone_column-1))]}"
            phone=$(echo "$phone" | tr -d '"' | tr -d ' ')
            
            if [ -z "$phone" ]; then
                continue
            fi
            
            # 检查电话号码格式
            if ! [[ $phone =~ ^([0-9]{3,4}-[0-9]{7,8}|[0-9]{11})$ ]]; then
                print_error "第${line_num}行电话号码格式错误: $phone"
            fi
        fi
        
    done < "$file"
}

# 检查邮箱格式
check_email_format() {
    local file=$1
    local email_column=$2
    local line_num=0
    
    if [ -z "$email_column" ]; then
        return
    fi
    
    print_info "检查邮箱格式（第${email_column}列）..."
    
    while IFS=',' read -ra FIELDS; do
        ((line_num++))
        
        if [ $line_num -eq 1 ]; then
            continue  # 跳过标题行
        fi
        
        if [ ${#FIELDS[@]} -ge $email_column ]; then
            local email="${FIELDS[$((email_column-1))]}"
            email=$(echo "$email" | tr -d '"' | tr -d ' ')
            
            if [ -z "$email" ]; then
                continue
            fi
            
            # 检查邮箱格式
            if ! [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                print_error "第${line_num}行邮箱格式错误: $email"
            fi
            
            # 检查是否包含中文
            if [[ $email =~ [^[:ascii:]] ]]; then
                print_error "第${line_num}行邮箱包含非ASCII字符: $email"
            fi
        fi
        
    done < "$file"
}

# 检查编码问题
check_encoding() {
    local file=$1
    
    print_info "检查文件编码..."
    
    if ! file "$file" | grep -q "UTF-8"; then
        print_warning "文件可能不是UTF-8编码，建议转换编码"
    fi
    
    # 检查BOM
    if hexdump -C "$file" | head -1 | grep -q "ef bb bf"; then
        print_warning "文件包含UTF-8 BOM，可能导致解析问题"
    fi
}

# 检查URL格式
check_url_format() {
    local file=$1
    local url_column=$2
    local line_num=0
    
    if [ -z "$url_column" ]; then
        return
    fi
    
    print_info "检查URL格式（第${url_column}列）..."
    
    while IFS=',' read -ra FIELDS; do
        ((line_num++))
        
        if [ $line_num -eq 1 ]; then
            continue  # 跳过标题行
        fi
        
        if [ ${#FIELDS[@]} -ge $url_column ]; then
            local url="${FIELDS[$((url_column-1))]}"
            url=$(echo "$url" | tr -d '"' | tr -d ' ')
            
            if [ -z "$url" ]; then
                continue
            fi
            
            # 检查是否为有效的URL格式
            if [[ $url =~ ^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$ ]]; then
                # 完整URL格式正确
                continue
            elif [[ $url =~ ^/[a-zA-Z0-9./_-]*$ ]]; then
                # 相对路径格式正确
                continue
            else
                print_error "第${line_num}行URL格式错误: $url"
            fi
            
            # 检查危险的URL协议
            if [[ $url =~ ^(javascript|data|file|ftp): ]]; then
                print_error "第${line_num}行URL包含危险协议: $url"
            fi
            
            # 检查是否包含中文或特殊字符
            if [[ $url =~ [^[:ascii:]] ]]; then
                print_error "第${line_num}行URL包含非ASCII字符: $url"
            fi
            
            # 检查路径遍历风险
            if [[ $url =~ \.\./.*\.\. ]]; then
                print_error "第${line_num}行URL包含路径遍历风险: $url"
            fi
        fi
        
    done < "$file"
}

# 统计分析
analyze_statistics() {
    local file=$1
    
    print_info "统计分析..."
    
    TOTAL_ROWS=$(wc -l < "$file")
    local data_rows=$((TOTAL_ROWS - 1))
    
    echo "总行数: $TOTAL_ROWS"
    echo "数据行数: $data_rows"
    
    # 统计空行
    local empty_lines=$(grep -c "^$" "$file" || true)
    if [ $empty_lines -gt 0 ]; then
        print_warning "发现 $empty_lines 个空行"
    fi
    
    # 统计字段数量一致性
    local first_line_fields=$(head -1 "$file" | tr ',' '\n' | wc -l)
    echo "期望字段数: $first_line_fields"
    
    local line_num=0
    while IFS=',' read -ra FIELDS; do
        ((line_num++))
        if [ ${#FIELDS[@]} -ne $first_line_fields ]; then
            print_warning "第${line_num}行字段数不一致: 期望${first_line_fields}，实际${#FIELDS[@]}"
        fi
    done < "$file"
}

# 生成修复建议
generate_fix_suggestions() {
    print_info "修复建议:"
    
    if [ $ERROR_COUNT -gt 0 ]; then
        echo "🔧 严重问题修复："
        echo "   1. 移除所有单引号、双引号、分号等危险字符"
        echo "   2. 清理HTML标签和脚本代码"
        echo "   3. 修正价格格式为纯数字"
        echo "   4. 修正电话和邮箱格式"
        echo "   5. 修正URL格式（使用完整URL或以/开头的相对路径）"
        echo "   6. 缩短过长的字段内容"
    fi
    
    if [ $WARNING_COUNT -gt 0 ]; then
        echo "⚠️  警告问题修复："
        echo "   1. 去除首尾空格: sed 's/^[[:space:]]*//g; s/[[:space:]]*$//g' file"
        echo "   2. 合并多个空格: sed 's/[[:space:]]\\+/ /g' file"
        echo "   3. 转换文件编码: iconv -f GBK -t UTF-8 file > new_file"
    fi
    
    echo ""
    echo "🛠️  可以使用以下命令自动清理："
    echo "   ./clean-data.sh your-file.csv"
}

# 主函数
main() {
    print_header
    
    local file=$1
    local price_column=$2
    local phone_column=$3
    local email_column=$4
    local url_column=$5
    
    if [ -z "$file" ]; then
        echo "用法: $0 <CSV文件> [价格列号] [电话列号] [邮箱列号] [URL列号]"
        echo ""
        echo "示例:"
        echo "  $0 products.csv 3           # 验证products.csv，第3列是价格"
        echo "  $0 products.csv 3 5         # 第3列价格，第5列电话"
        echo "  $0 products.csv 3 5 6       # 第3列价格，第5列电话，第6列邮箱"
        echo "  $0 products.csv 3 5 6 7     # 第3列价格，第5列电话，第6列邮箱，第7列URL"
        exit 1
    fi
    
    if [ ! -f "$file" ]; then
        print_error "文件不存在: $file"
        exit 1
    fi
    
    print_info "验证文件: $file"
    echo ""
    
    # 执行各种检查
    check_encoding "$file"
    check_dangerous_characters "$file"
    check_whitespace_issues "$file"
    check_field_length "$file"
    
    if [ -n "$price_column" ]; then
        check_price_format "$file" "$price_column"
    fi
    
    if [ -n "$phone_column" ]; then
        check_phone_format "$file" "$phone_column"
    fi
    
    if [ -n "$email_column" ]; then
        check_email_format "$file" "$email_column"
    fi
    
    if [ -n "$url_column" ]; then
        check_url_format "$file" "$url_column"
    fi
    
    analyze_statistics "$file"
    
    echo ""
    echo "==========================================="
    echo "验证结果："
    if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
        print_success "数据验证通过！没有发现问题。"
    else
        echo -e "${RED}发现 $ERROR_COUNT 个错误${NC}"
        echo -e "${YELLOW}发现 $WARNING_COUNT 个警告${NC}"
    fi
    echo "==========================================="
    
    if [ $ERROR_COUNT -gt 0 ] || [ $WARNING_COUNT -gt 0 ]; then
        echo ""
        generate_fix_suggestions
    fi
    
    # 设置退出码
    if [ $ERROR_COUNT -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# 执行主函数
main "$@" 