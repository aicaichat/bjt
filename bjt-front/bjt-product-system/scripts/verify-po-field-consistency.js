#!/usr/bin/env node

/**
 * PO页面字段一致性验证脚本
 * 检查PO页面表格列名是否与CSV标准一致
 */

const fs = require('fs');
const path = require('path');

// CSV标准字段定义（基于表单属性综合统一.csv）
const CSV_STANDARD_FIELDS = {
  // 产品属性字段
  'part_number': { zh: '料号', en: 'Part No.' },
  'name': { zh: '名称', en: 'Item' },
  'model': { zh: '型号', en: 'Model' },
  'spec': { zh: '规格描述', en: 'Spec.' },
  'brand': { zh: '品牌', en: 'Brand' },
  
  // 注意：数量、单价、金额是订单字段，不是产品属性字段
  'quantity': { zh: '数量', en: 'Quantity' },
  'unit_price': { zh: '单价', en: 'Unit Price' },
  'amount': { zh: '金额', en: 'Amount' }
};

// PO页面表格列映射
const PO_TABLE_COLUMNS = {
  'partNumber': 'part_number',
  'item': 'name',
  'model': 'model',
  'description': 'spec',
  'brandName': 'brand',
  'quantity': 'quantity',
  'unitPrice': 'unit_price',
  'amount': 'amount'
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

// 验证PO页面翻译文件中的字段
function verifyPOTranslationFields(translations, language, standardFields) {
  const results = {
    language,
    passed: [],
    failed: [],
    missing: [],
    orderFields: []  // 订单相关字段，不在CSV标准中
  };

  // 检查table.columns下的字段
  const tableColumns = translations?.table?.columns || {};
  
  Object.entries(PO_TABLE_COLUMNS).forEach(([poKey, standardKey]) => {
    const actualValue = tableColumns[poKey];
    const expectedValue = standardFields[standardKey]?.[language];
    
    if (!expectedValue) {
      // 这是订单字段，不在CSV产品属性标准中
      results.orderFields.push({
        poKey,
        standardKey,
        value: actualValue
      });
      return;
    }
    
    if (actualValue === undefined) {
      results.missing.push({
        poKey,
        standardKey,
        expected: expectedValue
      });
    } else if (actualValue === expectedValue) {
      results.passed.push({
        poKey,
        standardKey,
        value: actualValue
      });
    } else {
      results.failed.push({
        poKey,
        standardKey,
        expected: expectedValue,
        actual: actualValue
      });
    }
  });

  return results;
}

// 分析PO页面代码中的字段使用
function analyzePOCodeFields() {
  const poFilePath = path.resolve(__dirname, '../frontend/src/pages/PO/index.tsx');
  
  try {
    const content = fs.readFileSync(poFilePath, 'utf8');
    
    // 提取料号字段的处理逻辑
    const partNumberMatch = content.match(/p\.code \|\| p\.sku \|\| \(p as any\)\.part_number \|\| \(p as any\)\.item_id \|\| '-'/);
    
    // 提取名称字段的处理逻辑
    const nameMatch = content.match(/getProductName\(p\)/);
    
    // 提取其他字段的处理逻辑
    const modelMatch = content.match(/p\.model \|\| ''/);
    const specMatch = content.match(/p\.spec \|\| ''/);
    const brandMatch = content.match(/p\.brand \|\| ''/);
    
    return {
      partNumberLogic: partNumberMatch ? partNumberMatch[0] : 'Not found',
      nameLogic: nameMatch ? 'getProductName(p)' : 'Not found',
      modelLogic: modelMatch ? modelMatch[0] : 'Not found',
      specLogic: specMatch ? specMatch[0] : 'Not found',
      brandLogic: brandMatch ? brandMatch[0] : 'Not found'
    };
  } catch (error) {
    console.error('❌ 无法读取PO页面代码:', error.message);
    return null;
  }
}

// 生成验证报告
function generateReport(zhResults, enResults, codeAnalysis) {
  console.log('\n🔍 PO页面字段一致性验证报告');
  console.log('='.repeat(50));
  console.log(`验证时间: ${new Date().toLocaleString()}`);
  console.log(`基准标准: 表单属性综合统一.csv`);
  
  // 统计信息
  const totalProductFields = zhResults.passed.length + zhResults.failed.length + zhResults.missing.length;
  const zhPassRate = totalProductFields > 0 ? ((zhResults.passed.length / totalProductFields) * 100).toFixed(1) : '0.0';
  const enPassRate = totalProductFields > 0 ? ((enResults.passed.length / totalProductFields) * 100).toFixed(1) : '0.0';
  
  console.log('\n📊 总体统计:');
  console.log(`产品属性字段数: ${totalProductFields}`);
  console.log(`订单相关字段数: ${zhResults.orderFields.length}`);
  console.log(`中文翻译通过率: ${zhPassRate}% (${zhResults.passed.length}/${totalProductFields})`);
  console.log(`英文翻译通过率: ${enPassRate}% (${enResults.passed.length}/${totalProductFields})`);
  
  // 详细结果
  [
    { name: '中文', results: zhResults },
    { name: '英文', results: enResults }
  ].forEach(({ name, results }) => {
    console.log(`\n📋 ${name}翻译验证结果:`);
    
    if (results.passed.length > 0) {
      console.log(`\n✅ 通过验证 (${results.passed.length}个):`);
      results.passed.forEach(item => {
        console.log(`  - ${item.poKey} → ${item.standardKey}: "${item.value}"`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log(`\n❌ 验证失败 (${results.failed.length}个):`);
      results.failed.forEach(item => {
        console.log(`  - ${item.poKey} → ${item.standardKey}:`);
        console.log(`    期望: "${item.expected}"`);
        console.log(`    实际: "${item.actual}"`);
      });
    }
    
    if (results.missing.length > 0) {
      console.log(`\n⚠️ 缺失字段 (${results.missing.length}个):`);
      results.missing.forEach(item => {
        console.log(`  - ${item.poKey} → ${item.standardKey}: 期望 "${item.expected}"`);
      });
    }
    
    if (results.orderFields.length > 0) {
      console.log(`\n📦 订单相关字段 (${results.orderFields.length}个):`);
      results.orderFields.forEach(item => {
        console.log(`  - ${item.poKey}: "${item.value}" (订单字段，非产品属性)`);
      });
    }
  });
  
  // 代码分析结果
  if (codeAnalysis) {
    console.log('\n🔧 代码字段处理逻辑分析:');
    console.log(`料号处理: ${codeAnalysis.partNumberLogic}`);
    console.log(`名称处理: ${codeAnalysis.nameLogic}`);
    console.log(`型号处理: ${codeAnalysis.modelLogic}`);
    console.log(`规格处理: ${codeAnalysis.specLogic}`);
    console.log(`品牌处理: ${codeAnalysis.brandLogic}`);
  }
  
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
    console.log('- ✅ 所有产品属性字段已与CSV标准保持一致！');
  }
  
  console.log('\n📝 说明:');
  console.log('- PO页面包含产品属性字段和订单相关字段');
  console.log('- 只有产品属性字段需要与CSV标准保持一致');
  console.log('- 订单相关字段（数量、单价、金额）不在CSV产品属性标准范围内');
  
  return {
    success: zhResults.failed.length === 0 && enResults.failed.length === 0 && 
             zhResults.missing.length === 0 && enResults.missing.length === 0,
    zhPassRate: parseFloat(zhPassRate),
    enPassRate: parseFloat(enPassRate),
    totalProductFields,
    totalOrderFields: zhResults.orderFields.length
  };
}

// 主函数
function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const zhTranslationPath = path.join(projectRoot, 'frontend/src/i18n/locales/zh/po.json');
  const enTranslationPath = path.join(projectRoot, 'frontend/src/i18n/locales/en/po.json');
  
  console.log('🚀 开始验证PO页面字段一致性...');
  
  // 加载翻译文件
  const zhTranslations = loadTranslationFile(zhTranslationPath);
  const enTranslations = loadTranslationFile(enTranslationPath);
  
  if (!zhTranslations || !enTranslations) {
    console.error('❌ 无法加载翻译文件，验证终止');
    process.exit(1);
  }
  
  // 验证字段
  const zhResults = verifyPOTranslationFields(zhTranslations, 'zh', CSV_STANDARD_FIELDS);
  const enResults = verifyPOTranslationFields(enTranslations, 'en', CSV_STANDARD_FIELDS);
  
  // 分析代码
  const codeAnalysis = analyzePOCodeFields();
  
  // 生成报告
  const report = generateReport(zhResults, enResults, codeAnalysis);
  
  // 退出码
  process.exit(report.success ? 0 : 1);
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  CSV_STANDARD_FIELDS,
  PO_TABLE_COLUMNS,
  verifyPOTranslationFields,
  generateReport
}; 