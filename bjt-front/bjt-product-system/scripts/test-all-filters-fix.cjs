#!/usr/bin/env node

// 🧪 完整筛选功能修复验证脚本
// 验证所有筛选字段的修复效果，包括Model、Shape、Material、规格等

const axios = require('axios');

console.log('🚀 开始完整筛选功能修复验证...\n');

// 期望的修复结果数据
const expectedCounts = {
  models: {
    'LA-E4C': 37,
    'LA-E4S V2.0': 40,
    'LA-E5P': 5,
    'LA-F2': 14,
    'LA-E4S(paper)': 2
  },
  shapes: {
    'Pillow': 16,
    'Precut Air Pillow': 5,
    'Bubble': 26,
    'Tube': 5,
    'paper Bubble': 1,
    'paper air Pillow': 1
  },
  materials: {
    '30% HDPE': 2,
    '50% HDPE': 16,
    'HDPE': 14,
    '50% LDPE': 1,
    'LDPE': 2,
    'PAPE': 11,
    'PAPER': 2,
    'LDPE + HDPE': 1
  }
};

// 辅助函数
const normalize = (v) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').replace(/%/g, '');

const extractNumber = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  const match = String(value).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : undefined;
};

const isPaperMaterial = (material) => {
  if (!material) return false;
  const normalizedMaterial = material.toLowerCase();
  return normalizedMaterial === 'paper' || normalizedMaterial.includes('paper') || normalizedMaterial === 'pape';
};

const parseAppModel = (appModel) => {
  if (!appModel) return [];
  return appModel.split(',').map(m => m.trim().replace(/^["']|["']$/g, ''));
};

// 获取耗材数据
async function fetchConsumablesData() {
  try {
    const apiUrl = 'http://localhost:8080/wp-json/bjt/v1/consumables?page=1&per_page=1000';
    console.log('📡 正在从API获取数据:', apiUrl);
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API响应状态:', response.status);
    
    // 处理API响应格式
    let consumablesData = [];
    const data = response.data;
    
    if (data.success && data.data) {
      if (Array.isArray(data.data.items)) {
        consumablesData = data.data.items;
      } else if (Array.isArray(data.data)) {
        consumablesData = data.data;
      }
    } else if (Array.isArray(data)) {
      consumablesData = data;
    }
    
    console.log(`📊 解析到 ${consumablesData.length} 个耗材产品\n`);
    
    if (consumablesData.length === 0) {
      throw new Error('没有获取到有效的耗材数据');
    }
    
    return consumablesData;
    
  } catch (error) {
    console.error('❌ 获取耗材数据失败:', error.message);
    throw error;
  }
}

// 测试Model筛选
function testModelFilter(consumables) {
  console.log('🔍 测试Model筛选修复效果...');
  const modelCountMap = new Map();
  
  consumables.forEach(item => {
    if (item.app_model) {
      const models = parseAppModel(item.app_model);
      models.forEach(model => {
        if (model) {
          modelCountMap.set(model, (modelCountMap.get(model) || 0) + 1);
        }
      });
    }
  });
  
  console.log('📈 实际Model统计:');
  const modelResults = {};
  let allPassed = true;
  
  Array.from(modelCountMap.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([model, count]) => {
      const expected = expectedCounts.models[model];
      const status = expected ? (count === expected ? '✅' : '❌') : '⚠️';
      if (expected && count !== expected) allPassed = false;
      
      console.log(`  ${status} ${model}: ${count}个产品${expected ? ` (期望: ${expected})` : ' (新增)'}`);
      modelResults[model] = { actual: count, expected, status };
    });
  
  return { passed: allPassed, results: modelResults };
}

// 测试Shape筛选
function testShapeFilter(consumables) {
  console.log('\n🔍 测试Shape筛选修复效果...');
  const shapeCountMap = new Map();
  
  consumables.forEach(item => {
    if (item.shape) {
      const normalizedShape = item.shape.trim();
      shapeCountMap.set(normalizedShape, (shapeCountMap.get(normalizedShape) || 0) + 1);
    }
  });
  
  console.log('📈 实际Shape统计:');
  const shapeResults = {};
  let allPassed = true;
  
  Array.from(shapeCountMap.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([shape, count]) => {
      const expected = expectedCounts.shapes[shape];
      const status = expected ? (count === expected ? '✅' : '❌') : '⚠️';
      if (expected && count !== expected) allPassed = false;
      
      console.log(`  ${status} ${shape}: ${count}个产品${expected ? ` (期望: ${expected})` : ' (新增)'}`);
      shapeResults[shape] = { actual: count, expected, status };
    });
  
  return { passed: allPassed, results: shapeResults };
}

// 测试Material筛选
function testMaterialFilter(consumables) {
  console.log('\n🔍 测试Material筛选修复效果...');
  const materialCountMap = new Map();
  
  consumables.forEach(item => {
    if (item.material) {
      materialCountMap.set(item.material, (materialCountMap.get(item.material) || 0) + 1);
    }
  });
  
  console.log('📈 实际Material统计:');
  const materialResults = {};
  let allPassed = true;
  
  Array.from(materialCountMap.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([material, count]) => {
      const expected = expectedCounts.materials[material];
      const status = expected ? (count === expected ? '✅' : '❌') : '⚠️';
      if (expected && count !== expected) allPassed = false;
      
      console.log(`  ${status} ${material}: ${count}个产品${expected ? ` (期望: ${expected})` : ' (新增)'}`);
      materialResults[material] = { actual: count, expected, status };
    });
  
  return { passed: allPassed, results: materialResults };
}

// 测试规格筛选（厚度/重量）
function testSpecFilter(consumables) {
  console.log('\n🔍 测试规格筛选修复效果...');
  
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
  
  console.log('📈 塑料材质厚度分布:');
  Object.entries(plasticThickness)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .forEach(([thickness, count]) => {
      console.log(`  📏 ${thickness}: ${count}个产品`);
    });
  
  console.log('📈 纸质材质重量分布:');
  Object.entries(paperWeight)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .forEach(([weight, count]) => {
      console.log(`  ⚖️ ${weight}: ${count}个产品`);
    });
  
  return {
    plasticThickness: Object.keys(plasticThickness).length,
    paperWeight: Object.keys(paperWeight).length,
    totalSpecs: Object.keys(plasticThickness).length + Object.keys(paperWeight).length
  };
}

// 测试尺寸筛选
function testDimensionFilter(consumables) {
  console.log('\n🔍 测试尺寸筛选修复效果...');
  
  const widthStats = {};
  const lengthStats = {};
  
  consumables.forEach(item => {
    if (item.width_met) {
      const key = `${item.width_met}cm`;
      widthStats[key] = (widthStats[key] || 0) + 1;
    }
    if (item.length_met) {
      const key = `${item.length_met}cm`;
      lengthStats[key] = (lengthStats[key] || 0) + 1;
    }
  });
  
  console.log('📈 宽度分布:');
  Object.entries(widthStats)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .forEach(([width, count]) => {
      console.log(`  📐 ${width}: ${count}个产品`);
    });
  
  console.log('📈 长度分布:');
  Object.entries(lengthStats)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    .forEach(([length, count]) => {
      console.log(`  📏 ${length}: ${count}个产品`);
    });
  
  return {
    widthOptions: Object.keys(widthStats).length,
    lengthOptions: Object.keys(lengthStats).length,
    totalDimensions: Object.keys(widthStats).length + Object.keys(lengthStats).length
  };
}

// 测试组合筛选
function testCombinationFilter(consumables) {
  console.log('\n🔍 测试组合筛选功能...');
  
  // 测试 LA-E4C + Pillow 组合
  const combo1 = consumables.filter(item => {
    const models = parseAppModel(item.app_model);
    return models.includes('LA-E4C') && normalize(item.shape) === normalize('Pillow');
  });
  console.log(`📊 LA-E4C + Pillow: ${combo1.length}个产品`);
  
  // 测试 50% HDPE + Bubble 组合
  const combo2 = consumables.filter(item => {
    return normalize(item.material) === normalize('50% HDPE') && 
           normalize(item.shape) === normalize('Bubble');
  });
  console.log(`📊 50% HDPE + Bubble: ${combo2.length}个产品`);
  
  // 测试纸质材料 + thickness_met作为重量
  const combo3 = consumables.filter(item => {
    return isPaperMaterial(item.material) && item.thickness_met;
  });
  console.log(`📊 纸质材料(有重量): ${combo3.length}个产品`);
  
  return {
    combo1: combo1.length,
    combo2: combo2.length,
    combo3: combo3.length
  };
}

// 生成修复总结报告
function generateSummaryReport(results) {
  console.log('\n🎯 修复效果总结报告:');
  console.log('=====================================');
  
  console.log('\n✅ 已完成修复:');
  console.log(`  📋 Model筛选: ${results.model.passed ? '✅ 通过' : '❌ 需要调整'}`);
  console.log(`  🎯 Shape筛选: ${results.shape.passed ? '✅ 通过' : '❌ 需要调整'}`);
  console.log(`  🧪 Material筛选: ${results.material.passed ? '✅ 通过' : '❌ 需要调整'}`);
  
  console.log('\n📊 数据分析结果:');
  console.log(`  📏 规格选项总数: ${results.specs.totalSpecs}`);
  console.log(`  📐 尺寸选项总数: ${results.dimensions.totalDimensions}`);
  console.log(`  🔄 组合筛选测试: ${results.combinations.combo1 + results.combinations.combo2 + results.combinations.combo3}个组合样本`);
  
  console.log('\n🎉 修复状态:');
  const allPassed = results.model.passed && results.shape.passed && results.material.passed;
  if (allPassed) {
    console.log('  🟢 所有核心筛选功能修复完成！');
  } else {
    console.log('  🟡 部分筛选需要进一步调整');
  }
  
  console.log('\n📋 下一步建议:');
  if (!results.model.passed) {
    console.log('  🔧 调整Model筛选的app_model解析逻辑');
  }
  if (!results.shape.passed) {
    console.log('  🔧 检查Shape筛选的bag_type字段映射');
  }
  if (!results.material.passed) {
    console.log('  🔧 优化Material筛选的normalize处理');
  }
  
  console.log('  🧪 在浏览器中运行前端测试');
  console.log('  📈 验证性能优化效果');
  console.log('  🚀 准备部署到生产环境');
  
  return allPassed;
}

// 主测试流程
async function runAllTests() {
  try {
    console.log('🔧 BJT耗材页面完整筛选功能修复验证');
    console.log('==========================================\n');
    
    // 获取数据
    const consumables = await fetchConsumablesData();
    
    // 执行所有测试
    const results = {
      model: testModelFilter(consumables),
      shape: testShapeFilter(consumables),
      material: testMaterialFilter(consumables),
      specs: testSpecFilter(consumables),
      dimensions: testDimensionFilter(consumables),
      combinations: testCombinationFilter(consumables)
    };
    
    // 生成总结报告
    const allPassed = generateSummaryReport(results);
    
    // 输出测试结果
    console.log('\n📄 详细测试数据已保存到控制台输出');
    console.log(`🏁 测试完成! 总体状态: ${allPassed ? '✅ PASS' : '⚠️ 需要调整'}`);
    
    // 设置进程退出码
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 测试执行失败:', error.message);
    console.log('\n🔧 故障排除建议:');
    console.log('  1. 确认API服务运行在 localhost:8080');
    console.log('  2. 检查网络连接和防火墙设置');
    console.log('  3. 验证WordPress API endpoint正常工作');
    console.log('  4. 检查数据库连接和数据完整性');
    
    process.exit(2);
  }
}

// 执行测试
if (require.main === module) {
  runAllTests();
}

module.exports = {
  fetchConsumablesData,
  testModelFilter,
  testShapeFilter,
  testMaterialFilter,
  testSpecFilter,
  testDimensionFilter,
  testCombinationFilter,
  generateSummaryReport
}; 