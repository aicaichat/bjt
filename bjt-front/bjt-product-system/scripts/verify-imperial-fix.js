#!/usr/bin/env node

/**
 * 验证PO页面英制单位切换修复
 * 检查OrderList页面是否正确传递spec_imperial和model_imperial字段
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 验证PO页面英制单位切换修复...\n');

// 检查OrderList页面的修复
const orderListPath = path.join(__dirname, '../frontend/src/pages/OrderList/index.tsx');

if (!fs.existsSync(orderListPath)) {
  console.error('❌ OrderList页面文件不存在');
  process.exit(1);
}

const orderListContent = fs.readFileSync(orderListPath, 'utf8');

// 检查是否包含spec_imperial和model_imperial字段
const hasSpecImperial = orderListContent.includes('spec_imperial: (item as any).spec_imperial');
const hasModelImperial = orderListContent.includes('model_imperial: (item as any).model_imperial');
const hasComment = orderListContent.includes('🔧 新增：添加imperial字段支持');

console.log('📋 OrderList页面修复检查:');
console.log(`   spec_imperial字段: ${hasSpecImperial ? '✅' : '❌'}`);
console.log(`   model_imperial字段: ${hasModelImperial ? '✅' : '❌'}`);
console.log(`   修复注释: ${hasComment ? '✅' : '❌'}`);

// 检查PO页面的getProductModel和getProductSpec函数
const poPagePath = path.join(__dirname, '../frontend/src/pages/PO/index.tsx');

if (!fs.existsSync(poPagePath)) {
  console.error('❌ PO页面文件不存在');
  process.exit(1);
}

const poPageContent = fs.readFileSync(poPagePath, 'utf8');

const hasGetProductModel = poPageContent.includes('const getProductModel = (product: UnifiedProduct)');
const hasGetProductSpec = poPageContent.includes('const getProductSpec = (product: UnifiedProduct)');
const hasImperialLogic = poPageContent.includes('product.model_imperial') && poPageContent.includes('product.spec_imperial');

console.log('\n📋 PO页面单位切换逻辑检查:');
console.log(`   getProductModel函数: ${hasGetProductModel ? '✅' : '❌'}`);
console.log(`   getProductSpec函数: ${hasGetProductSpec ? '✅' : '❌'}`);
console.log(`   imperial字段逻辑: ${hasImperialLogic ? '✅' : '❌'}`);

// 检查UnifiedProduct类型定义
const typesPath = path.join(__dirname, '../frontend/src/types/product.types.ts');

if (!fs.existsSync(typesPath)) {
  console.error('❌ 类型定义文件不存在');
  process.exit(1);
}

const typesContent = fs.readFileSync(typesPath, 'utf8');

const hasModelImperialType = typesContent.includes('model_imperial?: string');
const hasSpecImperialType = typesContent.includes('spec_imperial?: string');

console.log('\n📋 类型定义检查:');
console.log(`   model_imperial类型: ${hasModelImperialType ? '✅' : '❌'}`);
console.log(`   spec_imperial类型: ${hasSpecImperialType ? '✅' : '❌'}`);

// 生成测试报告
const allChecks = [
  hasSpecImperial,
  hasModelImperial,
  hasComment,
  hasGetProductModel,
  hasGetProductSpec,
  hasImperialLogic,
  hasModelImperialType,
  hasSpecImperialType
];

const passedChecks = allChecks.filter(check => check).length;
const totalChecks = allChecks.length;
const passRate = Math.round((passedChecks / totalChecks) * 100);

console.log('\n📊 修复验证总结:');
console.log(`   通过检查: ${passedChecks}/${totalChecks}`);
console.log(`   通过率: ${passRate}%`);

if (passRate === 100) {
  console.log('\n🎉 PO页面英制单位切换修复验证成功！');
  console.log('   ✅ OrderList页面正确传递imperial字段');
  console.log('   ✅ PO页面具备完整的单位切换逻辑');
  console.log('   ✅ 类型定义支持imperial字段');
} else if (passRate >= 75) {
  console.log('\n⚠️  修复基本完成，但仍有部分检查未通过');
  console.log('   建议检查未通过的项目并进行补充修复');
} else {
  console.log('\n❌ 修复验证失败，需要进一步检查和修复');
}

// 模拟数据流测试
console.log('\n🧪 模拟数据流测试:');

// 模拟API返回的数据
const mockApiData = {
  id: 1,
  code: "90R01258",
  name: "MEX-RH30-13-20-13-L",
  model: "MEX-RH30-13-20-13-L",
  model_imperial: "MEX-RH30-05-08-5-L",
  spec: "13um 30%HDPE Pillow, 20cmx13cm,1000m,150R/PL",
  spec_imperial: ".5mil 30%HDPE Pillow, 8\"x5.0\", 3281', 150R/PL",
  brand: "Lockedair",
  quantity: 1,
  price: 100.00
};

// 模拟OrderList页面的数据映射（修复后）
const mappedData = {
  id: mockApiData.id,
  code: mockApiData.code,
  name: mockApiData.name,
  quantity: mockApiData.quantity,
  price: mockApiData.price,
  specs: mockApiData.spec,
  spec: mockApiData.spec,
  spec_imperial: mockApiData.spec_imperial, // 🔧 新增
  model: mockApiData.model,
  model_imperial: mockApiData.model_imperial, // 🔧 新增
  brand: mockApiData.brand
};

// 模拟PO页面的单位切换逻辑
function getProductModel(product, preferredUnit = 'metric') {
  if (preferredUnit === 'imperial') {
    return product.model_imperial || product.model || '';
  }
  return product.model || product.model_imperial || '';
}

function getProductSpec(product, preferredUnit = 'metric') {
  if (preferredUnit === 'imperial') {
    return product.spec_imperial || product.spec || '';
  }
  return product.spec || product.spec_imperial || '';
}

const metricModel = getProductModel(mappedData, 'metric');
const imperialModel = getProductModel(mappedData, 'imperial');
const metricSpec = getProductSpec(mappedData, 'metric');
const imperialSpec = getProductSpec(mappedData, 'imperial');

console.log('   数据映射测试:');
console.log(`     包含spec_imperial: ${mappedData.spec_imperial ? '✅' : '❌'}`);
console.log(`     包含model_imperial: ${mappedData.model_imperial ? '✅' : '❌'}`);

console.log('   单位切换测试:');
console.log(`     公制型号: ${metricModel}`);
console.log(`     英制型号: ${imperialModel}`);
console.log(`     型号切换有效: ${metricModel !== imperialModel ? '✅' : '❌'}`);
console.log(`     公制规格: ${metricSpec.substring(0, 50)}...`);
console.log(`     英制规格: ${imperialSpec.substring(0, 50)}...`);
console.log(`     规格切换有效: ${metricSpec !== imperialSpec ? '✅' : '❌'}`);

console.log('\n✨ 修复验证完成！'); 