// 耗材页面筛选功能测试脚本
// 在浏览器控制台中运行此脚本

console.log('🧪 开始测试耗材页面筛选功能...');

// 测试API数据获取
async function testApiData() {
  console.log('\n📡 测试API数据获取...');
  
  try {
    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/consumables?limit=10');
    const data = await response.json();
    
    console.log('✅ API响应成功');
    console.log(`📊 总数据量: ${data.data.total} 个耗材产品`);
    console.log(`📋 当前页数据: ${data.data.items.length} 个`);
    
    // 检查筛选选项
    const filterOptions = data.data.filterOptions;
    console.log('\n🔍 筛选选项统计:');
    console.log(`- 形状选项: ${filterOptions.shapes.length} 个`);
    console.log(`- 材质选项: ${filterOptions.materials.length} 个`);
    console.log(`- 机型选项: ${filterOptions.models.length} 个`);
    console.log(`- 厚度选项: ${filterOptions.thicknesses.length} 个`);
    console.log(`- 宽度选项: ${filterOptions.widths.length} 个`);
    console.log(`- 长度选项: ${filterOptions.lengths.length} 个`);
    
    // 显示形状选项详情
    console.log('\n🎯 形状选项详情:');
    filterOptions.shapes.forEach(shape => {
      console.log(`  - ${shape.id}: ${shape.name_en} (${shape.name_zh})`);
    });
    
    // 显示材质选项详情
    console.log('\n🧪 材质选项详情:');
    filterOptions.materials.forEach(material => {
      console.log(`  - ${material.id}: ${material.name}`);
    });
    
    // 显示机型选项详情
    console.log('\n🔧 机型选项详情:');
    filterOptions.models.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id}: ${model.name}`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ API测试失败:', error);
    return null;
  }
}

// 测试筛选功能
async function testFilterFunctionality() {
  console.log('\n🔍 测试筛选功能...');
  
  // 测试形状筛选
  console.log('\n1. 测试形状筛选 (MFC - Tube):');
  try {
    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/consumables?shape=MFC&limit=5');
    const data = await response.json();
    console.log(`✅ MFC形状筛选结果: ${data.data.items.length} 个产品`);
    
    // 验证筛选结果
    const allMFC = data.data.items.every(item => item.shape === 'MFC' || item.bag_type === 'MFC');
    console.log(`🎯 筛选准确性: ${allMFC ? '✅ 准确' : '❌ 不准确'}`);
  } catch (error) {
    console.error('❌ 形状筛选测试失败:', error);
  }
  
  // 测试材质筛选
  console.log('\n2. 测试材质筛选 (HDPE):');
  try {
    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/consumables?material=HDPE&limit=5');
    const data = await response.json();
    console.log(`✅ HDPE材质筛选结果: ${data.data.items.length} 个产品`);
    
    // 验证筛选结果
    const allHDPE = data.data.items.every(item => item.material && item.material.includes('HDPE'));
    console.log(`🎯 筛选准确性: ${allHDPE ? '✅ 准确' : '❌ 不准确'}`);
  } catch (error) {
    console.error('❌ 材质筛选测试失败:', error);
  }
  
  // 测试机型筛选
  console.log('\n3. 测试机型筛选 (LA-E4C):');
  try {
    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/consumables?app_model=LA-E4C&limit=5');
    const data = await response.json();
    console.log(`✅ LA-E4C机型筛选结果: ${data.data.items.length} 个产品`);
    
    // 验证筛选结果
    const allLA_E4C = data.data.items.every(item => 
      item.app_model && item.app_model.includes('LA-E4C')
    );
    console.log(`🎯 筛选准确性: ${allLA_E4C ? '✅ 准确' : '❌ 不准确'}`);
  } catch (error) {
    console.error('❌ 机型筛选测试失败:', error);
  }
  
  // 测试组合筛选
  console.log('\n4. 测试组合筛选 (MFC + HDPE):');
  try {
    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/consumables?shape=MFC&material=HDPE&limit=5');
    const data = await response.json();
    console.log(`✅ 组合筛选结果: ${data.data.items.length} 个产品`);
    
    // 验证筛选结果
    const validCombination = data.data.items.every(item => 
      (item.shape === 'MFC' || item.bag_type === 'MFC') && 
      item.material && item.material.includes('HDPE')
    );
    console.log(`🎯 筛选准确性: ${validCombination ? '✅ 准确' : '❌ 不准确'}`);
  } catch (error) {
    console.error('❌ 组合筛选测试失败:', error);
  }
}

// 测试前端页面状态
function testFrontendState() {
  console.log('\n🖥️ 测试前端页面状态...');
  
  // 检查是否在耗材页面
  const isConsumablesPage = window.location.pathname.includes('consumables') || 
                           document.title.includes('耗材') ||
                           document.querySelector('.consumables-page');
  
  console.log(`📍 当前页面: ${isConsumablesPage ? '✅ 耗材页面' : '❌ 非耗材页面'}`);
  
  if (isConsumablesPage) {
    // 检查筛选器元素
    const filterElements = {
      shapeFilter: document.querySelector('[data-testid="shape-filter"], .shape-selector, .smart-filter-select'),
      materialFilter: document.querySelector('[data-testid="material-filter"], .material-selector'),
      modelFilter: document.querySelector('[data-testid="model-filter"], .model-selector'),
      productList: document.querySelector('.products-container, .consumables-grid, [data-testid="product-list"]')
    };
    
    console.log('\n🔍 前端筛选器状态:');
    Object.entries(filterElements).forEach(([key, element]) => {
      console.log(`  - ${key}: ${element ? '✅ 存在' : '❌ 缺失'}`);
    });
    
    // 检查产品数据
    const productCards = document.querySelectorAll('.premium-consumable-card, .product-card, [data-testid="product-item"]');
    console.log(`\n📦 显示的产品数量: ${productCards.length} 个`);
    
    return {
      isConsumablesPage,
      filterElements,
      productCount: productCards.length
    };
  }
  
  return { isConsumablesPage: false };
}

// 主测试函数
async function runCompleteTest() {
  console.log('🚀 开始完整测试...\n');
  
  // 1. 测试API数据
  const apiData = await testApiData();
  
  // 2. 测试筛选功能
  await testFilterFunctionality();
  
  // 3. 测试前端状态
  const frontendState = testFrontendState();
  
  // 生成测试报告
  console.log('\n📋 测试报告总结:');
  console.log('================');
  
  if (apiData) {
    console.log('✅ API数据获取: 正常');
    console.log(`📊 数据量: ${apiData.data.total} 个产品`);
    console.log(`🔍 筛选选项: ${Object.keys(apiData.data.filterOptions).length} 种类型`);
  } else {
    console.log('❌ API数据获取: 失败');
  }
  
  console.log(`🖥️ 前端页面: ${frontendState.isConsumablesPage ? '正常' : '需要导航到耗材页面'}`);
  
  if (frontendState.isConsumablesPage) {
    console.log(`📦 显示产品: ${frontendState.productCount} 个`);
  }
  
  console.log('\n💡 建议操作:');
  if (!frontendState.isConsumablesPage) {
    console.log('1. 请导航到耗材页面 (http://localhost:5174/consumables)');
  }
  console.log('2. 测试各个筛选器的交互功能');
  console.log('3. 验证筛选结果的准确性');
  console.log('4. 检查tooltip显示是否正常');
  
  return {
    apiData,
    frontendState
  };
}

// 导出测试函数
window.testConsumablesFilters = runCompleteTest;
window.testApiData = testApiData;
window.testFilterFunctionality = testFilterFunctionality;
window.testFrontendState = testFrontendState;

console.log('✅ 测试脚本已加载！');
console.log('💡 使用方法:');
console.log('  - runCompleteTest() - 运行完整测试');
console.log('  - testApiData() - 仅测试API数据');
console.log('  - testFilterFunctionality() - 仅测试筛选功能');
console.log('  - testFrontendState() - 仅测试前端状态');
console.log('\n🚀 现在运行完整测试...');

// 自动运行测试
runCompleteTest(); 