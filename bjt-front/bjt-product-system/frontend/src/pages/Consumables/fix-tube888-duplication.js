// 🔧 Tube888重复问题专项修复工具
// 基于用户报告的Tube888重复问题，提供针对性分析和修复

window.analyzeTube888Duplication = function() {
  console.log('🔍 [Tube888重复分析] 开始专项分析...');
  console.log('=====================================');
  
  // 检查数据可用性
  if (typeof allConsumables === 'undefined') {
    console.error('❌ allConsumables 数据未加载');
    return { error: '数据未加载' };
  }
  
  if (typeof filterOptions === 'undefined') {
    console.error('❌ filterOptions 未加载');
    return { error: 'API配置未加载' };
  }
  
  // 1. 分析数据库中的Tube相关形状
  console.log('📊 第一步：分析数据库中的Tube相关形状');
  const shapeStats = new Map();
  const tubeRelatedShapes = [];
  
  allConsumables.forEach(item => {
    if (item.shape) {
      const shape = item.shape.trim();
      shapeStats.set(shape, (shapeStats.get(shape) || 0) + 1);
      
      // 检查是否与Tube相关
      if (shape.toLowerCase().includes('tube') || shape.includes('888')) {
        tubeRelatedShapes.push({
          shape,
          item: {
            id: item.id,
            part_number: item.part_number,
            model: item.model
          }
        });
      }
    }
  });
  
  console.log('📈 数据库中的Tube相关形状:', Object.fromEntries(
    Array.from(shapeStats.entries()).filter(([shape]) => 
      shape.toLowerCase().includes('tube') || shape.includes('888')
    )
  ));
  
  // 2. 分析API配置中的Tube相关配置
  console.log('\n📋 第二步：分析API配置中的Tube相关配置');
  const apiShapeConfigs = filterOptions?.shapes || [];
  const tubeApiConfigs = [];
  
  apiShapeConfigs.forEach((config, index) => {
    const configValues = [
      config.id,
      config.name_en,
      config.name_zh,
      config.code,
      config.shape_name,
      config.category_name,
      config.name
    ].filter(Boolean);
    
    const isTubeRelated = configValues.some(value => 
      value.toLowerCase().includes('tube') || value.includes('888')
    );
    
    if (isTubeRelated) {
      tubeApiConfigs.push({
        index,
        ...config,
        matchingFields: configValues.filter(value => 
          value.toLowerCase().includes('tube') || value.includes('888')
        )
      });
    }
  });
  
  console.log('🔧 包含"tube"或"888"的API配置:', tubeApiConfigs);
  
  // 3. 模拟当前的形状匹配逻辑
  console.log('\n🔧 第三步：模拟当前的形状匹配逻辑');
  const simulatedMatches = [];
  const processedShapes = new Set();
  const matchedDbShapes = new Set();
  
  tubeApiConfigs.forEach(shapeConfig => {
    console.log(`\n处理API配置: ${shapeConfig.id} (${shapeConfig.name_en || shapeConfig.name_zh})`);
    
    const possibleIds = [
      shapeConfig.id,
      shapeConfig.name_en,
      shapeConfig.name_zh,
      shapeConfig.code
    ].filter(Boolean);
    
    console.log('  可能的匹配ID:', possibleIds);
    
    // 查找精确匹配
    let exactMatch = null;
    for (const id of possibleIds) {
      if (shapeStats.has(id) && !matchedDbShapes.has(id)) {
        exactMatch = {
          dbShape: id,
          count: shapeStats.get(id),
          matchingId: id,
          matchType: '精确匹配'
        };
        console.log(`  ✅ 找到精确匹配: ${id} (${exactMatch.count}个产品)`);
        break;
      }
    }
    
    if (exactMatch) {
      const finalShapeId = exactMatch.dbShape;
      
      if (!processedShapes.has(finalShapeId)) {
        console.log(`  ➕ 添加形状选项: ${finalShapeId}`);
        simulatedMatches.push({
          id: finalShapeId,
          name: shapeConfig.name_zh || shapeConfig.name_en || finalShapeId,
          count: exactMatch.count,
          source: 'API配置',
          apiConfig: shapeConfig.id,
          matchType: exactMatch.matchType
        });
        processedShapes.add(finalShapeId);
        matchedDbShapes.add(exactMatch.dbShape);
      } else {
        console.log(`  ⚠️  重复检测: ${finalShapeId} 已被处理过!`);
        console.log(`    这可能导致重复的形状选项!`);
      }
    } else {
      console.log(`  ❌ 未找到匹配: ${shapeConfig.id}`);
    }
  });
  
  // 4. 检查当前页面的实际形状选项
  console.log('\n🔄 第四步：检查当前页面的实际形状选项');
  let currentTubeOptions = [];
  
  if (typeof smartFilterOptions !== 'undefined' && smartFilterOptions.shapes) {
    currentTubeOptions = smartFilterOptions.shapes.filter(option => 
      option.id.toLowerCase().includes('tube') || 
      option.id.includes('888') ||
      option.name.toLowerCase().includes('tube') ||
      option.name.includes('888')
    );
    
    console.log('🔍 当前页面的Tube相关选项:', currentTubeOptions);
    console.log(`📊 Tube选项数量: ${currentTubeOptions.length}`);
    
    // 检查是否有重复
    const tubeIds = currentTubeOptions.map(opt => opt.id);
    const uniqueTubeIds = new Set(tubeIds);
    
    if (tubeIds.length > uniqueTubeIds.size) {
      console.log('🚨 发现重复的Tube选项!');
      const duplicateIds = tubeIds.filter((id, index) => tubeIds.indexOf(id) !== index);
      console.log('重复的ID:', [...new Set(duplicateIds)]);
    } else {
      console.log('✅ 未发现重复的Tube选项');
    }
  } else {
    console.log('❌ 当前形状选项数据未加载');
  }
  
  // 5. 生成修复建议
  console.log('\n💡 第五步：生成修复建议');
  const suggestions = [];
  
  if (currentTubeOptions.length > 1) {
    suggestions.push('检测到多个Tube选项，可能存在重复问题');
    
    // 检查是否有相同ID的选项
    const idCounts = new Map();
    currentTubeOptions.forEach(opt => {
      idCounts.set(opt.id, (idCounts.get(opt.id) || 0) + 1);
    });
    
    const duplicateIds = Array.from(idCounts.entries()).filter(([, count]) => count > 1);
    if (duplicateIds.length > 0) {
      suggestions.push(`发现重复ID: ${duplicateIds.map(([id]) => id).join(', ')}`);
      suggestions.push('建议：在generateShapeOptions函数中加强去重逻辑');
    }
  }
  
  if (tubeApiConfigs.length > 1) {
    suggestions.push(`发现${tubeApiConfigs.length}个Tube相关的API配置`);
    suggestions.push('建议：检查API配置是否有重复定义');
  }
  
  // 6. 返回分析结果
  const result = {
    analysis: {
      dbTubeShapes: Object.fromEntries(
        Array.from(shapeStats.entries()).filter(([shape]) => 
          shape.toLowerCase().includes('tube') || shape.includes('888')
        )
      ),
      apiTubeConfigs: tubeApiConfigs.length,
      simulatedMatches: simulatedMatches.length,
      currentTubeOptions: currentTubeOptions.length,
      hasDuplicates: currentTubeOptions.length > new Set(currentTubeOptions.map(opt => opt.id)).size
    },
    suggestions,
    details: {
      tubeApiConfigs,
      simulatedMatches,
      currentTubeOptions
    }
  };
  
  console.log('\n📊 分析总结:', result.analysis);
  console.log('💡 修复建议:', suggestions);
  
  return result;
};

// 快速Tube888检查函数
window.quickTube888Check = function() {
  console.log('🚀 快速Tube888检查...');
  
  if (typeof smartFilterOptions !== 'undefined' && smartFilterOptions.shapes) {
    const tube888Options = smartFilterOptions.shapes.filter(option => 
      option.id.includes('888') || 
      option.name.includes('888') ||
      (option.id.toLowerCase().includes('tube') && option.name.includes('888'))
    );
    
    console.log(`📊 Tube888选项数量: ${tube888Options.length}`);
    tube888Options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.name} (ID: ${option.id}, 数量: ${option.count})`);
    });
    
    if (tube888Options.length > 1) {
      console.log('⚠️  发现多个Tube888选项，可能存在重复!');
    } else if (tube888Options.length === 1) {
      console.log('✅ Tube888选项数量正常');
    } else {
      console.log('❓ 未找到Tube888选项');
    }
    
    return tube888Options;
  } else {
    console.log('❌ 形状选项数据未加载');
    return [];
  }
};

// 修复Tube888重复问题
window.fixTube888Duplication = function() {
  console.log('🛠️ 开始修复Tube888重复问题...');
  
  // 检查当前是否确实存在重复
  const tubeOptions = window.quickTube888Check();
  
  if (tubeOptions.length <= 1) {
    console.log('✅ 未发现Tube888重复问题，无需修复');
    return { success: true, message: '无需修复' };
  }
  
  console.log('🔧 检测到Tube888重复，应用修复...');
  
  // 生成修复后的形状选项生成函数
  const generateShapeOptionsFixed = () => {
    console.log('🔧 [修复] 使用优化的形状选项生成逻辑');
    
    if (typeof calculateCascadingOptions === 'undefined') {
      console.error('❌ calculateCascadingOptions 函数未找到');
      return [];
    }
    
    const availableItems = calculateCascadingOptions('selectedShape');
    const shapeCountMap = new Map();

    // 统计数据库中的形状
    availableItems.forEach(item => {
      if (item.shape) {
        const normalizedShape = item.shape.trim();
        shapeCountMap.set(normalizedShape, (shapeCountMap.get(normalizedShape) || 0) + 1);
      }
    });

    console.log('🔧 [修复] 数据库形状统计:', Object.fromEntries(shapeCountMap));

    const shapeOptions = [];
    const processedShapes = new Set();
    const matchedDbShapes = new Set(); // 防止同一数据库形状被多次匹配

    // 处理API配置 - 使用严格的精确匹配
    if (filterOptions?.shapes && Array.isArray(filterOptions.shapes)) {
      filterOptions.shapes.forEach(shapeConfig => {
        const possibleIds = [shapeConfig.id].filter(Boolean); // 🔥 只使用ID进行匹配，避免过度匹配
        
        console.log('🔧 [修复] 处理配置:', {
          configId: shapeConfig.id,
          possibleIds
        });
        
        // 严格的精确匹配
        let exactMatch = null;
        for (const id of possibleIds) {
          if (shapeCountMap.has(id) && !matchedDbShapes.has(id)) {
            exactMatch = {
              dbShape: id,
              count: shapeCountMap.get(id) || 0,
              matchType: '精确匹配'
            };
            console.log('✅ [修复] 精确匹配:', { 
              配置: shapeConfig.id, 
              数据库形状: id, 
              数量: exactMatch.count 
            });
            break;
          }
        }
        
        if (exactMatch) {
          const finalShapeId = exactMatch.dbShape;
          
          if (!processedShapes.has(finalShapeId)) {
            shapeOptions.push({
              id: finalShapeId,
              name: shapeConfig.name_zh || shapeConfig.name_en || finalShapeId,
              count: exactMatch.count,
              disabled: exactMatch.count === 0,
              originalData: {
                ...shapeConfig,
                matchType: exactMatch.matchType
              }
            });
            
            processedShapes.add(finalShapeId);
            matchedDbShapes.add(exactMatch.dbShape);
            
            console.log('➕ [修复] 添加形状选项:', finalShapeId);
          } else {
            console.log(`⚠️ [修复] 跳过重复: ${finalShapeId} (配置: ${shapeConfig.id})`);
          }
        }
      });
    }

    // 补充未匹配的数据库形状
    shapeCountMap.forEach((count, shapeId) => {
      if (!matchedDbShapes.has(shapeId) && !processedShapes.has(shapeId) && count > 0) {
        shapeOptions.push({
          id: shapeId,
          name: shapeId,
          count,
          disabled: false,
          originalData: {
            id: shapeId,
            source: '数据库补充'
          }
        });
        processedShapes.add(shapeId);
        console.log('➕ [修复] 补充形状:', shapeId);
      }
    });

    // 按数量排序
    shapeOptions.sort((a, b) => b.count - a.count);
    
    console.log('🔧 [修复] 最终形状选项:', shapeOptions);
    
    // 验证修复结果
    const tubeOptionsAfterFix = shapeOptions.filter(opt => 
      opt.id.includes('888') || opt.name.includes('888')
    );
    console.log(`🔍 [修复] 修复后Tube888选项数量: ${tubeOptionsAfterFix.length}`);
    
    return shapeOptions;
  };
  
  console.log('💡 修复建议已生成，请在代码中应用 generateShapeOptionsFixed 函数');
  
  return {
    success: true,
    message: 'Tube888重复修复逻辑已生成',
    fixedFunction: generateShapeOptionsFixed
  };
};

console.log('🔧 Tube888重复问题修复工具已加载');
console.log('📋 可用函数:');
console.log('  - analyzeTube888Duplication() : 深度分析Tube888重复原因');
console.log('  - quickTube888Check() : 快速检查当前Tube888选项');
console.log('  - fixTube888Duplication() : 生成修复方案'); 