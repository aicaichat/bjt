#!/bin/bash

# BJT产品管理系统 - 简化生产部署脚本
# 基于已验证的开发环境配置

set -e

echo "🚀 BJT产品管理系统 - 简化生产部署"
echo "=================================="

# 检查前端镜像是否存在
if ! docker images | grep -q "dev-frontend"; then
    echo "❌ 前端镜像不存在，请先构建前端镜像"
    echo "运行: cd frontend && docker build -f Dockerfile.dev -t dev-frontend:latest ."
    exit 1
fi

echo "✅ 前端镜像检查通过"

# 停止开发环境（避免端口冲突）
echo "🔄 停止开发环境服务..."
docker-compose -f docker/dev/docker-compose.nginx.yml stop 2>/dev/null || true

# 启动简化生产环境
echo "🚀 启动生产环境服务..."
docker-compose -f docker/prod/docker-compose.simple.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f docker/prod/docker-compose.simple.yml ps

# 测试服务
echo "🧪 测试服务..."
echo "1. 测试前端应用..."
if curl -s "http://localhost:5173" | grep -q "BJT products"; then
    echo "✅ 前端应用正常"
else
    echo "❌ 前端应用异常"
fi

echo "2. 测试API接口..."
if curl -s "http://localhost:8080/wp-json/bjt/v1/product-lines" | grep -q "success"; then
    echo "✅ API接口正常"
else
    echo "❌ API接口异常"
fi

echo ""
echo "🎉 部署完成！"
echo "=================================="
echo "📱 访问地址："
echo "  前端应用: http://localhost:5173"
echo "  WordPress管理: http://localhost:8080/wp-admin"
echo "  API接口: http://localhost:8080/wp-json/bjt/v1"
echo ""
echo "🔧 管理命令："
echo "  查看日志: docker-compose -f docker/prod/docker-compose.simple.yml logs -f"
echo "  停止服务: docker-compose -f docker/prod/docker-compose.simple.yml stop"
echo "  重启服务: docker-compose -f docker/prod/docker-compose.simple.yml restart"
echo "" 