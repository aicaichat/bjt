#!/bin/bash
# 修复 Nginx upstream IP 地址问题

echo "=== 修复 Nginx upstream 连接 ==="
echo ""

echo "步骤 1: 检查当前 IP 地址..."
echo "----------------------------"
echo "WordPress 当前 IP:"
docker inspect prod_wordpress_1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

echo ""
echo "Nginx 当前 IP:"
docker inspect prod_nginx_1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

echo ""
echo ""
echo "步骤 2: 重启 Nginx 以刷新 DNS 解析..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production restart nginx

echo ""
echo "等待 Nginx 重启（15秒）..."
sleep 15

echo ""
echo "步骤 3: 验证 Nginx 状态..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production ps nginx

echo ""
echo ""
echo "步骤 4: 从 Nginx 测试 WordPress 连接..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T nginx curl -s -I http://wordpress/ 2>&1 | head -10

echo ""
echo ""
echo "步骤 5: 测试外部访问..."
echo "----------------------------"

echo "5.1) 测试诊断端点:"
RESPONSE=$(curl -s -I https://eorder.lockedair.com/wp-json/bjt/v1/diagnostic 2>&1)
echo "$RESPONSE" | head -5

if echo "$RESPONSE" | grep -q "200 OK"; then
    echo "✅ 诊断端点正常"
else
    echo "❌ 诊断端点失败"
fi

echo ""
echo "5.2) 测试登录端点:"
LOGIN_RESPONSE=$(curl -s -X POST https://eorder.lockedair.com/wp-json/bjt/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"BJTeorder601"}')

echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

echo ""
echo ""

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "🎉🎉🎉 登录成功！系统已完全恢复！ 🎉🎉🎉"
    echo ""
    echo "登录凭据:"
    echo "  用户名: admin"
    echo "  密码: BJTeorder601"
    echo ""
    echo "✅ 数据库: 正常"
    echo "✅ WordPress: 正常"
    echo "✅ Nginx: 正常"
    echo "✅ API: 正常"
    echo ""
    echo "⚠️  注意: 所有上传的图片已丢失，需要重新上传"
elif echo "$LOGIN_RESPONSE" | grep -q "502"; then
    echo "❌ 仍然 502 错误"
    echo ""
    echo "查看最新的 Nginx 错误:"
    docker logs prod_nginx_1 --tail=10 2>&1 | grep error
else
    echo "⚠️  登录失败，但没有 502 错误"
    echo "可能是密码错误或其他问题"
fi

echo ""
echo "=== 修复完成 ==="

