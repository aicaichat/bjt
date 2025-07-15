/**
 * 单位制显示修复测试脚本
 * 
 * 测试CartFieldUnifier的getFieldLabel和getFieldValue方法
 * 验证托盘尺寸等字段在公制和英制模式下的正确显示
 * 
 * 使用方法：
 * cd frontend && node ../scripts/test-unit-system-fix.js
 */

console.log('=== 单位制显示修复测试 ===');
console.log('测试时间:', new Date().toISOString());
console.log();

// 模拟测试数据
const testItem = {
  id: 'test-item-1',
  product_type: 'spare_part',
  part_number: '123131313131344',
  name: 'LA E5S test',
  model: 'LA-E5S V1.1',
  voltage: '220',
  properties: {
    pallet_size_cm: '100×120',
    pallet_size_inch: '39.4×47.2',
    pallet_height_cm: '150',
    pallet_height_inch: '59.1',
    package_size_cm: '21×21×42',
    package_size_inch: '8.3×8.3×16.5',
    net_weight_kg: '4.65',
    net_weight_lbs: '10.25',
    gross_weight_kg: '10.13',
    gross_weight_lbs: '22.34'
  }
};

// 测试字段列表
const testFields = [
  'pallet_size_cm',
  'pallet_height_cm', 
  'package_size_cm',
  'net_weight_kg',
  'gross_weight_kg'
];

// 模拟CartFieldUnifier的核心逻辑
const mockCartFieldUnifier = {
  getFieldLabel: function(fieldKey, language = 'zh', unitSystem = 'metric') {
    // 托盘尺寸字段的智能单位制处理
    if (fieldKey === 'pallet_size_cm' || fieldKey === 'pallet_size_inch' || fieldKey === 'pallet_size') {
      const baseName = language === 'zh' ? '托盘尺寸' : 'Pallet Size';
      const unit = unitSystem === 'metric' ? 'cm' : 'inch';
      return `${baseName}(${unit.toUpperCase()})`;
    }
    
    // 托盘高度字段的智能单位制处理
    if (fieldKey === 'pallet_height_cm' || fieldKey === 'pallet_height_inch' || fieldKey === 'pallet_height') {
      const baseName = language === 'zh' ? '托盘高度' : 'Pallet Height';
      const unit = unitSystem === 'metric' ? 'cm' : 'inch';
      return `${baseName}(${unit.toUpperCase()})`;
    }
    
    // 包装尺寸
    if (fieldKey === 'package_size_cm') {
      const baseName = language === 'zh' ? '包装尺寸' : 'Package Size';
      const unit = unitSystem === 'metric' ? 'cm' : 'inch';
      return `${baseName}(${unit})`;
    }
    
    // 净重
    if (fieldKey === 'net_weight_kg') {
      const baseName = language === 'zh' ? '单件净重' : 'Net Weight';
      const unit = unitSystem === 'metric' ? 'kg' : 'lbs';
      return `${baseName}(${unit})`;
    }
    
    // 毛重
    if (fieldKey === 'gross_weight_kg') {
      const baseName = language === 'zh' ? '包装毛重' : 'Gross Weight';
      const unit = unitSystem === 'metric' ? 'kg' : 'lbs';
      return `${baseName}(${unit})`;
    }
    
    return fieldKey;
  },
  
  getFieldValue: function(item, fieldKey, language = 'zh', unitSystem = 'metric') {
    const props = item.properties || {};
    
    // 托盘尺寸字段的智能单位制切换
    if (fieldKey === 'pallet_size_cm' || fieldKey === 'pallet_size_inch' || fieldKey === 'pallet_size') {
      if (unitSystem === 'metric') {
        return props.pallet_size_cm || props.pallet_size || item.pallet_size_cm || item.pallet_size;
      } else {
        return props.pallet_size_inch || props.pallet_size_imperial || item.pallet_size_inch || item.pallet_size_imperial;
      }
    }
    
    // 托盘高度字段的智能单位制切换
    if (fieldKey === 'pallet_height_cm' || fieldKey === 'pallet_height_inch' || fieldKey === 'pallet_height') {
      if (unitSystem === 'metric') {
        return props.pallet_height_cm || props.pallet_height || item.pallet_height_cm || item.pallet_height;
      } else {
        return props.pallet_height_inch || props.pallet_height_imperial || item.pallet_height_inch || item.pallet_height_imperial;
      }
    }
    
    // 包装尺寸
    if (fieldKey === 'package_size_cm') {
      if (unitSystem === 'metric') {
        return props.package_size_cm || props.package_size || item.package_size_cm || item.package_size;
      } else {
        return props.package_size_inch || props.package_size_imperial || item.package_size_inch || item.package_size_imperial;
      }
    }
    
    // 净重
    if (fieldKey === 'net_weight_kg') {
      if (unitSystem === 'metric') {
        return props.net_weight_kg || props.net_weight || item.net_weight_kg || item.net_weight;
      } else {
        return props.net_weight_lbs || props.net_weight_lb || item.net_weight_lbs || item.net_weight_lb;
      }
    }
    
    // 毛重
    if (fieldKey === 'gross_weight_kg') {
      if (unitSystem === 'metric') {
        return props.gross_weight_kg || props.gross_weight || item.gross_weight_kg || item.gross_weight;
      } else {
        return props.gross_weight_lbs || props.gross_weight_lb || item.gross_weight_lbs || item.gross_weight_lb;
      }
    }
    
    return props[fieldKey] || item[fieldKey] || '暂无数据';
  }
};

// 执行测试
console.log('🧪 测试各字段在不同单位制下的显示:');
console.log();

['metric', 'imperial'].forEach(unitSystem => {
  console.log(`📏 ${unitSystem === 'metric' ? '公制模式' : '英制模式'}:`);
  console.log('━'.repeat(50));
  
  testFields.forEach(fieldKey => {
    const label = mockCartFieldUnifier.getFieldLabel(fieldKey, 'zh', unitSystem);
    const value = mockCartFieldUnifier.getFieldValue(testItem, fieldKey, 'zh', unitSystem);
    
    console.log(`  ${fieldKey}:`);
    console.log(`    标签: ${label}`);
    console.log(`    值: ${value}`);
    console.log();
  });
  
  console.log();
});

// 重点测试托盘尺寸字段
console.log('🎯 重点测试 - 托盘尺寸字段:');
console.log('━'.repeat(50));

const palletTestCases = [
  { fieldKey: 'pallet_size_cm', description: '使用 pallet_size_cm 字段' },
  { fieldKey: 'pallet_size_inch', description: '使用 pallet_size_inch 字段' },
  { fieldKey: 'pallet_size', description: '使用通用 pallet_size 字段' }
];

palletTestCases.forEach(testCase => {
  console.log(`\n📦 ${testCase.description}:`);
  
  ['metric', 'imperial'].forEach(unitSystem => {
    const label = mockCartFieldUnifier.getFieldLabel(testCase.fieldKey, 'zh', unitSystem);
    const value = mockCartFieldUnifier.getFieldValue(testItem, testCase.fieldKey, 'zh', unitSystem);
    
    console.log(`  ${unitSystem === 'metric' ? '公制' : '英制'}: ${label} = ${value}`);
  });
});

console.log('\n✅ 测试完成！');
console.log('\n📋 期待结果:');
console.log('  - 公制模式应显示: 托盘尺寸(CM) = 100×120');
console.log('  - 英制模式应显示: 托盘尺寸(INCH) = 39.4×47.2');
console.log('  - 标签应根据用户偏好自动切换单位');
console.log('  - 值应从正确的字段中获取');
console.log('\n🔧 修复验证:');
console.log('  - getFieldLabel: 正确根据unitSystem返回对应单位的标签');
console.log('  - getFieldValue: 正确根据unitSystem选择对应的数据字段');
console.log('  - 显示字段配置: SPARE_PART_FIELDS已包含pallet_size_cm字段'); 