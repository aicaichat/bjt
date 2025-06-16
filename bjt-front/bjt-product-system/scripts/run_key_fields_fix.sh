#!/bin/bash

# BJT产品管理系统 - 关键匹配字段修复执行脚本
# 用途：修复数据库中关键匹配字段的格式问题

echo "🚀 BJT产品管理系统 - 关键匹配字段修复"
echo "=========================================="

# 检查是否在正确的目录
if [ ! -f "scripts/fix_key_matching_fields.sql" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

echo "📋 修复内容："
echo "  1. 去除双引号包围问题"
echo "  2. 统一关键匹配字段格式"
echo "  3. 减少匹配字段中的空格"
echo "  4. 保持显示字段的可读性"
echo ""

# 确认执行
read -p "⚠️  此操作将修改数据库数据，是否已备份数据库？(y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ 请先备份数据库后再执行修复"
    exit 1
fi

echo ""
echo "🔧 开始执行修复..."

# 方法1: 使用docker-compose (生产环境)
echo "方法1: 生产环境修复"
echo "docker-compose -f docker/prod/docker-compose.prod.yml exec mysql mysql -u root -p bjt < scripts/fix_key_matching_fields.sql"
echo ""

# 方法2: 使用开发环境
echo "方法2: 开发环境修复"
echo "docker exec -i dev-mysql-1 mysql -u root -p bjt < scripts/fix_key_matching_fields.sql"
echo ""

# 方法3: 直接MySQL连接
echo "方法3: 直接MySQL连接"
echo "mysql -h localhost -u root -p bjt < scripts/fix_key_matching_fields.sql"
echo ""

echo "📊 修复后验证步骤："
echo "  1. 检查双引号是否完全清除"
echo "  2. 验证关键字段匹配功能"
echo "  3. 测试前端产品显示"
echo "  4. 确认搜索功能正常"
echo ""

echo "⚠️  注意事项："
echo "  - 修复过程中请勿中断"
echo "  - 修复后请全面测试系统功能"
echo "  - 如有问题请立即恢复备份"
echo ""

echo "✅ 脚本准备完成，请选择合适的方法执行修复SQL" 