#!/bin/bash

# 比较开发环境和生产环境的诊断信息
# Compare diagnostic information between development and production environments

echo "=== BJT 环境诊断比较工具 ==="
echo "=== BJT Environment Diagnostic Comparison Tool ==="
echo

# 环境配置
DEV_URL="http://localhost:8080/wp-json/bjt/v1/diagnostic"
PROD_URL="https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic"

# 创建临时目录
TEMP_DIR="/tmp/bjt-diagnostic-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEMP_DIR"

echo "临时目录: $TEMP_DIR"
echo "Temporary directory: $TEMP_DIR"
echo

# 获取开发环境诊断信息
echo "🔍 获取开发环境诊断信息..."
echo "🔍 Fetching development environment diagnostic info..."
curl -s -o "$TEMP_DIR/dev-diagnostic.json" "$DEV_URL"
if [ $? -eq 0 ]; then
    echo "✅ 开发环境诊断信息获取成功"
    echo "✅ Development environment diagnostic info fetched successfully"
else
    echo "❌ 开发环境诊断信息获取失败"
    echo "❌ Failed to fetch development environment diagnostic info"
fi

# 获取生产环境诊断信息
echo "🔍 获取生产环境诊断信息..."
echo "🔍 Fetching production environment diagnostic info..."
curl -s -o "$TEMP_DIR/prod-diagnostic.json" "$PROD_URL"
if [ $? -eq 0 ]; then
    echo "✅ 生产环境诊断信息获取成功"
    echo "✅ Production environment diagnostic info fetched successfully"
else
    echo "❌ 生产环境诊断信息获取失败"
    echo "❌ Failed to fetch production environment diagnostic info"
fi

echo

# 检查文件是否存在并有内容
if [ ! -s "$TEMP_DIR/dev-diagnostic.json" ] || [ ! -s "$TEMP_DIR/prod-diagnostic.json" ]; then
    echo "❌ 诊断信息文件缺失或为空，无法进行比较"
    echo "❌ Diagnostic info files are missing or empty, cannot compare"
    
    # 显示错误详情
    echo
    echo "=== 开发环境响应 / Development Environment Response ==="
    cat "$TEMP_DIR/dev-diagnostic.json" 2>/dev/null || echo "文件不存在或为空"
    
    echo
    echo "=== 生产环境响应 / Production Environment Response ==="
    cat "$TEMP_DIR/prod-diagnostic.json" 2>/dev/null || echo "文件不存在或为空"
    
    exit 1
fi

# 格式化JSON输出
echo "📊 格式化诊断信息..."
echo "📊 Formatting diagnostic info..."
python3 -m json.tool "$TEMP_DIR/dev-diagnostic.json" > "$TEMP_DIR/dev-formatted.json" 2>/dev/null
python3 -m json.tool "$TEMP_DIR/prod-diagnostic.json" > "$TEMP_DIR/prod-formatted.json" 2>/dev/null

# 如果python3不可用，尝试使用jq
if [ ! -s "$TEMP_DIR/dev-formatted.json" ] || [ ! -s "$TEMP_DIR/prod-formatted.json" ]; then
    echo "尝试使用jq格式化..."
    jq . "$TEMP_DIR/dev-diagnostic.json" > "$TEMP_DIR/dev-formatted.json" 2>/dev/null
    jq . "$TEMP_DIR/prod-diagnostic.json" > "$TEMP_DIR/prod-formatted.json" 2>/dev/null
fi

# 如果格式化失败，使用原始文件
if [ ! -s "$TEMP_DIR/dev-formatted.json" ]; then
    cp "$TEMP_DIR/dev-diagnostic.json" "$TEMP_DIR/dev-formatted.json"
fi
if [ ! -s "$TEMP_DIR/prod-formatted.json" ]; then
    cp "$TEMP_DIR/prod-diagnostic.json" "$TEMP_DIR/prod-formatted.json"
fi

echo
echo "=== 🔍 关键差异分析 / Key Differences Analysis ==="
echo

# 提取关键信息进行比较
echo "📋 环境信息比较 / Environment Information Comparison"
echo "开发环境 WordPress 版本 / Dev WordPress Version:"
grep -o '"wordpress_version":"[^"]*"' "$TEMP_DIR/dev-diagnostic.json" | cut -d'"' -f4
echo "生产环境 WordPress 版本 / Prod WordPress Version:"
grep -o '"wordpress_version":"[^"]*"' "$TEMP_DIR/prod-diagnostic.json" | cut -d'"' -f4

echo
echo "开发环境 PHP 版本 / Dev PHP Version:"
grep -o '"php_version":"[^"]*"' "$TEMP_DIR/dev-diagnostic.json" | cut -d'"' -f4
echo "生产环境 PHP 版本 / Prod PHP Version:"
grep -o '"php_version":"[^"]*"' "$TEMP_DIR/prod-diagnostic.json" | cut -d'"' -f4

echo
echo "📂 文件校验和比较 / File Checksum Comparison"
echo "开发环境文件 / Dev Files:"
grep -A 20 '"file_checksums"' "$TEMP_DIR/dev-formatted.json" | head -30
echo
echo "生产环境文件 / Prod Files:"
grep -A 20 '"file_checksums"' "$TEMP_DIR/prod-formatted.json" | head -30

echo
echo "🔧 类状态比较 / Class Status Comparison"
echo "开发环境类 / Dev Classes:"
grep -A 10 '"class_status"' "$TEMP_DIR/dev-formatted.json" | head -20
echo
echo "生产环境类 / Prod Classes:"
grep -A 10 '"class_status"' "$TEMP_DIR/prod-formatted.json" | head -20

echo
echo "🧪 产品解析器测试结果 / Product Resolver Test Results"
echo "开发环境测试 / Dev Test:"
grep -A 10 '"product_resolver_test"' "$TEMP_DIR/dev-formatted.json" | head -15
echo
echo "生产环境测试 / Prod Test:"
grep -A 10 '"product_resolver_test"' "$TEMP_DIR/prod-formatted.json" | head -15

echo
echo "=== 📄 完整诊断报告 / Complete Diagnostic Reports ==="
echo
echo "开发环境完整报告保存至: $TEMP_DIR/dev-formatted.json"
echo "生产环境完整报告保存至: $TEMP_DIR/prod-formatted.json"
echo "Development environment full report saved to: $TEMP_DIR/dev-formatted.json"
echo "Production environment full report saved to: $TEMP_DIR/prod-formatted.json"

# 创建差异报告
echo
echo "=== 🔍 创建差异报告 / Creating Difference Report ==="
if command -v diff >/dev/null 2>&1; then
    diff -u "$TEMP_DIR/dev-formatted.json" "$TEMP_DIR/prod-formatted.json" > "$TEMP_DIR/differences.diff"
    if [ -s "$TEMP_DIR/differences.diff" ]; then
        echo "差异报告保存至: $TEMP_DIR/differences.diff"
        echo "Difference report saved to: $TEMP_DIR/differences.diff"
        echo
        echo "主要差异 / Key Differences:"
        head -50 "$TEMP_DIR/differences.diff"
    else
        echo "✅ 两个环境的诊断信息完全相同"
        echo "✅ Diagnostic information is identical between environments"
    fi
else
    echo "⚠️ diff命令不可用，无法创建差异报告"
    echo "⚠️ diff command not available, cannot create difference report"
fi

echo
echo "=== 🎯 建议的下一步操作 / Recommended Next Steps ==="
echo
echo "1. 检查文件校验和差异 / Check file checksum differences"
echo "2. 验证类加载状态 / Verify class loading status"
echo "3. 比较产品解析器测试结果 / Compare product resolver test results"
echo "4. 检查数据库连接和数据 / Check database connectivity and data"
echo
echo "详细报告文件位于: $TEMP_DIR"
echo "Detailed report files located at: $TEMP_DIR"
echo

# 快速测试PO API
echo "=== 🧪 快速PO API测试 / Quick PO API Test ==="
echo
echo "测试开发环境PO API..."
DEV_PO_URL="http://localhost:8080/wp-json/bjt/v1/orders"
curl -s "$DEV_PO_URL" | head -200 > "$TEMP_DIR/dev-po-test.json"

echo "测试生产环境PO API..."
PROD_PO_URL="https://eorder.lockedair.com/wp-json/bjt/v1/orders"
curl -s "$PROD_PO_URL" | head -200 > "$TEMP_DIR/prod-po-test.json"

echo "PO API测试结果保存至:"
echo "- 开发环境: $TEMP_DIR/dev-po-test.json"
echo "- 生产环境: $TEMP_DIR/prod-po-test.json"
echo

echo "=== ✅ 诊断完成 / Diagnostic Complete ===" 