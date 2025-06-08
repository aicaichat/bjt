// 在浏览器控制台运行此脚本来验证Model筛选修复效果
// 执行方法: 打开浏览器开发者工具，在Console中粘贴此代码并执行

console.log('🚀 开始验证Model筛选修复效果...');

// 验证API数据获取
async function testApiData() {
  try {
    const baseUrl = 'http://localhost:8080/wp-json/bjt/v1';
    const response = await fetch(`${baseUrl}/consumables?page=1&per_page=50`);
    const data = await response.json();
    
    console.log('📊 API数据获取测试:');
    console.log(`  ✅ HTTP状态: ${response.status}`);
    console.log(`  ✅ 数据格式: ${data.success ? '标准格式' : '简单格式'}`);
    
    let consumables = [];
    if (data.success && data.data) {
      consumables = Array.isArray(data.data.items) ? data.data.items : data.data;
    } else if (Array.isArray(data)) {
      consumables = data;
    }
    
    console.log(`  ✅ 解析到耗材数量: ${consumables.length}`);
    
    // 分析app_model字段分布
    const modelDistribution = {};
    consumables.forEach(item => {
      if (item.app_model) {
        const models = item.app_model.split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
        models.forEach(model => {
          if (model) {
            modelDistribution[model] = (modelDistribution[model] || 0) + 1;
          }
        });
      }
    });
    
    console.log('  ✅ 机型分布统计:', modelDistribution);
    
    return { consumables, modelDistribution };
  } catch (error) {
    console.error('❌ API数据获取失败:', error);
    return null;
  }
}

// 验证筛选逻辑
function testFilterLogic(consumables, targetModel) {
  const filtered = consumables.filter(item => {
    if (!item.app_model) return false;
    const appModels = item.app_model.split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
    return appModels.includes(targetModel);
  });
  
  console.log(`🔍 ${targetModel} 筛选测试:`);
  console.log(`  原始数据: ${consumables.length} 个耗材`);
  console.log(`  筛选结果: ${filtered.length} 个耗材`);
  console.log(`  匹配项目:`, filtered.map(item => ({
    id: item.id,
    name: item.model || item.part_number,
    app_model: item.app_model
  })));
  
  return filtered;
}

// 主测试函数
async function runCompleteTest() {
  console.log('🎯 开始完整的Model筛选修复验证...\n');
  
  // 1. 测试API数据获取
  const apiResult = await testApiData();
  if (!apiResult) {
    console.error('❌ 无法获取API数据，测试终止');
    return;
  }
  
  const { consumables, modelDistribution } = apiResult;
  
  // 2. 测试各个机型的筛选
  console.log('\n🔍 开始筛选逻辑测试:');
  const testModels = Object.keys(modelDistribution);
  
  testModels.forEach(model => {
    testFilterLogic(consumables, model);
  });
  
  // 3. 性能测试
  console.log('\n⚡ 性能测试:');
  const startTime = performance.now();
  for (let i = 0; i < 100; i++) {
    testModels.forEach(model => {
      testFilterLogic(consumables, model);
    });
  }
  const endTime = performance.now();
  console.log(`  ✅ 100次筛选总耗时: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`  ✅ 平均单次耗时: ${((endTime - startTime) / (100 * testModels.length)).toFixed(2)}ms`);
  
  // 4. 验证预期结果
  console.log('\n📈 预期结果验证:');
  const expectedDistribution = {
    'LA-E4C': 37,
    'LA-E4S V2.0': 40,
    'LA-E5P': 5,
    'LA-F2': 14,
    'LA-E4S(paper)': 2
  };
  
  let allMatched = true;
  Object.entries(expectedDistribution).forEach(([model, expected]) => {
    const actual = modelDistribution[model] || 0;
    const match = actual === expected;
    console.log(`  ${match ? '✅' : '❌'} ${model}: 期望${expected}, 实际${actual}`);
    if (!match) allMatched = false;
  });
  
  console.log(`\n🎉 测试总结: ${allMatched ? '✅ 完全匹配期望结果!' : '⚠️ 部分结果不匹配，可能需要检查数据'}`);
  
  return {
    success: allMatched,
    apiDataCount: consumables.length,
    modelDistribution: modelDistribution,
    expectedDistribution: expectedDistribution
  };
}

// 执行测试
runCompleteTest().then(result => {
  if (result) {
    console.log('\n✅ Model筛选修复验证完成!');
    console.log('结果已保存到 window.testResult');
    window.testResult = result;
  }
});

// 额外的调试函数
window.debugModelFilter = function(targetModel) {
  console.log(`🔍 调试模型筛选: ${targetModel}`);
  // 这里可以添加更多调试逻辑
}; 