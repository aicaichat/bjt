#!/bin/bash

echo "开始构建BJT前端项目..."

# 确保使用mock数据而跳过TypeScript检查
echo "使用mock数据构建，跳过TypeScript检查..."

# 检查.env.production.mock文件
if [ -f ".env.production.mock" ]; then
    echo "检查到.env.production.mock文件，确保VITE_BASE_URL正确..."
    # 确保VITE_BASE_URL与vite.config.js一致
    grep -q "VITE_BASE_URL=/bjt/" .env.production.mock || echo "VITE_BASE_URL=/bjt/" >> .env.production.mock
fi

# 执行构建
echo "执行构建命令..."
npm run build-mock-skip-ts

# 检查dist目录中的index.html文件
if [ -f "dist/index.html" ]; then
    echo "检查并修正dist/index.html中的base标签..."
    # 使用sed替换base标签
    sed -i '' 's|<base href="/" />|<base href="/bjt/" />|g' dist/index.html
fi

echo "构建完成！"
echo "构建后的文件位于: ./dist 目录"
echo "请注意: 所有资源路径都已配置为 /bjt/ 前缀" 