#!/bin/bash

# BJT生产环境文件上传功能测试脚本

set -e

echo "🧪 测试BJT生产环境文件上传功能..."

# 配置
PROD_URL="https://bjt.nh.cool"  # 替换为你的生产域名
TEST_USERNAME="admin"
TEST_PASSWORD="password123"  # 替换为实际密码

# 创建测试文件
echo "📁 创建测试文件..."
echo "Test image content" > /tmp/test-prod-image.jpg
echo "Test PDF content" > /tmp/test-prod.pdf

# 获取JWT token
echo "🔑 获取认证token..."
TOKEN=$(curl -s -X POST "${PROD_URL}/wp-json/bjt/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"${TEST_USERNAME}\", \"password\": \"${TEST_PASSWORD}\"}" \
    | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
    echo "❌ 获取认证token失败"
    exit 1
fi

echo "✅ 认证token获取成功"

# 测试图片上传
echo "🖼️  测试图片上传..."
IMAGE_RESULT=$(curl -s -X POST "${PROD_URL}/wp-json/bjt/v1/upload/image" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@/tmp/test-prod-image.jpg" \
    -F "upload_dir=uploads/machines/images")

IMAGE_SUCCESS=$(echo "$IMAGE_RESULT" | jq -r '.success // false')
if [ "$IMAGE_SUCCESS" = "true" ]; then
    IMAGE_URL=$(echo "$IMAGE_RESULT" | jq -r '.data.url')
    echo "✅ 图片上传成功: $IMAGE_URL"
    
    # 测试图片访问
    if curl -s -f "${PROD_URL}${IMAGE_URL}" > /dev/null; then
        echo "✅ 图片文件可正常访问"
    else
        echo "❌ 图片文件无法访问"
    fi
else
    echo "❌ 图片上传失败:"
    echo "$IMAGE_RESULT" | jq .
fi

# 测试PDF上传
echo "📄 测试PDF上传..."
PDF_RESULT=$(curl -s -X POST "${PROD_URL}/wp-json/bjt/v1/upload/file" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@/tmp/test-prod.pdf" \
    -F "upload_dir=uploads/machines/pdfs")

PDF_SUCCESS=$(echo "$PDF_RESULT" | jq -r '.success // false')
if [ "$PDF_SUCCESS" = "true" ]; then
    PDF_URL=$(echo "$PDF_RESULT" | jq -r '.data.url')
    echo "✅ PDF上传成功: $PDF_URL"
    
    # 测试PDF访问
    if curl -s -f "${PROD_URL}${PDF_URL}" > /dev/null; then
        echo "✅ PDF文件可正常访问"
    else
        echo "❌ PDF文件无法访问"
    fi
else
    echo "❌ PDF上传失败:"
    echo "$PDF_RESULT" | jq .
fi

# 清理测试文件
rm -f /tmp/test-prod-image.jpg /tmp/test-prod.pdf

echo ""
echo "🎯 测试完成！"
echo ""
echo "📋 测试结果摘要："
echo "   图片上传: $([ "$IMAGE_SUCCESS" = "true" ] && echo "✅ 成功" || echo "❌ 失败")"
echo "   PDF上传:  $([ "$PDF_SUCCESS" = "true" ] && echo "✅ 成功" || echo "❌ 失败")"
echo ""

if [ "$IMAGE_SUCCESS" = "true" ] && [ "$PDF_SUCCESS" = "true" ]; then
    echo "🎉 所有测试通过！文件上传功能正常工作"
    exit 0
else
    echo "⚠️  部分测试失败，请检查配置"
    exit 1
fi 