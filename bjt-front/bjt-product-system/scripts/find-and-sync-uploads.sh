#!/bin/bash
# 查找并同步uploads文件到服务器

set -e

cd /var/bjt/bjt/bjt-front/bjt-product-system

echo "=== 查找uploads文件 ==="
echo ""

# 1. 检查所有可能的位置
echo "1. 检查所有uploads目录"
echo "----------------------------------------"
find . -type d -name "uploads" 2>/dev/null | head -20

echo ""
echo "2. 查找包含'Paper'或'Cushioning'的文件"
echo "----------------------------------------"
find . -type f \( -iname "*paper*" -o -iname "*cushioning*" \) 2>/dev/null | head -20

echo ""
echo "3. 检查dist目录"
echo "----------------------------------------"
if [ -d "frontend/dist/uploads/product_lines" ]; then
    echo "  ✅ dist目录存在"
    ls -la frontend/dist/uploads/product_lines/ | head -10
else
    echo "  ❌ dist目录不存在"
fi

echo ""
echo "4. 检查备份目录"
echo "----------------------------------------"
if [ -d "backups" ]; then
    echo "  查找备份中的uploads文件："
    find backups -type f -iname "*paper*" -o -iname "*cushioning*" 2>/dev/null | head -10
else
    echo "  ⚠️  没有backups目录"
fi

echo ""
echo "=== 修复方案 ==="
echo ""

# 检查dist目录是否有文件
if [ -d "frontend/dist/uploads/product_lines" ] && [ "$(ls -A frontend/dist/uploads/product_lines 2>/dev/null)" ]; then
    echo "✅ 发现dist目录中有文件！"
    echo ""
    echo "可以："
    echo "1. 从dist目录复制到public目录"
    echo "   mkdir -p frontend/public/uploads/product_lines"
    echo "   cp -r frontend/dist/uploads/product_lines/* frontend/public/uploads/product_lines/"
    echo ""
    echo "2. 或者直接使用dist目录（需要修改Nginx配置）"
else
    echo "❌ 未找到文件"
    echo ""
    echo "需要："
    echo "1. 从开发机器同步文件到服务器"
    echo "2. 或者重新上传文件"
    echo "3. 或者从备份恢复"
fi
