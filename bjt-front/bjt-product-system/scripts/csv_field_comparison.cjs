#!/usr/bin/env node

/**
 * CSV字段对比脚本
 * 用于对比sparepart.csv和name统一.csv，确保备件页面字段定义的一致性
 */

const fs = require('fs');
const path = require('path');

// 改进的CSV解析函数
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
  
  return lines.map(line => {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim().replace(/^"|"$/g, '')); // 移除首尾引号
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    fields.push(currentField.trim().replace(/^"|"$/g, ''));
    return fields;
  });
}

// 从sparepart.csv提取字段信息
function extractSparePartFields(csvPath) {
  console.log('📊 解析 sparepart.csv...');
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);
  
  console.log('CSV总行数:', rows.length);
  console.log('前几行数据:');
  rows.slice(0, 10).forEach((row, index) => {
    console.log(`第${index + 1}行(${row.length}列):`, row.slice(0, 5), '...');
  });
  
  // 找到属性名称行（第3行，索引2）
  const headerRow = rows[2];
  console.log('完整字段头部行:', headerRow);
  
  // 提取所有有效字段，跳过第一列（属性名称）
  const fields = [];
  for (let i = 1; i < headerRow.length; i++) {
    const field = headerRow[i];
    if (field && field.trim() !== '') {
      // 处理换行符和特殊字符
      const cleanField = field.replace(/[\r\n]/g, ' ').trim();
      if (cleanField) {
        fields.push(cleanField);
      }
    }
  }
  
  console.log('清理后的字段列表:', fields);
  
  // 获取各个展示场景的要求 - 修正行索引
  const scenarios = {
    '选型页的商品展示': rows[5] || [],
    '购物车与PO确认': rows[6] || [],
    '选型和购物车的详细信息弹气泡显示': rows[7] || [],
    'PO页': rows[8] || []
  };
  
  console.log('场景数据:');
  Object.keys(scenarios).forEach(scenario => {
    console.log(`${scenario}:`, scenarios[scenario].slice(0, 10));
  });
  
  // 构建字段映射
  const fieldRequirements = {};
  
  fields.forEach((field, index) => {
    const columnIndex = index + 1; // 因为跳过了第一列
    fieldRequirements[field] = {
      columnIndex,
      scenarios: {}
    };
    
    Object.keys(scenarios).forEach(scenario => {
      const row = scenarios[scenario];
      const cellValue = row[columnIndex];
      const hasRequirement = cellValue && (cellValue.trim() === '√' || cellValue.trim() === '✓');
      fieldRequirements[field].scenarios[scenario] = hasRequirement;
      
      if (hasRequirement) {
        console.log(`字段 "${field}" 在场景 "${scenario}" 中需要显示`);
      }
    });
  });
  
  console.log(`✅ sparepart.csv 解析完成，找到 ${fields.length} 个字段`);
  
  return { fields, fieldRequirements };
}

// 从name统一.csv提取字段规范
function extractNameStandards(csvPath) {
  console.log('📊 解析 name统一.csv...');
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(content);
  
  // 跳过标题行
  const dataRows = rows.slice(1);
  
  const fieldStandards = {};
  const fieldsByCategory = {};
  
  dataRows.forEach((row, index) => {
    const [category, attribute, chineseName, englishName, unit, example] = row;
    
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
      
      // 按类别分组
      const cat = fieldStandards[cleanAttribute].category;
      if (!fieldsByCategory[cat]) {
        fieldsByCategory[cat] = [];
      }
      fieldsByCategory[cat].push(cleanAttribute);
    }
  });
  
  console.log(`✅ name统一.csv 解析完成，找到 ${Object.keys(fieldStandards).length} 个字段规范`);
  console.log('字段规范示例:');
  Object.keys(fieldStandards).slice(0, 5).forEach(key => {
    console.log(`- ${key}:`, fieldStandards[key]);
  });
  
  return { fieldStandards, fieldsByCategory };
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
        if (score >= 0.4) { // 降低阈值以获得更多匹配
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
function performComparison(sparePartData, nameStandardData) {
  console.log('\n🔍 开始字段对比分析...');
  
  const { fields: sparePartFields, fieldRequirements } = sparePartData;
  const { fieldStandards } = nameStandardData;
  
  const results = {
    exactMatches: [],
    fuzzyMatches: [],
    missingFields: [],
    extraFields: [],
    scenarios: {}
  };
  
  // 对比每个spare part字段
  sparePartFields.forEach(spField => {
    const match = matchFields(spField, fieldStandards);
    
    if (match) {
      if (match.type === 'exact') {
        results.exactMatches.push({
          sparePartField: spField,
          standardField: match.field,
          requirements: fieldRequirements[spField],
          standardDetails: fieldStandards[match.field]
        });
      } else {
        results.fuzzyMatches.push({
          sparePartField: spField,
          standardField: match.field,
          matchType: match.type,
          score: match.score,
          requirements: fieldRequirements[spField],
          standardDetails: fieldStandards[match.field]
        });
      }
    } else {
      results.missingFields.push({
        sparePartField: spField,
        requirements: fieldRequirements[spField]
      });
    }
  });
  
  // 找出name统一.csv中存在但sparepart.csv中不存在的字段
  Object.keys(fieldStandards).forEach(standardField => {
    const foundInSparePart = sparePartFields.some(spField => 
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
  const allScenarios = ['选型页的商品展示', '购物车与PO确认', '选型和购物车的详细信息弹气泡显示', 'PO页'];
  
  allScenarios.forEach(scenario => {
    results.scenarios[scenario] = {
      requiredFields: [],
      missingStandards: []
    };
    
    sparePartFields.forEach(field => {
      if (fieldRequirements[field] && fieldRequirements[field].scenarios[scenario]) {
        const match = matchFields(field, fieldStandards);
        if (match) {
          results.scenarios[scenario].requiredFields.push({
            field,
            standard: fieldStandards[match.field] || null
          });
        } else {
          results.scenarios[scenario].missingStandards.push(field);
        }
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
function generateReport(results, sparePartData, nameStandardData) {
  console.log('\n📋 生成对比报告...');
  
  const report = [];
  
  report.push('# 备件页面字段对比报告');
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
  report.push('## 📋 备件页面字段列表');
  report.push('');
  report.push('sparepart.csv中定义的所有字段:');
  sparePartData.fields.forEach((field, index) => {
    report.push(`${index + 1}. **${field}**`);
  });
  report.push('');
  
  // 完全匹配
  if (results.exactMatches.length > 0) {
    report.push('## ✅ 完全匹配字段');
    report.push('');
    report.push('| 备件字段 | 规范字段 | 中文名 | 英文名 | 使用场景 |');
    report.push('|---------|---------|--------|--------|----------|');
    
    results.exactMatches.forEach(match => {
      const scenarios = match.requirements ? Object.keys(match.requirements.scenarios)
        .filter(s => match.requirements.scenarios[s])
        .join(', ') : '无';
      
      const chineseName = match.standardDetails?.chineseName || '-';
      const englishName = match.standardDetails?.englishName || '-';
      
      report.push(`| ${match.sparePartField} | ${match.standardField} | ${chineseName} | ${englishName} | ${scenarios} |`);
    });
    report.push('');
  }
  
  // 模糊匹配
  if (results.fuzzyMatches.length > 0) {
    report.push('## ⚠️ 模糊匹配字段');
    report.push('');
    report.push('| 备件字段 | 推荐规范字段 | 中文名 | 英文名 | 匹配类型 | 匹配度 | 使用场景 |');
    report.push('|---------|-------------|--------|--------|----------|--------|----------|');
    
    results.fuzzyMatches.forEach(match => {
      const scenarios = match.requirements ? Object.keys(match.requirements.scenarios)
        .filter(s => match.requirements.scenarios[s])
        .join(', ') : '无';
      
      const chineseName = match.standardDetails?.chineseName || '-';
      const englishName = match.standardDetails?.englishName || '-';
      
      report.push(`| ${match.sparePartField} | ${match.standardField} | ${chineseName} | ${englishName} | ${match.matchType} | ${(match.score * 100).toFixed(1)}% | ${scenarios} |`);
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
      const scenarios = missing.requirements ? Object.keys(missing.requirements.scenarios)
        .filter(s => missing.requirements.scenarios[s])
        .join(', ') : '无';
      
      report.push(`- **${missing.sparePartField}** (使用场景: ${scenarios})`);
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
    report.push(`- 必需字段数: ${data.requiredFields.length}`);
    report.push(`- 缺失规范数: ${data.missingStandards.length}`);
    
    if (data.requiredFields.length > 0) {
      report.push('');
      report.push('必需字段:');
      data.requiredFields.forEach(item => {
        report.push(`  - ${item.field}`);
      });
    }
    
    if (data.missingStandards.length > 0) {
      report.push('');
      report.push('缺失规范的字段:');
      data.missingStandards.forEach(field => {
        report.push(`  - ${field}`);
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
  
  return report.join('\n');
}

// 主函数
function main() {
  console.log('🚀 启动CSV字段对比分析...');
  
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const sparePartPath = path.join(projectRoot, 'generated_sql_imports/sparepart.csv');
    const nameStandardPath = path.join(projectRoot, 'generated_sql_imports/name统一.csv');
    
    // 检查文件是否存在
    if (!fs.existsSync(sparePartPath)) {
      throw new Error(`文件不存在: ${sparePartPath}`);
    }
    
    if (!fs.existsSync(nameStandardPath)) {
      throw new Error(`文件不存在: ${nameStandardPath}`);
    }
    
    // 解析文件
    const sparePartData = extractSparePartFields(sparePartPath);
    const nameStandardData = extractNameStandards(nameStandardPath);
    
    // 执行对比
    const results = performComparison(sparePartData, nameStandardData);
    
    // 生成报告
    const report = generateReport(results, sparePartData, nameStandardData);
    
    // 保存报告
    const reportPath = path.join(projectRoot, 'docs/csv_field_comparison_report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    
    console.log('\n✅ 对比分析完成!');
    console.log(`📄 报告已保存到: ${reportPath}`);
    
    // 输出关键统计
    console.log('\n📊 关键统计:');
    console.log(`✅ 完全匹配: ${results.exactMatches.length}`);
    console.log(`⚠️ 模糊匹配: ${results.fuzzyMatches.length}`);
    console.log(`❌ 缺失规范: ${results.missingFields.length}`);
    console.log(`📋 额外规范: ${results.extraFields.length}`);
    
    // 如果有关键问题，退出码为1
    if (results.missingFields.length > 0 || results.fuzzyMatches.length > 0) {
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

module.exports = {
  parseCSV,
  extractSparePartFields,
  extractNameStandards,
  matchFields,
  performComparison,
  generateReport
}; 