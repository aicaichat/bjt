#!/bin/bash

# PO页面环境修复部署脚本

echo "🚀 开始部署PO页面环境修复"

# 1. 确认环境配置
echo "📋 检查环境配置..."
if [ ! -f "frontend/.env.production" ]; then
    echo "❌ frontend/.env.production 不存在"
    exit 1
fi

# 2. 构建前端
echo "🔨 构建前端..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

# 3. 部署到生产环境
echo "📦 部署到生产环境..."
# 这里添加具体的部署命令，例如：
# rsync -av build/ user@server:/path/to/deployment/
# 或者使用Docker部署等

echo "✅ 部署完成"
echo "🔍 请访问调试页面检查: https://your-domain.com/debug-po-environment.html"
