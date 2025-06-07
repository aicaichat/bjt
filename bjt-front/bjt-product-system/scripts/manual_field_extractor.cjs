#!/usr/bin/env node

/**
 * 手动字段提取器
 * 专门处理sparepart.csv的复杂格式
 */

const fs = require('fs');
const path = require('path');

// 手动定义sparepart.csv的字段结构（基于我们知道的实际内容）
const SPARE_PART_FIELDS = [
  '适配机型',
  '是否易损', 
  '产品图片',
  '料号',
  '名称(英文)',
  'Spec.',
  'Spec.(英制)',
  '适配序列号',
  '包装尺寸cm',
  '包装尺寸inch',
  'Unit',
  'productId',
  '单件净重kg',
  '单件净重lbs',
  '包装毛重kg',
  '包装毛重lbs',
  '单箱数量',
  '强关联物料'
];

// 手动定义场景要求（基于实际的Excel文件内容）
const SCENARIO_REQUIREMENTS = {
  '选型页的商品展示': [
    '适配机型',
    '是否易损',
    '产品图片', 
    '料号',
    '名称(英文)',
    'Spec.',
    '适配序列号',
    '单箱数量'
  ],
  '购物车与PO确认': [
    '适配机型',
    '产品图片',
    '料号', 
    '名称(英文)',
    'Spec.',
    '适配序列号',
    '包装尺寸cm',
    '包装尺寸inch',
    '单件净重kg',
    '单件净重lbs',
    '单箱数量'
  ],
  '选型和购物车的详细信息弹气泡显示': [
    '包装尺寸cm',
    '包装尺寸inch',
    '单件净重kg',
    '单件净重lbs'
  ],
  'PO页': [
    '料号',
    '名称(英文)',
    'Spec.',
    'Spec.(英制)'
  ]
};

// 从name统一.csv提取字段规范
function extractNameStandards(csvPath) {
  console.log('📊 解析 name统一.csv...');
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  const fieldStandards = {};
  
  // 跳过标题行，解析数据
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = parseCSVLine(line);
    
    const [category, attribute, chineseName, englishName, unit, example] = fields;
    
    if (attribute && attribute.trim()) {
      const cleanAttribute = attribute.trim();
      
      fieldStandards[cleanAttribute] = {
        category: category && category.trim() || '未分类',
        attribute: cleanAttribute,
        chineseName: chineseName && chineseName.trim() || '',
        englishName: englishName && englishName.trim() || '',
        unit: unit && unit.trim() || '',
        example: example && example.trim() || ''
      };
    }
  }
  
  console.log(`✅ name统一.csv 解析完成，找到 ${Object.keys(fieldStandards).length} 个字段规范`);
  
  return { fieldStandards };
}

// 简单的CSV行解析
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim().replace(/^"|"$/g, ''));
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  fields.push(currentField.trim().replace(/^"|"$/g, ''));
  return fields;
}

// 字段匹配函数
function matchFields(sparePartField, standardFields) {
  // 完全匹配
  if (standardFields[sparePartField]) {
    return { type: 'exact', field: sparePartField };
  }
  
  // 模糊匹配规则
  const fuzzyMatches = [];
  
  Object.keys(standardFields).forEach(standardField => {
    // 规则1: 忽略大小写和空格
    if (sparePartField.toLowerCase().replace(/\s+/g, '') === 
        standardField.toLowerCase().replace(/\s+/g, '')) {
      fuzzyMatches.push({ type: 'case_space', field: standardField, score: 0.9 });
    }
    
    // 规则2: 包含关系
    else if (standardField.includes(sparePartField) || sparePartField.includes(standardField)) {
      fuzzyMatches.push({ type: 'contains', field: standardField, score: 0.7 });
    }
    
    // 规则3: 关键词匹配
    else {
      const sparePartKeywords = sparePartField.toLowerCase().split(/[\s\(\)]/);
      const standardKeywords = standardField.toLowerCase().split(/[\s\(\)]/);
      
      const matchedKeywords = sparePartKeywords.filter(keyword => 
        keyword && standardKeywords.some(sk => sk.includes(keyword) || keyword.includes(sk))
      );
      
      if (matchedKeywords.length > 0) {
        const score = matchedKeywords.length / Math.max(sparePartKeywords.length, standardKeywords.length);
        if (score >= 0.4) {
          fuzzyMatches.push({ type: 'keywords', field: standardField, score });
        }
      }
    }
  });
  
  // 返回最佳匹配
  if (fuzzyMatches.length > 0) {
    fuzzyMatches.sort((a, b) => b.score - a.score);
    return fuzzyMatches[0];
  }
  
  return null;
}

// 执行对比分析
function performComparison(fieldStandards) {
  console.log('\n🔍 开始字段对比分析...');
  
  const results = {
    exactMatches: [],
    fuzzyMatches: [],
    missingFields: [],
    extraFields: [],
    scenarios: {}
  };
  
  // 对比每个spare part字段
  SPARE_PART_FIELDS.forEach(spField => {
    const match = matchFields(spField, fieldStandards);
    
    if (match) {
      if (match.type === 'exact') {
        results.exactMatches.push({
          sparePartField: spField,
          standardField: match.field,
          standardDetails: fieldStandards[match.field]
        });
      } else {
        results.fuzzyMatches.push({
          sparePartField: spField,
          standardField: match.field,
          matchType: match.type,
          score: match.score,
          standardDetails: fieldStandards[match.field]
        });
      }
    } else {
      results.missingFields.push({
        sparePartField: spField
      });
    }
  });
  
  // 找出name统一.csv中存在但sparepart.csv中不存在的字段
  Object.keys(fieldStandards).forEach(standardField => {
    const foundInSparePart = SPARE_PART_FIELDS.some(spField => 
      matchFields(spField, { [standardField]: fieldStandards[standardField] })
    );
    
    if (!foundInSparePart) {
      results.extraFields.push({
        standardField,
        details: fieldStandards[standardField]
      });
    }
  });
  
  // 按场景统计字段需求
  Object.keys(SCENARIO_REQUIREMENTS).forEach(scenario => {
    const requiredFields = SCENARIO_REQUIREMENTS[scenario];
    
    results.scenarios[scenario] = {
      requiredFields: [],
      missingStandards: []
    };
    
    requiredFields.forEach(field => {
      const match = matchFields(field, fieldStandards);
      if (match) {
        results.scenarios[scenario].requiredFields.push({
          field,
          standard: fieldStandards[match.field] || null
        });
      } else {
        results.scenarios[scenario].missingStandards.push(field);
      }
    });
  });
  
  console.log('对比结果统计:');
  console.log(`- 完全匹配: ${results.exactMatches.length}`);
  console.log(`- 模糊匹配: ${results.fuzzyMatches.length}`);
  console.log(`- 缺失规范: ${results.missingFields.length}`);
  console.log(`- 额外规范: ${results.extraFields.length}`);
  
  return results;
}

// 生成对比报告
function generateReport(results) {
  console.log('\n📋 生成对比报告...');
  
  const report = [];
  
  report.push('# 备件页面字段对比报告（手动修正版）');
  report.push('');
  report.push(`生成时间: ${new Date().toISOString()}`);
  report.push('');
  
  // 统计信息
  report.push('## 对比统计');
  report.push('');
  report.push(`- ✅ 完全匹配字段: ${results.exactMatches.length}`);
  report.push(`- ⚠️ 模糊匹配字段: ${results.fuzzyMatches.length}`);  
  report.push(`- ❌ 缺失规范字段: ${results.missingFields.length}`);
  report.push(`- 📋 额外规范字段: ${results.extraFields.length}`);
  report.push('');
  
  // 备件字段列表
  report.push('## 📋 备件页面字段列表（完整版）');
  report.push('');
  report.push('sparepart.csv中定义的所有字段:');
  SPARE_PART_FIELDS.forEach((field, index) => {
    report.push(`${index + 1}. **${field}**`);
  });
  report.push('');
  
  // 完全匹配
  if (results.exactMatches.length > 0) {
    report.push('## ✅ 完全匹配字段');
    report.push('');
    report.push('| 备件字段 | 规范字段 | 中文名 | 英文名 |');
    report.push('|---------|---------|--------|--------|');
    
    results.exactMatches.forEach(match => {
      const chineseName = match.standardDetails?.chineseName || '-';
      const englishName = match.standardDetails?.englishName || '-';
      
      report.push(`| ${match.sparePartField} | ${match.standardField} | ${chineseName} | ${englishName} |`);
    });
    report.push('');
  }
  
  // 模糊匹配
  if (results.fuzzyMatches.length > 0) {
    report.push('## ⚠️ 模糊匹配字段');
    report.push('');
    report.push('| 备件字段 | 推荐规范字段 | 中文名 | 英文名 | 匹配类型 | 匹配度 |');
    report.push('|---------|-------------|--------|--------|----------|--------|');
    
    results.fuzzyMatches.forEach(match => {
      const chineseName = match.standardDetails?.chineseName || '-';
      const englishName = match.standardDetails?.englishName || '-';
      
      report.push(`| ${match.sparePartField} | ${match.standardField} | ${chineseName} | ${englishName} | ${match.matchType} | ${(match.score * 100).toFixed(1)}% |`);
    });
    report.push('');
  }
  
  // 缺失规范
  if (results.missingFields.length > 0) {
    report.push('## ❌ 缺失规范字段');
    report.push('');
    report.push('以下字段在备件定义中存在，但在name统一规范中缺失：');
    report.push('');
    
    results.missingFields.forEach(missing => {
      report.push(`- **${missing.sparePartField}**`);
    });
    report.push('');
  }
  
  // 按场景分析
  report.push('## 🎭 按场景字段分析');
  report.push('');
  
  Object.keys(results.scenarios).forEach(scenario => {
    const data = results.scenarios[scenario];
    report.push(`### ${scenario}`);
    report.push('');
    report.push(`- 必需字段数: ${data.requiredFields.length + data.missingStandards.length}`);
    report.push(`- 有规范字段数: ${data.requiredFields.length}`);
    report.push(`- 缺失规范数: ${data.missingStandards.length}`);
    
    if (data.requiredFields.length > 0) {
      report.push('');
      report.push('有规范的必需字段:');
      data.requiredFields.forEach(item => {
        const standard = item.standard;
        const chineseName = standard?.chineseName || '-';
        const englishName = standard?.englishName || '-';
        report.push(`  - **${item.field}** (${chineseName} / ${englishName})`);
      });
    }
    
    if (data.missingStandards.length > 0) {
      report.push('');
      report.push('🚨 缺失规范的必需字段:');
      data.missingStandards.forEach(field => {
        report.push(`  - **${field}** ❌`);
      });
    }
    report.push('');
  });
  
  // 建议
  report.push('## 💡 修复建议');
  report.push('');
  
  if (results.missingFields.length > 0) {
    report.push('### 1. 添加缺失的字段规范');
    report.push('');
    report.push('需要在name统一.csv中添加以下字段的规范:');
    results.missingFields.forEach(missing => {
      report.push(`- **${missing.sparePartField}**`);
    });
    report.push('');
  }
  
  if (results.fuzzyMatches.length > 0) {
    report.push('### 2. 统一字段命名');
    report.push('');
    report.push('建议统一以下字段的命名:');
    results.fuzzyMatches.forEach(match => {
      report.push(`- "${match.sparePartField}" → "${match.standardField}"`);
    });
    report.push('');
  }
  
  // 关键问题总结
  report.push('## 🎯 关键问题总结');
  report.push('');
  
  // 统计各场景缺失的字段
  const allMissingFields = new Set();
  Object.keys(results.scenarios).forEach(scenario => {
    results.scenarios[scenario].missingStandards.forEach(field => {
      allMissingFields.add(field);
    });
  });
  
  if (allMissingFields.size > 0) {
    report.push('### 🚨 影响备件页面功能的关键缺失字段：');
    report.push('');
    Array.from(allMissingFields).forEach(field => {
      const affectedScenarios = Object.keys(results.scenarios).filter(scenario => 
        results.scenarios[scenario].missingStandards.includes(field)
      );
      report.push(`- **${field}** (影响场景: ${affectedScenarios.join(', ')})`);
    });
    report.push('');
  }
  
  return report.join('\n');
}

// 主函数
function main() {
  console.log('🚀 启动手动字段对比分析...');
  
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const nameStandardPath = path.join(projectRoot, 'generated_sql_imports/name统一.csv');
    
    // 检查文件是否存在
    if (!fs.existsSync(nameStandardPath)) {
      throw new Error(`文件不存在: ${nameStandardPath}`);
    }
    
    console.log('📊 使用手动定义的备件字段列表:');
    SPARE_PART_FIELDS.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field}`);
    });
    
    console.log('\n📊 使用手动定义的场景要求:');
    Object.keys(SCENARIO_REQUIREMENTS).forEach(scenario => {
      console.log(`  ${scenario}: ${SCENARIO_REQUIREMENTS[scenario].length} 个字段`);
    });
    
    // 解析name统一.csv
    const { fieldStandards } = extractNameStandards(nameStandardPath);
    
    // 执行对比
    const results = performComparison(fieldStandards);
    
    // 生成报告
    const report = generateReport(results);
    
    // 保存报告
    const reportPath = path.join(projectRoot, 'docs/csv_field_comparison_report_manual.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    
    console.log('\n✅ 对比分析完成!');
    console.log(`📄 报告已保存到: ${reportPath}`);
    
    // 输出关键统计
    console.log('\n📊 关键统计:');
    console.log(`✅ 完全匹配: ${results.exactMatches.length}`);
    console.log(`⚠️ 模糊匹配: ${results.fuzzyMatches.length}`);
    console.log(`❌ 缺失规范: ${results.missingFields.length}`);
    console.log(`📋 额外规范: ${results.extraFields.length}`);
    
    // 统计场景影响
    let totalMissing = 0;
    Object.keys(results.scenarios).forEach(scenario => {
      totalMissing += results.scenarios[scenario].missingStandards.length;
    });
    console.log(`🚨 影响场景的缺失字段: ${totalMissing}`);
    
    // 如果有关键问题，退出码为1
    if (results.missingFields.length > 0 || results.fuzzyMatches.length > 0 || totalMissing > 0) {
      console.log('\n⚠️ 发现字段一致性问题，请查看报告详情');
      process.exit(1);
    } else {
      console.log('\n🎉 所有字段定义一致!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
} 