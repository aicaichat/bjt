#!/bin/bash

# 配置变量 - 请根据实际情况修改
WP_PATH="/path/to/wordpress"  # WordPress安装路径
APP_SUBDIR="bjt"              # 子目录名称
BUILD_DIR="dist"              # Vite构建目录

# 显示脚本开始
echo "========================================="
echo "BJT前端应用部署脚本"
echo "将应用部署到WordPress的/$APP_SUBDIR/子目录"
echo "========================================="

# 1. 确保已经构建应用
echo "1. 构建项目..."
echo "执行: npm run build-mock-skip-ts"
npm run build-mock-skip-ts

# 检查构建是否成功
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ 构建失败: $BUILD_DIR 目录不存在"
    exit 1
fi

# 2. 准备目标目录
echo "2. 准备WordPress子目录..."
BJT_DIR="$WP_PATH/$APP_SUBDIR"

# 检查是否有写入权限
if [ ! -w "$(dirname "$WP_PATH")" ]; then
    echo "❌ 错误: 没有WordPress目录的写入权限"
    echo "请使用sudo运行此脚本或修改目录权限"
    exit 1
fi

# 创建或清空目标目录
if [ -d "$BJT_DIR" ]; then
    echo "清空现有目录: $BJT_DIR"
    rm -rf "$BJT_DIR"/*
else
    echo "创建目录: $BJT_DIR"
    mkdir -p "$BJT_DIR"
fi

# 3. 复制文件
echo "3. 复制构建文件到WordPress目录..."
cp -r "$BUILD_DIR"/* "$BJT_DIR"/

# 4. 复制缺失的图像文件
echo "4. 确保images目录存在..."
if [ -d "public/images" ]; then
    mkdir -p "$BJT_DIR/images"
    cp -r public/images/* "$BJT_DIR/images/"
    echo "✓ 已复制图像文件"
else
    echo "⚠️ public/images目录不存在，请确保图像已包含在构建中"
fi

# 5. 设置权限
echo "5. 设置文件权限..."
find "$BJT_DIR" -type d -exec chmod 755 {} \;
find "$BJT_DIR" -type f -exec chmod 644 {} \;

# 6. 完成
echo "========================================="
echo "✓ 部署完成!"
echo "应用已部署到: $BJT_DIR"
echo "访问URL: http://your-wordpress-site/$APP_SUBDIR/"
echo "========================================="

# 7. Nginx配置提示
echo "Nginx配置参考:"
echo "
location /$APP_SUBDIR/ {
    alias $BJT_DIR/;
    try_files \$uri \$uri/ /$APP_SUBDIR/index.html;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control \"public, max-age=31536000\";
    }
}
"

# 如果没有服务器访问权限，创建可部署ZIP包
echo "创建可部署ZIP包..."
zip -r bjt-deployment.zip "$BUILD_DIR"/*
echo "✓ 生成的文件: bjt-deployment.zip"
echo "请将此文件解压到WordPress目录下的bjt子目录中" 