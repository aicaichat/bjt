#!/bin/bash

# 验证参数
if [ $# -ne 1 ]; then
    echo "Usage: $0 <new_version>"
    echo "Example: $0 1.0.1"
    exit 1
fi

# 新版本号
NEW_VERSION=$1

# 验证版本格式
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "错误: 版本号格式不正确。请使用格式: X.Y.Z (例如: 1.0.1)"
    exit 1
fi

# 插件主文件
PLUGIN_FILE="bjt-product-admin.php"

# 检查文件是否存在
if [ ! -f "$PLUGIN_FILE" ]; then
    echo "错误: 找不到插件主文件: $PLUGIN_FILE"
    exit 1
fi

# 获取当前版本
CURRENT_VERSION=$(grep "Version:" "$PLUGIN_FILE" | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+")
if [ -z "$CURRENT_VERSION" ]; then
    echo "错误: 无法从文件中获取当前版本号"
    exit 1
fi

echo "当前版本: $CURRENT_VERSION"
echo "新版本: $NEW_VERSION"
echo

# 确认更新
read -p "确定要更新版本号吗? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 0
fi

# 更新主文件中的版本号
echo "更新 $PLUGIN_FILE 中的版本号..."
sed -i "" "s/Version: $CURRENT_VERSION/Version: $NEW_VERSION/" "$PLUGIN_FILE"
sed -i "" "s/define('BJT_PRODUCT_ADMIN_VERSION', '$CURRENT_VERSION');/define('BJT_PRODUCT_ADMIN_VERSION', '$NEW_VERSION');/" "$PLUGIN_FILE"

# 检查更新结果
if grep -q "Version: $NEW_VERSION" "$PLUGIN_FILE" && grep -q "define('BJT_PRODUCT_ADMIN_VERSION', '$NEW_VERSION');" "$PLUGIN_FILE"; then
    echo "✓ 版本号已更新到 $NEW_VERSION"
else
    echo "错误: 版本号更新失败"
    exit 1
fi

# 更新 readme.md 文件（如果存在）
if [ -f "README.md" ]; then
    echo "更新 README.md 中的版本号..."
    if grep -q "Version: $CURRENT_VERSION" "README.md"; then
        sed -i "" "s/Version: $CURRENT_VERSION/Version: $NEW_VERSION/" "README.md"
        echo "✓ README.md 中的版本号已更新"
    else
        echo "⚠️ README.md 中没有找到版本号标记"
    fi
fi

echo
echo "版本更新完成！请运行测试以确保插件正常工作。"
echo "然后可以使用 './package-plugin.sh' 打包新版本。" 