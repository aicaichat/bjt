#!/bin/bash
# 诊断 Nginx 到 WordPress 的连接问题

echo "=== 诊断 Nginx -> WordPress 连接 ==="
echo ""

echo "步骤 1: 检查 WordPress 是否真的在监听..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress netstat -tlnp 2>/dev/null || \
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress ss -tlnp 2>/dev/null

echo ""
echo "步骤 2: 从 Nginx 容器内部测试 WordPress..."
echo "----------------------------"
echo "2.1) Ping WordPress 主机名:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T nginx ping -c 3 wordpress 2>&1 || echo "Ping 失败"

echo ""
echo "2.2) 测试 WordPress 端口 80:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T nginx nc -zv wordpress 80 2>&1 || echo "端口不可达"

echo ""
echo "2.3) 使用 curl 测试:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T nginx curl -v http://wordpress/ 2>&1 | head -40

echo ""
echo ""
echo "步骤 3: 检查 Nginx 配置中的 upstream..."
echo "----------------------------"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T nginx cat /etc/nginx/conf.d/default.conf | grep -A 10 "upstream\|proxy_pass" | head -30

echo ""
echo ""
echo "步骤 4: 检查 WordPress 内部访问..."
echo "----------------------------"
echo "4.1) 从 WordPress 容器内部访问自己:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress curl -I http://localhost/ 2>&1 | head -10

echo ""
echo "4.2) WordPress PHP-FPM 进程:"
docker-compose -f docker/prod/docker-compose.prod.yml --env-file .env.production exec -T wordpress ps aux | grep -E "apache|php" | head -10

echo ""
echo ""
echo "步骤 5: 检查 Docker 网络..."
echo "----------------------------"
docker network inspect prod_bjt_network --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}' 2>/dev/null

echo ""
echo ""
echo "步骤 6: 查看 Nginx 错误日志..."
echo "----------------------------"
docker logs prod_nginx_1 --tail=50 2>&1 | grep -iE "error|upstream|wordpress|502"

echo ""
echo ""
echo "步骤 7: 查看 WordPress 访问日志..."
echo "----------------------------"
docker logs prod_wordpress_1 --tail=30 2>&1 | grep -E "GET|POST"

echo ""
echo ""
echo "=== 诊断完成 ==="
echo ""

echo "💡 可能的原因:"
echo "1. Nginx 配置中的 upstream 主机名或端口错误"
echo "2. WordPress 没有真正监听在 80 端口"
echo "3. Docker 网络配置问题"
echo "4. Nginx 连接超时设置太短"

