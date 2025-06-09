// 🔧 形状筛选功能验证脚本
// 直接在浏览器控制台中运行此脚本来验证修复效果

console.log('🔧 开始形状筛选功能验证...');

// 验证函数
(function validateShapeFilter() {
  // 1. 检查数据是否加载
  if (typeof window.allConsumables === 'undefined') {
    console.error('❌ 耗材数据未加载，请等待页面完全加载后再运行此脚本');
    return;
  }

  if (typeof window.smartFilterOptions === 'undefined') {
    console.error('❌ 筛选选项未初始化，请等待页面完全加载后再运行此脚本');
    return;
  }

  console.log('✅ 数据检查通过');

  // 2. 分析数据库中的形状分布
  const allConsumables = window.allConsumables;
  const shapeStats = {};
  
  allConsumables.forEach(item => {
    if (item.shape) {
      const shape = item.shape.trim();
      shapeStats[shape] = (shapeStats[shape] || 0) + 1;
    }
  });

  console.log('📊 数据库中的形状分布:', shapeStats);
  console.log('📊 总产品数:', allConsumables.length);
  console.log('📊 形状种类数:', Object.keys(shapeStats).length);

  // 3. 验证生成的形状选项
  const smartFilterOptions = window.smartFilterOptions;
  const shapeOptions = smartFilterOptions.shapes || [];

  console.log('🔧 生成的形状选项数量:', shapeOptions.length);
  
  shapeOptions.forEach((option, index) => {
    console.log(`🔧 选项${index + 1}:`, {
      id: option.id,
      name: option.name,
      count: option.count,
      disabled: option.disabled,
      hasImage: !!option.originalData?.image_url,
      imageUrl: option.originalData?.image_url?.substring(0, 50) + '...'
    });
  });

  // 4. 验证CSV要求的形状覆盖
  const csvRequiredShapes = [
    'Pillow', 'Precut Air Pillow', 'Bubble', 'Tube', 'paper Bubble', 'paper air Pillow'
  ];

  console.log('📋 CSV要求的形状覆盖情况:');
  csvRequiredShapes.forEach(requiredShape => {
    const found = shapeOptions.find(option => 
      option.id === requiredShape || 
      option.name.includes(requiredShape)
    );
    const hasDataInDB = !!shapeStats[requiredShape];
    
    console.log(`📋 ${requiredShape}:`, {
      inOptions: !!found,
      inDatabase: hasDataInDB,
      status: found ? '✅ 已覆盖' : (hasDataInDB ? '⚠️ 有数据但未显示' : '⭕ 无数据')
    });
  });

  // 5. 测试筛选功能
  console.log('🧪 测试形状筛选功能...');
  
  // 获取第一个有数据的形状进行测试
  const testShape = shapeOptions.find(option => option.count > 0);
  if (testShape) {
    console.log(`🧪 使用 "${testShape.name}" 进行筛选测试...`);
    
    // 模拟normalize函数
    const normalize = (v) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').replace(/%/g, '');
    
    // 执行筛选
    const filteredItems = allConsumables.filter(item => {
      if (!item.shape) return false;
      
      const itemShape = normalize(item.shape);
      const targetShape = normalize(testShape.id);
      
      return itemShape === targetShape;
    });
    
    console.log(`🧪 筛选结果: ${filteredItems.length} 个产品`);
    console.log(`🧪 预期数量: ${testShape.count}`);
    console.log(`🧪 匹配准确度: ${filteredItems.length === testShape.count ? '✅ 100%' : '⚠️ ' + Math.round((Math.min(filteredItems.length, testShape.count) / Math.max(filteredItems.length, testShape.count)) * 100) + '%'}`);
    
    if (filteredItems.length > 0) {
      console.log('🧪 筛选结果样本:', filteredItems.slice(0, 2).map(item => ({
        id: item.id,
        name: item.name,
        shape: item.shape
      })));
    }
  }

  // 6. 验证图片处理
  console.log('🖼️ 图片URL处理验证:');
  let validImages = 0;
  let placeholderImages = 0;
  let brokenImages = 0;

  shapeOptions.forEach(option => {
    const imageUrl = option.originalData?.image_url;
    if (imageUrl) {
      if (imageUrl.startsWith('data:')) {
        placeholderImages++;
      } else if (imageUrl.includes('/images/') || imageUrl.includes('.png') || imageUrl.includes('.jpg')) {
        validImages++;
      } else {
        brokenImages++;
      }
    }
  });

  console.log('🖼️ 图片统计:', {
    总图片数: shapeOptions.length,
    有效图片: validImages,
    占位图片: placeholderImages,
    可能有问题的图片: brokenImages
  });

  // 7. 生成验证报告
  const report = {
    数据加载: '✅ 正常',
    形状选项数量: shapeOptions.length,
    CSV形状覆盖率: Math.round((csvRequiredShapes.filter(shape => 
      shapeOptions.some(option => option.id === shape || option.name.includes(shape))
    ).length / csvRequiredShapes.length) * 100) + '%',
    图片处理: validImages > 0 ? '✅ 正常' : (placeholderImages > 0 ? '⚠️ 使用占位图' : '❌ 有问题'),
    筛选功能: testShape && filteredItems ? '✅ 正常' : '❌ 有问题'
  };

  console.log('📊 验证报告:', report);

  // 8. 给出建议
  const suggestions = [];
  if (shapeOptions.length === 0) {
    suggestions.push('❌ 形状选项未生成，检查 generateShapeOptions 函数');
  }
  if (report.CSV形状覆盖率 !== '100%') {
    suggestions.push('⚠️ CSV要求的形状覆盖不完整，需要检查数据映射');
  }
  if (validImages === 0 && placeholderImages === 0) {
    suggestions.push('❌ 图片URL处理有问题，检查 cleanImageUrl 函数');
  }
  if (testShape && filteredItems && filteredItems.length !== testShape.count) {
    suggestions.push('⚠️ 筛选逻辑可能需要优化，数量不匹配');
  }

  if (suggestions.length === 0) {
    console.log('🎉 形状筛选功能修复成功！所有验证项目都通过了。');
  } else {
    console.log('⚠️ 发现需要改进的地方:');
    suggestions.forEach(suggestion => console.log(suggestion));
  }

})();

console.log('🔧 形状筛选功能验证完成'); 