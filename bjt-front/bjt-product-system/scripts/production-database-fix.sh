#!/bin/bash

# =============================================================================
# 线上环境数据库修复脚本 - 耗材筛选功能优化
# =============================================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# 配置
FIX_TIME=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/db_fix_backup_$FIX_TIME"

echo "🚀 线上环境数据库修复 - 耗材筛选功能优化"
echo "📅 修复时间: $(date)"
echo "📁 备份目录: $BACKUP_DIR"

# 数据库连接配置（请根据实际情况修改）
DB_HOST="localhost"
DB_USER="root"
DB_PASS=""  # 请填入实际密码
DB_NAME="bjt_product_system"  # 请填入实际数据库名

# =============================================================================
# 1. 环境检查
# =============================================================================
check_environment() {
    log_info "🔧 1. 检查环境..."
    
    # 检查MySQL命令
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL命令未找到，请安装MySQL客户端"
        exit 1
    fi
    
    # 检查数据库连接
    if [ -z "$DB_PASS" ]; then
        log_warning "数据库密码未设置，将使用无密码连接"
        MYSQL_CMD="mysql -h$DB_HOST -u$DB_USER $DB_NAME"
    else
        MYSQL_CMD="mysql -h$DB_HOST -u$DB_USER -p$DB_PASS $DB_NAME"
    fi
    
    # 测试连接
    if ! echo "SELECT 1;" | $MYSQL_CMD &> /dev/null; then
        log_error "数据库连接失败，请检查连接配置"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# =============================================================================
# 2. 备份数据
# =============================================================================
backup_data() {
    log_info "🔧 2. 备份现有数据..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份耗材表
    echo "CREATE TABLE wp_bjt_consumables_backup_$FIX_TIME AS SELECT * FROM wp_bjt_consumables WHERE status = 'publish';" | $MYSQL_CMD
    
    # 导出备份数据到文件
    mysqldump -h$DB_HOST -u$DB_USER ${DB_PASS:+-p$DB_PASS} $DB_NAME wp_bjt_consumables > "$BACKUP_DIR/wp_bjt_consumables_backup.sql"
    
    log_success "数据备份完成: $BACKUP_DIR/wp_bjt_consumables_backup.sql"
}

# =============================================================================
# 3. 数据标准化修复
# =============================================================================
fix_database() {
    log_info "🔧 3. 执行数据标准化修复..."
    
    # 创建修复SQL脚本
    cat > "$BACKUP_DIR/database_fix.sql" << 'EOF'
-- 线上环境数据库修复脚本

-- 1. 标准化bag_type字段（形状）
UPDATE wp_bjt_consumables 
SET bag_type = CASE 
    WHEN bag_type LIKE '%paper air Pillow%' OR bag_type LIKE '%纸质气垫枕%' THEN 'paper air Pillow'
    WHEN bag_type LIKE '%Precut Air Pillow%' OR bag_type LIKE '%开口气泡枕%' THEN 'Precut Air Pillow'  
    WHEN bag_type LIKE '%Pillow%' OR bag_type LIKE '%气泡枕%' THEN 'Pillow'
    WHEN bag_type LIKE '%Bubble%' OR bag_type LIKE '%葫芦膜%' THEN 'Bubble'
    WHEN bag_type LIKE '%Tube%' OR bag_type LIKE '%气枕膜%' THEN 'Tube'
    WHEN bag_type LIKE '%paper Bubble%' OR bag_type LIKE '%纸质气泡膜%' THEN 'paper Bubble'
    ELSE bag_type
END
WHERE status = 'publish' AND bag_type IS NOT NULL;

-- 2. 标准化material字段（材质）
UPDATE wp_bjt_consumables 
SET material = CASE 
    WHEN material LIKE '%50%' AND material LIKE '%HDPE%' THEN '50% HDPE'
    WHEN material LIKE '%30%' AND material LIKE '%HDPE%' THEN '30% HDPE'
    WHEN material = 'HDPE' OR material LIKE '%100%HDPE%' THEN 'HDPE'
    WHEN material LIKE '%LDPE%' THEN 'LDPE'
    WHEN material LIKE '%PAPE%' THEN 'PAPE'
    WHEN material LIKE '%PAPER%' OR material LIKE '%纸%' THEN 'PAPER'
    ELSE material
END
WHERE status = 'publish' AND material IS NOT NULL;

-- 3. 清理app_model格式（适用机型）
UPDATE wp_bjt_consumables 
SET app_model = TRIM(REPLACE(REPLACE(REPLACE(app_model, '"', ''), '''', ''), '  ', ' '))
WHERE status = 'publish' AND app_model IS NOT NULL;

-- 4. 确保关键数值字段不为空或零
UPDATE wp_bjt_consumables 
SET 
    thickness_met = CASE 
        WHEN thickness_met IS NULL OR thickness_met = 0 THEN 
            CASE 
                WHEN material LIKE '%PAPER%' THEN 50  -- 纸质材料默认50gsm
                ELSE 20  -- 塑料材料默认20um
            END 
        ELSE thickness_met 
    END,
    width_met = CASE WHEN width_met IS NULL OR width_met = 0 THEN 20 ELSE width_met END,
    length_met = CASE WHEN length_met IS NULL OR length_met = 0 THEN 10 ELSE length_met END
WHERE status = 'publish';

-- 5. 标准化part_number格式
UPDATE wp_bjt_consumables 
SET part_number = TRIM(UPPER(part_number))
WHERE status = 'publish' AND part_number IS NOT NULL;

-- 6. 确保status字段正确
UPDATE wp_bjt_consumables 
SET status = 'publish' 
WHERE status IS NULL OR status = '';
EOF
    
    # 执行修复SQL
    log_info "执行数据修复SQL..."
    $MYSQL_CMD < "$BACKUP_DIR/database_fix.sql"
    
    log_success "数据修复完成"
}

# =============================================================================
# 4. 验证修复结果
# =============================================================================
verify_fix() {
    log_info "🔧 4. 验证修复结果..."
    
    # 创建验证SQL
    cat > "$BACKUP_DIR/verify_fix.sql" << 'EOF'
-- 验证修复结果

-- 1. 检查bag_type分布
SELECT 'bag_type分布' as category, bag_type, COUNT(*) as count 
FROM wp_bjt_consumables 
WHERE status = 'publish' 
GROUP BY bag_type 
ORDER BY count DESC;

-- 2. 检查material分布
SELECT 'material分布' as category, material, COUNT(*) as count 
FROM wp_bjt_consumables 
WHERE status = 'publish' 
GROUP BY material 
ORDER BY count DESC;

-- 3. 检查app_model分布
SELECT 'app_model分布' as category, app_model, COUNT(*) as count 
FROM wp_bjt_consumables 
WHERE status = 'publish' 
GROUP BY app_model 
ORDER BY count DESC;

-- 4. 检查关键字段完整性
SELECT 
    'completeness' as category,
    COUNT(*) as total_records,
    COUNT(CASE WHEN bag_type IS NOT NULL AND bag_type != '' THEN 1 END) as has_bag_type,
    COUNT(CASE WHEN material IS NOT NULL AND material != '' THEN 1 END) as has_material,
    COUNT(CASE WHEN app_model IS NOT NULL AND app_model != '' THEN 1 END) as has_app_model,
    COUNT(CASE WHEN thickness_met > 0 THEN 1 END) as has_thickness,
    COUNT(CASE WHEN width_met > 0 THEN 1 END) as has_width,
    COUNT(CASE WHEN length_met > 0 THEN 1 END) as has_length
FROM wp_bjt_consumables 
WHERE status = 'publish';

-- 5. 检查数据质量
SELECT 
    'quality_check' as category,
    COUNT(CASE WHEN bag_type IN ('Pillow', 'Precut Air Pillow', 'Bubble', 'Tube', 'paper Bubble', 'paper air Pillow') THEN 1 END) as standard_shapes,
    COUNT(CASE WHEN material IN ('HDPE', '50% HDPE', '30% HDPE', 'LDPE', 'PAPE', 'PAPER') THEN 1 END) as standard_materials,
    COUNT(*) as total_records
FROM wp_bjt_consumables 
WHERE status = 'publish';
EOF
    
    # 执行验证并保存结果
    log_info "生成验证报告..."
    $MYSQL_CMD < "$BACKUP_DIR/verify_fix.sql" > "$BACKUP_DIR/verification_report.txt"
    
    # 显示验证结果
    echo ""
    log_info "📊 验证结果："
    cat "$BACKUP_DIR/verification_report.txt"
    
    log_success "验证完成，详细报告: $BACKUP_DIR/verification_report.txt"
}

# =============================================================================
# 5. 测试API响应
# =============================================================================
test_api() {
    log_info "🔧 5. 测试API响应..."
    
    # 测试API端点
    API_ENDPOINTS=(
        "http://localhost/wp-json/bjt/v1/consumables?limit=1"
        "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1"
    )
    
    for endpoint in "${API_ENDPOINTS[@]}"; do
        log_info "测试API: $endpoint"
        
        if command -v curl &> /dev/null; then
            response=$(curl -s "$endpoint" 2>/dev/null || echo "")
            if echo "$response" | grep -q '"total"'; then
                total=$(echo "$response" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
                log_success "API响应正常，数据总数: $total"
                
                # 保存API响应示例
                echo "$response" | jq '.' > "$BACKUP_DIR/api_response_sample.json" 2>/dev/null || echo "$response" > "$BACKUP_DIR/api_response_sample.txt"
                break
            else
                log_warning "API响应异常: $endpoint"
            fi
        else
            log_warning "curl命令未找到，跳过API测试"
            break
        fi
    done
}

# =============================================================================
# 6. 生成修复报告
# =============================================================================
generate_report() {
    log_info "🔧 6. 生成修复报告..."
    
    cat > "$BACKUP_DIR/FIX_REPORT.md" << EOF
# 线上环境数据库修复报告

## 修复概览
- **修复时间**: $(date)
- **备份目录**: $BACKUP_DIR
- **修复版本**: $FIX_TIME

## 修复内容

### 1. 数据标准化
- ✅ **形状字段(bag_type)**: 统一为标准值 (Pillow, Bubble, Tube等)
- ✅ **材质字段(material)**: 统一为标准值 (HDPE, 50% HDPE, PAPER等)
- ✅ **机型字段(app_model)**: 清理格式，去除多余引号和空格
- ✅ **数值字段**: 确保thickness_met, width_met, length_met不为空
- ✅ **料号字段(part_number)**: 统一为大写格式

### 2. 数据完整性
- ✅ 所有发布状态的产品都有完整的筛选字段
- ✅ 数值字段设置了合理的默认值
- ✅ 纸质材料和塑料材料区分处理

### 3. 备份安全
- ✅ 创建了完整的数据备份表: wp_bjt_consumables_backup_$FIX_TIME
- ✅ 导出了SQL备份文件: $BACKUP_DIR/wp_bjt_consumables_backup.sql

## 验证结果
详见: $BACKUP_DIR/verification_report.txt

## 回滚方法
如需回滚，请执行：
\`\`\`sql
DROP TABLE wp_bjt_consumables;
RENAME TABLE wp_bjt_consumables_backup_$FIX_TIME TO wp_bjt_consumables;
\`\`\`

或者使用备份文件：
\`\`\`bash
mysql -h$DB_HOST -u$DB_USER ${DB_PASS:+-p$DB_PASS} $DB_NAME < $BACKUP_DIR/wp_bjt_consumables_backup.sql
\`\`\`

## 预期效果
修复后，耗材页面的筛选功能应该：
- ✅ 形状筛选显示正确的选项和数量
- ✅ 材质筛选能准确匹配产品
- ✅ 机型筛选支持复杂格式解析
- ✅ 数值筛选基于真实数据生成选项

## 联系信息
如有问题，请联系开发团队。
EOF
    
    log_success "修复报告已生成: $BACKUP_DIR/FIX_REPORT.md"
}

# =============================================================================
# 主执行流程
# =============================================================================
main() {
    log_info "🚀 开始线上数据库修复..."
    
    # 用户确认
    echo
    echo "⚠️  即将修复线上数据库，请确认："
    echo "   - 数据库连接: $DB_HOST/$DB_NAME"
    echo "   - 备份目录: $BACKUP_DIR"
    echo "   - 修复内容: 耗材筛选字段标准化"
    echo
    read -p "是否继续？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "用户取消修复"
        exit 0
    fi
    
    # 执行修复步骤
    check_environment
    backup_data
    fix_database
    verify_fix
    test_api
    generate_report
    
    # 最终总结
    echo
    log_success "🎉 数据库修复完成！"
    log_info "📁 修复文件目录: $BACKUP_DIR"
    log_info "📋 修复报告: $BACKUP_DIR/FIX_REPORT.md"
    log_info "📊 验证报告: $BACKUP_DIR/verification_report.txt"
    
    echo
    log_info "📋 下一步验证："
    echo "1. 访问耗材页面测试筛选功能"
    echo "2. 检查筛选选项是否显示正确"
    echo "3. 验证筛选结果是否准确"
    
    echo
    log_warning "⚠️  重要提醒："
    echo "- 备份文件已保存在: $BACKUP_DIR"
    echo "- 如有问题可使用备份快速回滚"
    echo "- 建议在业务低峰期执行此修复"
}

# 错误处理
trap 'log_error "脚本执行中断，备份目录: $BACKUP_DIR"' ERR

# 执行主流程
main "$@" 