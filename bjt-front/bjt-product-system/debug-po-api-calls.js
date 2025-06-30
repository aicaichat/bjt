#!/usr/bin/env node

/**
 * PO页面API调用问题调试脚本
 * 分析线上环境为什么显示价格为0.00的问题
 */

console.log('🔍 PO页面API调用问题调试分析\n');

// 模拟生产环境变量
const productionEnv = {
  'VITE_API_URL': '/wp-json/bjt/v1',
  'VITE_DATA_SOURCE': 'real-api',
  'VITE_USE_MOCK_DATA': 'false',
  'VITE_USE_MOCK_ORDERS': 'false',
  'VITE_FORCE_MOCK': 'false',
  'MODE': 'production',
  'PROD': 'true',
  'DEV': 'false'
};

console.log('📋 生产环境配置检查:');
Object.entries(productionEnv).forEach(([key, value]) => {
  console.log(`   ${key}: ${value}`);
});

console.log('\n🔍 问题分析:');

// 分析1: API配置逻辑
console.log('\n1. API配置逻辑分析:');
console.log('   ✅ API_CONFIG.BASE_URL:', productionEnv.VITE_API_URL);
console.log('   ✅ API_CONFIG.USE_MOCK_DATA: false (硬编码)');
console.log('   ✅ OrderService forceMock: false (硬编码)');

// 分析2: OrderService的Mock判断逻辑
console.log('\n2. OrderService Mock判断逻辑:');
const useMockOrders = productionEnv.VITE_USE_MOCK_ORDERS === 'true';
const forceMock = false; // 代码中硬编码为false
console.log(`   VITE_USE_MOCK_ORDERS: ${productionEnv.VITE_USE_MOCK_ORDERS} → ${useMockOrders}`);
console.log(`   forceMock (代码): ${forceMock}`);
console.log(`   最终使用Mock: ${forceMock || useMockOrders}`);

// 分析3: API调用失败回退逻辑
console.log('\n3. API调用失败回退分析:');
console.log('   🔄 当API调用失败时，OrderService会自动回退到Mock数据');
console.log('   📊 Mock数据中的价格都是0.00，这解释了为什么线上显示价格为0');

// 分析4: 可能的原因
console.log('\n4. 可能的原因:');
console.log('   ❌ 真实API调用失败 (网络/认证/服务器问题)');
console.log('   ❌ API端点不存在或返回错误');
console.log('   ❌ 数据传递过程中丢失价格信息');
console.log('   ❌ 前端数据处理逻辑问题');

// 分析5: 解决方案
console.log('\n5. 建议的解决方案:');
console.log('   1. 🔍 检查真实API是否正常工作');
console.log('   2. 🔧 添加更详细的API调用日志');
console.log('   3. 🛠️  修复Mock数据中的价格为真实价格');
console.log('   4. 📝 添加API调用失败的用户提示');
console.log('   5. 🔄 改进错误处理和重试机制');

// 分析6: 调试建议
console.log('\n6. 调试建议:');
console.log('   📱 在生产环境中打开浏览器开发者工具');
console.log('   🌐 检查Network面板中的API请求');
console.log('   📊 查看Console中的API调用日志');
console.log('   🔍 检查是否有错误信息或失败的请求');

console.log('\n🎯 修复优先级:');
console.log('   1. 高优先级: 检查API服务器状态和端点');
console.log('   2. 中优先级: 修复Mock数据价格');
console.log('   3. 低优先级: 改进错误处理和用户体验');

console.log('\n💡 快速修复建议:');
console.log('   如果API暂时无法修复，可以先更新Mock数据中的价格为真实价格');
console.log('   这样至少能确保PO页面显示正确的价格信息'); 