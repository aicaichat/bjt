#!/bin/bash

echo "=== BJT 生产环境部署脚本 ==="
echo "=== BJT Production Deployment Script ==="
echo

# 检查是否有未提交的更改
echo "🔍 检查Git状态..."
echo "🔍 Checking Git status..."
git status --porcelain

if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  检测到未提交的更改，建议先提交："
    echo "⚠️  Uncommitted changes detected, recommend committing first:"
    git status --short
    echo
    read -p "是否继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 1
    fi
fi

# 显示将要部署的关键文件
echo "📋 将要部署的关键文件："
echo "📋 Key files to be deployed:"
echo "- plugins/bjt-core-entities/bjt-product-api.php (包含诊断端点)"
echo "- plugins/bjt-core-entities/includes/class-product-info-resolver.php (产品信息解析器)"
echo "- plugins/bjt-core-entities/controllers/class-order-controller.php (订单控制器)"
echo

# 确认部署
read -p "确认部署到生产环境？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 1
fi

echo "🚀 开始部署..."
echo "🚀 Starting deployment..."

# 方法1：如果您有SSH访问权限
echo "=== 部署方法选择 ==="
echo "=== Deployment Method Selection ==="
echo "1. SSH部署 (推荐) - 需要服务器SSH访问权限"
echo "2. Git部署 - 在服务器上执行git pull"
echo "3. 手动部署 - 生成部署包供手动上传"
echo

read -p "请选择部署方法 (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        echo "🔧 SSH部署模式"
        echo "请提供生产服务器信息："
        read -p "服务器地址: " SERVER_HOST
        read -p "用户名: " SERVER_USER
        read -p "WordPress根目录路径 (如: /var/www/html): " WORDPRESS_PATH
        
        if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ] || [ -z "$WORDPRESS_PATH" ]; then
            echo "❌ 服务器信息不完整"
            exit 1
        fi
        
        echo "📤 通过SSH部署文件..."
        
        # 部署关键文件
        scp plugins/bjt-core-entities/bjt-product-api.php "$SERVER_USER@$SERVER_HOST:$WORDPRESS_PATH/wp-content/plugins/bjt-core-entities/"
        scp plugins/bjt-core-entities/includes/class-product-info-resolver.php "$SERVER_USER@$SERVER_HOST:$WORDPRESS_PATH/wp-content/plugins/bjt-core-entities/includes/"
        scp plugins/bjt-core-entities/controllers/class-order-controller.php "$SERVER_USER@$SERVER_HOST:$WORDPRESS_PATH/wp-content/plugins/bjt-core-entities/controllers/"
        
        # 清理PHP缓存
        echo "🧹 清理生产环境PHP缓存..."
        ssh "$SERVER_USER@$SERVER_HOST" "
            # 重启PHP-FPM (根据您的服务器配置调整)
            sudo systemctl reload php-fpm 2>/dev/null || sudo systemctl reload php8.0-fpm 2>/dev/null || sudo systemctl reload php8.1-fpm 2>/dev/null || echo '请手动重启PHP服务'
            
            # 清理OPcache
            if [ -f $WORDPRESS_PATH/wp-admin/admin.php ]; then
                php -r \"if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache cleared\n'; }\"
            fi
        "
        ;;
        
    2)
        echo "📡 Git部署模式"
        echo "请在生产服务器上执行以下命令："
        echo
        echo "cd /path/to/your/wordpress/wp-content/plugins/bjt-core-entities"
        echo "git pull origin main"
        echo "sudo systemctl reload php-fpm  # 或相应的PHP服务"
        echo
        echo "⚠️  请确保生产服务器上的Git仓库是最新的"
        ;;
        
    3)
        echo "📦 生成手动部署包..."
        DEPLOY_DIR="bjt-production-deploy-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$DEPLOY_DIR/plugins/bjt-core-entities"
        
        # 复制关键文件到部署目录
        cp -r plugins/bjt-core-entities/* "$DEPLOY_DIR/plugins/bjt-core-entities/"
        
        # 创建部署说明
        cat > "$DEPLOY_DIR/DEPLOY_INSTRUCTIONS.md" << EOF
# BJT 生产环境部署说明

## 部署步骤：

1. 将此目录中的 plugins/bjt-core-entities/ 文件夹上传到生产服务器
2. 覆盖 /wp-content/plugins/bjt-core-entities/ 目录
3. 重启PHP服务以清理缓存：
   \`\`\`bash
   sudo systemctl reload php-fpm
   \`\`\`
4. 访问诊断端点验证部署：
   https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic

## 关键更新：

- 添加了诊断API端点用于远程调试
- 更新了产品信息解析器
- 修复了订单控制器中的产品信息获取逻辑

## 部署时间：$(date)
EOF
        
        echo "✅ 部署包已生成: $DEPLOY_DIR"
        echo "请将整个目录上传到生产服务器并按照说明操作"
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo
echo "🧪 部署后验证步骤："
echo "🧪 Post-deployment verification steps:"
echo "1. 访问诊断端点: https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic"
echo "2. 检查PO页面: https://eorder.lockedair.com/po"
echo "3. 运行环境比较脚本: ./compare-environments.sh"
echo

echo "=== 部署完成 ==="
echo "=== Deployment Complete ===" 