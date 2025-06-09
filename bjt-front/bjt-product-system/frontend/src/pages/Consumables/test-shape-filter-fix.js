// 形状筛选修复测试脚本
console.log('🧪 [测试] 开始形状筛选修复效果验证...');

// 测试函数：验证形状筛选功能
window.testShapeFilterFix = async function() {
  console.log('🔍 [形状筛选测试] 开始验证...');
  
  try {
    // 1. 检查当前页面数据
    if (typeof allConsumables === 'undefined') {
      console.error('❌ allConsumables 数据未加载');
      return;
    }
    
    if (typeof smartFilterOptions === 'undefined') {
      console.error('❌ smartFilterOptions 未初始化');
      return;
    }
    
    // 2. 分析数据库中的形状数据
    console.log('📊 [数据分析] 分析数据库中的形状字段...');
    const shapeStats = {};
    allConsumables.forEach(item => {
      if (item.shape) {
        const shape = item.shape.trim();
        shapeStats[shape] = (shapeStats[shape] || 0) + 1;
      }
    });
    
    console.log('📊 [数据分析] 数据库形状统计:', shapeStats);
    
    // 3. 验证生成的形状选项
    console.log('🔧 [选项验证] 验证生成的形状筛选选项...');
    const shapeOptions = smartFilterOptions.shapes || [];
    
    console.log('🔧 [选项验证] 形状选项数量:', shapeOptions.length);
    console.log('🔧 [选项验证] 形状选项详情:', shapeOptions.map(option => ({
      id: option.id,
      name: option.name,
      count: option.count,
      disabled: option.disabled,
      hasImage: !!option.originalData?.image_url,
      imageUrl: option.originalData?.image_url
    })));
    
    // 4. 验证CSV要求的形状是否都被包含
    const csvRequiredShapes = [
      'Pillow', 'Precut Air Pillow', 'Bubble', 'Tube', 'paper Bubble', 'paper air Pillow'
    ];
    
    console.log('📋 [CSV验证] 检查CSV要求的形状覆盖情况...');
    const csvCoverage = {};
    csvRequiredShapes.forEach(requiredShape => {
      const found = shapeOptions.find(option => 
        option.id === requiredShape || 
        option.name.includes(requiredShape) ||
        Object.values(shapeStats).some(shape => shape === requiredShape)
      );
      csvCoverage[requiredShape] = {
        covered: !!found,
        option: found,
        hasDataInDB: !!shapeStats[requiredShape]
      };
    });
    
    console.log('📋 [CSV验证] CSV覆盖情况:', csvCoverage);
    
    // 5. 测试形状筛选功能
    console.log('🧪 [功能测试] 测试形状筛选功能...');
    
    // 获取第一个有数据的形状进行测试
    const testShape = shapeOptions.find(option => option.count > 0);
    if (testShape) {
      console.log(`🧪 [功能测试] 使用形状 "${testShape.name}" 进行测试...`);
      
      // 模拟筛选
      const filteredItems = allConsumables.filter(item => {
        if (!item.shape) return false;
        
        const itemShape = item.shape.trim().toLowerCase().replace(/\s+/g, '').replace(/%/g, '');
        const targetShape = testShape.id.toLowerCase().replace(/\s+/g, '').replace(/%/g, '');
        
        return itemShape === targetShape || 
               (testShape.originalData?.name_en && 
                itemShape === testShape.originalData.name_en.toLowerCase().replace(/\s+/g, '').replace(/%/g, '')) ||
               (testShape.originalData?.name_zh && 
                itemShape === testShape.originalData.name_zh.toLowerCase().replace(/\s+/g, '').replace(/%/g, ''));
      });
      
      console.log(`🧪 [功能测试] 筛选结果: ${filteredItems.length} 个产品`);
      console.log(`🧪 [功能测试] 预期数量: ${testShape.count}`);
      console.log(`🧪 [功能测试] 匹配度: ${filteredItems.length === testShape.count ? '✅ 完全匹配' : '⚠️ 数量不匹配'}`);
      
      if (filteredItems.length > 0) {
        console.log('🧪 [功能测试] 筛选结果样本:', filteredItems.slice(0, 3).map(item => ({
          id: item.id,
          name: item.name,
          shape: item.shape
        })));
      }
    }
    
    // 6. 验证图片URL处理
    console.log('🖼️ [图片测试] 验证图片URL处理...');
    const imageResults = shapeOptions.map(option => {
      const imageUrl = option.originalData?.image_url;
      return {
        shapeName: option.name,
        hasImage: !!imageUrl,
        imageUrl: imageUrl,
        isDataUri: imageUrl?.startsWith('data:'),
        isPlaceholder: imageUrl === shapePlaceholderImage
      };
    });
    
    console.log('🖼️ [图片测试] 图片URL处理结果:', imageResults);
    
    // 7. 生成测试报告
    const testReport = {
      dataAnalysis: {
        totalProducts: allConsumables.length,
        uniqueShapes: Object.keys(shapeStats).length,
        shapeDistribution: shapeStats
      },
      optionGeneration: {
        totalOptions: shapeOptions.length,
        enabledOptions: shapeOptions.filter(o => !o.disabled).length,
        disabledOptions: shapeOptions.filter(o => o.disabled).length
      },
      csvCompliance: {
        requiredShapes: csvRequiredShapes.length,
        coveredShapes: Object.values(csvCoverage).filter(c => c.covered).length,
        complianceRate: Math.round((Object.values(csvCoverage).filter(c => c.covered).length / csvRequiredShapes.length) * 100)
      },
      imageHandling: {
        totalImages: imageResults.length,
        validImages: imageResults.filter(r => r.hasImage && !r.isPlaceholder).length,
        placeholderImages: imageResults.filter(r => r.isPlaceholder).length,
        dataUriImages: imageResults.filter(r => r.isDataUri).length
      }
    };
    
    console.log('📊 [测试报告] 形状筛选修复效果评估:', testReport);
    
    // 8. 成功/失败判断
    const success = testReport.csvCompliance.complianceRate >= 80 && 
                   testReport.optionGeneration.totalOptions > 0 &&
                   testReport.imageHandling.totalImages > 0;
    
    if (success) {
      console.log('✅ [测试结果] 形状筛选修复成功！');
    } else {
      console.log('❌ [测试结果] 形状筛选修复需要进一步优化');
    }
    
    return testReport;
    
  } catch (error) {
    console.error('❌ [测试失败] 形状筛选测试出现错误:', error);
    return { success: false, error: error.message };
  }
};

// 自动运行测试（如果页面已加载）
if (document.readyState === 'complete') {
  setTimeout(() => {
    if (typeof allConsumables !== 'undefined' && allConsumables.length > 0) {
      window.testShapeFilterFix();
    }
  }, 1000);
} else {
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof allConsumables !== 'undefined' && allConsumables.length > 0) {
        window.testShapeFilterFix();
      }
    }, 2000);
  });
}

console.log('🧪 [测试] 形状筛选测试脚本已加载，请在页面加载完成后调用 testShapeFilterFix()'); 