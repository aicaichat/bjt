#!/bin/bash
# 测试源站服务器（绕过CDN）

set -e

SERVER_IP="47.90.251.35"
TEST_URLS=(
    "/uploads/product_lines/Paper%20Cushioning%20Machine.jpg"
    "/uploads/product_lines/Water%20Activated%20Tape%20Dispenser.jpg"
    "/uploads/product-lines/images/Paper%20Cushioning%20Machine.jpg"
    "/uploads/product-lines/images/Water%20Activated%20Tape%20Dispenser.jpg"
)

echo "=== 测试源站服务器: $SERVER_IP ==="
echo ""

# 测试HTTP访问
echo "1. 测试HTTP访问（端口80）"
echo "----------------------------------------"
for url in "${TEST_URLS[@]}"; do
    echo ""
    echo "测试: http://$SERVER_IP$url"
    response=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "http://$SERVER_IP$url" 2>/dev/null || echo "000")
    if [ "$response" = "200" ]; then
        echo "  ✅ HTTP $response - 文件可访问"
        # 获取文件大小
        size=$(curl -s -I "http://$SERVER_IP$url" 2>/dev/null | grep -i "content-length" | awk '{print $2}' | tr -d '\r')
        if [ -n "$size" ]; then
            echo "  文件大小: $size bytes"
        fi
    elif [ "$response" = "404" ]; then
        echo "  ❌ HTTP $response - 文件不存在"
    elif [ "$response" = "000" ]; then
        echo "  ⚠️  连接失败或超时"
    else
        echo "  ⚠️  HTTP $response"
    fi
done

echo ""
echo "2. 测试HTTPS访问（端口443）"
echo "----------------------------------------"
for url in "${TEST_URLS[@]}"; do
    echo ""
    echo "测试: https://$SERVER_IP$url"
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -k "https://$SERVER_IP$url" 2>/dev/null || echo "000")
    if [ "$response" = "200" ]; then
        echo "  ✅ HTTP $response - 文件可访问"
        size=$(curl -s -I -k "https://$SERVER_IP$url" 2>/dev/null | grep -i "content-length" | awk '{print $2}' | tr -d '\r')
        if [ -n "$size" ]; then
            echo "  文件大小: $size bytes"
        fi
    elif [ "$response" = "404" ]; then
        echo "  ❌ HTTP $response - 文件不存在"
    elif [ "$response" = "000" ]; then
        echo "  ⚠️  连接失败或超时"
    else
        echo "  ⚠️  HTTP $response"
    fi
done

echo ""
echo "3. 对比CDN访问"
echo "----------------------------------------"
CDN_DOMAIN="eorder.lockedair.com"
for url in "${TEST_URLS[@]}"; do
    echo ""
    echo "CDN访问: https://$CDN_DOMAIN$url"
    cdn_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$CDN_DOMAIN$url" 2>/dev/null || echo "000")
    source_response=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "http://$SERVER_IP$url" 2>/dev/null || echo "000")
    
    if [ "$cdn_response" = "200" ] && [ "$source_response" = "200" ]; then
        echo "  ✅ CDN和源站都返回200"
    elif [ "$cdn_response" = "404" ] && [ "$source_response" = "200" ]; then
        echo "  ⚠️  CDN返回404，源站返回200 - 可能是CDN缓存问题！"
    elif [ "$cdn_response" = "200" ] && [ "$source_response" = "404" ]; then
        echo "  ⚠️  CDN返回200，源站返回404 - 异常情况"
    elif [ "$cdn_response" = "404" ] && [ "$source_response" = "404" ]; then
        echo "  ❌ CDN和源站都返回404 - 文件确实不存在"
    else
        echo "  CDN: $cdn_response, 源站: $source_response"
    fi
done

echo ""
echo "4. 检查响应头（CDN标识）"
echo "----------------------------------------"
echo "测试: https://$CDN_DOMAIN/uploads/product_lines/Paper%20Cushioning%20Machine.jpg"
echo ""
headers=$(curl -s -I "https://$CDN_DOMAIN/uploads/product_lines/Paper%20Cushioning%20Machine.jpg" 2>/dev/null | head -15)
echo "$headers" | grep -iE "(x-cache|via|server|cdn|age)" || echo "  未发现CDN相关头部"

echo ""
echo "=== 测试完成 ==="
echo ""
echo "结论："
echo "- 如果源站返回200，CDN返回404 → CDN缓存了404，需要刷新CDN缓存"
echo "- 如果源站和CDN都返回404 → 文件不存在，需要检查文件位置"
echo "- 如果源站和CDN都返回200 → 问题已解决"
