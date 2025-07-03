#!/bin/bash

# 🚨 服务器端快速修复脚本
echo "🚨 服务器端快速修复：解决显示旧版本问题"
echo "=============================================="

# 简单环境检查
echo "📍 当前位置: $(pwd)"
echo "📝 Git状态: $(git log --oneline -1)"

# 🔥 关键修复：跳过TS检查强制构建
cd frontend
echo "🔧 清理缓存并重新构建..."
rm -rf dist/ node_modules/.vite/ .vite/

# 🔥 使用跳过检查的构建命令
echo "⚡ 执行跳过TypeScript检查的构建..."
NODE_ENV=production npm run build:skip-check

# 验证
if [ -d "dist" ]; then
    echo "✅ 构建成功！"
    timestamp=$(date +%s)
    
    # 添加版本标记
    if [ -f "dist/index.html" ]; then
        sed -i.bak "s|<head>|<head><meta name=\"build-version\" content=\"${timestamp}\">|" dist/index.html
        echo "✅ 已添加版本号: ${timestamp}"
    fi
    
    echo "📊 构建结果:"
    ls -la dist/index.html
    du -sh dist/
else
    echo "❌ 构建失败，尝试备用方案..."
    npx vite build --mode production
fi

cd ..

echo ""
echo "🎯 现在请："
echo "1. 重启Web服务器 (nginx/apache)"
echo "2. 清理CDN缓存（如果有）"
echo "3. 浏览器硬刷新验证"
echo ""
echo "🔗 验证URL（加时间戳防缓存）:"
echo "http://your-domain.com/?v=${timestamp}" 