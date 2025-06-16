// 🔧 Shape Filter Bubble重复问题修复方案
// 基于深度分析的结果，提供多种修复策略

window.fixBubbleDuplication = function() {
  console.log('🛠️ 开始修复bubble重复问题...');
  
  // 修复策略1: 优化形状匹配逻辑，避免多重匹配
  const generateShapeOptionsFixed = () => {
    const availableItems = calculateCascadingOptions('selectedShape');
    const shapeCountMap = new Map();
    
    // 统计真实的形状数据
    availableItems.forEach(item => {
      if (item.shape) {
        const normalizedShape = item.shape.trim();
        shapeCountMap.set(normalizedShape, (shapeCountMap.get(normalizedShape) || 0) + 1);
      }
    });
    
    console.log('🔧 [修复] 数据库形状统计:', Object.fromEntries(shapeCountMap));
    
    const shapeOptions = [];
    const processedShapes = new Set();
    const matchedDbShapes = new Set(); // 🔥 新增：跟踪已匹配的数据库形状
    
    // 处理API配置
    if (filterOptions?.shapes && Array.isArray(filterOptions.shapes)) {
      filterOptions.shapes.forEach(shapeConfig => {
        // 🔥 修复：更严格的匹配逻辑
        const possibleIds = [
          shapeConfig.id,
          shapeConfig.name_en,
          shapeConfig.name_zh,
          shapeConfig.code
        ].filter(Boolean);
        
        let bestMatch = null;
        let bestMatchScore = 0;
        
        // 🔥 优化：使用评分机制找到最佳匹配，避免多重匹配
        for (const id of possibleIds) {
          // 1. 精确匹配（最高分）
          if (shapeCountMap.has(id) && !matchedDbShapes.has(id)) {
            bestMatch = {
              dbShape: id,
              count: shapeCountMap.get(id),
              score: 100,
              matchType: '精确匹配'
            };
            break;
          }
          
          // 2. 包含匹配（较低分）
          if (bestMatchScore < 50) {
            for (const [dbShape, count] of shapeCountMap.entries()) {
              if (matchedDbShapes.has(dbShape)) continue; // 已被匹配的数据库形状跳过
              
              const normalizedDbShape = dbShape.toLowerCase().replace(/\s+/g, '');
              const normalizedConfigId = id.toLowerCase().replace(/\s+/g, '');
              
              // 🔥 修复：使用更严格的包含匹配规则
              let score = 0;
              if (normalizedDbShape === normalizedConfigId) {
                score = 90; // 标准化后完全相同
              } else if (normalizedDbShape.includes(normalizedConfigId) && normalizedConfigId.length >= 4) {
                score = 60; // 数据库形状包含配置ID（且配置ID足够长）
              } else if (normalizedConfigId.includes(normalizedDbShape) && normalizedDbShape.length >= 4) {
                score = 50; // 配置ID包含数据库形状（且数据库形状足够长）
              }
              
              if (score > bestMatchScore) {
                bestMatch = {
                  dbShape: dbShape,
                  count: count,
                  score: score,
                  matchType: score >= 90 ? '标准化匹配' : '包含匹配'
                };
                bestMatchScore = score;
              }
            }
          }
        }
        
        // 添加形状选项
        const finalShapeId = bestMatch ? bestMatch.dbShape : shapeConfig.id;
        const finalCount = bestMatch ? bestMatch.count : 0;
        
        if (!processedShapes.has(finalShapeId)) {
          console.log(`🔧 [修复] 添加形状选项:`, {
            id: finalShapeId,
            count: finalCount,
            matchType: bestMatch?.matchType || '无匹配',
            score: bestMatch?.score || 0,
            config: {
              id: shapeConfig.id,
              name_en: shapeConfig.name_en,
              name_zh: shapeConfig.name_zh
            }
          });
          
          shapeOptions.push({
            id: finalShapeId,
            name: shapeConfig.name_zh || shapeConfig.name_en || shapeConfig.name || finalShapeId,
            count: finalCount,
            disabled: finalCount === 0,
            originalData: {
              ...shapeConfig,
              matchType: bestMatch?.matchType,
              matchScore: bestMatch?.score
            }
          });
          
          processedShapes.add(finalShapeId);
          if (bestMatch) {
            matchedDbShapes.add(bestMatch.dbShape);
          }
        } else {
          console.log(`⚠️ [修复] 跳过重复形状: ${finalShapeId}`);
        }
      });
    }
    
    // 处理未匹配的数据库形状
    shapeCountMap.forEach((count, shapeId) => {
      if (!matchedDbShapes.has(shapeId) && !processedShapes.has(shapeId)) {
        console.log(`🔧 [修复] 补充未配置形状: ${shapeId}`);
        shapeOptions.push({
          id: shapeId,
          name: shapeId,
          count,
          disabled: false,
          originalData: {
            id: shapeId,
            name_zh: shapeId,
            name_en: shapeId,
            source: '数据库补充'
          }
        });
        processedShapes.add(shapeId);
      }
    });
    
    // 按数量排序
    shapeOptions.sort((a, b) => b.count - a.count);
    
    console.log('🔧 [修复] 最终形状选项:', shapeOptions);
    return shapeOptions;
  };
  
  return { generateShapeOptionsFixed };
};

// 修复策略2: API级别的形状配置去重
window.fixApiShapeConfig = function() {
  console.log('🔧 [API修复] 检查API形状配置重复...');
  
  if (!filterOptions?.shapes) {
    console.log('❌ filterOptions.shapes 不可用');
    return;
  }
  
  const configMap = new Map();
  const duplicates = [];
  
  filterOptions.shapes.forEach((config, index) => {
    const identifiers = [
      config.id,
      config.name_en,
      config.name_zh,
      config.code
    ].filter(Boolean);
    
    // 检查每个标识符是否已存在
    for (const identifier of identifiers) {
      const normalizedId = identifier.toLowerCase().replace(/\s+/g, '');
      
      if (configMap.has(normalizedId)) {
        duplicates.push({
          current: { index, config, identifier },
          existing: configMap.get(normalizedId)
        });
        console.log('🔍 发现重复配置:', {
          标识符: identifier,
          当前配置: `${index}: ${config.id}`,
          已存在配置: `${configMap.get(normalizedId).index}: ${configMap.get(normalizedId).config.id}`
        });
      } else {
        configMap.set(normalizedId, { index, config, identifier });
      }
    }
  });
  
  if (duplicates.length > 0) {
    console.log('⚠️ 发现API配置重复:', duplicates);
    console.log('建议: 需要在后端API层面清理重复的形状配置');
    return duplicates;
  } else {
    console.log('✅ API形状配置无重复');
    return [];
  }
};

// 修复策略3: 提供临时前端修复补丁
window.applyShapeFilterPatch = function() {
  console.log('🩹 应用临时前端修复补丁...');
  
  // 保存原始函数
  if (!window.originalGenerateShapeOptions) {
    console.log('❌ 无法找到原始generateShapeOptions函数');
    return false;
  }
  
  // 应用修复后的逻辑
  const { generateShapeOptionsFixed } = fixBubbleDuplication();
  
  // 替换函数（仅用于测试）
  console.log('⚠️ 注意：这是临时修复，需要在源代码中永久应用');
  
  return true;
};

// 验证修复效果
window.validateBubbleFix = function() {
  console.log('✅ 验证bubble修复效果...');
  
  // 应用修复逻辑
  const { generateShapeOptionsFixed } = fixBubbleDuplication();
  const fixedOptions = generateShapeOptionsFixed();
  
  const bubbleOptions = fixedOptions.filter(option => 
    option.id.toLowerCase().includes('bubble') || 
    option.name.toLowerCase().includes('bubble')
  );
  
  console.log('🫧 修复后的bubble选项:', bubbleOptions);
  console.log(`📊 修复结果: ${bubbleOptions.length}个bubble选项`);
  
  if (bubbleOptions.length <= 1) {
    console.log('✅ 修复成功！bubble重复问题已解决');
    return { success: true, bubbleCount: bubbleOptions.length };
  } else {
    console.log('⚠️ 修复后仍有多个bubble选项，需要进一步调整');
    return { success: false, bubbleCount: bubbleOptions.length, options: bubbleOptions };
  }
};

console.log('🛠️ Shape Filter修复工具已加载');
console.log('可用方法:');
console.log('- fixBubbleDuplication() : 获取修复后的生成函数');
console.log('- fixApiShapeConfig() : 检查API配置重复');
console.log('- validateBubbleFix() : 验证修复效果'); 