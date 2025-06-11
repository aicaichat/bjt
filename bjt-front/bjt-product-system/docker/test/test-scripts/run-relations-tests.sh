#!/bin/bash

# RelationsPage 测试执行脚本
# 基于真实数据库关系数据进行测试

set -e

echo "🚀 启动 RelationsPage 测试环境..."

# 等待服务启动
echo "⏳ 等待数据库和WordPress服务启动..."
./wait-for-services.sh

# 检查数据库连接
echo "🔍 检查数据库连接和测试数据..."
./check-database.sh

# 运行单元测试
echo "🧪 执行单元测试..."
npm run test -- --testPathPattern="relations" --coverage

# 运行集成测试
echo "🔗 执行集成测试..."
npm run test:integration -- --grep "RelationsPage"

# 运行E2E测试
echo "🎭 执行端到端测试..."
npm run test:e2e -- relations-page.spec.ts

# 运行真实数据验证测试
echo "📊 基于真实数据进行验证测试..."
./validate-real-data.sh

echo "✅ 所有RelationsPage测试完成！" 