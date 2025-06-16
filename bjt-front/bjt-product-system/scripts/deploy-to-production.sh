#!/bin/bash

# =============================================================================
# 线上环境部署脚本
# 将本地开发环境的修改部署到线上生产环境
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
DEPLOY_TIME=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/production_deploy_backup_$DEPLOY_TIME"
PRODUCTION_SERVER="your-production-server.com"  # 替换为实际服务器地址
PRODUCTION_USER="deploy"  # 替换为实际用户名

echo "🚀 开始线上环境部署..."
echo "📅 部署时间: $(date)"
echo "📁 备份目录: $BACKUP_DIR"

# =============================================================================
# Phase 1: 前端构建和部署
# =============================================================================
deploy_frontend() {
    log_info "🔧 Phase 1: 前端构建和部署"
    
    # 1. 构建前端
    log_info "构建前端应用..."
    cd frontend
    
    # 安装依赖（如果需要）
    if [ ! -d "node_modules" ]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    # 构建生产版本
    log_info "构建生产版本..."
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "前端构建失败，dist目录不存在"
        exit 1
    fi
    
    log_success "前端构建完成"
    
    # 2. 部署到线上服务器
    log_info "部署前端到线上服务器..."
    
    # 创建部署包
    tar -czf "../frontend-$DEPLOY_TIME.tar.gz" dist/
    
    # 上传到服务器（需要配置SSH密钥）
    # scp "../frontend-$DEPLOY_TIME.tar.gz" "$PRODUCTION_USER@$PRODUCTION_SERVER:/tmp/"
    
    # 在服务器上解压和部署
    # ssh "$PRODUCTION_USER@$PRODUCTION_SERVER" "
    #     cd /var/www/html &&
    #     sudo cp -r /var/www/html /var/www/html.backup.$DEPLOY_TIME &&
    #     sudo tar -xzf /tmp/frontend-$DEPLOY_TIME.tar.gz &&
    #     sudo cp -r dist/* /var/www/html/ &&
    #     sudo systemctl reload nginx
    # "
    
    log_warning "前端部署命令已准备，请根据实际服务器配置执行"
    cd ..
}

# =============================================================================
# Phase 2: 后端代码部署
# =============================================================================
deploy_backend() {
    log_info "🔧 Phase 2: 后端代码部署"
    
    # 1. 打包后端代码
    log_info "打包后端代码..."
    mkdir -p "$BACKUP_DIR"
    
    # 打包WordPress插件
    tar -czf "$BACKUP_DIR/wordpress-plugins-$DEPLOY_TIME.tar.gz" \
        plugins/ \
        wordpress/wp-content/mu-plugins/ \
        --exclude='*.log' \
        --exclude='node_modules' \
        --exclude='.git'
    
    log_success "后端代码打包完成"
    
    # 2. 上传到线上服务器
    log_info "准备后端部署命令..."
    
    cat > "$BACKUP_DIR/deploy-backend-commands.sh" << 'EOF'
#!/bin/bash
# 在线上服务器执行的后端部署命令

DEPLOY_TIME=$(date +%Y%m%d_%H%M%S)

# 备份现有代码
sudo cp -r /var/www/wordpress/wp-content/plugins /var/www/wordpress/wp-content/plugins.backup.$DEPLOY_TIME
sudo cp -r /var/www/wordpress/wp-content/mu-plugins /var/www/wordpress/wp-content/mu-plugins.backup.$DEPLOY_TIME

# 解压新代码
cd /tmp
sudo tar -xzf wordpress-plugins-$DEPLOY_TIME.tar.gz

# 部署新代码
sudo cp -r plugins/* /var/www/wordpress/wp-content/plugins/
sudo cp -r wordpress/wp-content/mu-plugins/* /var/www/wordpress/wp-content/mu-plugins/

# 设置权限
sudo chown -R www-data:www-data /var/www/wordpress/wp-content/
sudo chmod -R 755 /var/www/wordpress/wp-content/

# 重启服务
sudo systemctl restart php-fpm
sudo systemctl reload nginx

echo "✅ 后端代码部署完成"
EOF
    
    chmod +x "$BACKUP_DIR/deploy-backend-commands.sh"
    log_success "后端部署脚本已生成: $BACKUP_DIR/deploy-backend-commands.sh"
}

# =============================================================================
# Phase 3: 数据库更新
# =============================================================================
deploy_database() {
    log_info "🔧 Phase 3: 数据库更新"
    
    # 1. 生成数据库更新脚本
    cat > "$BACKUP_DIR/database-updates.sql" << 'EOF'
-- 线上环境数据库更新脚本

-- 1. 备份现有数据
CREATE TABLE IF NOT EXISTS wp_bjt_consumables_backup_before_deploy AS 
SELECT * FROM wp_bjt_consumables WHERE status = 'publish';

-- 2. 标准化bag_type字段
UPDATE wp_bjt_consumables 
SET bag_type = CASE 
    WHEN bag_type LIKE '%paper air Pillow%' THEN 'paper air Pillow'
    WHEN bag_type LIKE '%Precut Air Pillow%' THEN 'Precut Air Pillow'  
    WHEN bag_type LIKE '%Pillow%' THEN 'Pillow'
    WHEN bag_type LIKE '%Bubble%' THEN 'Bubble'
    WHEN bag_type LIKE '%Tube%' THEN 'Tube'
    WHEN bag_type LIKE '%paper Bubble%' THEN 'paper Bubble'
    ELSE bag_type
END
WHERE status = 'publish' AND bag_type IS NOT NULL;

-- 3. 标准化material字段
UPDATE wp_bjt_consumables 
SET material = CASE 
    WHEN material LIKE '%50%' AND material LIKE '%HDPE%' THEN '50% HDPE'
    WHEN material LIKE '%30%' AND material LIKE '%HDPE%' THEN '30% HDPE'
    WHEN material = 'HDPE' THEN 'HDPE'
    WHEN material LIKE '%LDPE%' THEN 'LDPE'
    WHEN material LIKE '%PAPE%' THEN 'PAPE'
    WHEN material LIKE '%PAPER%' THEN 'PAPER'
    ELSE material
END
WHERE status = 'publish' AND material IS NOT NULL;

-- 4. 清理app_model格式
UPDATE wp_bjt_consumables 
SET app_model = TRIM(REPLACE(REPLACE(app_model, '"', ''), '''', ''))
WHERE status = 'publish' AND app_model IS NOT NULL;

-- 5. 确保关键字段不为空
UPDATE wp_bjt_consumables 
SET 
    thickness_met = CASE WHEN thickness_met IS NULL OR thickness_met = 0 THEN 20 ELSE thickness_met END,
    width_met = CASE WHEN width_met IS NULL OR width_met = 0 THEN 20 ELSE width_met END,
    length_met = CASE WHEN length_met IS NULL OR length_met = 0 THEN 10 ELSE length_met END
WHERE status = 'publish';

-- 6. 验证更新结果
SELECT 'bag_type分布' as info, bag_type, COUNT(*) as count 
FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY bag_type ORDER BY count DESC;

SELECT 'material分布' as info, material, COUNT(*) as count 
FROM wp_bjt_consumables WHERE status = 'publish' GROUP BY material ORDER BY count DESC;

SELECT '总记录数' as info, COUNT(*) as total_records
FROM wp_bjt_consumables WHERE status = 'publish';
EOF
    
    # 2. 生成数据库部署脚本
    cat > "$BACKUP_DIR/deploy-database.sh" << 'EOF'
#!/bin/bash
# 线上数据库更新脚本

echo "🔧 开始数据库更新..."

# 数据库连接配置（请根据实际情况修改）
DB_HOST="localhost"
DB_USER="root"
DB_PASS="your_password"
DB_NAME="bjt_product_system"

# 执行数据库更新
mysql -h$DB_HOST -u$DB_USER -p$DB_PASS $DB_NAME < database-updates.sql

if [ $? -eq 0 ]; then
    echo "✅ 数据库更新成功"
else
    echo "❌ 数据库更新失败"
    exit 1
fi

# 验证API响应
echo "🧪 验证API响应..."
API_RESPONSE=$(curl -s "http://localhost/wp-json/bjt/v1/consumables?limit=1")
if echo "$API_RESPONSE" | grep -q '"success":true'; then
    echo "✅ API验证成功"
else
    echo "❌ API验证失败"
fi
EOF
    
    chmod +x "$BACKUP_DIR/deploy-database.sh"
    log_success "数据库部署脚本已生成: $BACKUP_DIR/deploy-database.sh"
}

# =============================================================================
# Phase 4: 生成部署文档
# =============================================================================
generate_deploy_docs() {
    log_info "🔧 Phase 4: 生成部署文档"
    
    cat > "$BACKUP_DIR/DEPLOYMENT_GUIDE.md" << EOF
# 线上环境部署指南

## 部署概览
- **部署时间**: $(date)
- **备份目录**: $BACKUP_DIR
- **部署版本**: $DEPLOY_TIME

## 部署步骤

### 1. 前端部署
\`\`\`bash
# 在线上服务器执行
cd /var/www/html
sudo cp -r /var/www/html /var/www/html.backup.$DEPLOY_TIME
sudo tar -xzf /tmp/frontend-$DEPLOY_TIME.tar.gz
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx
\`\`\`

### 2. 后端部署
\`\`\`bash
# 上传文件到服务器
scp $BACKUP_DIR/wordpress-plugins-$DEPLOY_TIME.tar.gz user@server:/tmp/
scp $BACKUP_DIR/deploy-backend-commands.sh user@server:/tmp/

# 在服务器执行
ssh user@server
cd /tmp
chmod +x deploy-backend-commands.sh
sudo ./deploy-backend-commands.sh
\`\`\`

### 3. 数据库更新
\`\`\`bash
# 上传数据库脚本
scp $BACKUP_DIR/database-updates.sql user@server:/tmp/
scp $BACKUP_DIR/deploy-database.sh user@server:/tmp/

# 在服务器执行
ssh user@server
cd /tmp
chmod +x deploy-database.sh
./deploy-database.sh
\`\`\`

## 验证步骤

### 1. 检查前端
- 访问: https://your-domain.com
- 检查耗材页面: https://your-domain.com/consumables
- 验证筛选功能正常工作

### 2. 检查API
\`\`\`bash
curl "https://your-domain.com/wp-json/bjt/v1/consumables?limit=1"
\`\`\`

### 3. 检查筛选功能
\`\`\`bash
# 测试形状筛选
curl "https://your-domain.com/wp-json/bjt/v1/consumables?shape=MFC&limit=5"

# 测试材质筛选  
curl "https://your-domain.com/wp-json/bjt/v1/consumables?material=HDPE&limit=5"

# 测试机型筛选
curl "https://your-domain.com/wp-json/bjt/v1/consumables?app_model=LA-E4C&limit=5"
\`\`\`

## 回滚方案

### 前端回滚
\`\`\`bash
sudo rm -rf /var/www/html/*
sudo cp -r /var/www/html.backup.$DEPLOY_TIME/* /var/www/html/
sudo systemctl reload nginx
\`\`\`

### 后端回滚
\`\`\`bash
sudo rm -rf /var/www/wordpress/wp-content/plugins/*
sudo rm -rf /var/www/wordpress/wp-content/mu-plugins/*
sudo cp -r /var/www/wordpress/wp-content/plugins.backup.$DEPLOY_TIME/* /var/www/wordpress/wp-content/plugins/
sudo cp -r /var/www/wordpress/wp-content/mu-plugins.backup.$DEPLOY_TIME/* /var/www/wordpress/wp-content/mu-plugins/
sudo systemctl restart php-fpm
\`\`\`

### 数据库回滚
\`\`\`sql
DROP TABLE wp_bjt_consumables;
RENAME TABLE wp_bjt_consumables_backup_before_deploy TO wp_bjt_consumables;
\`\`\`

## 联系信息
如有问题，请联系开发团队。
EOF
    
    log_success "部署文档已生成: $BACKUP_DIR/DEPLOYMENT_GUIDE.md"
}

# =============================================================================
# 主执行流程
# =============================================================================
main() {
    log_info "🚀 开始准备线上部署..."
    
    # 用户确认
    echo
    read -p "⚠️  即将准备线上部署文件，是否继续？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "用户取消部署准备"
        exit 0
    fi
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 执行各个阶段
    deploy_frontend
    deploy_backend  
    deploy_database
    generate_deploy_docs
    
    # 最终总结
    echo
    log_success "🎉 线上部署文件准备完成！"
    log_info "📁 部署文件目录: $BACKUP_DIR"
    log_info "📋 部署指南: $BACKUP_DIR/DEPLOYMENT_GUIDE.md"
    
    echo
    log_info "📋 下一步操作："
    echo "1. 查看部署指南: cat $BACKUP_DIR/DEPLOYMENT_GUIDE.md"
    echo "2. 上传文件到线上服务器"
    echo "3. 按照指南执行部署步骤"
    echo "4. 验证部署结果"
    
    echo
    log_warning "⚠️  重要提醒："
    echo "- 请在非业务高峰期进行部署"
    echo "- 部署前请确保线上环境已备份"
    echo "- 部署后请及时验证功能"
}

# 执行主流程
main "$@" 