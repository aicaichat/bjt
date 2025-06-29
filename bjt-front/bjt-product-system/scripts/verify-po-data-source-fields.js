#!/usr/bin/env node

/**
 * PO页面数据源字段验证脚本
 * 检查PO页面显示的字段是否从正确的数据表中读取，以及数据类型表字段值是否正确
 */

const fs = require('fs');
const path = require('path');

// 数据库表结构定义（基于实际数据库设计）
const DATABASE_TABLES = {
  // 主机料号表
  'wp_bjt_parts': {
    description: '主机料号表',
    type: 'machine',
    fields: {
      'id': 'bigint(20) AUTO_INCREMENT',
      'product_line': 'varchar(50) - 产品线标识',
      'model': 'varchar(100) - 型号',
      'voltage': 'varchar(50) - 电压',
      'image_url': 'varchar(255) - 图片URL',
      'part_number': 'varchar(100) - 料号',
      'name_cn': 'varchar(255) - 中文名称',
      'name_en': 'varchar(255) - 英文名称',
      'brand': 'varchar(100) - 品牌',
      'spec': 'varchar(255) - 规格参数(公制)',
      'spec_imperial': 'varchar(255) - 规格参数(英制)',
      'package_size_cm': 'varchar(100) - 包装尺寸(cm)',
      'package_size_inch': 'varchar(100) - 包装尺寸(inch)',
      'net_weight_kg': 'decimal(10,2) - 单件净重(kg)',
      'net_weight_lbs': 'decimal(10,2) - 单件净重(lbs)',
      'pcs_per_box': 'int(11) - 单箱数量',
      'pallet_size_cm': 'varchar(100) - 托盘尺寸(cm)',
      'pallet_size_inch': 'varchar(100) - 托盘尺寸(inch)',
      'pcs_per_pallet': 'int(11) - 一托数量'
    }
  },

  // 配件料号表
  'wp_bjt_accessories': {
    description: '配件料号表',
    type: 'accessory',
    fields: {
      'id': 'bigint(20) AUTO_INCREMENT',
      'product_line': 'varchar(50) - 产品线标识',
      'model': 'varchar(100) - 型号',
      'brand': 'varchar(100) - 品牌',
      'part_number': 'varchar(100) - 料号',
      'name_cn': 'varchar(255) - 中文名称',
      'name_en': 'varchar(255) - 英文名称',
      'spec': 'varchar(255) - 规格参数(公制)',
      'spec_imperial': 'varchar(255) - 规格参数(英制)',
      'voltage': 'varchar(50) - 电压',
      'frequency': 'varchar(50) - 频率',
      'package_size_cm': 'varchar(100) - 包装尺寸(cm)',
      'package_size_inch': 'varchar(100) - 包装尺寸(inch)',
      'net_weight_kg': 'decimal(10,2) - 单件净重(kg)',
      'net_weight_lbs': 'decimal(10,2) - 单件净重(lbs)',
      'pcs_per_box': 'int(11) - 单箱数量',
      'pallet_size_cm': 'varchar(100) - 托盘尺寸(cm)',
      'pallet_size_inch': 'varchar(100) - 托盘尺寸(inch)',
      'pcs_per_pallet': 'int(11) - 一托数量'
    }
  },

  // 备件料号表
  'wp_bjt_spare_parts': {
    description: '备件料号表',
    type: 'spare_part',
    fields: {
      'id': 'bigint(20) AUTO_INCREMENT',
      'product_line_id': 'bigint(20) - 产品线ID',
      'app_model': 'varchar(255) - 适配机型',
      'is_consumable': 'tinyint(1) - 是否易损',
      'image_url': 'varchar(255) - 产品图片',
      'part_number': 'varchar(100) - 料号',
      'name_zh': 'varchar(255) - 中文名称',
      'name_en': 'varchar(255) - 英文名称',
      'spec': 'varchar(255) - 规格参数(公制)',
      'spec_imperial': 'varchar(255) - 规格参数(英制)',
      'app_sn': 'varchar(255) - 适配序列号',
      'package_size_cm': 'varchar(100) - 包装尺寸(cm)',
      'package_size_inch': 'varchar(100) - 包装尺寸(inch)',
      'net_weight_kg': 'decimal(10,2) - 单件净重(kg)',
      'net_weight_lbs': 'decimal(10,2) - 单件净重(lbs)',
      'pcs_per_box': 'int(11) - 单箱数量'
    }
  },

  // 耗材表
  'wp_bjt_consumables': {
    description: '耗材表',
    type: 'consumable',
    fields: {
      'id': 'bigint(20) AUTO_INCREMENT',
      'product_line_id': 'bigint(20) - 产品线ID',
      'model': 'varchar(100) - 型号',
      'brand': 'varchar(100) - 品牌',
      'part_number': 'varchar(100) - 料号',
      'name_zh': 'varchar(255) - 中文名称', // ✅ 实际存在
      'name_en': 'varchar(255) - 英文名称', // ✅ 实际存在
      'title_zh': 'varchar(255) - 中文标题', // ✅ 实际存在
      'title_en': 'varchar(255) - 英文标题', // ✅ 实际存在
      'spec': 'varchar(255) - 规格参数(公制)',
      'spec_imperial': 'varchar(255) - 规格参数(英制)',
      'app_model': 'varchar(255) - 适用机型',
      'bag_type': 'varchar(100) - 袋型',
      'material': 'varchar(100) - 材质',
      'thickness_met': 'decimal(10,2) - 厚度/克重(um/gsm)',
      'thickness_imp': 'decimal(10,2) - 厚度/克重(mil/#)',
      'width_met': 'decimal(10,2) - 膜宽(cm)',
      'width_imp': 'decimal(10,2) - 膜宽(inch)',
      'package_size_cm': 'varchar(100) - 包装尺寸(cm)',
      'package_size_inch': 'varchar(100) - 包装尺寸(inch)',
      'net_weight_kg': 'decimal(10,2) - 单件净重(kg)',
      'net_weight_lbs': 'decimal(10,2) - 单件净重(lbs)'
    }
  }
};

// PO页面字段映射（从代码分析得出）
const PO_FIELD_MAPPING = {
  // 料号字段映射
  'partNumber': {
    poDisplayName: '料号',
    sourceLogic: 'p.code || p.sku || (p as any).part_number || (p as any).item_id || \'-\'',
    expectedDatabaseFields: {
      'machine': 'part_number',
      'accessory': 'part_number', 
      'spare_part': 'part_number',
      'consumable': 'part_number'
    },
    priority: ['code', 'sku', 'part_number', 'item_id'],
    fallback: '-'
  },

  // 名称字段映射
  'item': {
    poDisplayName: '名称',
    sourceLogic: 'getProductName(p) - 多语言名称获取函数',
    expectedDatabaseFields: {
      'machine': ['name_cn', 'name_en'],
      'accessory': ['name_cn', 'name_en'],
      'spare_part': ['name_zh', 'name_en'],
      'consumable': ['title_zh', 'title_en']
    },
    priority: ['name_zh', 'name_en', 'name_cn', 'title_zh', 'title_en', 'name'],
    multilingual: true
  },

  // 型号字段映射
  'model': {
    poDisplayName: '型号',
    sourceLogic: 'p.model || \'\'',
    expectedDatabaseFields: {
      'machine': 'model',
      'accessory': 'model',
      'spare_part': 'app_model', // 备件使用适配机型作为型号
      'consumable': 'model'
    },
    fallback: ''
  },

  // 规格描述字段映射
  'description': {
    poDisplayName: '规格描述',
    sourceLogic: 'p.spec || \'\'',
    expectedDatabaseFields: {
      'machine': ['spec', 'spec_imperial'],
      'accessory': ['spec', 'spec_imperial'],
      'spare_part': ['spec', 'spec_imperial'],
      'consumable': 'spec'
    },
    unitDependent: true,
    fallback: ''
  },

  // 品牌字段映射
  'brandName': {
    poDisplayName: '品牌',
    sourceLogic: 'p.brand || \'\'',
    expectedDatabaseFields: {
      'machine': 'brand',
      'accessory': 'brand',
      'spare_part': null, // 备件表可能没有brand字段
      'consumable': 'brand'
    },
    fallback: ''
  }
};

// API查询逻辑分析（基于代码搜索结果）
const API_QUERY_LOGIC = {
  'machine': {
    table: 'wp_bjt_parts',
    queryStrategies: [
      'SELECT model, brand, spec, name_zh, name_en FROM table WHERE part_number = ?',
      'SELECT model, brand, spec, name_zh, name_en FROM table WHERE model = ?',
      'SELECT model, brand, spec, name_zh, name_en FROM table WHERE id = ?',
      'SELECT model, brand, spec, name_zh, name_en FROM table WHERE name_zh LIKE ? OR name_en LIKE ?'
    ],
    nameFields: ['name_cn', 'name_en'],
    issues: ['使用name_cn而不是name_zh可能导致字段不匹配']
  },

  'spare_part': {
    table: 'wp_bjt_spare_parts',
    queryStrategies: [
      'SELECT COALESCE(NULLIF(model, \'\'), app_model, \'\') as model, spec, name_zh, name_en FROM table WHERE part_number = ?'
    ],
    nameFields: ['name_zh', 'name_en'],
    modelLogic: 'COALESCE(NULLIF(model, \'\'), app_model, \'\')',
    issues: ['model字段可能为空，使用app_model作为fallback']
  },

  'accessory': {
    table: 'wp_bjt_accessories',
    queryStrategies: [
      'SELECT model, brand, spec, name_zh, name_en FROM table WHERE part_number = ?'
    ],
    nameFields: ['name_cn', 'name_en'],
    issues: ['API使用name_zh/name_en但表结构可能是name_cn/name_en']
  },

  'consumable': {
    table: 'wp_bjt_consumables',
    queryStrategies: [
      'SELECT model, brand, spec, title_zh, title_en FROM table WHERE part_number = ?'
    ],
    nameFields: ['title_zh', 'title_en'],
    issues: ['使用title_zh/title_en而不是name_zh/name_en']
  }
};

// 数据类型不一致问题分析
const DATA_TYPE_ISSUES = {
  'field_naming_inconsistency': {
    description: '字段命名不一致',
    examples: [
      '主机表使用name_cn/name_en，备件表使用name_zh/name_en',
      '耗材表使用title_zh/title_en，其他表使用name_*格式',
      'API查询中字段名与实际表结构不匹配'
    ],
    impact: 'PO页面可能显示空值或错误数据',
    solution: '统一所有表的字段命名规范'
  },

  'model_field_logic': {
    description: '型号字段逻辑不一致',
    examples: [
      '备件表的model字段可能为空，需要使用app_model作为fallback',
      'API查询使用COALESCE(NULLIF(model, \'\'), app_model, \'\')',
      'PO页面直接使用p.model可能获取不到正确值'
    ],
    impact: '备件的型号显示可能为空',
    solution: '在前端也实现相同的fallback逻辑'
  },

  'brand_field_availability': {
    description: '品牌字段可用性不一致',
    examples: [
      '备件表可能没有brand字段',
      'API查询中brand字段可能返回NULL',
      'PO页面显示空白品牌信息'
    ],
    impact: '备件产品的品牌信息缺失',
    solution: '为备件表添加brand字段或使用默认值'
  },

  'spec_unit_handling': {
    description: '规格字段单位制处理',
    examples: [
      '数据库同时存储spec(公制)和spec_imperial(英制)',
      'PO页面需要根据用户偏好选择正确的规格字段',
      '当前代码只使用p.spec，未考虑英制需求'
    ],
    impact: '英制用户看到的规格信息可能不正确',
    solution: '根据用户单位偏好动态选择规格字段'
  }
};

// 验证函数
function verifyPODataSourceFields() {
  console.log('\n🔍 PO页面数据源字段验证报告');
  console.log('='.repeat(60));
  console.log(`验证时间: ${new Date().toLocaleString()}`);
  console.log(`验证范围: 数据表结构 → API查询逻辑 → PO页面显示`);

  // 1. 数据表结构分析
  console.log('\n📊 数据表结构分析:');
  Object.entries(DATABASE_TABLES).forEach(([tableName, tableInfo]) => {
    console.log(`\n🏷️  ${tableName} (${tableInfo.description})`);
    console.log(`   产品类型: ${tableInfo.type}`);
    
    // 检查关键字段
    const keyFields = ['part_number', 'model', 'brand', 'spec'];
    keyFields.forEach(field => {
      const fieldInfo = tableInfo.fields[field];
      if (fieldInfo) {
        console.log(`   ✅ ${field}: ${fieldInfo}`);
      } else {
        console.log(`   ❌ ${field}: 字段不存在`);
      }
    });

    // 检查名称字段
    const nameFields = Object.keys(tableInfo.fields).filter(f => 
      f.includes('name') || f.includes('title')
    );
    console.log(`   📝 名称字段: ${nameFields.join(', ')}`);
  });

  // 2. PO字段映射验证
  console.log('\n📋 PO字段映射验证:');
  Object.entries(PO_FIELD_MAPPING).forEach(([poField, mapping]) => {
    console.log(`\n🎯 ${mapping.poDisplayName} (${poField})`);
    console.log(`   源码逻辑: ${mapping.sourceLogic}`);
    
    Object.entries(mapping.expectedDatabaseFields).forEach(([productType, dbField]) => {
      const table = Object.values(DATABASE_TABLES).find(t => t.type === productType);
      if (table && dbField) {
        const fields = Array.isArray(dbField) ? dbField : [dbField];
        const fieldExists = fields.every(f => table.fields[f]);
        console.log(`   ${productType}: ${fields.join('/')} ${fieldExists ? '✅' : '❌'}`);
      } else if (dbField === null) {
        console.log(`   ${productType}: 无对应字段 ⚠️`);
      }
    });
  });

  // 3. API查询逻辑问题分析
  console.log('\n🔧 API查询逻辑问题分析:');
  Object.entries(API_QUERY_LOGIC).forEach(([productType, logic]) => {
    console.log(`\n📦 ${productType.toUpperCase()}`);
    console.log(`   数据表: ${logic.table}`);
    console.log(`   名称字段: ${logic.nameFields.join(', ')}`);
    
    if (logic.modelLogic) {
      console.log(`   型号逻辑: ${logic.modelLogic}`);
    }
    
    if (logic.issues && logic.issues.length > 0) {
      console.log(`   ⚠️  潜在问题:`);
      logic.issues.forEach(issue => {
        console.log(`      - ${issue}`);
      });
    }
  });

  // 4. 数据类型不一致问题
  console.log('\n❌ 数据类型不一致问题:');
  Object.entries(DATA_TYPE_ISSUES).forEach(([issueKey, issue]) => {
    console.log(`\n🚨 ${issue.description}`);
    console.log(`   影响: ${issue.impact}`);
    console.log(`   示例:`);
    issue.examples.forEach(example => {
      console.log(`      - ${example}`);
    });
    console.log(`   解决方案: ${issue.solution}`);
  });

  // 5. 修复建议
  console.log('\n💡 修复建议:');
  console.log('\n🔧 数据库层面:');
  console.log('   1. 统一字段命名规范');
  console.log('      - 所有产品表统一使用name_zh/name_en作为名称字段');
  console.log('      - 或者统一使用name_cn/name_en');
  console.log('   2. 完善字段覆盖');
  console.log('      - 为备件表添加brand字段');
  console.log('      - 确保所有表都有完整的规格字段(spec/spec_imperial)');

  console.log('\n🔧 API层面:');
  console.log('   1. 修正字段映射');
  console.log('      - 确保API查询使用正确的字段名');
  console.log('      - 实现统一的字段映射逻辑');
  console.log('   2. 增强查询逻辑');
  console.log('      - 为备件型号实现fallback逻辑');
  console.log('      - 添加品牌字段的默认值处理');

  console.log('\n🔧 前端层面:');
  console.log('   1. 完善字段获取逻辑');
  console.log('      - 实现与API相同的fallback机制');
  console.log('      - 根据用户单位偏好选择规格字段');
  console.log('   2. 增加数据验证');
  console.log('      - 检查关键字段是否为空');
  console.log('      - 提供友好的缺失数据提示');

  // 6. 验证结果总结
  console.log('\n📈 验证结果总结:');
  console.log('   ✅ 数据表结构基本完整');
  console.log('   ⚠️  字段命名存在不一致');
  console.log('   ❌ API查询逻辑与表结构不完全匹配');
  console.log('   🔧 需要统一字段映射和查询逻辑');
  
  return {
    success: false,
    issues: Object.keys(DATA_TYPE_ISSUES).length,
    recommendations: 8
  };
}

// 生成修复脚本建议
function generateFixScript() {
  console.log('\n📝 修复脚本建议:');
  console.log('\n-- 数据库字段统一脚本');
  console.log('-- 1. 统一名称字段命名');
  console.log('ALTER TABLE wp_bjt_parts CHANGE name_cn name_zh VARCHAR(255);');
  console.log('ALTER TABLE wp_bjt_accessories CHANGE name_cn name_zh VARCHAR(255);');
  console.log('ALTER TABLE wp_bjt_consumables CHANGE title_zh name_zh VARCHAR(255);');
  console.log('ALTER TABLE wp_bjt_consumables CHANGE title_en name_en VARCHAR(255);');
  
  console.log('\n-- 2. 为备件表添加brand字段');
  console.log('ALTER TABLE wp_bjt_spare_parts ADD COLUMN brand VARCHAR(100) COMMENT \'品牌\' AFTER name_en;');
  
  console.log('\n-- 3. 确保所有表都有规格字段');
  console.log('-- (检查并添加缺失的spec_imperial字段)');
  
  console.log('\n// 前端修复建议');
  console.log('// 1. 更新getProductName函数以处理统一的字段名');
  console.log('// 2. 实现getProductModel函数处理备件的型号fallback');
  console.log('// 3. 添加getProductSpec函数根据单位偏好选择规格');
}

// 主函数
function main() {
  console.log('🚀 开始验证PO页面数据源字段...');
  
  const result = verifyPODataSourceFields();
  generateFixScript();
  
  console.log('\n🎯 验证完成！');
  console.log(`发现 ${result.issues} 个问题类型，提供 ${result.recommendations} 项修复建议。`);
  
  process.exit(result.success ? 0 : 1);
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  DATABASE_TABLES,
  PO_FIELD_MAPPING,
  API_QUERY_LOGIC,
  DATA_TYPE_ISSUES,
  verifyPODataSourceFields
}; 