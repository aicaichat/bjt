// 🔍 Bubble形状重复问题深度分析脚本
// 用于诊断为什么bubble形状选项出现三个的问题

window.debugBubbleDuplication = function() {
  console.log('🔍 [Bubble重复分析] 开始深度诊断...');
  console.log('=====================================');
  
  // 1. 检查基础数据是否可用
  if (typeof allConsumables === 'undefined') {
    console.error('❌ allConsumables 数据未加载，请确保在耗材页面运行此脚本');
    return;
  }
  
  if (typeof filterOptions === 'undefined') {
    console.error('❌ filterOptions 未加载，请确保API数据已获取');
    return;
  }
  
  // 2. 分析数据库中的bubble相关形状数据
  console.log('📊 第一步：分析数据库中的形状数据');
  const shapeStats = new Map();
  const bubbleRelatedShapes = [];
  
  allConsumables.forEach((item, index) => {
    if (item.shape) {
      const shape = item.shape.trim();
      shapeStats.set(shape, (shapeStats.get(shape) || 0) + 1);
      
      // 收集所有包含bubble的形状
      if (shape.toLowerCase().includes('bubble')) {
        bubbleRelatedShapes.push({
          index,
          id: item.id,
          shape: shape,
          part_number: item.part_number,
          app_model: item.app_model
        });
      }
    }
  });
  
  console.log('📈 数据库中所有形状统计:', Object.fromEntries(shapeStats));
  console.log('🫧 包含"bubble"的形状数据:', bubbleRelatedShapes.slice(0, 5)); // 只显示前5个避免过多输出
  
  // 3. 分析API返回的形状配置
  console.log('\n📋 第二步：分析API形状配置');
  const apiShapeConfigs = filterOptions?.shapes || [];
  const bubbleConfigs = [];
  
  apiShapeConfigs.forEach((config, index) => {
    console.log(`API形状配置 ${index + 1}:`, {
      id: config.id,
      name_en: config.name_en,
      name_zh: config.name_zh,
      code: config.code,
      shape_name: config.shape_name,
      category_name: config.category_name,
      image_url: config.image_url
    });
    
    // 检查是否与bubble相关
    const configValues = [
      config.id,
      config.name_en,
      config.name_zh,
      config.code,
      config.shape_name,
      config.category_name,
      config.name
    ].filter(Boolean);
    
    const isBubbleRelated = configValues.some(value => 
      value.toLowerCase().includes('bubble')
    );
    
    if (isBubbleRelated) {
      bubbleConfigs.push({
        index,
        ...config,
        matchingFields: configValues.filter(value => 
          value.toLowerCase().includes('bubble')
        )
      });
    }
  });
  
  console.log('🫧 包含"bubble"的API配置:', bubbleConfigs);
  
  // 4. 模拟generateShapeOptions的匹配逻辑
  console.log('\n🔧 第三步：模拟形状选项生成逻辑');
  const processedShapes = new Set();
  const simulatedShapeOptions = [];
  
  // 首先处理API配置
  apiShapeConfigs.forEach(shapeConfig => {
    const possibleIds = [
      shapeConfig.id,
      shapeConfig.name_en, 
      shapeConfig.name_zh,
      shapeConfig.shape_name,
      shapeConfig.category_name,
      shapeConfig.code,
      shapeConfig.name
    ].filter(Boolean);
    
    console.log(`\n🔍 处理形状配置:`, {
      原始配置: shapeConfig,
      可能的匹配ID: possibleIds
    });
    
    // 精确匹配
    let matchedCount = 0;
    let matchedShapeId = '';
    
    for (const id of possibleIds) {
      if (shapeStats.has(id)) {
        matchedCount = shapeStats.get(id);
        matchedShapeId = id;
        console.log(`✅ 精确匹配: ${id} -> ${matchedCount}个产品`);
        break;
      }
    }
    
    // 模糊匹配
    if (matchedCount === 0) {
      for (const [dbShape, count] of shapeStats.entries()) {
        for (const configId of possibleIds) {
          const normalizedDbShape = dbShape.toLowerCase().replace(/\s+/g, '');
          const normalizedConfigId = configId.toLowerCase().replace(/\s+/g, '');
          
          if (normalizedDbShape.includes(normalizedConfigId) || 
              normalizedConfigId.includes(normalizedDbShape)) {
            matchedCount = count;
            matchedShapeId = dbShape;
            console.log(`🔄 模糊匹配: ${dbShape} ↔ ${configId} -> ${count}个产品`);
            break;
          }
        }
        if (matchedCount > 0) break;
      }
    }
    
    const finalShapeId = matchedShapeId || shapeConfig.id;
    
    // 检查是否已处理过这个形状
    if (processedShapes.has(finalShapeId)) {
      console.log(`⚠️  重复检测: ${finalShapeId} 已被处理过!`);
      console.log(`   之前添加的选项:`, simulatedShapeOptions.find(opt => opt.id === finalShapeId));
      console.log(`   当前尝试添加:`, {
        id: finalShapeId,
        name: shapeConfig.name_zh || shapeConfig.name_en || finalShapeId,
        count: matchedCount,
        源配置: shapeConfig
      });
    } else {
      simulatedShapeOptions.push({
        id: finalShapeId,
        name: shapeConfig.name_zh || shapeConfig.name_en || shapeConfig.name || finalShapeId,
        count: matchedCount,
        source: 'API配置',
        originalConfig: shapeConfig
      });
      processedShapes.add(finalShapeId);
      console.log(`➕ 添加形状选项: ${finalShapeId} (${matchedCount}个产品)`);
    }
  });
  
  // 处理数据库中API未配置的形状
  shapeStats.forEach((count, shapeId) => {
    if (!processedShapes.has(shapeId) && count > 0) {
      simulatedShapeOptions.push({
        id: shapeId,
        name: shapeId,
        count,
        source: '数据库补充'
      });
      processedShapes.add(shapeId);
      console.log(`➕ 补充数据库形状: ${shapeId} (${count}个产品)`);
    }
  });
  
  // 5. 分析最终结果
  console.log('\n📊 第四步：分析最终结果');
  const bubbleOptions = simulatedShapeOptions.filter(option => 
    option.id.toLowerCase().includes('bubble') || 
    option.name.toLowerCase().includes('bubble')
  );
  
  console.log('🫧 最终的bubble相关选项:', bubbleOptions);
  console.log(`🔢 bubble选项总数: ${bubbleOptions.length}`);
  
  if (bubbleOptions.length > 1) {
    console.log('\n⚠️  发现bubble重复问题！');
    console.log('重复原因分析:');
    
    bubbleOptions.forEach((option, index) => {
      console.log(`\n选项 ${index + 1}:`);
      console.log(`  ID: ${option.id}`);
      console.log(`  名称: ${option.name}`);
      console.log(`  数量: ${option.count}`);
      console.log(`  来源: ${option.source}`);
      
      if (option.originalConfig) {
        console.log(`  原始配置:`, {
          id: option.originalConfig.id,
          name_en: option.originalConfig.name_en,
          name_zh: option.originalConfig.name_zh,
          code: option.originalConfig.code
        });
      }
    });
    
    // 提供修复建议
    console.log('\n🛠️  修复建议:');
    console.log('1. 检查API形状配置是否有重复的bubble定义');
    console.log('2. 检查形状匹配逻辑是否产生了多重匹配');
    console.log('3. 确保processedShapes的去重逻辑正确工作');
    console.log('4. 可能需要在API层面统一bubble的形状定义');
  } else {
    console.log('✅ bubble选项数量正常');
  }
  
  // 6. 与实际生成的选项对比（如果可用）
  if (typeof smartFilterOptions !== 'undefined' && smartFilterOptions.shapes) {
    console.log('\n🔄 第五步：与实际生成选项对比');
    const actualBubbleOptions = smartFilterOptions.shapes.filter(option => 
      option.id.toLowerCase().includes('bubble') || 
      option.name.toLowerCase().includes('bubble')
    );
    
    console.log('🫧 实际生成的bubble选项:', actualBubbleOptions);
    console.log(`📊 对比结果: 模拟${bubbleOptions.length}个 vs 实际${actualBubbleOptions.length}个`);
    
    if (bubbleOptions.length !== actualBubbleOptions.length) {
      console.log('⚠️  模拟结果与实际结果不一致，需要进一步分析代码逻辑');
    }
  }
  
  console.log('\n=====================================');
  console.log('🔍 [Bubble重复分析] 诊断完成');
  
  // 返回分析结果
  return {
    totalShapes: shapeStats.size,
    bubbleRelatedShapes: bubbleRelatedShapes.length,
    apiConfigs: apiShapeConfigs.length,
    bubbleConfigs: bubbleConfigs.length,
    simulatedOptions: simulatedShapeOptions.length,
    bubbleOptions: bubbleOptions.length,
    analysis: {
      hasMultipleBubbles: bubbleOptions.length > 1,
      bubbleOptions: bubbleOptions,
      suggestions: bubbleOptions.length > 1 ? [
        '检查API形状配置重复定义',
        '验证形状匹配逻辑',
        '确认去重机制有效',
        '统一bubble形状标识'
      ] : ['bubble选项正常']
    }
  };
};

// 快捷调用函数
window.quickBubbleCheck = function() {
  console.log('🚀 快速bubble检查...');
  
  if (typeof smartFilterOptions !== 'undefined' && smartFilterOptions.shapes) {
    const bubbleOptions = smartFilterOptions.shapes.filter(option => 
      option.id.toLowerCase().includes('bubble') || 
      option.name.toLowerCase().includes('bubble')
    );
    
    console.log(`🫧 当前bubble选项数量: ${bubbleOptions.length}`);
    bubbleOptions.forEach((option, index) => {
      console.log(`${index + 1}. ${option.name} (${option.count})`);
    });
    
    return bubbleOptions;
  } else {
    console.log('❌ 形状选项数据未加载');
    return [];
  }
};

console.log('🔧 Bubble重复诊断工具已加载');
console.log('使用方法:');
console.log('- debugBubbleDuplication() : 完整诊断分析');
console.log('- quickBubbleCheck() : 快速检查当前bubble选项'); 