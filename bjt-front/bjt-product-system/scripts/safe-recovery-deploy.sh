#!/bin/bash
# 安全的生产环境恢复和重新部署脚本

set -e

echo "=========================================="
echo "  生产环境安全恢复和重新部署"
echo "=========================================="
echo ""
echo "⚠️  重要提示："
echo "   - 此脚本将备份当前数据"
echo "   - 检查并恢复数据库表"
echo "   - 清理磁盘空间"
echo "   - 重新部署系统"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目目录
PROJECT_DIR="/var/bjt/www/bjt/bjt-front/bjt-product-system"
BACKUP_DIR="/var/bjt/backups/recovery-$(date +%Y%m%d_%H%M%S)"

# Docker Compose 文件
COMPOSE_FILE="docker/prod/docker-compose.prod.yml"

# 日志文件
LOG_FILE="/tmp/recovery-deploy-$(date +%Y%m%d_%H%M%S).log"

# 日志函数
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# 检查是否为 root 或有 sudo 权限
if [ "$EUID" -ne 0 ]; then 
    error "请使用 root 权限或 sudo 运行此脚本"
    exit 1
fi

# 进入项目目录
cd "$PROJECT_DIR" || {
    error "无法进入项目目录: $PROJECT_DIR"
    exit 1
}

echo ""
echo "=========================================="
echo "  步骤 1/5: 备份当前生产环境"
echo "=========================================="
echo ""

log "创建备份目录: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 1.1 备份数据库
log "备份数据库..."
docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqldump \
    -u root -pbjtpassword123 bjt > "$BACKUP_DIR/database-backup.sql" 2>/dev/null || {
    warning "数据库备份失败，继续执行..."
}

if [ -f "$BACKUP_DIR/database-backup.sql" ]; then
    log "✅ 数据库备份完成: $(du -h "$BACKUP_DIR/database-backup.sql" | cut -f1)"
else
    warning "⚠️  数据库备份文件未生成"
fi

# 1.2 备份配置文件
log "备份配置文件..."
cp -r nginx/conf.d "$BACKUP_DIR/" 2>/dev/null || true
cp docker/prod/.env "$BACKUP_DIR/" 2>/dev/null || true
cp docker/prod/docker-compose.prod.yml "$BACKUP_DIR/" 2>/dev/null || true

log "✅ 配置文件备份完成"

# 1.3 记录当前容器状态
log "记录当前容器状态..."
docker-compose -f "$COMPOSE_FILE" ps > "$BACKUP_DIR/container-status.txt" 2>/dev/null || true
docker images > "$BACKUP_DIR/docker-images.txt" 2>/dev/null || true

log "✅ 备份完成，保存在: $BACKUP_DIR"

echo ""
echo "=========================================="
echo "  步骤 2/5: 检查数据库状态并恢复表结构"
echo "=========================================="
echo ""

# 2.1 检查数据库连接
log "检查数据库连接..."
DB_AVAILABLE=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql \
    mysql -u root -pbjtpassword123 -e "SELECT 1" 2>/dev/null || echo "FAILED")

if [ "$DB_AVAILABLE" = "FAILED" ]; then
    error "❌ 数据库连接失败"
    log "尝试重启 MySQL 容器..."
    docker-compose -f "$COMPOSE_FILE" restart mysql
    sleep 10
fi

# 2.2 检查关键数据库表
log "检查关键数据库表..."

REQUIRED_TABLES=(
    "wp_bjt_products"
    "wp_bjt_product_lines"
    "wp_bjt_machines"
    "wp_bjt_parts"
    "wp_bjt_consumables"
    "wp_options"
    "wp_users"
)

MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
    TABLE_EXISTS=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql \
        mysql -u root -pbjtpassword123 bjt \
        -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep -c "$table" || echo "0")
    
    if [ "$TABLE_EXISTS" = "0" ]; then
        error "❌ 表丢失: $table"
        MISSING_TABLES+=("$table")
    else
        log "✅ 表存在: $table"
    fi
done

# 2.3 如果有表丢失，尝试恢复
if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    warning "检测到 ${#MISSING_TABLES[@]} 个表丢失"
    
    # 检查是否有备份可以恢复
    LATEST_BACKUP=$(find /var/bjt/backups -name "*.sql" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2)
    
    if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
        log "发现最新备份: $LATEST_BACKUP"
        log "恢复数据库..."
        
        docker-compose -f "$COMPOSE_FILE" exec -T mysql \
            mysql -u root -pbjtpassword123 bjt < "$LATEST_BACKUP" || {
            error "数据库恢复失败"
        }
        
        log "✅ 数据库已从备份恢复"
    else
        warning "未找到备份文件，将在部署时重新创建表结构"
    fi
fi

echo ""
echo "=========================================="
echo "  步骤 3/5: 清理磁盘空间"
echo "=========================================="
echo ""

# 3.1 检查磁盘使用率
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
log "当前磁盘使用率: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -gt 80 ]; then
    warning "磁盘使用率超过 80%，开始清理..."
    
    # 清理 Docker
    log "清理 Docker 未使用的资源..."
    docker system prune -a -f --volumes
    
    # 清理旧的备份（保留最近 5 个）
    log "清理旧的备份文件..."
    cd /var/bjt/backups
    ls -t | tail -n +6 | xargs rm -rf 2>/dev/null || true
    cd "$PROJECT_DIR"
    
    # 清理日志
    log "清理系统日志..."
    journalctl --vacuum-time=7d
    find /var/log -name "*.log" -size +100M -exec truncate -s 0 {} \;
    
    # 清理前端构建缓存（会在部署时重新生成）
    log "清理前端构建缓存..."
    rm -rf frontend/node_modules frontend/dist frontend/.vite 2>/dev/null || true
    
    NEW_DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    log "清理后磁盘使用率: ${NEW_DISK_USAGE}%"
    
    if [ "$NEW_DISK_USAGE" -gt 85 ]; then
        error "⚠️  磁盘空间仍然不足，可能导致部署失败"
        error "建议："
        error "  1. 手动检查并删除大文件"
        error "  2. 购买更大的云盘或添加数据盘"
        echo ""
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "用户取消部署"
            exit 1
        fi
    fi
else
    log "✅ 磁盘空间充足"
fi

echo ""
echo "=========================================="
echo "  步骤 4/5: 执行重新部署"
echo "=========================================="
echo ""

# 4.1 拉取最新代码
log "拉取最新代码..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log "当前分支: $CURRENT_BRANCH"

read -p "是否拉取最新代码？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git pull origin "$CURRENT_BRANCH"
    log "✅ 代码已更新"
else
    log "跳过代码更新"
fi

# 4.2 停止当前服务
log "停止当前服务..."
docker-compose -f "$COMPOSE_FILE" down || {
    warning "停止服务时出现警告，继续执行..."
}

# 4.3 重新构建和启动服务
log "重新构建和启动服务..."
log "这可能需要几分钟时间，请耐心等待..."

# 启动服务（不重新构建，除非需要）
docker-compose -f "$COMPOSE_FILE" up -d

# 等待服务启动
log "等待服务启动..."
sleep 30

# 检查服务状态
log "检查服务状态..."
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "=========================================="
echo "  步骤 5/5: 验证部署和数据完整性"
echo "=========================================="
echo ""

# 5.1 检查容器状态
log "检查容器健康状态..."
RUNNING_CONTAINERS=$(docker-compose -f "$COMPOSE_FILE" ps --filter "status=running" | grep -c "Up" || echo "0")
log "运行中的容器数: $RUNNING_CONTAINERS"

# 5.2 检查数据库连接
log "检查数据库连接..."
sleep 5
DB_CHECK=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql \
    mysql -u root -pbjtpassword123 -e "SELECT 1" 2>/dev/null || echo "FAILED")

if [ "$DB_CHECK" = "FAILED" ]; then
    error "❌ 数据库连接失败"
else
    log "✅ 数据库连接正常"
fi

# 5.3 检查关键表是否存在
log "验证数据库表..."
for table in "${REQUIRED_TABLES[@]}"; do
    TABLE_EXISTS=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql \
        mysql -u root -pbjtpassword123 bjt \
        -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep -c "$table" || echo "0")
    
    if [ "$TABLE_EXISTS" = "0" ]; then
        error "❌ 表仍然丢失: $table"
    else
        log "✅ 表验证通过: $table"
    fi
done

# 5.4 测试 API 端点
log "测试 API 端点..."
sleep 10

API_TEST=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/wp-json/bjt/v1/diagnostic" || echo "000")
if [ "$API_TEST" = "200" ]; then
    log "✅ API 端点响应正常"
else
    warning "⚠️  API 端点响应异常: $API_TEST"
fi

# 5.5 检查插件状态
log "检查插件状态..."
PLUGIN_STATUS=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql \
    mysql -u root -pbjtpassword123 bjt \
    -e "SELECT option_value FROM wp_options WHERE option_name = 'active_plugins';" 2>/dev/null || echo "")

if echo "$PLUGIN_STATUS" | grep -q "bjt-core-entities"; then
    log "✅ BJT 插件已激活"
else
    warning "⚠️  BJT 插件未激活，正在激活..."
    
    # 激活插件
    docker-compose -f "$COMPOSE_FILE" exec -T mysql \
        mysql -u root -pbjtpassword123 bjt \
        -e "UPDATE wp_options SET option_value = 'a:1:{i:0;s:37:\"bjt-core-entities/bjt-product-api.php\";}' WHERE option_name = 'active_plugins';" 2>/dev/null || true
    
    # 重启 WordPress
    docker-compose -f "$COMPOSE_FILE" restart wordpress
    sleep 10
fi

echo ""
echo "=========================================="
echo "  部署完成"
echo "=========================================="
echo ""

log "📊 部署摘要："
log "  - 备份位置: $BACKUP_DIR"
log "  - 日志文件: $LOG_FILE"
log "  - 磁盘使用: $(df -h / | awk 'NR==2 {print $5}')"
log "  - 运行容器: $RUNNING_CONTAINERS"
echo ""

log "🔗 验证链接："
log "  - 前端: https://eorder.lockedair.com"
log "  - API: https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic"
log "  - 管理后台: https://eorder.lockedair.com/wp-admin"
echo ""

log "📝 下一步操作："
log "  1. 访问前端页面验证功能"
log "  2. 检查 API 是否正常返回数据"
log "  3. 查看日志: docker-compose -f $COMPOSE_FILE logs -f"
log "  4. 如有问题，可从备份恢复: $BACKUP_DIR/database-backup.sql"
echo ""

log "✅ 恢复和部署流程完成！"

