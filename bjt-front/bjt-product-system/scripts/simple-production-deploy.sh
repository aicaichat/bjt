#!/bin/bash

# =============================================================================
# 简化版线上部署脚本 - 专注于耗材筛选功能修复
# =============================================================================

set -e

echo "🚀 线上环境耗材筛选功能部署"
echo "📅 部署时间: $(date)"

DEPLOY_TIME=$(date +%Y%m%d_%H%M%S)

# =============================================================================
# 1. 前端构建
# =============================================================================
echo "🔧 1. 构建前端..."
cd frontend

# 构建生产版本
npm run build

if [ ! -d "dist" ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

echo "✅ 前端构建完成"

# 创建前端部署包
tar -czf "../frontend-production-$DEPLOY_TIME.tar.gz" dist/
echo "📦 前端部署包: frontend-production-$DEPLOY_TIME.tar.gz"

cd ..

# =============================================================================
# 2. 后端代码打包
# =============================================================================
echo "🔧 2. 打包后端代码..."

# 只打包修改过的关键文件
tar -czf "backend-fixes-$DEPLOY_TIME.tar.gz" \
    plugins/bjt-core-entities/controllers/class-consumable-controller.php \
    --exclude='*.log'

echo "✅ 后端代码打包完成"
echo "📦 后端修复包: backend-fixes-$DEPLOY_TIME.tar.gz"

# =============================================================================
# 3. 生成线上执行脚本
# =============================================================================
echo "🔧 3. 生成线上执行脚本..."

cat > "deploy-on-server-$DEPLOY_TIME.sh" << EOF
#!/bin/bash
# 在线上服务器执行的部署脚本

echo "🚀 开始线上部署..."
DEPLOY_TIME=$DEPLOY_TIME

# 1. 备份现有文件
echo "💾 备份现有文件..."
sudo cp -r /var/www/html /var/www/html.backup.\$DEPLOY_TIME
sudo cp /var/www/wordpress/wp-content/plugins/bjt-core-entities/controllers/class-consumable-controller.php /tmp/class-consumable-controller.php.backup.\$DEPLOY_TIME

# 2. 部署前端
echo "🔧 部署前端..."
cd /tmp
tar -xzf frontend-production-$DEPLOY_TIME.tar.gz
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

# 3. 部署后端
echo "🔧 部署后端..."
tar -xzf backend-fixes-$DEPLOY_TIME.tar.gz
sudo cp plugins/bjt-core-entities/controllers/class-consumable-controller.php /var/www/wordpress/wp-content/plugins/bjt-core-entities/controllers/
sudo chown -R www-data:www-data /var/www/wordpress/wp-content/

# 4. 重启服务
echo "🔄 重启服务..."
sudo systemctl restart php-fpm
sudo systemctl reload nginx

# 5. 验证部署
echo "🧪 验证部署..."
sleep 5
API_RESPONSE=\$(curl -s "http://localhost/wp-json/bjt/v1/consumables?limit=1")
if echo "\$API_RESPONSE" | grep -q '"total"'; then
    echo "✅ API验证成功"
    echo "📊 数据总数: \$(echo "\$API_RESPONSE" | jq '.data.total' 2>/dev/null || echo '未知')"
else
    echo "❌ API验证失败"
    echo "响应: \$API_RESPONSE"
fi

echo "🎉 部署完成！"
EOF

chmod +x "deploy-on-server-$DEPLOY_TIME.sh"

# =============================================================================
# 4. 生成回滚脚本
# =============================================================================
cat > "rollback-$DEPLOY_TIME.sh" << EOF
#!/bin/bash
# 回滚脚本

echo "🔄 开始回滚..."
DEPLOY_TIME=$DEPLOY_TIME

# 回滚前端
sudo rm -rf /var/www/html/*
sudo cp -r /var/www/html.backup.\$DEPLOY_TIME/* /var/www/html/

# 回滚后端
sudo cp /tmp/class-consumable-controller.php.backup.\$DEPLOY_TIME /var/www/wordpress/wp-content/plugins/bjt-core-entities/controllers/class-consumable-controller.php

# 重启服务
sudo systemctl restart php-fpm
sudo systemctl reload nginx

echo "✅ 回滚完成"
EOF

chmod +x "rollback-$DEPLOY_TIME.sh"

# =============================================================================
# 5. 生成部署说明
# =============================================================================
cat > "DEPLOY_INSTRUCTIONS_$DEPLOY_TIME.md" << EOF
# 线上部署说明

## 文件清单
- \`frontend-production-$DEPLOY_TIME.tar.gz\` - 前端构建文件
- \`backend-fixes-$DEPLOY_TIME.tar.gz\` - 后端修复文件
- \`deploy-on-server-$DEPLOY_TIME.sh\` - 服务器执行脚本
- \`rollback-$DEPLOY_TIME.sh\` - 回滚脚本

## 部署步骤

### 1. 上传文件到服务器
\`\`\`bash
scp frontend-production-$DEPLOY_TIME.tar.gz user@your-server:/tmp/
scp backend-fixes-$DEPLOY_TIME.tar.gz user@your-server:/tmp/
scp deploy-on-server-$DEPLOY_TIME.sh user@your-server:/tmp/
scp rollback-$DEPLOY_TIME.sh user@your-server:/tmp/
\`\`\`

### 2. 在服务器执行部署
\`\`\`bash
ssh user@your-server
cd /tmp
chmod +x deploy-on-server-$DEPLOY_TIME.sh
sudo ./deploy-on-server-$DEPLOY_TIME.sh
\`\`\`

### 3. 验证部署结果
\`\`\`bash
# 检查API
curl "https://your-domain.com/wp-json/bjt/v1/consumables?limit=1"

# 检查筛选功能
curl "https://your-domain.com/wp-json/bjt/v1/consumables?shape=Pillow&limit=5"
\`\`\`

### 4. 如需回滚
\`\`\`bash
ssh user@your-server
cd /tmp
chmod +x rollback-$DEPLOY_TIME.sh
sudo ./rollback-$DEPLOY_TIME.sh
\`\`\`

## 修改内容
- ✅ 修复了耗材筛选功能
- ✅ 优化了API响应格式
- ✅ 改进了前端筛选逻辑
- ✅ 添加了错误处理机制

## 验证清单
- [ ] 前端页面正常加载
- [ ] 筛选选项正确显示
- [ ] 形状筛选功能正常
- [ ] 材质筛选功能正常
- [ ] 机型筛选功能正常
- [ ] API响应正常
EOF

echo ""
echo "🎉 部署文件准备完成！"
echo ""
echo "📁 生成的文件："
echo "  - frontend-production-$DEPLOY_TIME.tar.gz"
echo "  - backend-fixes-$DEPLOY_TIME.tar.gz"
echo "  - deploy-on-server-$DEPLOY_TIME.sh"
echo "  - rollback-$DEPLOY_TIME.sh"
echo "  - DEPLOY_INSTRUCTIONS_$DEPLOY_TIME.md"
echo ""
echo "📋 下一步："
echo "1. 查看部署说明: cat DEPLOY_INSTRUCTIONS_$DEPLOY_TIME.md"
echo "2. 上传文件到线上服务器"
echo "3. 在服务器执行部署脚本"
echo ""
echo "⚠️  建议在非业务高峰期进行部署" 