// 🔧 MFC/Tube重复问题专项修复工具
// 基于数据库实际数据分析：
// - wp_bjt_shapes: MFC → "Tube888", MFF → "Bubble999"  
// - wp_bjt_consumables: bag_type有"Tube"(5个), "MFC"(2个), "MFF"(1个), "Bubble"(21个)
// 问题：bag_type="Tube"和"MFC"都被映射到MFC配置，造成重复

window.analyzeMFCTubeDuplication = function() {
  console.log('🔍 [MFC/Tube重复分析] 开始专项分析...');
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
  
  // 1. 分析数据库中的bag_type分布
  console.log('📊 第一步：分析数据库中的bag_type分布');
  const bagTypeStats = new Map();
  const tubeRelatedProducts = [];
  
  allConsumables.forEach(item => {
    if (item.bag_type || item.shape) {
      const bagType = item.bag_type || item.shape;
      bagTypeStats.set(bagType, (bagTypeStats.get(bagType) || 0) + 1);
      
      // 收集Tube相关的产品
      if (bagType && (bagType.toLowerCase().includes('tube') || 
                      bagType.toLowerCase().includes('mfc') || 
                      bagType.toLowerCase().includes('mff'))) {
        tubeRelatedProducts.push({
          id: item.id,
          part_number: item.part_number,
          bag_type: bagType,
          model: item.model,
          material: item.material
        });
      }
    }
  });
  
  console.log('📈 bag_type统计：');
  Array.from(bagTypeStats.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([bagType, count]) => {
      console.log(`   ${bagType}: ${count}个产品`);
    });
  
  // 2. 分析API筛选配置
  console.log('\\n🔧 第二步：分析API筛选配置');
  const shapeConfigs = filterOptions.shapes || [];
  const tubeRelatedConfigs = shapeConfigs.filter(config => 
    config.name_en && (config.name_en.toLowerCase().includes('tube') ||
                       config.id === 'MFC' || config.id === 'MFF')
  );
  
  console.log('🎯 Tube相关的API配置：');
  tubeRelatedConfigs.forEach(config => {
    console.log(`   ID: ${config.id}, name_en: "${config.name_en}", name_zh: "${config.name_zh}"`);
  });
  
  // 3. 分析映射关系问题
  console.log('\\n🔍 第三步：分析映射关系问题');
  
  // 当前映射逻辑（从后端代码推断）
  const currentMapping = {
    'Tube': 'MFC',     // bag_type="Tube" → MFC配置 ("Tube888")
    'MFC': 'MFC',      // bag_type="MFC" → MFC配置 ("Tube888") 
    'MFF': 'MFF',      // bag_type="MFF" → MFF配置 ("Bubble999")
    'Bubble': 'MFF'    // bag_type="Bubble" → MFF配置 ("Bubble999")
  };
  
  console.log('🔄 当前映射关系：');
  Object.entries(currentMapping).forEach(([bagType, configId]) => {
    const count = bagTypeStats.get(bagType) || 0;
    const config = shapeConfigs.find(c => c.id === configId);
    const displayName = config ? config.name_en : '未找到配置';
    console.log(`   bag_type="${bagType}" (${count}个) → ${configId}配置 ("${displayName}")`);
  });
  
  // 4. 识别重复问题
  console.log('\\n⚠️ 第四步：识别重复问题');
  const configUsage = new Map();
  
  Object.entries(currentMapping).forEach(([bagType, configId]) => {
    const count = bagTypeStats.get(bagType) || 0;
    if (count > 0) {
      if (!configUsage.has(configId)) {
        configUsage.set(configId, []);
      }
      configUsage.get(configId).push({ bagType, count });
    }
  });
  
  const duplicateConfigs = Array.from(configUsage.entries())
    .filter(([configId, usages]) => usages.length > 1);
  
  if (duplicateConfigs.length > 0) {
    console.log('🚨 发现重复配置：');
    duplicateConfigs.forEach(([configId, usages]) => {
      const config = shapeConfigs.find(c => c.id === configId);
      const displayName = config ? config.name_en : '未知';
      const totalCount = usages.reduce((sum, u) => sum + u.count, 0);
      
      console.log(`   ${configId}配置 ("${displayName}") 被${usages.length}种bag_type使用，总计${totalCount}个产品：`);
      usages.forEach(({ bagType, count }) => {
        console.log(`     - bag_type="${bagType}": ${count}个产品`);
      });
    });
  } else {
    console.log('✅ 未发现重复配置');
  }
  
  // 5. 提供修复建议
  console.log('\\n💡 第五步：修复建议');
  
  if (duplicateConfigs.length > 0) {
    console.log('🛠️ 建议的修复方案：');
    
    // 方案1：数据标准化
    console.log('\\n📋 方案1：数据标准化（推荐）');
    console.log('   将数据库中的bag_type统一为标准值：');
    console.log('   - 将 bag_type="Tube" 改为 bag_type="MFC"');
    console.log('   - 将 bag_type="Bubble" 改为 bag_type="MFF"');
    console.log('   - SQL语句：');
    console.log('     UPDATE wp_bjt_consumables SET bag_type="MFC" WHERE bag_type="Tube";');
    console.log('     UPDATE wp_bjt_consumables SET bag_type="MFF" WHERE bag_type="Bubble";');
    
    // 方案2：扩展形状配置
    console.log('\\n📋 方案2：扩展形状配置');
    console.log('   在wp_bjt_shapes表中添加缺失的配置：');
    console.log('   - 添加 code="Tube", name_en="Tube", name_zh="气枕膜"');
    console.log('   - 添加 code="Bubble", name_en="Bubble", name_zh="气泡膜"');
    
    // 方案3：改进映射逻辑
    console.log('\\n📋 方案3：改进映射逻辑');
    console.log('   修改后端map_bag_type_to_dictionary_code方法：');
    console.log('   - 为每种bag_type创建独立的映射');
    console.log('   - 避免多对一的映射关系');
  }
  
  // 6. 返回分析结果
  const result = {
    bagTypeStats: Object.fromEntries(bagTypeStats),
    tubeRelatedProducts: tubeRelatedProducts,
    tubeRelatedConfigs: tubeRelatedConfigs,
    duplicateConfigs: duplicateConfigs.map(([configId, usages]) => ({
      configId,
      usages,
      totalCount: usages.reduce((sum, u) => sum + u.count, 0)
    })),
    hasDuplication: duplicateConfigs.length > 0
  };
  
  console.log('\\n📊 分析完成，结果：', result);
  return result;
};

// 快速检查MFC/Tube重复的简化版本
window.quickMFCTubeCheck = function() {
  console.log('🔍 [快速检查] MFC/Tube重复状态');
  
  if (typeof allConsumables === 'undefined' || typeof filterOptions === 'undefined') {
    console.error('❌ 数据未加载');
    return;
  }
  
  // 统计bag_type
  const bagTypeCount = new Map();
  allConsumables.forEach(item => {
    const bagType = item.bag_type || item.shape;
    if (bagType) {
      bagTypeCount.set(bagType, (bagTypeCount.get(bagType) || 0) + 1);
    }
  });
  
  // 检查Tube相关的数量
  const tubeCount = bagTypeCount.get('Tube') || 0;
  const mfcCount = bagTypeCount.get('MFC') || 0;
  const mffCount = bagTypeCount.get('MFF') || 0;
  const bubbleCount = bagTypeCount.get('Bubble') || 0;
  
  console.log('📊 Tube相关产品统计：');
  console.log(`   bag_type="Tube": ${tubeCount}个`);
  console.log(`   bag_type="MFC": ${mfcCount}个`);
  console.log(`   bag_type="MFF": ${mffCount}个`);
  console.log(`   bag_type="Bubble": ${bubbleCount}个`);
  
  // 检查筛选选项
  const shapeOptions = filterOptions.shapes || [];
  const tubeOptions = shapeOptions.filter(opt => 
    opt.name_en && opt.name_en.toLowerCase().includes('tube')
  );
  
  console.log('🎯 Tube相关筛选选项：');
  tubeOptions.forEach(opt => {
    console.log(`   "${opt.name_en}" (ID: ${opt.id})`);
  });
  
  // 判断是否有重复
  const hasDuplication = tubeOptions.length > 1 || 
                        (tubeCount > 0 && mfcCount > 0);
  
  if (hasDuplication) {
    console.log('🚨 检测到重复：多个bag_type映射到相同的筛选选项');
  } else {
    console.log('✅ 未检测到明显重复');
  }
  
  return {
    tubeCount,
    mfcCount, 
    mffCount,
    bubbleCount,
    tubeOptions: tubeOptions.length,
    hasDuplication
  };
};

// 修复MFC/Tube重复的实际操作
window.fixMFCTubeDuplication = function() {
  console.log('🔧 [修复操作] 开始修复MFC/Tube重复问题');
  
  const analysis = analyzeMFCTubeDuplication();
  if (!analysis.hasDuplication) {
    console.log('✅ 未检测到重复问题，无需修复');
    return { success: true, message: '无需修复' };
  }
  
  console.log('⚠️ 检测到重复问题，建议的修复步骤：');
  console.log('1. 联系后端开发人员执行数据标准化SQL');
  console.log('2. 或者在wp_bjt_shapes表中添加缺失的形状配置');
  console.log('3. 重启后端服务使更改生效');
  console.log('4. 刷新前端页面验证修复效果');
  
  return {
    success: false,
    message: '需要后端配合修复',
    analysis: analysis
  };
};

console.log('🔧 MFC/Tube重复修复工具已加载');
console.log('📋 可用命令：');
console.log('   - analyzeMFCTubeDuplication() - 完整分析');
console.log('   - quickMFCTubeCheck() - 快速检查');
console.log('   - fixMFCTubeDuplication() - 修复操作'); 