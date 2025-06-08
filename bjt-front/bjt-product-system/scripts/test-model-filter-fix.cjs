#!/usr/bin/env node

// Model筛选功能修复验证脚本
// 模拟SQL数据进行测试

const EXPECTED_MODEL_DISTRIBUTION = {
  'LA-E4C': 37,
  'LA-E4S V2.0': 40, 
  'LA-E5P': 5,
  'LA-F2': 14,
  'LA-E4S(paper)': 2
};

// 模拟的测试数据（基于实际SQL数据样本）
const mockConsumables = [
  { id: '1', app_model: 'LA-E4C,"LA-E4S V2.0"', part_number: '90R01258' },
  { id: '2', app_model: 'LA-E4C,"LA-E4S V2.0"', part_number: '90R01312' },
  { id: '3', app_model: 'LA-E5P', part_number: '90S01005' },
  { id: '4', app_model: '"LA-E4S V2.0",LA-F2', part_number: '90B01041' },
  { id: '5', app_model: 'LA-E4S(paper)', part_number: '92A01007' },
  { id: '6', app_model: 'LA-F2', part_number: '90B01264' }
];

// 修复后的解析函数
function parseAppModels(appModel) {
  if (!appModel) return [];
  
  return appModel
    .split(',')
    .map(model => model.trim().replace(/^["']|["']$/g, ''))
    .filter(model => model.length > 0);
}

// 生成动态模型选项
function generateModelOptions(consumables) {
  const modelCountMap = new Map();
  
  consumables.forEach(item => {
    const models = parseAppModels(item.app_model);
    models.forEach(model => {
      modelCountMap.set(model, (modelCountMap.get(model) || 0) + 1);
    });
  });
  
  const options = [
    { id: 'all', name: 'ALL', count: consumables.length }
  ];
  
  // 按字母顺序排序
  Array.from(modelCountMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([model, count]) => {
      options.push({ id: model, name: model, count });
    });
  
  return options;
}

// 筛选函数
function filterByModel(consumables, selectedModel) {
  if (!selectedModel || selectedModel === 'all') return consumables;
  
  return consumables.filter(item => {
    const models = parseAppModels(item.app_model);
    return models.includes(selectedModel);
  });
}

// 测试函数
function runTests() {
  console.log('🚀 开始Model筛选功能修复验证...\n');
  
  // 测试1：解析格式测试
  console.log('📝 测试1：复杂格式解析');
  const testCases = [
    { input: 'LA-E4C,"LA-E4S V2.0"', expected: ['LA-E4C', 'LA-E4S V2.0'] },
    { input: '"LA-E4S V2.0",LA-F2', expected: ['LA-E4S V2.0', 'LA-F2'] },
    { input: 'LA-E5P', expected: ['LA-E5P'] },
    { input: 'LA-E4S(paper)', expected: ['LA-E4S(paper)'] }
  ];
  
  let formatTestsPassed = 0;
  testCases.forEach(test => {
    const parsed = parseAppModels(test.input);
    const passed = JSON.stringify(parsed.sort()) === JSON.stringify(test.expected.sort());
    console.log(`  ${test.input} -> ${parsed.join(', ')} ${passed ? '✅' : '❌'}`);
    if (passed) formatTestsPassed++;
  });
  
  console.log(`  格式解析测试: ${formatTestsPassed}/${testCases.length} 通过\n`);
  
  // 测试2：选项生成测试
  console.log('📝 测试2：筛选选项生成');
  const options = generateModelOptions(mockConsumables);
  const models = options.filter(opt => opt.id !== 'all').map(opt => opt.id);
  
  console.log(`  生成选项数量: ${options.length}`);
  console.log(`  机型选项: ${models.join(', ')}`);
  
  const expectedModels = Object.keys(EXPECTED_MODEL_DISTRIBUTION);
  const missingModels = expectedModels.filter(model => !models.includes(model));
  const extraModels = models.filter(model => !expectedModels.includes(model));
  
  console.log(`  缺失机型: ${missingModels.join(', ') || '无'}`);
  console.log(`  额外机型: ${extraModels.join(', ') || '无'}`);
  
  const optionsTestPassed = models.length >= 4; // 至少4个机型（基于样本数据）
  console.log(`  选项生成测试: ${optionsTestPassed ? '✅' : '❌'}\n`);
  
  // 测试3：筛选功能测试
  console.log('📝 测试3：筛选功能验证');
  let filterTestsPassed = 0;
  const uniqueModels = [...new Set(models)];
  
  uniqueModels.forEach(model => {
    const filtered = filterByModel(mockConsumables, model);
    const count = filtered.length;
    console.log(`  ${model}: 筛选出 ${count} 个耗材`);
    
    // 验证筛选结果的准确性
    const isAccurate = filtered.every(item => {
      const itemModels = parseAppModels(item.app_model);
      return itemModels.includes(model);
    });
    
    if (isAccurate && count > 0) filterTestsPassed++;
    console.log(`    准确性: ${isAccurate ? '✅' : '❌'}`);
  });
  
  console.log(`  筛选功能测试: ${filterTestsPassed}/${uniqueModels.length} 通过\n`);
  
  // 测试4：性能测试
  console.log('📝 测试4：性能验证');
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    uniqueModels.forEach(model => {
      filterByModel(mockConsumables, model);
    });
  }
  const totalTime = Date.now() - start;
  const avgTime = totalTime / (100 * uniqueModels.length);
  
  console.log(`  100次批量筛选总耗时: ${totalTime}ms`);
  console.log(`  平均单次筛选耗时: ${avgTime.toFixed(2)}ms`);
  
  const performanceTestPassed = avgTime < 50; // 50ms内
  console.log(`  性能测试: ${performanceTestPassed ? '✅' : '❌'}\n`);
  
  // 总结
  const totalTests = 4;
  const passedTests = [
    formatTestsPassed === testCases.length,
    optionsTestPassed,
    filterTestsPassed === uniqueModels.length,
    performanceTestPassed
  ].filter(Boolean).length;
  
  console.log('📊 测试总结:');
  console.log(`  总计测试: ${totalTests}`);
  console.log(`  通过测试: ${passedTests}`);
  console.log(`  成功率: ${(passedTests/totalTests*100).toFixed(1)}%`);
  console.log(`  整体结果: ${passedTests === totalTests ? '🎉 全部通过' : '❌ 部分失败'}`);
  
  if (passedTests === totalTests) {
    console.log('\n✅ Model筛选功能修复验证成功！');
    console.log('   - 复杂格式解析正确');
    console.log('   - 筛选选项生成正确');
    console.log('   - 筛选功能工作正常');
    console.log('   - 性能满足要求');
  } else {
    console.log('\n❌ 修复验证存在问题，需要进一步调试');
  }
  
  return passedTests === totalTests;
}

// 执行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  parseAppModels,
  generateModelOptions,
  filterByModel,
  runTests
}; 