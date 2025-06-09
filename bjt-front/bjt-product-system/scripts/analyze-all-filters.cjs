#!/usr/bin/env node

// 耗材筛选字段分析脚本
// 分析数据库中所有筛选字段的分布情况，为修复提供基础数据

console.log('🔍 开始分析耗材筛选字段分布...');

// 模拟耗材数据（基于实际SQL数据）
const mockConsumables = [
  { id: '1', app_model: 'LA-E4C,"LA-E4S V2.0"', bag_type: 'Pillow', material: '30% HDPE', thickness_met: 13, width_met: 20, length_met: 13 },
  { id: '2', app_model: 'LA-E4C,"LA-E4S V2.0"', bag_type: 'Pillow', material: 'HDPE', thickness_met: 13, width_met: 20, length_met: 13 },
  { id: '3', app_model: 'LA-E5P', bag_type: 'Precut Air Pillow', material: 'HDPE', thickness_met: 13, width_met: 20, length_met: 13 },
  { id: '4', app_model: '"LA-E4S V2.0",LA-F2', bag_type: 'Bubble', material: 'PAPE', thickness_met: 26, width_met: 80, length_met: 33 },
  { id: '5', app_model: 'LA-E4S(paper)', bag_type: 'paper Bubble', material: 'PAPER', thickness_met: 50, width_met: 40, length_met: 14 },
  { id: '6', app_model: 'LA-F2', bag_type: 'Bubble', material: 'PAPE', thickness_met: 35, width_met: 80, length_met: 16.5 },
  { id: '7', app_model: 'LA-E4C,"LA-E4S V2.0"', bag_type: 'Bubble', material: '50% HDPE', thickness_met: 17, width_met: 40, length_met: 16.5 },
  { id: '8', app_model: 'LA-E4C,"LA-E4S V2.0"', bag_type: 'Tube', material: 'HDPE', thickness_met: 20, width_met: 40, length_met: 28 },
  // 更多示例数据...
];

// 分析函数
function analyzeField(consumables, fieldName, parser = null) {
  const distribution = {};
  const totalItems = consumables.length;
  
  consumables.forEach(item => {
    let values = [];
    
    if (parser) {
      values = parser(item[fieldName]);
    } else {
      if (item[fieldName]) {
        values = [item[fieldName]];
      }
    }
    
    values.forEach(value => {
      if (value && value.toString().trim()) {
        const key = value.toString().trim();
        distribution[key] = (distribution[key] || 0) + 1;
      }
    });
  });
  
  return {
    field: fieldName,
    totalItems,
    uniqueValues: Object.keys(distribution).length,
    distribution: Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [key, count]) => {
        acc[key] = count;
        return acc;
      }, {})
  };
}

// 解析app_model字段的复杂格式
function parseAppModel(appModel) {
  if (!appModel) return [];
  return appModel.split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
}

// 判断是否为纸质材料
function isPaperMaterial(material) {
  return material === 'PAPER' || material?.toLowerCase().includes('paper');
}

// 分析所有筛选字段
function analyzeAllFilters(consumables) {
  console.log('\n📊 筛选字段分析报告:\n');
  
  // 1. Model筛选分析
  console.log('🔸 1. Model（适用机型）筛选分析:');
  const modelAnalysis = analyzeField(consumables, 'app_model', parseAppModel);
  console.log(`   总产品数: ${modelAnalysis.totalItems}`);
  console.log(`   机型数量: ${modelAnalysis.uniqueValues}`);
  console.log('   分布情况:');
  Object.entries(modelAnalysis.distribution).forEach(([model, count]) => {
    console.log(`     ${model}: ${count}个产品`);
  });
  
  // 2. Shape筛选分析
  console.log('\n🔸 2. Shape（形状）筛选分析:');
  const shapeAnalysis = analyzeField(consumables, 'bag_type');
  console.log(`   形状数量: ${shapeAnalysis.uniqueValues}`);
  console.log('   分布情况:');
  Object.entries(shapeAnalysis.distribution).forEach(([shape, count]) => {
    console.log(`     ${shape}: ${count}个产品`);
  });
  
  // 3. Material筛选分析
  console.log('\n🔸 3. Material（材质）筛选分析:');
  const materialAnalysis = analyzeField(consumables, 'material');
  console.log(`   材质数量: ${materialAnalysis.uniqueValues}`);
  console.log('   分布情况:');
  Object.entries(materialAnalysis.distribution).forEach(([material, count]) => {
    console.log(`     ${material}: ${count}个产品`);
  });
  
  // 4. 厚度/重量分析（按材质分类）
  console.log('\n🔸 4. Thickness/Weight（厚度/重量）分析:');
  const plasticThickness = {};
  const paperWeight = {};
  
  consumables.forEach(item => {
    if (item.thickness_met) {
      if (isPaperMaterial(item.material)) {
        const key = `${item.thickness_met}gsm`;
        paperWeight[key] = (paperWeight[key] || 0) + 1;
      } else {
        const key = `${item.thickness_met}um`;
        plasticThickness[key] = (plasticThickness[key] || 0) + 1;
      }
    }
  });
  
  console.log('   塑料材质厚度分布:');
  Object.entries(plasticThickness).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).forEach(([thickness, count]) => {
    console.log(`     ${thickness}: ${count}个产品`);
  });
  
  console.log('   纸质材质重量分布:');
  Object.entries(paperWeight).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).forEach(([weight, count]) => {
    console.log(`     ${weight}: ${count}个产品`);
  });
  
  // 5. Width分析
  console.log('\n🔸 5. Width（宽度）分析:');
  const widthAnalysis = analyzeField(consumables, 'width_met');
  console.log(`   宽度规格数量: ${widthAnalysis.uniqueValues}`);
  console.log('   分布情况:');
  Object.entries(widthAnalysis.distribution).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).forEach(([width, count]) => {
    console.log(`     ${width}cm: ${count}个产品`);
  });
  
  // 6. Length分析
  console.log('\n🔸 6. Length（长度）分析:');
  const lengthAnalysis = analyzeField(consumables, 'length_met');
  console.log(`   长度规格数量: ${lengthAnalysis.uniqueValues}`);
  console.log('   分布情况:');
  Object.entries(lengthAnalysis.distribution).sort(([a], [b]) => parseFloat(a) - parseFloat(b)).forEach(([length, count]) => {
    console.log(`     ${length}cm: ${count}个产品`);
  });
  
  return {
    model: modelAnalysis,
    shape: shapeAnalysis,
    material: materialAnalysis,
    plasticThickness,
    paperWeight,
    width: widthAnalysis,
    length: lengthAnalysis
  };
}

// 生成修复建议
function generateFixSuggestions(analysis) {
  console.log('\n🔧 修复建议:\n');
  
  console.log('1. Model筛选修复（✅已完成）:');
  console.log('   - 复杂格式解析已正确实现');
  console.log('   - 精确匹配逻辑已优化');
  
  console.log('\n2. Shape筛选修复:');
  console.log('   - 需要确保bag_type字段直接映射');
  console.log('   - 检查形状图片URL是否正确');
  Object.keys(analysis.shape.distribution).forEach(shape => {
    console.log(`   - 支持形状: ${shape}`);
  });
  
  console.log('\n3. Material筛选修复:');
  console.log('   - 需要处理百分比符号的normalize');
  console.log('   - 保持原始材质名称显示');
  Object.keys(analysis.material.distribution).forEach(material => {
    console.log(`   - 支持材质: ${material}`);
  });
  
  console.log('\n4. 规格筛选修复:');
  console.log('   - 塑料材质: 使用thickness_met显示厚度(um)');
  console.log('   - 纸质材质: 使用thickness_met显示重量(gsm)');
  console.log('   - 需要isPaperMaterial()函数判断材质类型');
  
  console.log('\n5. 尺寸筛选修复:');
  console.log('   - 直接使用width_met、length_met字段');
  console.log('   - 数值提取和精确匹配');
  console.log('   - 支持的宽度规格:', Object.keys(analysis.width.distribution).join(', '));
  console.log('   - 支持的长度规格:', Object.keys(analysis.length.distribution).join(', '));
}

// 生成期望结果数据
function generateExpectedResults(analysis) {
  console.log('\n📈 期望结果数据（用于测试验证）:\n');
  
  console.log('```javascript');
  console.log('const expectedCounts = {');
  console.log('  models: {');
  Object.entries(analysis.model.distribution).forEach(([model, count]) => {
    console.log(`    '${model}': ${count},`);
  });
  console.log('  },');
  
  console.log('  shapes: {');
  Object.entries(analysis.shape.distribution).forEach(([shape, count]) => {
    console.log(`    '${shape}': ${count},`);
  });
  console.log('  },');
  
  console.log('  materials: {');
  Object.entries(analysis.material.distribution).forEach(([material, count]) => {
    console.log(`    '${material}': ${count},`);
  });
  console.log('  }');
  console.log('};');
  console.log('```');
}

// 执行分析
console.log('使用示例数据进行分析（实际使用时请替换为真实API数据）\n');

const analysis = analyzeAllFilters(mockConsumables);
generateFixSuggestions(analysis);
generateExpectedResults(analysis);

console.log('\n✅ 筛选字段分析完成！');
console.log('\n📝 下一步操作:');
console.log('1. 使用真实API数据运行此分析');
console.log('2. 根据修复建议逐步修复各筛选字段');
console.log('3. 使用期望结果数据进行验证测试');

module.exports = {
  analyzeAllFilters,
  generateFixSuggestions,
  generateExpectedResults,
  parseAppModel,
  isPaperMaterial
}; 