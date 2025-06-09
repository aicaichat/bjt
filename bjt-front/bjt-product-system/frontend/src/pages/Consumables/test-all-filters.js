// 测试Shape选项生成
const shapeCountMap = new Map();
consumables.forEach(item => {
  if (item.shape) {
    const normalizedShape = item.shape.trim();
    shapeCountMap.set(normalizedShape, (shapeCountMap.get(normalizedShape) || 0) + 1);
  }
});

console.log('📈 Shape选项:', Array.from(shapeCountMap.entries()).map(([shape, count]) => `${shape}(${count})`).join(', '));

// 测试Material选项生成
const materialCountMap = new Map();
consumables.forEach(item => {
  if (item.material) {
    materialCountMap.set(item.material, (materialCountMap.get(item.material) || 0) + 1);
  }
});

console.log('📈 Material选项:', Array.from(materialCountMap.entries()).map(([material, count]) => `${material}(${count})`).join(', '));

return {
  modelOptions: modelCountMap.size,
  shapeOptions: shapeCountMap.size,
  materialOptions: materialCountMap.size
};

// 测试筛选逻辑
function testFilterLogic(consumables) {
  console.log('\n🔍 测试筛选逻辑...');
  
  // 测试Shape筛选逻辑
  console.log('🎯 测试Shape筛选逻辑:');
  const pillowItems = consumables.filter(item => normalize(item.shape) === normalize('Pillow'));
  console.log(`  Pillow筛选结果: ${pillowItems.length}个产品`);
  
  // 测试Material筛选逻辑
  console.log('🧪 测试Material筛选逻辑:');
  const hdpeItems = consumables.filter(item => normalize(item.material) === normalize('50% HDPE'));
  console.log(`  50% HDPE筛选结果: ${hdpeItems.length}个产品`);
  
  // 测试Model筛选逻辑
  console.log('📋 测试Model筛选逻辑:');
  const laE4CItems = consumables.filter(item => {
    const models = parseAppModel(item.app_model);
    return models.includes('LA-E4C');
  });
  console.log(`  LA-E4C筛选结果: ${laE4CItems.length}个产品`);
  
  // 测试组合筛选
  console.log('🔄 测试组合筛选:');
  const comboItems = consumables.filter(item => {
    const models = parseAppModel(item.app_model);
    return models.includes('LA-E4C') && normalize(item.shape) === normalize('Pillow');
  });
  console.log(`  LA-E4C + Pillow组合: ${comboItems.length}个产品`);
  
  return {
    pillowItems: pillowItems.length,
    hdpeItems: hdpeItems.length,
    laE4CItems: laE4CItems.length,
    comboItems: comboItems.length
  };
} 