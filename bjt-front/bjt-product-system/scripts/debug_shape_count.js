// 调试Shape筛选计数问题
const fs = require('fs');
const path = require('path');

// 模拟数据库数据 (从SQL文件提取的48个产品)
const consumablesData = [
  // 从SQL文件中的数据
  {
    id: 1,
    model: 'MEX-RH30-13-20-13-L',
    app_model: 'LA-E4C,"LA-E4S V2.0"',
    bag_type: 'Pillow',
    shape: 'Pillow',
    material: '30% HDPE'
  },
  {
    id: 2,
    model: 'MEX-H-13-20-13-L',
    app_model: 'LA-E4C,"LA-E4S V2.0"',
    bag_type: 'Pillow',
    shape: 'Pillow',
    material: 'HDPE'
  },
  // ... 继续添加其他产品
];

// 根据SQL数据，我们应该有48个产品
const totalProducts = 48;

console.log('🔍 调试Shape筛选计数问题');
console.log('='.repeat(50));

// 1. 统计每种shape的数量
const shapeCountMap = new Map();
consumablesData.forEach(item => {
  if (item.shape) {
    const shape = item.shape.trim();
    shapeCountMap.set(shape, (shapeCountMap.get(shape) || 0) + 1);
  }
});

console.log('📊 Shape分布统计:');
shapeCountMap.forEach((count, shape) => {
  console.log(`  ${shape}: ${count}个产品`);
});

// 2. 计算总数的两种方式
const sumByAddition = Array.from(shapeCountMap.values()).reduce((sum, count) => sum + count, 0);
const actualTotal = consumablesData.length;

console.log('\n🧮 计数对比:');
console.log(`  通过相加子选项: ${sumByAddition}`);
console.log(`  实际产品总数: ${actualTotal}`);
console.log(`  预期产品总数: ${totalProducts}`);

// 3. 问题分析
if (sumByAddition === actualTotal) {
  console.log('\n✅ 计数逻辑正确！每个产品只属于一种shape');
} else {
  console.log('\n❌ 发现问题！');
  if (sumByAddition > actualTotal) {
    console.log('  → 存在重复计数，某些产品被计算了多次');
  } else {
    console.log('  → 存在漏计，某些产品没有被统计');
  }
}

// 4. 检查数据质量
console.log('\n🔍 数据质量检查:');
const withoutShape = consumablesData.filter(item => !item.shape);
if (withoutShape.length > 0) {
  console.log(`  ⚠️  发现 ${withoutShape.length} 个产品没有shape字段`);
  withoutShape.forEach(item => {
    console.log(`    - ${item.model}: shape="${item.shape}"`);
  });
} else {
  console.log('  ✅ 所有产品都有shape字段');
}

// 5. 修复建议
console.log('\n💡 修复建议:');
console.log('在SmartFilterSelect组件中，"全部"选项的计数应该使用:');
console.log('  ❌ 错误: options.reduce((sum, opt) => sum + opt.count, 0)');
console.log('  ✅ 正确: allConsumables.length (或传入正确的总数)');

module.exports = {
  shapeCountMap,
  sumByAddition,
  actualTotal,
  totalProducts
}; 