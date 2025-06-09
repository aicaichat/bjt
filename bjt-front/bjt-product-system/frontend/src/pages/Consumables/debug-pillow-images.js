// 🚨 Pillow/Precut Air Pillow 图片问题专项诊断脚本

console.log('🚨 开始Pillow图片问题诊断...');

window.debugPillowImages = function() {
  console.log('🔍 [专项诊断] Pillow/Precut Air Pillow 图片显示问题');
  console.log('========================================');
  
  // 1. 检查API返回的原始数据
  console.log('📡 [步骤1] 检查API原始数据');
  if (filterOptions?.shapes) {
    console.log('API返回的shapes总数:', filterOptions.shapes.length);
    
    filterOptions.shapes.forEach((config, index) => {
      console.log(`🔍 [形状配置 ${index}]`, {
        id: config.id,
        name_zh: config.name_zh, 
        name_en: config.name_en,
        image_url: config.image_url,
        完整配置: config
      });
    });
  } else {
    console.error('❌ filterOptions.shapes 未找到');
  }
  
  // 2. 检查数据库中的shape分布
  console.log('');
  console.log('📊 [步骤2] 检查数据库shape字段分布');
  const shapeStats = {};
  allConsumables.forEach(item => {
    if (item.shape) {
      const shape = item.shape.trim();
      shapeStats[shape] = (shapeStats[shape] || 0) + 1;
    }
  });
  console.log('数据库shape统计:', shapeStats);
  
  // 3. 模拟generateShapeOptions的匹配过程
  console.log('');
  console.log('🔧 [步骤3] 模拟形状选项生成过程');
  
  if (filterOptions?.shapes) {
    filterOptions.shapes.forEach((shapeConfig, index) => {
      const possibleIds = [
        shapeConfig.id,
        shapeConfig.name_en, 
        shapeConfig.name_zh
      ].filter(Boolean);
      
      console.log(`🔍 [配置${index}] 开始匹配:`, {
        配置: shapeConfig,
        可能的ID: possibleIds
      });
      
      // 匹配数据库统计
      let matchedCount = 0;
      let matchedShapeId = '';
      
      for (const id of possibleIds) {
        if (shapeStats[id]) {
          matchedCount = shapeStats[id];
          matchedShapeId = id;
          console.log(`✅ [直接匹配成功] ${id}: ${matchedCount}个产品`);
          break;
        }
      }
      
      // 模糊匹配
      if (matchedCount === 0) {
        console.log('🔍 [尝试模糊匹配]');
        for (const [dbShape, count] of Object.entries(shapeStats)) {
          for (const configId of possibleIds) {
            const normalizedDbShape = dbShape.toLowerCase().replace(/\s+/g, '');
            const normalizedConfigId = configId.toLowerCase().replace(/\s+/g, '');
            
            if (normalizedDbShape.includes(normalizedConfigId) || 
                normalizedConfigId.includes(normalizedDbShape)) {
              matchedCount = count;
              matchedShapeId = dbShape;
              console.log(`✅ [模糊匹配成功] ${dbShape} ↔ ${configId}: ${count}个产品`);
              break;
            }
          }
          if (matchedCount > 0) break;
        }
      }
      
      if (matchedCount === 0) {
        console.log('❌ [匹配失败] 未找到对应的数据库记录');
      }
      
      // 图片URL处理
      const originalUrl = shapeConfig.image_url;
      let cleanedUrl = originalUrl;
      
      if (originalUrl) {
        cleanedUrl = originalUrl.trim().replace(/^'+|'+$/g, '').replace(/\\/g, '/');
        cleanedUrl = cleanedUrl.replace(/^\/assets\/images\//, '/images/');
        if (!cleanedUrl.startsWith('/')) cleanedUrl = '/' + cleanedUrl;
        if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(cleanedUrl)) {
          cleanedUrl += '.png';
        }
      }
      
      console.log(`🖼️ [图片URL处理]`, {
        原始URL: originalUrl,
        处理后URL: cleanedUrl,
        是否为占位符: cleanedUrl === 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwI'
      });
      
      console.log('---');
    });
  }
  
  // 4. 检查最终生成的形状选项
  console.log('');
  console.log('📋 [步骤4] 检查最终生成的形状选项');
  if (smartFilterOptions?.shapes) {
    smartFilterOptions.shapes.forEach(shape => {
      if (shape.name.includes('Pillow') || shape.name.includes('气泡枕')) {
        console.log(`🎯 [Pillow相关形状] ${shape.name}:`, {
          id: shape.id,
          name: shape.name,
          count: shape.count,
          disabled: shape.disabled,
          图片URL: shape.originalData?.image_url,
          完整数据: shape.originalData
        });
      }
    });
  }
  
  // 5. 实际测试图片加载
  console.log('');
  console.log('🖼️ [步骤5] 测试图片URL可访问性');
  const testUrls = [
    '/images/MEX/values/MEX.png',
    '/images/MEX/values/MEX-2.png'
  ];
  
  testUrls.forEach(url => {
    const img = new Image();
    img.onload = () => console.log(`✅ [图片可访问] ${url}`);
    img.onerror = () => console.log(`❌ [图片不可访问] ${url}`);
    img.src = url;
  });
  
  // 6. 诊断结论
  console.log('');
  console.log('🎯 [诊断结论]');
  console.log('请检查以上日志，重点关注:');
  console.log('1. API配置中是否有Pillow/Precut Air Pillow的记录');
  console.log('2. 数据库shape字段中是否有对应的数据');
  console.log('3. 匹配逻辑是否正确找到对应关系');
  console.log('4. 图片URL是否正确处理');
  console.log('5. 图片文件是否可以访问');
};

// 自动运行
if (typeof allConsumables !== 'undefined' && allConsumables.length > 0) {
  setTimeout(() => {
    window.debugPillowImages();
  }, 1000);
}

console.log('🚨 Pillow图片诊断脚本已加载');
console.log('📖 运行: debugPillowImages() 开始诊断'); 