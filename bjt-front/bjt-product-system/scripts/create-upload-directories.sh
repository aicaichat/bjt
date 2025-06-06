#!/bin/bash

# 创建文件上传目录脚本
# 确保所有必要的文件上传目录都存在

echo "🗂️  创建文件上传目录..."

# 基础上传目录
BASE_DIR="frontend/public/uploads"

# 需要创建的目录列表
DIRECTORIES=(
    "$BASE_DIR"
    "$BASE_DIR/host"
    "$BASE_DIR/machines"
    "$BASE_DIR/machines/images"
    "$BASE_DIR/machines/pdfs"
    "$BASE_DIR/parts"
    "$BASE_DIR/parts/images"
    "$BASE_DIR/parts/pdfs"
    "$BASE_DIR/accessories"
    "$BASE_DIR/accessories/images"
    "$BASE_DIR/accessories/pdfs"
    "$BASE_DIR/spare-parts"
    "$BASE_DIR/spare-parts/images"
    "$BASE_DIR/spare-parts/pdfs"
    "$BASE_DIR/specifications"
    "$BASE_DIR/temp"
)

# 创建目录
for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "✅ 创建目录: $dir"
    else
        echo "ℹ️  目录已存在: $dir"
    fi
done

# 设置权限
echo ""
echo "🔒 设置目录权限..."
chmod -R 755 "$BASE_DIR"
echo "✅ 权限设置完成"

# 创建 .gitkeep 文件保持目录在git中
echo ""
echo "📝 创建 .gitkeep 文件..."
for dir in "${DIRECTORIES[@]}"; do
    if [ ! -f "$dir/.gitkeep" ]; then
        touch "$dir/.gitkeep"
        echo "✅ 创建 .gitkeep: $dir/.gitkeep"
    fi
done

# 显示目录结构
echo ""
echo "📁 目录结构预览:"
tree "$BASE_DIR" 2>/dev/null || ls -la "$BASE_DIR"

echo ""
echo "🎉 所有上传目录创建完成！" 