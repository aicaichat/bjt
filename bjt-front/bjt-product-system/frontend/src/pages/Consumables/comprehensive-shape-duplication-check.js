// 🔍 全面形状重复检测工具
// 检查所有shape字段是否存在重复问题，不仅仅是bubble

window.comprehensiveShapeDuplicationCheck = function() {
  console.log('🔍 [全面重复检测] 开始检查所有形状的重复问题...');
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
  
  // 1. 分析数据库中的所有形状
  console.log('📊 第一步：分析数据库中的所有形状数据');
  const shapeStats = new Map();
  
  allConsumables.forEach(item => {
    if (item.shape) {
      const shape = item.shape.trim();
      shapeStats.set(shape, (shapeStats.get(shape) || 0) + 1);
    }
  });
  
  console.log('📈 数据库中的形状统计:', Object.fromEntries(shapeStats));
  console.log(`📊 数据库中共有 ${shapeStats.size} 种不同的形状`);
  
  // 2. 分析API配置的所有标识符
  console.log('\n📋 第二步：分析API配置的所有标识符');
  const apiShapeConfigs = filterOptions?.shapes || [];
  const allIdentifiers = new Map(); // 标识符 -> 配置数组
  
  apiShapeConfigs.forEach((config, index) => {
    const identifiers = [
      { type: 'id', value: config.id },
      { type: 'name_en', value: config.name_en },
      { type: 'name_zh', value: config.name_zh },
      { type: 'code', value: config.code },
      { type: 'name', value: config.name },
      { type: 'shape_name', value: config.shape_name },
      { type: 'category_name', value: config.category_name }
    ].filter(item => item.value);
    
    identifiers.forEach(identifier => {
      const key = identifier.value;
      if (!allIdentifiers.has(key)) {
        allIdentifiers.set(key, []);
      }
      allIdentifiers.get(key).push({
        configIndex: index,
        configId: config.id,
        identifierType: identifier.type,
        config: config
      });
    });
  });
  
  // 3. 检测API配置重复
  console.log('\n⚠️  第三步：检测API配置中的重复标识符');
  const duplicatedIdentifiers = [];
  
  allIdentifiers.forEach((configs, identifier) => {
    if (configs.length > 1) {
      duplicatedIdentifiers.push({
        identifier,
        count: configs.length,
        configs: configs
      });
      
      console.log(`🔍 发现重复标识符: "${identifier}" (${configs.length}个配置使用)`);
      configs.forEach(config => {
        console.log(`   配置${config.configIndex}: ${config.configId} (字段: ${config.identifierType})`);
      });
    }
  });
  
  // 4. 模拟精准匹配过程，检测可能的重复
  console.log('\n🎯 第四步：模拟精准匹配，检测重复风险');
  const matchResults = [];
  const matchedDbShapes = new Set();
  const generatedOptions = [];
  
  apiShapeConfigs.forEach((shapeConfig, configIndex) => {
    const possibleIds = [
      shapeConfig.id,
      shapeConfig.name_en,
      shapeConfig.name_zh,
      shapeConfig.code
    ].filter(Boolean);
    
    // 精确匹配
    let exactMatch = null;
    for (const id of possibleIds) {
      if (shapeStats.has(id) && !matchedDbShapes.has(id)) {
        exactMatch = {
          configIndex,
          configId: shapeConfig.id,
          matchedId: id,
          dbShape: id,
          count: shapeStats.get(id),
          matchType: '精确匹配'
        };
        matchedDbShapes.add(id);
        break;
      }
    }
    
    if (exactMatch) {
      // 检查是否会产生重复的生成选项
      const finalShapeId = exactMatch.dbShape;
      const existingOption = generatedOptions.find(opt => opt.id === finalShapeId);
      
      if (existingOption) {
        console.log(`⚠️  检测到潜在重复: ${finalShapeId}`);
        console.log(`   已存在选项: 配置${existingOption.configIndex} (${existingOption.configId})`);
        console.log(`   当前匹配: 配置${configIndex} (${shapeConfig.id})`);
      } else {
        generatedOptions.push({
          id: finalShapeId,
          configIndex,
          configId: shapeConfig.id,
          count: exactMatch.count
        });
      }
    }
    
    matchResults.push({
      configIndex,
      configId: shapeConfig.id,
      match: exactMatch,
      success: !!exactMatch
    });
  });
  
  // 5. 分析所有形状的重复风险
  console.log('\n📊 第五步：分析所有形状的重复风险');
  
  const shapeRiskAnalysis = new Map();
  
  // 为每个数据库形状分析风险
  shapeStats.forEach((count, dbShape) => {
    const potentialMatches = [];
    
    apiShapeConfigs.forEach((config, index) => {
      const possibleIds = [config.id, config.name_en, config.name_zh, config.code].filter(Boolean);
      
      if (possibleIds.includes(dbShape)) {
        potentialMatches.push({
          configIndex: index,
          configId: config.id,
          matchingField: possibleIds.find(id => id === dbShape)
        });
      }
    });
    
    if (potentialMatches.length > 1) {
      shapeRiskAnalysis.set(dbShape, {
        count,
        riskLevel: '高',
        potentialMatches,
        reason: `${potentialMatches.length}个API配置可能匹配到同一个数据库形状`
      });
      
      console.log(`🚨 高风险形状: ${dbShape} (${count}个产品)`);
      console.log(`   可能匹配的配置: ${potentialMatches.map(m => m.configId).join(', ')}`);
    } else if (potentialMatches.length === 1) {
      shapeRiskAnalysis.set(dbShape, {
        count,
        riskLevel: '低',
        potentialMatches,
        reason: '只有一个API配置匹配'
      });
    } else {
      shapeRiskAnalysis.set(dbShape, {
        count,
        riskLevel: '中',
        potentialMatches: [],
        reason: '没有API配置匹配，将作为补充添加'
      });
    }
  });
  
  // 6. 检查当前生成的形状选项（如果可用）
  console.log('\n🔄 第六步：检查当前生成的形状选项');
  let currentDuplicates = [];
  
  if (typeof smartFilterOptions !== 'undefined' && smartFilterOptions.shapes) {
    const shapeIds = smartFilterOptions.shapes.map(s => s.id);
    const shapeIdCounts = new Map();
    
    shapeIds.forEach(id => {
      shapeIdCounts.set(id, (shapeIdCounts.get(id) || 0) + 1);
    });
    
    shapeIdCounts.forEach((count, id) => {
      if (count > 1) {
        currentDuplicates.push({ id, count });
        console.log(`⚠️  当前存在重复: ${id} (${count}次)`);
      }
    });
    
    if (currentDuplicates.length === 0) {
      console.log('✅ 当前形状选项无重复');
    }
  } else {
    console.log('⚠️  当前形状选项数据不可用');
  }
  
  // 7. 生成全面的重复风险报告
  console.log('\n📋 第七步：生成全面重复风险报告');
  
  const highRiskShapes = Array.from(shapeRiskAnalysis.entries())
    .filter(([, analysis]) => analysis.riskLevel === '高');
  
  const report = {
    数据库形状总数: shapeStats.size,
    API配置总数: apiShapeConfigs.length,
    重复标识符数量: duplicatedIdentifiers.length,
    高风险形状数量: highRiskShapes.length,
    当前重复选项数量: currentDuplicates.length,
    精准匹配成功数: matchResults.filter(r => r.success).length,
    风险评估: {
      总体风险级别: highRiskShapes.length > 0 ? '高' : (duplicatedIdentifiers.length > 0 ? '中' : '低'),
      主要风险因素: [
        ...(duplicatedIdentifiers.length > 0 ? ['API配置标识符重复'] : []),
        ...(highRiskShapes.length > 0 ? ['多个配置匹配同一形状'] : []),
        ...(currentDuplicates.length > 0 ? ['当前选项存在重复'] : [])
      ],
      建议措施: [
        ...(duplicatedIdentifiers.length > 0 ? ['清理API配置重复标识符'] : []),
        ...(highRiskShapes.length > 0 ? ['优化形状匹配逻辑'] : []),
        '维持精准匹配机制',
        '定期进行重复检测'
      ]
    }
  };
  
  console.log('📊 全面重复风险报告:', report);
  
  // 8. 详细显示高风险形状
  if (highRiskShapes.length > 0) {
    console.log('\n🚨 高风险形状详情:');
    highRiskShapes.forEach(([shape, analysis]) => {
      console.log(`\n🔍 ${shape} (${analysis.count}个产品):`);
      console.log(`   风险原因: ${analysis.reason}`);
      console.log('   潜在匹配配置:');
      analysis.potentialMatches.forEach(match => {
        console.log(`     - 配置${match.configIndex}: ${match.configId} (匹配字段: ${match.matchingField})`);
      });
    });
  }
  
  console.log('\n=====================================');
  console.log('🔍 [全面重复检测] 检测完成');
  
  return {
    success: true,
    shapeStats: Object.fromEntries(shapeStats),
    duplicatedIdentifiers,
    matchResults,
    shapeRiskAnalysis: Object.fromEntries(shapeRiskAnalysis),
    currentDuplicates,
    report,
    highRiskShapes: highRiskShapes.map(([shape, analysis]) => ({ shape, analysis }))
  };
};

// 快速重复检测
window.quickDuplicationCheck = function() {
  console.log('🚀 快速重复检测...');
  
  if (typeof smartFilterOptions !== 'undefined' && smartFilterOptions.shapes) {
    const shapeIds = smartFilterOptions.shapes.map(s => s.id);
    const shapeNames = smartFilterOptions.shapes.map(s => s.name);
    
    // 检查ID重复
    const idCounts = new Map();
    shapeIds.forEach(id => {
      idCounts.set(id, (idCounts.get(id) || 0) + 1);
    });
    
    // 检查名称重复
    const nameCounts = new Map();
    shapeNames.forEach(name => {
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    });
    
    const idDuplicates = Array.from(idCounts.entries()).filter(([, count]) => count > 1);
    const nameDuplicates = Array.from(nameCounts.entries()).filter(([, count]) => count > 1);
    
    console.log(`📊 形状选项总数: ${smartFilterOptions.shapes.length}`);
    console.log(`🔍 ID重复: ${idDuplicates.length}个`);
    console.log(`🔍 名称重复: ${nameDuplicates.length}个`);
    
    if (idDuplicates.length > 0) {
      console.log('⚠️  ID重复详情:');
      idDuplicates.forEach(([id, count]) => {
        console.log(`   ${id}: ${count}次`);
      });
    }
    
    if (nameDuplicates.length > 0) {
      console.log('⚠️  名称重复详情:');
      nameDuplicates.forEach(([name, count]) => {
        console.log(`   ${name}: ${count}次`);
      });
    }
    
    if (idDuplicates.length === 0 && nameDuplicates.length === 0) {
      console.log('✅ 未发现重复问题');
    }
    
    return {
      totalShapes: smartFilterOptions.shapes.length,
      idDuplicates,
      nameDuplicates,
      hasNoDuplicates: idDuplicates.length === 0 && nameDuplicates.length === 0
    };
  } else {
    console.log('❌ 形状选项数据未加载');
    return null;
  }
};

console.log('🔍 全面形状重复检测工具已加载');
console.log('使用方法:');
console.log('- comprehensiveShapeDuplicationCheck() : 全面重复风险检测');
console.log('- quickDuplicationCheck() : 快速重复检测'); 