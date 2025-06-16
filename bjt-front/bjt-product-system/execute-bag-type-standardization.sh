#!/bin/bash

# 🔧 耗材表bag_type字段数据标准化执行脚本
# 解决bag_type字段混合存储code和name_en的问题

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 配置
BACKUP_DIR="/tmp/bag_type_standardization_backup_$(date +%Y%m%d_%H%M%S)"
DOCKER_COMPOSE_FILE="docker/dev/docker-compose.nginx.yml"
SQL_FILE="fix-bag-type-data-standardization.sql"

log_info "🚀 开始耗材表bag_type字段数据标准化"
echo "======================================================"

# 1. 环境检查
log_info "📋 第一步：环境检查"

if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    log_error "Docker Compose文件不存在: $DOCKER_COMPOSE_FILE"
    exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
    log_error "SQL脚本文件不存在: $SQL_FILE"
    exit 1
fi

# 检查数据库连接
log_info "检查数据库连接..."
if ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec mysql mysql -u root -proot -e "USE bjt_product; SELECT 1;" > /dev/null 2>&1; then
    log_error "无法连接到数据库"
    exit 1
fi

log_success "环境检查通过"

# 2. 数据备份
log_info "📦 第二步：数据备份"

mkdir -p "$BACKUP_DIR"
log_info "创建备份目录: $BACKUP_DIR"

# 备份耗材表
log_info "备份wp_bjt_consumables表..."
docker-compose -f "$DOCKER_COMPOSE_FILE" exec mysql mysqldump -u root -proot bjt_product wp_bjt_consumables > "$BACKUP_DIR/wp_bjt_consumables_backup.sql"

# 备份形状表
log_info "备份wp_bjt_shapes表..."
docker-compose -f "$DOCKER_COMPOSE_FILE" exec mysql mysqldump -u root -proot bjt_product wp_bjt_shapes > "$BACKUP_DIR/wp_bjt_shapes_backup.sql"

log_success "数据备份完成: $BACKUP_DIR"

# 3. 显示当前数据状态
log_info "📊 第三步：显示当前数据状态"

echo "当前bag_type分布："
docker-compose -f "$DOCKER_COMPOSE_FILE" exec mysql mysql -u root -proot -e "
USE bjt_product; 
SELECT bag_type, COUNT(*) as count 
FROM wp_bjt_consumables 
WHERE status = 'publish' 
GROUP BY bag_type 
ORDER BY count DESC;
" 2>/dev/null | tail -n +2

# 4. 用户确认
echo
log_warning "即将执行数据标准化操作，这将修改数据库中的数据"
log_info "备份已保存到: $BACKUP_DIR"
echo
read -p "⚠️  确认继续执行？[y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "用户取消操作"
    exit 0
fi

# 5. 执行数据标准化
log_info "🔧 第四步：执行数据标准化"

log_info "执行SQL脚本..."
docker-compose -f "$DOCKER_COMPOSE_FILE" exec mysql mysql -u root -proot bjt_product < "$SQL_FILE"

log_success "数据标准化完成"

# 6. 验证结果
log_info "🧪 第五步：验证结果"

echo "标准化后的bag_type分布："
docker-compose -f "$DOCKER_COMPOSE_FILE" exec mysql mysql -u root -proot -e "
USE bjt_product; 
SELECT bag_type, COUNT(*) as count 
FROM wp_bjt_consumables 
WHERE status = 'publish' 
GROUP BY bag_type 
ORDER BY count DESC;
" 2>/dev/null | tail -n +2

echo
echo "形状配置匹配验证："
docker-compose -f "$DOCKER_COMPOSE_FILE" exec mysql mysql -u root -proot -e "
USE bjt_product;
SELECT 
    c.bag_type,
    COUNT(c.id) as consumable_count,
    CASE 
        WHEN s.code IS NOT NULL THEN '✅ 有对应形状配置'
        ELSE '❌ 缺少形状配置'
    END as shape_config_status
FROM wp_bjt_consumables c
LEFT JOIN wp_bjt_shapes s ON c.bag_type = s.code AND s.status = 'publish'
WHERE c.status = 'publish'
GROUP BY c.bag_type, s.code
ORDER BY consumable_count DESC;
" 2>/dev/null | tail -n +2

# 7. 重启服务
log_info "🔄 第六步：重启WordPress服务"

docker-compose -f "$DOCKER_COMPOSE_FILE" restart wordpress
log_info "等待服务启动..."
sleep 10

# 8. API验证
log_info "🌐 第七步：API验证"

log_info "测试API响应..."
if curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?page=1&per_page=1" > /dev/null; then
    log_success "API响应正常"
    
    # 检查筛选选项
    log_info "检查形状筛选选项..."
    SHAPES_COUNT=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?page=1&per_page=1" | jq '.data.filterOptions.shapes | length' 2>/dev/null || echo "0")
    log_info "形状筛选选项数量: $SHAPES_COUNT"
    
    if [ "$SHAPES_COUNT" -gt 0 ]; then
        log_success "筛选选项生成正常"
    else
        log_warning "筛选选项可能有问题"
    fi
else
    log_warning "API响应异常，请检查服务状态"
fi

# 9. 生成报告
log_info "📋 第八步：生成修复报告"

cat > "$BACKUP_DIR/standardization_report.md" << EOF
# bag_type字段数据标准化报告

## 执行时间
$(date)

## 备份位置
$BACKUP_DIR

## 标准化操作
1. Pillow → MEX
2. Precut Air Pillow → MEY
3. Bubble → MFB
4. paper Bubble → MFB
5. Tube → MFC

## 预期结果
- 所有bag_type值现在都是wp_bjt_shapes表中的code
- 解决了重复显示问题
- 筛选功能应该正常工作

## 回滚方法
如需回滚，请执行：
\`\`\`bash
docker-compose -f $DOCKER_COMPOSE_FILE exec mysql mysql -u root -proot bjt_product < $BACKUP_DIR/wp_bjt_consumables_backup.sql
docker-compose -f $DOCKER_COMPOSE_FILE restart wordpress
\`\`\`

## 验证方法
1. 访问耗材页面
2. 检查形状筛选选项是否正常
3. 测试筛选功能是否工作
4. 确认不再有重复选项
EOF

log_success "修复报告已生成: $BACKUP_DIR/standardization_report.md"

# 10. 完成总结
echo
log_success "🎉 bag_type字段数据标准化完成！"
echo "======================================================"
log_info "📁 备份目录: $BACKUP_DIR"
log_info "📋 详细报告: $BACKUP_DIR/standardization_report.md"
log_info "🌐 请访问前端页面验证筛选功能"
echo
log_info "🔧 如果遇到问题，可以使用备份文件回滚"
echo "回滚命令: docker-compose -f $DOCKER_COMPOSE_FILE exec mysql mysql -u root -proot bjt_product < $BACKUP_DIR/wp_bjt_consumables_backup.sql" 