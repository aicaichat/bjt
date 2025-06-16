#!/bin/bash

# =============================================================================
# 远程服务器数据库修复脚本 - 通过Docker连接
# 适用于远程生产环境
# =============================================================================

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

# =============================================================================
# 配置参数
# =============================================================================

# Docker容器配置（根据您的实际环境调整）
MYSQL_CONTAINER_NAME="dev-mysql-1"  # 或者其他容器名
MYSQL_ROOT_PASSWORD="root"          # 根据实际密码调整
MYSQL_DATABASE="bjt_product"        # 数据库名
MYSQL_USER="root"                   # 用户名

# 备份配置
BACKUP_DIR="/tmp/bjt_remote_backup_$(date +%Y%m%d_%H%M%S)"
SQL_FILE="scripts/remote-database-fix.sql"

# =============================================================================
# 环境检查函数
# =============================================================================

check_docker_environment() {
    log_info "检查Docker环境..."
    
    # 检查Docker是否安装
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装或不在PATH中"
        exit 1
    fi
    
    # 检查Docker服务是否运行
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行"
        exit 1
    fi
    
    log_success "Docker环境检查通过"
}

find_mysql_container() {
    log_info "查找MySQL容器..."
    
    # 尝试多种可能的容器名
    POSSIBLE_NAMES=(
        "dev-mysql-1"
        "mysql"
        "bjt-mysql"
        "wordpress-mysql"
        "db"
        "database"
    )
    
    for name in "${POSSIBLE_NAMES[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^${name}$"; then
            MYSQL_CONTAINER_NAME="$name"
            log_success "找到MySQL容器: $MYSQL_CONTAINER_NAME"
            return 0
        fi
    done
    
    # 如果没找到，列出所有运行的容器
    log_warning "未找到标准MySQL容器名，当前运行的容器："
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    
    echo
    read -p "请输入MySQL容器名称: " MYSQL_CONTAINER_NAME
    
    if [ -z "$MYSQL_CONTAINER_NAME" ]; then
        log_error "容器名称不能为空"
        exit 1
    fi
}

test_mysql_connection() {
    log_info "测试MySQL连接..."
    
    # 测试连接
    if docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        log_success "MySQL连接测试成功"
    else
        log_error "MySQL连接失败"
        log_info "尝试其他连接参数..."
        
        # 尝试不同的用户名和密码组合
        echo "请选择连接方式："
        echo "1) root/root (默认)"
        echo "2) root/password"
        echo "3) 自定义用户名密码"
        read -p "选择 [1-3]: " choice
        
        case $choice in
            1)
                MYSQL_USER="root"
                MYSQL_ROOT_PASSWORD="root"
                ;;
            2)
                MYSQL_USER="root"
                MYSQL_ROOT_PASSWORD="password"
                ;;
            3)
                read -p "用户名: " MYSQL_USER
                read -s -p "密码: " MYSQL_ROOT_PASSWORD
                echo
                ;;
            *)
                log_error "无效选择"
                exit 1
                ;;
        esac
        
        # 再次测试连接
        if docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" &> /dev/null; then
            log_success "MySQL连接测试成功"
        else
            log_error "MySQL连接仍然失败，请检查容器状态和连接参数"
            exit 1
        fi
    fi
}

# =============================================================================
# 数据库操作函数
# =============================================================================

create_backup() {
    log_info "创建数据库备份..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份整个数据库
    docker exec "$MYSQL_CONTAINER_NAME" mysqldump -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" > "$BACKUP_DIR/full_backup.sql"
    
    # 备份耗材表
    docker exec "$MYSQL_CONTAINER_NAME" mysqldump -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" wp_bjt_consumables > "$BACKUP_DIR/consumables_backup.sql"
    
    log_success "备份完成: $BACKUP_DIR"
}

check_current_data() {
    log_info "检查当前数据状态..."
    
    # 检查耗材数量
    TOTAL_COUNT=$(docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -D"$MYSQL_DATABASE" -se "SELECT COUNT(*) FROM wp_bjt_consumables WHERE status = 'publish';")
    
    log_info "当前发布状态的耗材数量: $TOTAL_COUNT"
    
    # 检查bag_type分布
    log_info "当前bag_type分布:"
    docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -D"$MYSQL_DATABASE" -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;"
    
    # 检查material分布
    log_info "当前material分布:"
    docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -D"$MYSQL_DATABASE" -e "SELECT material, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY material ORDER BY count DESC;"
}

execute_fix() {
    log_info "执行数据库修复..."
    
    if [ ! -f "$SQL_FILE" ]; then
        log_error "SQL文件不存在: $SQL_FILE"
        exit 1
    fi
    
    # 将SQL文件复制到容器中
    docker cp "$SQL_FILE" "$MYSQL_CONTAINER_NAME:/tmp/fix.sql"
    
    # 执行修复SQL
    docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -D"$MYSQL_DATABASE" < /tmp/fix.sql
    
    # 清理临时文件
    docker exec "$MYSQL_CONTAINER_NAME" rm -f /tmp/fix.sql
    
    log_success "数据库修复执行完成"
}

verify_fix() {
    log_info "验证修复结果..."
    
    # 检查修复后的数据分布
    log_info "修复后bag_type分布:"
    docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -D"$MYSQL_DATABASE" -e "SELECT bag_type, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;"
    
    log_info "修复后material分布:"
    docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -D"$MYSQL_DATABASE" -e "SELECT material, COUNT(*) as count FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY material ORDER BY count DESC;"
    
    # 检查数据完整性
    log_info "数据完整性检查:"
    docker exec "$MYSQL_CONTAINER_NAME" mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -D"$MYSQL_DATABASE" -e "
    SELECT 
        'completeness' as category,
        COUNT(*) as total_records,
        COUNT(CASE WHEN bag_type IS NOT NULL AND bag_type != '' THEN 1 END) as has_bag_type,
        COUNT(CASE WHEN material IS NOT NULL AND material != '' THEN 1 END) as has_material,
        COUNT(CASE WHEN app_model IS NOT NULL AND app_model != '' THEN 1 END) as has_app_model
    FROM wp_bjt_consumables 
    WHERE status = 'publish';
    "
}

# =============================================================================
# 主执行流程
# =============================================================================

main() {
    log_info "🚀 开始远程数据库修复"
    log_info "目标: 修复耗材筛选功能的数据格式问题"
    
    # 用户确认
    echo
    log_warning "⚠️  即将在远程服务器上修改数据库"
    log_warning "⚠️  请确保您有数据库的完整备份"
    echo
    read -p "是否继续？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "用户取消操作"
        exit 0
    fi
    
    # 执行检查和修复
    check_docker_environment
    find_mysql_container
    test_mysql_connection
    create_backup
    check_current_data
    
    echo
    log_warning "即将执行数据库修复，最后确认："
    read -p "确定执行修复？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "用户取消修复"
        exit 0
    fi
    
    execute_fix
    verify_fix
    
    # 最终总结
    echo
    log_success "🎉 远程数据库修复完成！"
    log_info "📁 备份位置: $BACKUP_DIR"
    log_info "🔧 修复内容: 将内部代码转换为前端期望的描述格式"
    
    echo
    log_info "📋 修复摘要:"
    echo "   ✅ MEX → Pillow (气泡枕)"
    echo "   ✅ MEY → Precut Air Pillow (开口气泡枕)"
    echo "   ✅ MFB → paper Bubble (纸质气泡膜)"
    echo "   ✅ MFC → Tube (气枕膜)"
    echo "   ✅ MFF → Bubble (葫芦膜)"
    echo "   ✅ 材质字段标准化"
    echo "   ✅ 机型字段格式清理"
    
    echo
    log_info "🔙 如需回滚，请执行:"
    echo "docker exec $MYSQL_CONTAINER_NAME mysql -u$MYSQL_USER -p$MYSQL_ROOT_PASSWORD -D$MYSQL_DATABASE -e \"DROP TABLE wp_bjt_consumables; RENAME TABLE wp_bjt_consumables_backup_remote TO wp_bjt_consumables;\""
}

# 错误处理
trap 'log_error "脚本执行中断，备份位置: $BACKUP_DIR"' ERR

# 执行主流程
main "$@" 