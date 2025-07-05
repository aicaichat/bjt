#!/bin/bash

echo "🚀 BJT前端代码部署修复脚本"
echo "========================================="

# 设置错误时退出
set -e

# 1. 清理和重新安装依赖
echo "📦 1. 清理并重新安装依赖..."
rm -rf node_modules package-lock.json dist
npm install

# 2. 设置生产环境变量
echo "🔧 2. 设置生产环境配置..."
export NODE_ENV=production
export VITE_API_URL="/wp-json/bjt/v1"

# 3. 重新构建
echo "🔨 3. 重新构建应用..."
npm run build:skip-check

# 4. 生成部署包
echo "📦 4. 生成部署包..."
cd dist
zip -r ../bjt-frontend-$(date +%Y%m%d-%H%M%S).zip .
cd ..

echo "✅ 构建完成！"
echo "📁 构建文件位于: ./dist/"
echo "📦 部署包已生成"

# 5. 检查构建结果
echo "🔍 5. 检查构建结果..."
echo "主要文件："
ls -la dist/index.html
ls -la dist/assets/ | head -5

# 6. 缓存清理指导
echo ""
echo "🧹 部署后请执行以下步骤清理缓存："
echo "1. 清理CDN缓存（如果使用了CDN）"
echo "2. 清理浏览器缓存 (Ctrl+Shift+R 或 Cmd+Shift+R)"
echo "3. 检查Nginx静态文件缓存配置"

echo ""
echo "🌐 部署完成后测试："
echo "- 打开浏览器开发者工具"
echo "- 检查Network标签页，确认加载的是新的JS/CSS文件"
echo "- 测试购物车添加删除功能"
echo "- 测试耗材页面英制筛选功能" 