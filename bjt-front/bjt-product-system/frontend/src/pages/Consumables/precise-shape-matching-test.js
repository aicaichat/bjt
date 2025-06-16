// 🎯 精准形状匹配测试验证脚本
// 验证形状筛选只使用精确匹配，不使用模糊匹配

window.testPreciseShapeMatching = function() {
  console.log('🎯 [精准匹配测试] 开始验证形状精确匹配逻辑...');
  console.log('=====================================');
  
  // 检查数据可用性
  if (typeof allConsumables === 'undefined') {
    console.error('❌ allConsumables 数据未加载');
    return;
  }
  
  if (typeof filterOptions === 'undefined') {
    console.error('❌ filterOptions 未加载');
    return;
  }
  
  // 1. 分析数据库中的形状数据
  console.log('📊 第一步：分析数据库中的真实形状数据');
  const shapeStats = new Map();
  
  allConsumables.forEach(item => {
    if (item.shape) {
      const shape = item.shape.trim();
      shapeStats.set(shape, (shapeStats.get(shape) || 0) + 1);
    }
  });
  
  console.log('📈 数据库中的形状统计:', Object.fromEntries(shapeStats));
  console.log(`📊 数据库中共有 ${shapeStats.size} 种不同的形状`);
  
  // 2. 分析API配置
  console.log('\n📋 第二步：分析API形状配置');
  const apiShapeConfigs = filterOptions?.shapes || [];
  console.log(`📊 API配置中共有 ${apiShapeConfigs.length} 个形状配置`);
  
  // 3. 测试精确匹配逻辑
  console.log('\n🎯 第三步：测试精确匹配逻辑');
  const matchResults = [];
  const matchedDbShapes = new Set();
  
  apiShapeConfigs.forEach((shapeConfig, index) => {
    const possibleIds = [
      shapeConfig.id,
      shapeConfig.name_en,
      shapeConfig.name_zh,
      shapeConfig.code
    ].filter(Boolean);
    
    console.log(`\n🔍 处理API配置 ${index + 1}:`, {
      id: shapeConfig.id,
      name_en: shapeConfig.name_en,
      name_zh: shapeConfig.name_zh,
      code: shapeConfig.code,
      possibleIds: possibleIds
    });
    
    // 精确匹配测试
    let exactMatch = null;
    for (const id of possibleIds) {
      if (shapeStats.has(id) && !matchedDbShapes.has(id)) {
        exactMatch = {
          apiConfig: shapeConfig,
          matchedId: id,
          dbShape: id,
          count: shapeStats.get(id),
          matchType: '精确匹配'
        };
        console.log(`✅ 精确匹配成功: ${id} -> ${exactMatch.count}个产品`);
        matchedDbShapes.add(id);
        break;
      }
    }
    
    if (!exactMatch) {
      console.log(`❌ 未找到精确匹配: ${shapeConfig.id}`);
      console.log(`   可能的ID: ${possibleIds.join(', ')}`);
      console.log(`   数据库中的形状: ${Array.from(shapeStats.keys()).join(', ')}`);
    }
    
    matchResults.push({
      configIndex: index,
      configId: shapeConfig.id,
      match: exactMatch,
      success: !!exactMatch
    });
  });
  
  // 4. 分析匹配结果
  console.log('\n📊 第四步：分析匹配结果');
  const successfulMatches = matchResults.filter(r => r.success);
  const failedMatches = matchResults.filter(r => !r.success);
  
  console.log(`✅ 成功匹配: ${successfulMatches.length}个`);
  console.log(`❌ 匹配失败: ${failedMatches.length}个`);
  console.log(`📊 匹配成功率: ${((successfulMatches.length / matchResults.length) * 100).toFixed(1)}%`);
  
  // 详细显示成功匹配
  if (successfulMatches.length > 0) {
    console.log('\n✅ 成功匹配详情:');
    successfulMatches.forEach(result => {
      const match = result.match;
      console.log(`  ${match.apiConfig.id} -> ${match.dbShape} (${match.count}个产品)`);
    });
  }
  
  // 详细显示匹配失败
  if (failedMatches.length > 0) {
    console.log('\n❌ 匹配失败详情:');
    failedMatches.forEach(result => {
      console.log(`  配置ID: ${result.configId} - 在数据库中找不到对应的形状`);
    });
  }
  
  // 5. 检查未匹配的数据库形状
  console.log('\n📋 第五步：检查未匹配的数据库形状');
  const unmatchedDbShapes = [];
  shapeStats.forEach((count, shape) => {
    if (!matchedDbShapes.has(shape)) {
      unmatchedDbShapes.push({ shape, count });
    }
  });
  
  if (unmatchedDbShapes.length > 0) {
    console.log('⚠️  数据库中有形状未被API配置覆盖:');
    unmatchedDbShapes.forEach(item => {
      console.log(`  ${item.shape} (${item.count}个产品)`);
    });
  } else {
    console.log('✅ 所有数据库形状都被API配置覆盖');
  }
  
  // 6. 验证bubble精确匹配
  console.log('\n🫧 第六步：专门验证bubble形状的精确匹配');
  const bubbleMatches = successfulMatches.filter(result => 
    result.match.dbShape.toLowerCase().includes('bubble')
  );
  
  console.log(`🫧 bubble相关的精确匹配: ${bubbleMatches.length}个`);
  bubbleMatches.forEach(result => {
    const match = result.match;
    console.log(`  ${match.apiConfig.id} (${match.apiConfig.name_zh || match.apiConfig.name_en}) -> ${match.dbShape} (${match.count}个产品)`);
  });
  
  // 7. 生成精确匹配报告
  console.log('\n📋 第七步：生成精确匹配报告');
  const report = {
    总API配置数: apiShapeConfigs.length,
    总数据库形状数: shapeStats.size,
    精确匹配成功数: successfulMatches.length,
    精确匹配失败数: failedMatches.length,
    匹配成功率: `${((successfulMatches.length / matchResults.length) * 100).toFixed(1)}%`,
    未覆盖的数据库形状数: unmatchedDbShapes.length,
    bubble精确匹配数: bubbleMatches.length,
    精确匹配优势: [
      '避免形状重复问题',
      '确保筛选结果精确性',
      '减少意外匹配',
      '提高用户体验'
    ]
  };
  
  console.log('📊 精确匹配报告:', report);
  
  console.log('\n=====================================');
  console.log('🎯 [精准匹配测试] 验证完成');
  
  return {
    success: true,
    matchResults,
    successfulMatches,
    failedMatches,
    unmatchedDbShapes,
    bubbleMatches,
    report
  };
};

// 快速验证精确匹配是否工作正常
window.quickPreciseMatchCheck = function() {
  console.log('🚀 快速精确匹配检查...');
  
  if (typeof smartFilterOptions !== 'undefined' && smartFilterOptions.shapes) {
    console.log(`📊 当前生成的形状选项数量: ${smartFilterOptions.shapes.length}`);
    
    // 检查是否有重复的形状
    const shapeIds = smartFilterOptions.shapes.map(s => s.id);
    const uniqueShapeIds = new Set(shapeIds);
    
    if (shapeIds.length === uniqueShapeIds.size) {
      console.log('✅ 形状选项无重复，精确匹配工作正常');
    } else {
      console.log('⚠️  发现重复的形状选项');
      const duplicates = shapeIds.filter((id, index) => shapeIds.indexOf(id) !== index);
      console.log('重复的形状ID:', [...new Set(duplicates)]);
    }
    
    // 特别检查bubble选项
    const bubbleOptions = smartFilterOptions.shapes.filter(option => 
      option.id.toLowerCase().includes('bubble') || 
      option.name.toLowerCase().includes('bubble')
    );
    console.log(`🫧 bubble选项数量: ${bubbleOptions.length}`);
    bubbleOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.name} (ID: ${option.id}, 数量: ${option.count})`);
    });
    
    return {
      totalShapes: smartFilterOptions.shapes.length,
      hasNoDuplicates: shapeIds.length === uniqueShapeIds.size,
      bubbleCount: bubbleOptions.length,
      bubbleOptions: bubbleOptions
    };
  } else {
    console.log('❌ 形状选项数据未加载');
    return null;
  }
};

console.log('🎯 精准形状匹配测试工具已加载');
console.log('使用方法:');
console.log('- testPreciseShapeMatching() : 完整的精确匹配验证');
console.log('- quickPreciseMatchCheck() : 快速检查精确匹配效果'); 