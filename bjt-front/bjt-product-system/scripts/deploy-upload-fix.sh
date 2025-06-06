#!/bin/bash

# BJT生产环境文件上传功能修复部署脚本
# 用途：安全地将文件上传修复同步到生产环境

set -e  # 遇到错误立即退出

echo "🚀 开始部署BJT文件上传功能修复到生产环境..."

# 检查当前目录
if [ ! -f "docker/prod/docker-compose.prod.yml" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 备份当前配置
echo "📦 备份当前生产环境配置..."
cp docker/prod/docker-compose.prod.yml docker/prod/docker-compose.prod.yml.backup.$(date +%Y%m%d_%H%M%S)
cp nginx/conf.d/production.conf nginx/conf.d/production.conf.backup.$(date +%Y%m%d_%H%M%S)

echo "✅ 配置文件已备份"

# 检查生产环境服务状态
echo "🔍 检查生产环境服务状态..."
if docker compose -f docker/prod/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "⚠️  检测到生产环境正在运行"
    
    # 询问是否继续
    read -p "是否继续部署？这将重启服务 (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
    
    # 优雅停止服务
    echo "🛑 优雅停止生产环境服务..."
    docker compose -f docker/prod/docker-compose.prod.yml down --timeout 30
    
    echo "✅ 服务已停止"
else
    echo "ℹ️  生产环境服务未运行"
fi

# 确保上传目录存在
echo "📁 创建上传目录结构..."
mkdir -p frontend/public/uploads/machines/images
mkdir -p frontend/public/uploads/machines/pdfs
mkdir -p frontend/public/uploads/parts/images
mkdir -p frontend/public/uploads/accessories/images
mkdir -p frontend/public/uploads/spare_parts/images

echo "✅ 上传目录结构已创建"

# 重新启动生产环境
echo "🚀 启动生产环境服务..."
docker compose -f docker/prod/docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务健康状态
echo "🔍 检查服务健康状态..."
for i in {1..12}; do
    if docker compose -f docker/prod/docker-compose.prod.yml ps | grep -q "healthy"; then
        echo "✅ 服务启动成功"
        break
    fi
    
    if [ $i -eq 12 ]; then
        echo "❌ 服务启动超时，请检查日志"
        docker compose -f docker/prod/docker-compose.prod.yml logs --tail=50
        exit 1
    fi
    
    echo "⏳ 等待服务健康检查... ($i/12)"
    sleep 10
done

# 测试文件上传功能
echo "🧪 测试文件上传功能..."

# 检查上传目录是否可访问
if docker exec prod-wordpress-1 test -d /var/www/html/frontend/public/uploads; then
    echo "✅ 上传目录映射成功"
else
    echo "❌ 上传目录映射失败"
    exit 1
fi

# 检查nginx配置
if docker exec prod-nginx-1 nginx -t; then
    echo "✅ Nginx配置验证成功"
else
    echo "❌ Nginx配置验证失败"
    exit 1
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 部署摘要："
echo "   ✅ WordPress服务已添加frontend目录映射"
echo "   ✅ Nginx服务已添加frontend目录映射"
echo "   ✅ Nginx配置已添加/uploads/路由处理"
echo "   ✅ 上传目录结构已创建"
echo "   ✅ 服务健康检查通过"
echo ""
echo "🔗 现在可以测试文件上传功能："
echo "   - 图片上传：/wp-json/bjt/v1/upload/image"
echo "   - PDF上传：/wp-json/bjt/v1/upload/file"
echo "   - 文件访问：https://your-domain/uploads/..."
echo ""
echo "📝 如果遇到问题，可以使用备份文件回滚："
echo "   docker/prod/docker-compose.prod.yml.backup.*"
echo "   nginx/conf.d/production.conf.backup.*" 