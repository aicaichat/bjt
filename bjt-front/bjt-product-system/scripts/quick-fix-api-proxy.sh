#!/bin/bash

echo "=== BJT 快速修复API代理问题 ==="
echo "=== BJT Quick Fix API Proxy Issues ==="
echo

# 检查当前目录
if [ ! -f "frontend/src/config.ts" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "🔧 修复前端API配置..."

# 1. 更新前端环境配置
cd frontend

# 备份现有配置
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%s)
    echo "✓ 已备份现有.env配置"
fi

# 创建正确的环境配置
cat > .env << 'EOF'
# 修复后的环境配置 - 使用相对路径让Vite代理处理
VITE_USE_MOCK_DATA=false
VITE_API_URL=/wp-json/bjt/v1
VITE_API_BASE_URL=/wp-json/bjt/v1
VITE_USE_MOCK_CART=false
VITE_DEBUG=true
VITE_ENABLE_AUTH_RETRY=true
VITE_ENABLE_PROXY_LOGGING=true
EOF

echo "✓ 已更新前端环境配置"

# 2. 检查并更新配置文件
echo "🔧 检查API配置文件..."

# 检查config.ts是否使用了正确的环境变量
if grep -q "VITE_API_BASE_URL" src/config.ts; then
    echo "✓ config.ts正确使用了VITE_API_BASE_URL"
else
    echo "⚠️  config.ts可能需要更新"
fi

cd ..

# 3. 重启提示
echo ""
echo "🚀 修复完成！请按以下步骤操作："
echo ""
echo "1. 确保WordPress后端服务正在运行："
echo "   docker-compose up -d  # 或您的启动命令"
echo ""
echo "2. 重启前端开发服务器："
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. 检查浏览器控制台，应该能看到代理日志："
echo "   📤 Proxying: GET /wp-json/bjt/v1/... → http://localhost:8080"
echo "   📥 Response: 200 /wp-json/bjt/v1/..."
echo ""
echo "4. 如果仍有问题，请检查："
echo "   - WordPress服务是否在localhost:8080运行"
echo "   - 防火墙是否阻止了端口8080"
echo "   - Docker网络配置是否正确"
echo ""
echo "=== 修复完成 ===" 