#!/usr/bin/env node

/**
 * 备件页面字段标准化修复工具
 * 基于CSV标准，专门修复备件页面的字段显示问题
 */

import fs from 'fs';
import path from 'path';

// 备件页面字段标准化映射 - 基于CSV标准
const SPARE_PARTS_FIELD_FIXES = [
  {
    file: 'frontend/src/i18n/locales/en/spareParts.json',
    fixes: [
      // 1. 修复 "Pieces per Box" → "Qty per Carton"
      {
        find: '"Pieces per Box"',
        replace: '"Qty per Carton"',
        reason: '标准化单箱数量字段'
      },
      {
        find: '"Pieces Per Box"',
        replace: '"Qty per Carton"',
        reason: '标准化单箱数量字段（大写）'
      },
      // 2. 修复 "Package Size" → "Packaging Dim."
      {
        find: '"Package Size"',
        replace: '"Packaging Dim."',
        reason: '标准化包装尺寸字段'
      },
      {
        find: '"Package Size (cm)"',
        replace: '"Packaging Dim.(cm)"',
        reason: '标准化包装尺寸字段（公制）'
      },
      {
        find: '"Package Size (inch)"',
        replace: '"Packaging Dim.(inch)"',
        reason: '标准化包装尺寸字段（英制）'
      },
      // 3. 修复 "Net Weight (lbs)" → "Net Weight(lb)"
      {
        find: '"Net Weight (lbs)"',
        replace: '"Net Weight(lb)"',
        reason: '修复重量单位标准化'
      },
      // 4. 修复 "Part Number" → "Part No."
      {
        find: '"Part Number"',
        replace: '"Part No."',
        reason: '标准化料号字段'
      },
      // 5. 修复 "Compatible Models" → "Applicable Machine"
      {
        find: '"Compatible Models"',
        replace: '"Applicable Machine"',
        reason: '标准化适配机型字段'
      },
      {
        find: '"Compatible Model"',
        replace: '"Applicable Machine"',
        reason: '标准化适配机型字段'
      }
    ]
  },
  {
    file: 'frontend/src/i18n/locales/zh/spareParts.json',
    fixes: [
      // 中文对应修复
      {
        find: '"净重(lbs)"',
        replace: '"净重(lb)"',
        reason: '修复中文重量单位'
      },
      {
        find: '"包装尺寸(cm)"',
        replace: '"包装尺寸(cm)"',
        reason: '保持中文包装尺寸标准'
      },
      {
        find: '"包装尺寸(inch)"',
        replace: '"包装尺寸(inch)"',
        reason: '保持中文包装尺寸标准'
      }
    ]
  }
];

// 执行备件页面字段修复
function executeSparePartsFieldFixes(dryRun = false) {
  console.log('🔧 备件页面字段标准化修复');
  console.log(`模式: ${dryRun ? '预览' : '执行修复'}`);
  console.log('');
  
  let totalChanges = 0;
  const results = [];
  
  SPARE_PARTS_FIELD_FIXES.forEach(({ file, fixes }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️ 文件不存在: ${file}`);
      return;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      let fileChanges = 0;
      
      fixes.forEach(({ find, replace, reason }) => {
        const beforeCount = (newContent.match(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (beforeCount > 0) {
          newContent = newContent.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
          fileChanges += beforeCount;
          totalChanges += beforeCount;
          console.log(`  ✅ ${path.basename(file)}: ${reason}`);
          console.log(`     ${find} → ${replace} (${beforeCount}处)`);
        }
      });
      
      if (fileChanges > 0) {
        results.push({
          file,
          changes: fileChanges,
          success: true
        });
        
        if (!dryRun) {
          // 备份原文件
          fs.writeFileSync(`${file}.backup`, content);
          // 写入修改
          fs.writeFileSync(file, newContent);
          console.log(`  💾 已备份: ${file}.backup`);
        }
      } else {
        console.log(`  ℹ️ ${path.basename(file)}: 无需修改`);
      }
      
    } catch (error) {
      console.log(`❌ 处理失败: ${file} - ${error.message}`);
      results.push({
        file,
        changes: 0,
        success: false,
        error: error.message
      });
    }
  });
  
  return { totalChanges, results };
}

// 生成备件页面修复报告
function generateSparePartsReport(results) {
  const report = `# 备件页面字段标准化修复报告

执行时间: ${new Date().toLocaleString()}

## 📊 修复统计
- 总修改数: ${results.totalChanges}
- 成功文件: ${results.results.filter(r => r.success).length}
- 失败文件: ${results.results.filter(r => !r.success).length}

## 🎯 主要修复项目

### 英文字段标准化
- **"Pieces per Box" → "Qty per Carton"** - 单箱数量字段标准化
- **"Package Size" → "Packaging Dim."** - 包装尺寸字段标准化  
- **"Net Weight (lbs)" → "Net Weight(lb)"** - 重量单位标准化
- **"Part Number" → "Part No."** - 料号字段标准化
- **"Compatible Models" → "Applicable Machine"** - 适配机型字段标准化

### 中文字段标准化
- **"净重(lbs)" → "净重(lb)"** - 中文重量单位标准化

## 📋 修复详情
${results.results.map(r => 
  `- ${r.file}: ${r.success ? `✅ ${r.changes}处修改` : `❌ ${r.error}`}`
).join('\n')}

## ✅ 验证方法
1. 重启前端服务: \`./scripts/docker-dev.sh restart-frontend\`
2. 访问备件页面: http://localhost:5173/spare-parts
3. 检查字段显示是否符合CSV标准
4. 测试tooltip显示效果
5. 验证多语言切换功能

## 🔄 回滚方法
如需回滚修改：
\`\`\`bash
# 恢复备份文件
find frontend/src/i18n/locales -name "*.backup" -exec sh -c 'mv "\$1" "\${1%.backup}"' _ {} \\;
./scripts/docker-dev.sh restart-frontend
\`\`\`

## 📊 预期效果
修复后，备件页面将显示：
- ✅ "Qty per Carton" 而不是 "Pieces per Box"
- ✅ "Packaging Dim." 而不是 "Package Size"  
- ✅ "Net Weight(lb)" 而不是 "Net Weight (lbs)"
- ✅ "Part No." 而不是 "Part Number"
- ✅ "Applicable Machine" 而不是 "Compatible Models"
`;

  fs.writeFileSync('output/spare-parts-field-fix-report.md', report);
  console.log('\n📋 修复报告已生成: output/spare-parts-field-fix-report.md');
}

// 分析备件页面当前字段使用情况
function analyzeSparePartsFields() {
  console.log('🔍 分析备件页面字段使用情况...\n');
  
  const filesToAnalyze = [
    'frontend/src/i18n/locales/en/spareParts.json',
    'frontend/src/i18n/locales/zh/spareParts.json'
  ];
  
  const problemFields = {
    'Pieces per Box': 0,
    'Package Size': 0,
    'Net Weight (lbs)': 0,
    'Part Number': 0,
    'Compatible Models': 0,
    '净重(lbs)': 0
  };
  
  filesToAnalyze.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      Object.keys(problemFields).forEach(field => {
        const matches = content.match(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
        if (matches) {
          problemFields[field] += matches.length;
        }
      });
    }
  });
  
  console.log('📊 发现的问题字段：');
  Object.entries(problemFields).forEach(([field, count]) => {
    if (count > 0) {
      console.log(`  ❌ "${field}": ${count}处`);
    }
  });
  
  const totalProblems = Object.values(problemFields).reduce((sum, count) => sum + count, 0);
  console.log(`\n总计: ${totalProblems}处需要修复的字段\n`);
  
  return totalProblems;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const analyze = args.includes('--analyze');
  
  console.log('🎯 备件页面字段标准化工具');
  console.log('基于CSV标准: generated_sql_imports/表单属性综合统一.csv');
  console.log('');
  
  if (analyze) {
    analyzeSparePartsFields();
    return;
  }
  
  const results = executeSparePartsFieldFixes(dryRun);
  
  console.log('\n📊 执行完成');
  console.log(`修改总数: ${results.totalChanges}`);
  
  if (!dryRun && results.totalChanges > 0) {
    generateSparePartsReport(results);
    console.log('\n🚀 建议重启前端服务:');
    console.log('./scripts/docker-dev.sh restart-frontend');
    console.log('\n🌐 验证地址:');
    console.log('http://localhost:5173/spare-parts');
  }
  
  if (dryRun && results.totalChanges > 0) {
    console.log('\n✅ 预览完成，执行实际修复:');
    console.log('node scripts/spare-parts-field-fix.js');
  }
  
  if (results.totalChanges === 0) {
    console.log('\n✅ 所有字段已符合标准，无需修复');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 