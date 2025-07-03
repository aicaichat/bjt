#!/bin/bash

echo "🚀 强制部署更新脚本 - 解决显示旧版本问题"
echo "=================================="

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步骤1：验证代码状态
echo -e "${YELLOW}📋 步骤1：验证代码状态${NC}"
echo "当前提交:"
git log --oneline -1
echo ""

# 检查关键文件是否存在
echo "检查关键修复文件:"
if [ -f "frontend/src/hooks/useNavigationHistory.ts" ]; then
    echo -e "✅ ${GREEN}Safari导航Hook存在${NC}"
else
    echo -e "❌ ${RED}Safari导航Hook不存在${NC}"
fi

if grep -q "Cache-Control.*no-cache" frontend/src/admin/api/httpAdminService.ts 2>/dev/null; then
    echo -e "✅ ${GREEN}缓存修复代码存在${NC}"
else
    echo -e "❌ ${RED}缓存修复代码不存在${NC}"
fi
echo ""

# 步骤2：强制清理并重新构建前端
echo -e "${YELLOW}🔧 步骤2：强制清理并重新构建前端${NC}"
cd frontend

# 清理所有缓存和构建文件
echo "清理前端缓存和构建文件..."
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/
rm -rf .vite/
npm cache clean --force 2>/dev/null || true

# 检查package.json中的build脚本
echo "当前构建脚本:"
grep -A5 -B5 '"build"' package.json

# 重新安装依赖（可选，如果有依赖问题）
echo "重新安装依赖..."
npm install

# 强制重新构建
echo "强制重新构建前端..."
NODE_ENV=production npm run build

# 验证构建结果
if [ -d "dist" ]; then
    echo -e "✅ ${GREEN}前端构建成功${NC}"
    echo "构建文件时间戳:"
    ls -la dist/index.html
    echo "构建文件大小:"
    du -sh dist/
else
    echo -e "❌ ${RED}前端构建失败${NC}"
    exit 1
fi

cd ..

# 步骤3：清理Docker缓存（如果使用Docker）
echo -e "${YELLOW}🐳 步骤3：清理Docker缓存${NC}"
echo "检查Docker容器状态:"
docker ps | grep -E "(bjt|wordpress|frontend)" || echo "未发现相关Docker容器"

# 如果有前端Docker容器，重建它
if docker ps | grep -q frontend; then
    echo "重建前端Docker容器..."
    docker-compose down frontend 2>/dev/null || true
    docker-compose build --no-cache frontend 2>/dev/null || true
    docker-compose up -d frontend 2>/dev/null || true
fi

# 步骤4：清理Nginx缓存（如果有）
echo -e "${YELLOW}🌐 步骤4：清理Nginx缓存${NC}"
if [ -f "/etc/nginx/nginx.conf" ] || [ -d "nginx/" ]; then
    echo "发现Nginx配置，建议清理缓存:"
    echo "sudo nginx -s reload"
    echo "或重启Nginx服务"
fi

# 步骤5：生成浏览器缓存清理指导
echo -e "${YELLOW}🌍 步骤5：浏览器缓存清理指导${NC}"
echo "请在浏览器中执行以下操作:"
echo "1. 硬刷新: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)"
echo "2. 开发者工具: F12 → Network → 勾选 'Disable cache'"
echo "3. 清理缓存: Ctrl+Shift+Delete 清理浏览器缓存"
echo "4. 无痕模式: 使用无痕/隐私模式访问网站"

# 步骤6：验证关键功能
echo -e "${YELLOW}🔍 步骤6：验证更新内容${NC}"
echo "请验证以下功能是否已更新:"
echo "✓ Logo尺寸是否变大了 (应该比之前大80%)"
echo "✓ 购物车页面是否移除了Browse Categories"
echo "✓ Safari中Continue Shopping按钮是否正常工作"
echo "✓ 管理后台耗材页面下拉框是否显示最新数据"

# 步骤7：生成版本验证URL
echo -e "${YELLOW}🔗 步骤7：版本验证URL${NC}"
timestamp=$(date +%s)
echo "访问以下URL验证更新（带时间戳防缓存）:"
echo "http://your-domain.com/?v=${timestamp}"
echo "http://your-domain.com/admin?v=${timestamp}"

echo ""
echo -e "${GREEN}🎉 强制更新完成！${NC}"
echo "如果问题仍然存在，请检查:"
echo "1. 生产环境是否真的重新部署了构建文件"
echo "2. CDN是否有缓存需要清理"
echo "3. 负载均衡器是否指向了正确的服务器" 