#!/bin/bash

# 退出时清理资源
trap 'echo "脚本被中断，正在清理临时文件..."; cleanup; exit 1' INT TERM

# 插件基础信息
PLUGIN_NAME="bjt-product-admin"
PLUGIN_FILE="bjt-product-admin.php"
CURRENT_DIR=$(pwd)
PLUGIN_PATH="${CURRENT_DIR}"
DESTINATION_DIR="${CURRENT_DIR}"

# 从主文件中提取版本号
VERSION=$(grep "Version:" "${PLUGIN_PATH}/${PLUGIN_FILE}" | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+")
if [ -z "$VERSION" ]; then
    echo "无法从插件文件中获取版本号，使用默认版本1.0.0"
    VERSION="1.0.0"
fi

# 创建临时目录
TMP_DIR="/tmp/${PLUGIN_NAME}"
TMP_PLUGIN_DIR="${TMP_DIR}/${PLUGIN_NAME}"

# 清理函数
cleanup() {
    if [ -d "$TMP_DIR" ]; then
        rm -rf "$TMP_DIR"
    fi
}

# 开始打包
echo "========================================"
echo "开始打包 ${PLUGIN_NAME} v${VERSION}"
echo "========================================"

# 确保临时目录为空
cleanup
mkdir -p "$TMP_PLUGIN_DIR"

if [ ! -d "$TMP_PLUGIN_DIR" ]; then
    echo "错误：无法创建临时目录"
    exit 1
fi

# 复制文件到临时目录
echo "正在复制文件到临时目录..."
cp -r "${PLUGIN_PATH}/assets" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 assets 目录"
cp -r "${PLUGIN_PATH}/includes" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 includes 目录"
cp -r "${PLUGIN_PATH}/templates" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 templates 目录"
cp -r "${PLUGIN_PATH}/docs" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 docs 目录"
cp -r "${PLUGIN_PATH}/languages" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 languages 目录"

# 复制根目录文件
echo "正在复制根目录文件..."
cp "${PLUGIN_PATH}/${PLUGIN_FILE}" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 ${PLUGIN_FILE}"
cp "${PLUGIN_PATH}/uninstall.php" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 uninstall.php"
cp "${PLUGIN_PATH}/README.md" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 README.md"

# 检查是否存在LICENSE文件
if [ -f "${PLUGIN_PATH}/LICENSE" ]; then
    cp "${PLUGIN_PATH}/LICENSE" "$TMP_PLUGIN_DIR/" && echo "✓ 复制 LICENSE"
fi

# 创建打包目录（如果不存在）
PACKAGE_DIR="${DESTINATION_DIR}/packages"
mkdir -p "$PACKAGE_DIR"

# 执行打包
echo "正在创建zip文件..."
cd "$TMP_DIR" || { echo "错误：无法进入临时目录"; cleanup; exit 1; }

ZIP_FILE="${PACKAGE_DIR}/${PLUGIN_NAME}-${VERSION}.zip"
zip -r -q "$ZIP_FILE" "${PLUGIN_NAME}" || { echo "错误：打包失败"; cleanup; exit 1; }

# 清理
echo "正在清理临时文件..."
cleanup

# 检查生成的文件
if [ -f "$ZIP_FILE" ]; then
    SIZE=$(du -h "$ZIP_FILE" | cut -f1)
    echo "========================================"
    echo "打包成功！"
    echo "插件名称：${PLUGIN_NAME}"
    echo "插件版本：${VERSION}"
    echo "文件大小：${SIZE}"
    echo "文件位置：${ZIP_FILE}"
    echo "========================================"
else
    echo "错误：生成文件失败"
    exit 1
fi 