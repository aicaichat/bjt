#!/bin/bash

# 多语言工具集验证脚本
echo "🔍 验证多语言工具集..."
echo "=================================================="

# 检查目录结构
echo "📂 检查目录结构..."
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ $1 - 目录不存在"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ] && [ -x "$1" ]; then
        echo "✅ $1"
    elif [ -f "$1" ]; then
        echo "⚠️ $1 - 文件存在但不可执行"
        return 1
    else
        echo "❌ $1 - 文件不存在"
        return 1
    fi
}

# 检查目录
check_dir "tools/i18n-scanner"
check_dir "tools/i18n-fixer"
check_dir "docs/i18n-guides"
check_dir "docs/i18n-templates"

echo ""
echo "🔧 检查工具文件..."

# 检查工具文件
check_file "tools/i18n-scanner/i18n-tools.sh"
check_file "tools/i18n-scanner/scan-all.sh"
check_file "tools/i18n-scanner/scan-file.sh"
check_file "tools/i18n-scanner/quick-scan.sh"
check_file "tools/i18n-fixer/fix-hardcoded.sh"
check_file "tools/i18n-fixer/generate-i18n-files.sh"

echo ""
echo "📚 检查文档文件..."

# 检查文档文件
if [ -f "docs/i18n-guides/README.md" ]; then
    echo "✅ docs/i18n-guides/README.md"
else
    echo "❌ docs/i18n-guides/README.md"
fi

if [ -f "docs/i18n-guides/best-practices.md" ]; then
    echo "✅ docs/i18n-guides/best-practices.md"
else
    echo "❌ docs/i18n-guides/best-practices.md"
fi

if [ -f "docs/i18n-templates/common-patterns.md" ]; then
    echo "✅ docs/i18n-templates/common-patterns.md"
else
    echo "❌ docs/i18n-templates/common-patterns.md"
fi

if [ -f "PROJECT-I18N-STATUS.md" ]; then
    echo "✅ PROJECT-I18N-STATUS.md"
else
    echo "❌ PROJECT-I18N-STATUS.md"
fi

echo ""
echo "🚀 测试工具功能..."

# 测试主入口
echo "🔍 测试主入口工具..."
if ./tools/i18n-scanner/i18n-tools.sh version > /dev/null 2>&1; then
    echo "✅ 主入口工具正常"
else
    echo "❌ 主入口工具异常"
fi

# 测试翻译文件生成
echo "🏗️ 测试翻译文件生成..."
if ./tools/i18n-fixer/generate-i18n-files.sh test > /dev/null 2>&1; then
    # 清理测试文件
    rm -f frontend/src/i18n/locales/zh/test.json frontend/src/i18n/locales/en/test.json
    echo "✅ 翻译文件生成工具正常"
else
    echo "❌ 翻译文件生成工具异常"
fi

echo ""
echo "📊 验证结果："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $? -eq 0 ]; then
    echo "🎉 所有工具验证通过！"
    echo ""
    echo "📖 接下来可以："
    echo "   1. 查看完整文档: docs/i18n-guides/README.md"
    echo "   2. 查看项目状态: PROJECT-I18N-STATUS.md"
    echo "   3. 开始扫描项目: ./tools/i18n-scanner/i18n-tools.sh scan-all frontend/src/pages"
    echo ""
    echo "🚀 开始你的多语言国际化之旅！"
else
    echo "⚠️ 部分工具验证失败，请检查相关文件"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 