#!/bin/bash

echo "🚨 紧急修复：部署后显示旧版本问题"
echo "====================================="

# 🔥 步骤1：强制重新构建前端（最可能的问题）
echo "🔧 强制重新构建前端..."
cd frontend

# 清理构建缓存
rm -rf dist/
rm -rf node_modules/.vite/
npm cache clean --force 2>/dev/null || true

# 强制构建
echo "执行强制构建..."
NODE_ENV=production npm run build

if [ -d "dist" ]; then
    echo "✅ 前端构建成功"
    echo "构建时间: $(date)"
    ls -la dist/index.html
else
    echo "❌ 构建失败"
    exit 1
fi

cd ..

# 🔥 步骤2：添加版本号避免缓存
echo "🔢 添加版本号到HTML文件..."
timestamp=$(date +%s)
if [ -f "frontend/dist/index.html" ]; then
    # 在HTML中添加版本号作为注释和meta标签
    sed -i.bak "s|<head>|<head><meta name=\"version\" content=\"${timestamp}\"><!-- Version: ${timestamp} -->|g" frontend/dist/index.html
    echo "✅ 已添加版本号: ${timestamp}"
fi

# 🔥 步骤3：生成紧急验证命令
echo ""
echo "🎯 立即验证更新："
echo "1. 硬刷新浏览器: Ctrl+F5 (Win) 或 Cmd+Shift+R (Mac)"
echo "2. 无痕模式访问网站"
echo "3. 开发者工具 → Network → 勾选 'Disable cache'"
echo ""
echo "🔗 带时间戳的验证URL（复制到浏览器）:"
echo "http://your-domain.com/?v=${timestamp}&cache=false"
echo "http://your-domain.com/admin?v=${timestamp}&cache=false"
echo ""
echo "🔍 检查要点："
echo "✓ Logo是否明显变大了"
echo "✓ 购物车页面是否没有Browse Categories"
echo "✓ Safari的Continue Shopping是否正常"
echo "✓ 管理后台下拉框数据是否最新"
echo ""
echo "⚡ 如果仍然显示旧版本，请："
echo "1. 重启Web服务器"
echo "2. 清理CDN缓存（如果有）"
echo "3. 检查负载均衡配置" 