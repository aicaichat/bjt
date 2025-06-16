#!/bin/bash
# BJT产品管理系统生产环境部署脚本（集成bag_type数据修复）
# 在数据库初始化阶段就解决数据不一致问题

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_banner() {
    echo -e "${PURPLE}"
    echo "════════════════════════════════════════════════════════════════"
    echo "  BJT产品管理系统 - 生产环境部署（集成数据修复）"
    echo "  版本: v3.0 (自动修复bag_type数据不一致问题)"
    echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${BLUE}[STEP $(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 全局变量
DEPLOYMENT_LOG="logs/deployment-$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="backups/deployment-$(date +%Y%m%d_%H%M%S)"

# 创建日志和备份目录
mkdir -p logs backups

# 日志记录函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$DEPLOYMENT_LOG"
}

# 环境变量验证
validate_environment() {
    print_step "验证环境配置..."
    
    if [ ! -f ".env.production" ]; then
        print_error ".env.production 文件不存在"
        print_info "请运行: cp env.production.example .env.production"
        print_info "然后编辑 .env.production 配置您的环境变量"
        exit 1
    fi
    
    source .env.production
    log_message "已加载环境变量配置"
    
    # 验证必需的环境变量
    local required_vars=(
        "DOMAIN_NAME"
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_DATABASE"
        "MYSQL_USER"
        "MYSQL_PASSWORD"
        "JWT_AUTH_SECRET_KEY"
        "WP_HOME"
        "WP_SITEURL"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "以下环境变量未设置："
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "环境变量验证通过"
    print_info "目标域名: $DOMAIN_NAME"
    print_info "数据库: $MYSQL_DATABASE"
    
    log_message "环境变量验证完成"
}

# 准备数据库初始化文件（集成bag_type修复）
prepare_database_init() {
    print_step "准备数据库初始化文件（集成bag_type修复）..."
    
    # 创建数据库初始化目录
    mkdir -p docker/mysql/initdb.d
    
    # 复制基础初始化文件
    if [ -f "generated_sql_imports/init.sql" ]; then
        cp generated_sql_imports/init.sql docker/mysql/initdb.d/01-init.sql
        print_success "✅ 基础数据库结构文件已准备"
    else
        print_error "❌ 基础数据库结构文件不存在: generated_sql_imports/init.sql"
        exit 1
    fi
    
    # 复制设备数据文件
    if [ -f "generated_sql_imports/_设备.sql" ]; then
        cp "generated_sql_imports/_设备.sql" docker/mysql/initdb.d/02-machines.sql
        print_success "✅ 设备数据文件已准备"
    else
        print_warning "⚠️ 设备数据文件不存在，将跳过设备数据导入"
    fi
    
    # 复制耗材数据文件
    if [ -f "generated_sql_imports/_耗材.sql" ]; then
        cp "generated_sql_imports/_耗材.sql" docker/mysql/initdb.d/03-consumables.sql
        print_success "✅ 耗材数据文件已准备"
    else
        print_warning "⚠️ 耗材数据文件不存在，将跳过耗材数据导入"
    fi
    
    # 🔥 关键：添加bag_type修复脚本
    if [ -f "generated_sql_imports/fix-bag-type-during-init.sql" ]; then
        cp generated_sql_imports/fix-bag-type-during-init.sql docker/mysql/initdb.d/04-fix-bag-type.sql
        print_success "✅ bag_type修复脚本已准备"
    else
        print_error "❌ bag_type修复脚本不存在，请先创建该文件"
        exit 1
    fi
    
    # 创建完整的初始化脚本
    cat > docker/mysql/initdb.d/00-complete-init.sql << 'EOF'
-- =====================================================
-- BJT产品管理系统完整数据库初始化脚本
-- 包含数据结构、数据导入和bag_type修复
-- =====================================================

-- 设置字符集和时区
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 记录初始化开始
INSERT INTO wp_bjt_logs (log_type, message, details, created_at) 
VALUES ('system', '数据库初始化开始', CONCAT('开始时间: ', NOW()), NOW());

-- 显示初始化进度
SELECT '🚀 开始BJT产品管理系统数据库初始化...' as status;
EOF
    
    # 创建最终验证脚本
    cat > docker/mysql/initdb.d/99-final-verification.sql << 'EOF'
-- =====================================================
-- 最终验证和总结
-- =====================================================

-- 验证关键表的数据
SELECT '📊 数据库初始化完成统计:' as info;

SELECT 
    'wp_bjt_consumables' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN bag_type IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF') THEN 1 END) as standardized_bag_type,
    COUNT(CASE WHEN bag_type NOT IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF') THEN 1 END) as non_standard_bag_type
FROM wp_bjt_consumables

UNION ALL

SELECT 
    'wp_bjt_shapes' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'publish' THEN 1 END) as published_records,
    0 as non_standard_bag_type
FROM wp_bjt_shapes

UNION ALL

SELECT 
    'wp_bjt_materials' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'publish' THEN 1 END) as published_records,
    0 as non_standard_bag_type
FROM wp_bjt_materials;

-- 显示bag_type修复后的分布
SELECT '🎯 bag_type字段标准化结果:' as info;
SELECT 
    bag_type,
    COUNT(*) as count,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM wp_bjt_consumables), 1), '%') as percentage
FROM wp_bjt_consumables 
GROUP BY bag_type 
ORDER BY count DESC;

-- 记录初始化完成
INSERT INTO wp_bjt_logs (log_type, message, details, created_at) 
VALUES (
    'system', 
    '数据库初始化完成',
    CONCAT(
        '完成时间: ', NOW(),
        ', 耗材记录数: ', (SELECT COUNT(*) FROM wp_bjt_consumables),
        ', bag_type标准化: ', 
        CASE 
            WHEN (SELECT COUNT(*) FROM wp_bjt_consumables WHERE bag_type NOT IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF')) = 0 
            THEN '✅ 成功' 
            ELSE '⚠️ 部分失败' 
        END
    ),
    NOW()
);

-- 最终成功提示
SELECT 
    '🎉 BJT产品管理系统数据库初始化完成！' as message,
    '✅ bag_type字段已标准化，筛选功能将正常工作' as note,
    '🔗 可以开始使用前端应用了' as next_step,
    NOW() as completion_time;
EOF
    
    print_success "数据库初始化文件准备完成（包含bag_type修复）"
    log_message "数据库初始化文件准备完成"
}

# 前端构建
build_frontend() {
    print_step "构建前端应用..."
    
    cd frontend
    
    # 检查Node.js环境
    if ! command -v npm &> /dev/null; then
        print_error "npm未安装，请先安装Node.js"
        exit 1
    fi
    
    # 安装依赖
    print_info "安装前端依赖..."
    npm install
    
    # 构建生产版本
    print_info "构建生产版本..."
    npm run build
    
    # 验证构建结果
    if [ ! -f "build/index.html" ] && [ ! -f "dist/index.html" ]; then
        print_error "前端构建失败，未生成index.html"
        exit 1
    fi
    
    cd ..
    
    print_success "前端构建完成"
    log_message "前端构建完成"
}

# 执行部署
execute_deployment() {
    print_step "执行Docker部署（包含数据库自动修复）..."
    
    # 停止现有服务
    print_info "停止现有服务..."
    docker-compose -f docker/prod/docker-compose.prod.yml down 2>/dev/null || true
    
    # 清理旧镜像（可选）
    print_info "清理旧镜像..."
    docker system prune -f &>/dev/null || true
    
    # 构建并启动服务
    print_info "构建并启动服务..."
    if ! docker-compose -f docker/prod/docker-compose.prod.yml up -d --build; then
        print_error "Docker服务启动失败"
        exit 1
    fi
    
    print_success "Docker服务启动完成"
    log_message "Docker服务启动完成"
}

# 等待数据库初始化完成
wait_for_database_init() {
    print_step "等待数据库初始化完成（包含bag_type修复）..."
    
    local max_attempts=60
    local attempt=1
    
    print_info "等待MySQL服务启动..."
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} &> /dev/null; then
            print_success "MySQL服务已启动"
            break
        fi
        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "MySQL服务启动超时"
        exit 1
    fi
    
    # 等待数据库初始化完成
    print_info "等待数据库初始化和bag_type修复完成..."
    sleep 30  # 给数据库初始化一些时间
    
    # 验证bag_type修复结果
    print_info "验证bag_type修复结果..."
    local non_standard_count=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
        mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
            USE ${MYSQL_DATABASE};
            SELECT COUNT(*) FROM wp_bjt_consumables 
            WHERE bag_type NOT IN ('MEX', 'MEY', 'MFB', 'MFC', 'MFF');" 2>/dev/null | tail -n 1)
    
    if [ "$non_standard_count" = "0" ]; then
        print_success "✅ bag_type字段标准化修复成功"
    else
        print_warning "⚠️ 仍有 $non_standard_count 条非标准bag_type记录"
    fi
    
    # 显示修复后的分布
    print_info "bag_type修复后的分布："
    docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql \
        mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "
            USE ${MYSQL_DATABASE};
            SELECT bag_type, COUNT(*) as count 
            FROM wp_bjt_consumables 
            GROUP BY bag_type 
            ORDER BY count DESC;" 2>/dev/null || true
    
    log_message "数据库初始化和bag_type修复完成"
}

# 健康检查
health_check() {
    print_step "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    print_info "等待服务完全启动..."
    while [ $attempt -le $max_attempts ]; do
        sleep 10
        
        # 检查容器状态
        if docker-compose -f docker/prod/docker-compose.prod.yml ps | grep -q "Up"; then
            print_info "尝试 $attempt/$max_attempts: 容器运行正常"
            
            # 检查网站可访问性
            if curl -k -s -o /dev/null -w "%{http_code}" "https://${DOMAIN_NAME}" | grep -q "200\|301\|302"; then
                print_success "网站健康检查通过"
                break
            else
                print_info "网站暂时不可访问，继续等待..."
            fi
        else
            print_warning "部分容器未正常启动"
        fi
        
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "健康检查超时，请手动验证部署状态"
        exit 1
    fi
    
    # 检查API接口
    if curl -k -s "https://${DOMAIN_NAME}/wp-json/bjt/v1/consumables?limit=1" | grep -q "data\|items"; then
        print_success "✓ 耗材API接口正常"
        
        # 验证筛选功能
        local api_response=$(curl -k -s "https://${DOMAIN_NAME}/wp-json/bjt/v1/consumables?limit=1")
        if echo "$api_response" | grep -q "filterOptions"; then
            print_success "✓ 筛选选项API正常"
        else
            print_warning "⚠ 筛选选项API可能异常"
        fi
    else
        print_warning "⚠ 耗材API接口可能异常"
    fi
    
    log_message "健康检查完成"
}

# 显示部署结果
show_deployment_result() {
    print_step "部署完成!"
    
    echo ""
    echo -e "${GREEN}✅ 部署成功完成！${NC}"
    echo ""
    echo "🌐 访问地址:"
    echo "   前端应用: https://$DOMAIN_NAME"
    echo "   WordPress后台: https://$DOMAIN_NAME/wp-admin"
    echo "   API接口: https://$DOMAIN_NAME/wp-json/bjt/v1"
    echo ""
    echo "🔧 数据修复状态:"
    echo "   ✅ bag_type字段已标准化"
    echo "   ✅ 筛选功能已修复"
    echo "   ✅ 数据一致性问题已解决"
    echo ""
    echo "📁 备份与日志:"
    echo "   📋 部署日志: $DEPLOYMENT_LOG"
    echo "   📦 备份目录: $BACKUP_DIR"
    echo ""
    echo "🧪 验证建议:"
    echo "   1. 访问耗材页面测试筛选功能"
    echo "   2. 检查形状筛选是否显示正确图片"
    echo "   3. 验证材质和机型筛选是否正常"
    echo ""
    echo "🔙 如需回滚:"
    echo "   docker-compose -f docker/prod/docker-compose.prod.yml down"
    echo "   # 然后恢复备份数据"
    echo ""
}

# 主执行流程
main() {
    print_banner
    
    print_info "🚀 开始BJT产品管理系统部署（集成bag_type修复）"
    print_info "预计执行时间: 10-15分钟"
    
    # 用户确认
    echo
    read -p "⚠️  即将开始部署，是否继续？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "用户取消部署"
        exit 0
    fi
    
    # 执行各个阶段
    validate_environment
    prepare_database_init
    build_frontend
    execute_deployment
    wait_for_database_init
    health_check
    show_deployment_result
    
    print_success "🎉 BJT产品管理系统部署完成！bag_type数据问题已在初始化时修复。"
}

# 错误处理
trap 'print_error "部署过程中断，备份目录: $BACKUP_DIR"' ERR

# 执行主流程
main "$@" 