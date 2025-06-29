#!/usr/bin/env node

/**
 * 备件页面字段一致性验证脚本
 * 检查备件页面显示的字段是否与CSV标准完全一致
 */

const fs = require('fs');
const path = require('path');

// CSV标准字段定义（基于表单属性综合统一.csv）
const CSV_STANDARD_FIELDS = {
  // 基础字段
  'app_model': { zh: '适用机型', en: 'Applicable Machine' },
  'part_number': { zh: '料号', en: 'Part No.' },
  'name_en': { zh: '名称', en: 'Item' },
  'spec': { zh: '规格描述', en: 'Spec.' },
  'app_sn': { zh: '适配序列号', en: 'Applicable SN.' },
  'pcs_per_box': { zh: '单箱数量', en: 'Qty per Carton' },
  
  // 包装字段
  'package_size_cm': { zh: '包装尺寸(cm)', en: 'Packaging Dim.(cm)' },
  'package_size_inch': { zh: '包装尺寸(inch)', en: 'Packaging Dim.(inch)' },
  'net_weight_kg': { zh: '单件净重(kg)', en: 'Net Weight(kg)' },
  'net_weight_lbs': { zh: '单件净重(lb)', en: 'Net Weight(lb)' }
};

// 读取翻译文件
function loadTranslationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ 无法读取翻译文件: ${filePath}`, error.message);
    return null;
  }
}

// 验证翻译文件中的字段
function verifyTranslationFields(translations, language, standardFields) {
  const results = {
    language,
    passed: [],
    failed: [],
    missing: []
  };

  // 检查主要字段
  const keyMappings = {
    'app_model': ['table.columns.compatibility', 'fields.compatibleModels', 'fields.partModel', 'fields.appModel'],
    'spec': ['table.columns.spec', 'fields.specifications'],
    'app_sn': ['details.properties.appSn', 'fields.compatibleSerialNumber'],
    'pcs_per_box': ['details.properties.pcsPerBox', 'fields.pcsPerBox'],
    'package_size_cm': ['details.properties.packageSizeCm'],
    'package_size_inch': ['details.properties.packageSizeInch'],
    'net_weight_kg': ['details.properties.netWeightKg'],
    'net_weight_lbs': ['details.properties.netWeightLbs']
  };

  Object.entries(keyMappings).forEach(([field, keys]) => {
    const expectedValue = standardFields[field][language];
    
    keys.forEach(keyPath => {
      const actualValue = getNestedValue(translations, keyPath);
      
      if (actualValue === undefined) {
        results.missing.push({
          field,
          key: keyPath,
          expected: expectedValue
        });
      } else if (actualValue === expectedValue) {
        results.passed.push({
          field,
          key: keyPath,
          value: actualValue
        });
      } else {
        results.failed.push({
          field,
          key: keyPath,
          expected: expectedValue,
          actual: actualValue
        });
      }
    });
  });

  return results;
}

// 获取嵌套对象的值
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// 生成验证报告
function generateReport(zhResults, enResults) {
  console.log('\n🔍 备件页面字段一致性验证报告');
  console.log('='.repeat(50));
  console.log(`验证时间: ${new Date().toLocaleString()}`);
  console.log(`基准标准: 表单属性综合统一.csv`);
  
  // 统计信息
  const totalChecks = zhResults.passed.length + zhResults.failed.length + zhResults.missing.length;
  const zhPassRate = ((zhResults.passed.length / totalChecks) * 100).toFixed(1);
  const enPassRate = ((enResults.passed.length / totalChecks) * 100).toFixed(1);
  
  console.log('\n📊 总体统计:');
  console.log(`中文翻译通过率: ${zhPassRate}% (${zhResults.passed.length}/${totalChecks})`);
  console.log(`英文翻译通过率: ${enPassRate}% (${enResults.passed.length}/${totalChecks})`);
  
  // 详细结果
  [
    { name: '中文', results: zhResults },
    { name: '英文', results: enResults }
  ].forEach(({ name, results }) => {
    console.log(`\n📋 ${name}翻译验证结果:`);
    
    if (results.passed.length > 0) {
      console.log(`\n✅ 通过验证 (${results.passed.length}个):`);
      results.passed.forEach(item => {
        console.log(`  - ${item.key}: "${item.value}"`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log(`\n❌ 验证失败 (${results.failed.length}个):`);
      results.failed.forEach(item => {
        console.log(`  - ${item.key}:`);
        console.log(`    期望: "${item.expected}"`);
        console.log(`    实际: "${item.actual}"`);
      });
    }
    
    if (results.missing.length > 0) {
      console.log(`\n⚠️ 缺失字段 (${results.missing.length}个):`);
      results.missing.forEach(item => {
        console.log(`  - ${item.key}: 期望 "${item.expected}"`);
      });
    }
  });
  
  // 修复建议
  console.log('\n💡 修复建议:');
  if (zhResults.failed.length > 0 || enResults.failed.length > 0) {
    console.log('- 🔧 修正不一致的翻译值');
  }
  if (zhResults.missing.length > 0 || enResults.missing.length > 0) {
    console.log('- ➕ 添加缺失的翻译键');
  }
  if (zhResults.failed.length === 0 && enResults.failed.length === 0 && 
      zhResults.missing.length === 0 && enResults.missing.length === 0) {
    console.log('- ✅ 所有字段已与CSV标准保持一致！');
  }
  
  return {
    success: zhResults.failed.length === 0 && enResults.failed.length === 0 && 
             zhResults.missing.length === 0 && enResults.missing.length === 0,
    zhPassRate: parseFloat(zhPassRate),
    enPassRate: parseFloat(enPassRate)
  };
}

// 主函数
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const zhTranslationPath = path.join(projectRoot, 'frontend/src/i18n/locales/zh/spareParts.json');
  const enTranslationPath = path.join(projectRoot, 'frontend/src/i18n/locales/en/spareParts.json');
  
  console.log('🚀 开始验证备件页面字段一致性...');
  
  // 加载翻译文件
  const zhTranslations = loadTranslationFile(zhTranslationPath);
  const enTranslations = loadTranslationFile(enTranslationPath);
  
  if (!zhTranslations || !enTranslations) {
    console.error('❌ 无法加载翻译文件，验证终止');
    process.exit(1);
  }
  
  // 验证字段
  const zhResults = verifyTranslationFields(zhTranslations, 'zh', CSV_STANDARD_FIELDS);
  const enResults = verifyTranslationFields(enTranslations, 'en', CSV_STANDARD_FIELDS);
  
  // 生成报告
  const report = generateReport(zhResults, enResults);
  
  // 退出码
  process.exit(report.success ? 0 : 1);
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  CSV_STANDARD_FIELDS,
  verifyTranslationFields,
  generateReport
}; 