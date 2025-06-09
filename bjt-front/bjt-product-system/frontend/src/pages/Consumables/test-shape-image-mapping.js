// 🔧 形状图片映射验证脚本
// 专门验证Pillow和Precut Air Pillow的图片显示问题

console.log('🔧 开始验证形状图片映射...');

// 验证函数
window.testShapeImageMapping = function() {
  console.log('🔍 [形状图片验证] 开始检查...');
  
  try {
    // 1. 检查当前页面数据
    if (typeof allConsumables === 'undefined') {
      console.error('❌ allConsumables 数据未加载');
      return;
    }
    
    if (typeof filterOptions === 'undefined') {
      console.error('❌ filterOptions 数据未加载');
      return;
    }
    
    console.log('✅ 数据检查通过');
    
    // 2. 检查API返回的形状配置
    console.log('📊 [API配置] filterOptions.shapes:', filterOptions?.shapes);
    
    if (filterOptions?.shapes) {
      filterOptions.shapes.forEach((shapeConfig, index) => {
        console.log(`📊 [形状配置${index}]`, {
          id: shapeConfig.id,
          name_zh: shapeConfig.name_zh,
          name_en: shapeConfig.name_en,
          image_url: shapeConfig.image_url,
          featured_image: shapeConfig.featured_image,
          originalConfig: shapeConfig
        });
      });
    }
    
    // 3. 检查数据库中的形状分布
    const shapeStats = {};
    allConsumables.forEach(item => {
      if (item.shape) {
        const shape = item.shape.trim();
        shapeStats[shape] = (shapeStats[shape] || 0) + 1;
      }
    });
    
    console.log('📊 [数据库形状] 统计:', shapeStats);
    
    // 4. 重点检查Pillow和Precut Air Pillow
    const targetShapes = ['Pillow', 'Precut Air Pillow', '气泡枕', '预切气泡枕', '开口气泡枕'];
    
    console.log('🎯 [重点检查] 目标形状验证:');
    targetShapes.forEach(targetShape => {
      const dbCount = shapeStats[targetShape] || 0;
      const apiConfig = filterOptions?.shapes?.find(s => 
        s.id === targetShape || 
        s.name_en === targetShape || 
        s.name_zh === targetShape
      );
      
      console.log(`🔍 [${targetShape}]`, {
        数据库数量: dbCount,
        API配置: apiConfig ? {
          id: apiConfig.id,
          name_zh: apiConfig.name_zh,
          name_en: apiConfig.name_en,
          image_url: apiConfig.image_url
        } : '未找到配置',
        匹配状态: dbCount > 0 && apiConfig ? '✅ 匹配' : '❌ 不匹配'
      });
    });
    
    // 5. 检查当前生成的形状选项
    if (typeof smartFilterOptions !== 'undefined' && smartFilterOptions.shapes) {
      console.log('📊 [生成的形状选项]');
      smartFilterOptions.shapes.forEach(shape => {
        if (targetShapes.some(target => 
          shape.id === target || 
          shape.name === target ||
          shape.id.includes('Pillow') ||
          shape.name.includes('Pillow') ||
          shape.name.includes('气泡枕')
        )) {
          console.log(`🎯 [找到目标形状] ${shape.name}:`, {
            id: shape.id,
            name: shape.name,
            count: shape.count,
            disabled: shape.disabled,
            image_url: shape.originalData?.image_url,
            originalData: shape.originalData
          });
        }
      });
    }
    
    // 6. 检查图片URL处理
    console.log('🖼️ [图片URL处理测试]');
    const testUrls = [
      '/images/MEX/values/MEX.png',
      '/images/MEX/values/MEX-2.png',
      'images/MEX/values/MEX.png',
      '/assets/images/MEX/values/MEX.png'
    ];
    
    testUrls.forEach(url => {
      // 模拟cleanImageUrl函数
      let cleaned = url.trim().replace(/^'+|'+$/g, '').replace(/\\/g, '/');
      cleaned = cleaned.replace(/^\/assets\/images\//, '/images/');
      if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;
      if (!/\.(png|jpg|jpeg|webp|gif)$/i.test(cleaned)) {
        cleaned += '.png';
      }
      
      console.log('🖼️ URL处理:', {
        原始: url,
        处理后: cleaned
      });
    });
    
    console.log('');
    console.log('💡 [诊断建议]');
    console.log('1. 检查filterOptions.shapes是否包含正确的形状配置');
    console.log('2. 验证形状名称匹配逻辑是否正确');
    console.log('3. 确认图片URL路径处理是否正确');
    console.log('4. 检查图片文件是否存在于服务器上');
    
    return {
      success: true,
      shapeStats,
      apiShapes: filterOptions?.shapes || [],
      generatedShapes: smartFilterOptions?.shapes || []
    };
    
  } catch (error) {
    console.error('❌ [验证失败]', error);
    return { success: false, error: error.message };
  }
};

// 自动运行验证
if (document.readyState === 'complete') {
  setTimeout(() => {
    if (typeof allConsumables !== 'undefined' && allConsumables.length > 0) {
      window.testShapeImageMapping();
    }
  }, 1000);
} else {
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof allConsumables !== 'undefined' && allConsumables.length > 0) {
        window.testShapeImageMapping();
      }
    }, 2000);
  });
}

console.log('🔧 形状图片映射验证脚本已加载');
console.log('📖 使用方法: 在控制台运行 testShapeImageMapping() 进行验证'); 