// 🔧 耗材页面Tooltip字段完整性验证脚本
// 可以直接在浏览器控制台中运行此脚本来验证tooltip字段显示的完整性

console.log('🔧 开始验证耗材Tooltip字段完整性...');

// 根据CSV要求定义的33个必须字段
const REQUIRED_TOOLTIP_FIELDS = {
  // 基本规格字段（8个）
  basicSpecs: [
    'material',           // 材质
    'thickness',          // 厚度/克重
    'width_met',         // 膜宽(公制)
    'width_imp',         // 膜宽(英制)
    'length_met',        // 袋长(公制)
    'length_inch',       // 袋长(英制)
    'total_length_met',  // 总长(公制)
    'total_length_imp'   // 总长(英制)
  ],
  
  // 产品标识字段（5个）
  productInfo: [
    'part_number',       // 料号
    'model',            // 型号(公制)
    'model_imperial',   // 型号(英制)
    'spec',             // 规格(公制)
    'spec_imperial',    // 规格(英制)
    'brand'             // 品牌
  ],
  
  // 条件显示字段（2个）
  conditionalFields: [
    'bubble_diameter_met', // 泡径(公制) - 仅气泡产品
    'bubble_diameter_inch' // 泡径(英制) - 仅气泡产品
  ],
  
  // 包装属性字段（8个）
  packageInfo: [
    'packaging_type',        // 包装方式
    'package_size_cm',       // 包装尺寸(公制)
    'package_size_inch',     // 包装尺寸(英制)
    'unit_weight_kg',        // 单件净重(公制)
    'unit_weight_lbs',       // 单件净重(英制)
    'package_gross_weight_kg', // 包装毛重(公制)
    'package_gross_weight_lbs', // 包装毛重(英制)
    'pcs_per_box',          // 单箱数量
    'package_image_url'     // 包装实物图片
  ],
  
  // 打托属性字段（10个）
  palletInfo: [
    'pallet_size_cm',        // 托盘尺寸
    'pallet_rolls_a',        // 一托卷数A
    'pallet_weight_a_kg',    // 整托毛重A(公制)
    'pallet_weight_a_lbs',   // 整托毛重A(英制)
    'pallet_height_a_cm',    // 打托高度A(公制)
    'pallet_height_a_inch',  // 打托高度A(英制)
    'pallet_rolls_b',        // 一托卷数B
    'pallet_weight_b_kg',    // 整托毛重B(公制)
    'pallet_height_b_cm',    // 打托高度B(公制)
    'core_diameter_cm'       // 纸筒内径(公制)
  ]
};

// 验证函数
window.validateTooltipFields = function(productItem = null) {
  console.log('🔍 [Tooltip验证] 开始字段完整性检查...');
  
  try {
    // 获取测试数据
    let testItem = productItem;
    if (!testItem) {
      if (typeof allConsumables !== 'undefined' && allConsumables.length > 0) {
        testItem = allConsumables[0];
        console.log('📊 [测试数据] 使用第一个产品进行测试:', testItem.name || testItem.id);
      } else {
        console.error('❌ 无法获取测试数据，请确保页面已加载');
        return { success: false, error: '无法获取测试数据' };
      }
    }
    
    // 模拟safeGet函数的字段映射
    const fieldMappings = {
      'material': ['material', 'specs.material'],
      'thickness': ['thickness', 'specs.thickness', 'thickness_met', 'thickness_imp'],
      'width_met': ['width_met', 'width_met_val', 'specs.width', 'width'],
      'width_imp': ['width_imp', 'width_imp_val', 'specs.width_imperial'],
      'length_met': ['length_met', 'length_met_val', 'specs.length', 'length'],
      'length_inch': ['length_imp', 'length_imp_val', 'specs.length_imperial'],
      'total_length_met': ['total_length_met', 'total_length_met_val', 'specs.rollLength'],
      'total_length_imp': ['total_length_imp', 'total_length_imp_val', 'specs.rollLength_imperial'],
      'part_number': ['part_number', 'code', 'product_code', 'specs.part_number'],
      'model': ['model', 'model_met', 'specs.model'],
      'model_imperial': ['model_imperial', 'model_imp', 'specs.model_imperial'],
      'spec': ['spec', 'spec_met', 'specs.spec'],
      'spec_imperial': ['spec_imperial', 'spec_imp', 'specs.spec_imperial'],
      'brand': ['brand', 'specs.brand'],
      'bubble_diameter_met': ['bubble_diameter_met', 'specs.bubble_diameter_met'],
      'bubble_diameter_inch': ['bubble_diameter_inch', 'specs.bubble_diameter_inch'],
      'packaging_type': ['package_type', 'packaging_type', 'sales_unit', 'specs.package_type'],
      'package_size_cm': ['package_size_cm', 'specs.package_size_cm'],
      'package_size_inch': ['package_size_inch', 'specs.package_size_inch'],
      'unit_weight_kg': ['net_weight_kg', 'unit_weight_kg', 'specs.net_weight_kg'],
      'unit_weight_lbs': ['net_weight_lbs', 'unit_weight_lbs', 'specs.net_weight_lbs'],
      'package_gross_weight_kg': ['package_gross_weight_kg', 'gross_weight_kg', 'specs.package_gross_weight_kg'],
      'package_gross_weight_lbs': ['package_gross_weight_lbs', 'gross_weight_lbs', 'specs.package_gross_weight_lbs'],
      'pcs_per_box': ['pcs_per_box', 'per_box', 'box_quantity', 'specs.pcs_per_box'],
      'package_image_url': ['package_image_url', 'packaging_image', 'specs.package_image_url'],
      'pallet_size_cm': ['pallet_size_cm', 'specs.pallet_size_cm'],
      'pallet_rolls_a': ['pcs_per_pallet_a', 'pallet_rolls_a', 'specs.pcs_per_pallet_a'],
      'pallet_weight_a_kg': ['pallet_gross_weight_a_kg', 'specs.pallet_gross_weight_a_kg'],
      'pallet_weight_a_lbs': ['pallet_gross_weight_a_lbs', 'specs.pallet_gross_weight_a_lbs'],
      'pallet_height_a_cm': ['pallet_height_a_cm', 'specs.pallet_height_a_cm'],
      'pallet_height_a_inch': ['pallet_height_a_inch', 'specs.pallet_height_a_inch'],
      'pallet_rolls_b': ['pcs_per_pallet_b', 'pallet_rolls_b', 'specs.pcs_per_pallet_b'],
      'pallet_weight_b_kg': ['pallet_gross_weight_b_kg', 'specs.pallet_gross_weight_b_kg'],
      'pallet_height_b_cm': ['pallet_height_b_cm', 'specs.pallet_height_b_cm'],
      'core_diameter_cm': ['tube_inner_diameter_cm', 'core_diameter_cm', 'specs.tube_inner_diameter_cm']
    };
    
    // 模拟safeGet函数
    const mockSafeGet = (field, fallback = 'N/A') => {
      if (fieldMappings[field]) {
        for (const mappedField of fieldMappings[field]) {
          let value;
          if (mappedField.includes('.')) {
            const [parentKey, childKey] = mappedField.split('.');
            value = testItem[parentKey]?.[childKey];
          } else {
            value = testItem[mappedField];
          }
          if (value !== null && value !== undefined && value !== '') {
            return String(value);
          }
        }
      }
      return fallback;
    };
    
    // 执行字段验证
    const validationResults = {};
    let totalFields = 0;
    let availableFields = 0;
    let missingFields = [];
    
    for (const [category, fields] of Object.entries(REQUIRED_TOOLTIP_FIELDS)) {
      validationResults[category] = {
        total: fields.length,
        available: 0,
        missing: [],
        details: {}
      };
      
      for (const field of fields) {
        totalFields++;
        const value = mockSafeGet(field);
        const isAvailable = value !== 'N/A' && value !== '' && value !== '待补充';
        
        validationResults[category].details[field] = {
          value: value,
          available: isAvailable,
          mappedFrom: fieldMappings[field] || [field]
        };
        
        if (isAvailable) {
          validationResults[category].available++;
          availableFields++;
        } else {
          validationResults[category].missing.push(field);
          missingFields.push(field);
        }
      }
    }
    
    // 生成报告
    const completionRate = Math.round((availableFields / totalFields) * 100);
    const report = {
      summary: {
        totalFields,
        availableFields,
        missingFields: missingFields.length,
        completionRate: `${completionRate}%`,
        status: completionRate >= 80 ? '✅ 优秀' : completionRate >= 60 ? '⚠️ 良好' : '❌ 需要改进'
      },
      byCategory: validationResults,
      missingFieldsList: missingFields,
      testProduct: {
        id: testItem.id,
        name: testItem.name || testItem.code,
        shape: testItem.shape
      }
    };
    
    // 输出详细报告
    console.log('📊 [验证报告] Tooltip字段完整性分析:');
    console.log('===============================================');
    console.log(`🎯 总体评估: ${report.summary.status}`);
    console.log(`📈 完成度: ${report.summary.completionRate} (${availableFields}/${totalFields})`);
    console.log('');
    
    for (const [category, result] of Object.entries(validationResults)) {
      const categoryRate = Math.round((result.available / result.total) * 100);
      console.log(`📂 ${category}: ${categoryRate}% (${result.available}/${result.total})`);
      
      if (result.missing.length > 0) {
        console.log(`   ❌ 缺失字段: ${result.missing.join(', ')}`);
      }
    }
    
    if (missingFields.length > 0) {
      console.log('');
      console.log('🚨 需要补充的字段:');
      missingFields.forEach(field => {
        console.log(`   - ${field}: ${fieldMappings[field]?.join(' | ') || 'N/A'}`);
      });
    }
    
    console.log('');
    console.log('💡 建议:');
    if (completionRate < 60) {
      console.log('   1. 优先补充基本规格和产品标识字段');
      console.log('   2. 确保API返回数据包含所有必要字段');
      console.log('   3. 检查字段映射是否正确');
    } else if (completionRate < 80) {
      console.log('   1. 补充包装属性和打托属性字段');
      console.log('   2. 完善条件显示逻辑');
    } else {
      console.log('   1. 字段完整性良好，继续保持');
      console.log('   2. 可以优化UI展示效果');
    }
    
    return report;
    
  } catch (error) {
    console.error('❌ [验证失败] Tooltip字段验证出现错误:', error);
    return { success: false, error: error.message };
  }
};

// 自动运行验证（如果页面已加载）
if (document.readyState === 'complete') {
  setTimeout(() => {
    if (typeof allConsumables !== 'undefined' && allConsumables.length > 0) {
      window.validateTooltipFields();
    }
  }, 1000);
} else {
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof allConsumables !== 'undefined' && allConsumables.length > 0) {
        window.validateTooltipFields();
      }
    }, 2000);
  });
}

console.log('🔧 Tooltip字段验证脚本已加载');
console.log('📖 使用方法: 在控制台运行 validateTooltipFields() 进行验证'); 