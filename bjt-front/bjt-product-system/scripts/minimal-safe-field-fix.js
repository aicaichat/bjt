#!/usr/bin/env node

/**
 * 极简安全字段修复工具
 * 原则：最小修改、零风险、立即生效
 * 只修复最明显的显示问题，不涉及复杂逻辑
 */

import fs from 'fs';
import path from 'path';

// 只修复最关键的显示问题 - 极简列表
const CRITICAL_FIXES = [
  {
    file: 'frontend/src/i18n/locales/en/spareParts.json',
    fixes: [
      {
        find: '"Net Weight (lbs)"',
        replace: '"Net Weight(lb)"',
        reason: '修复重量单位显示'
      }
    ]
  },
  {
    file: 'frontend/src/i18n/locales/zh/spareParts.json',
    fixes: [
      {
        find: '"净重(lbs)"',
        replace: '"净重(lb)"',
        reason: '修复中文重量单位显示'
      }
    ]
  },
  {
    file: 'frontend/src/i18n/locales/en/machines.json',
    fixes: [
      {
        find: '"lbs": "lbs"',
        replace: '"lbs": "lb"',
        reason: '修复机器页面单位显示'
      }
    ]
  },
  {
    file: 'frontend/src/i18n/locales/zh/machines.json',
    fixes: [
      {
        find: '"lbs": "lbs"',
        replace: '"lbs": "lb"',
        reason: '修复机器页面中文单位显示'
      }
    ]
  }
];

// 极简执行函数
function executeMinimalFixes(dryRun = false) {
  console.log('🎯 极简安全字段修复');
  console.log(`模式: ${dryRun ? '预览' : '执行'}`);
  console.log('');
  
  let totalChanges = 0;
  const results = [];
  
  CRITICAL_FIXES.forEach(({ file, fixes }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️ 文件不存在: ${file}`);
      return;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      let fileChanges = 0;
      
      fixes.forEach(({ find, replace, reason }) => {
        if (newContent.includes(find)) {
          newContent = newContent.replace(find, replace);
          fileChanges++;
          totalChanges++;
          console.log(`  ✅ ${path.basename(file)}: ${reason}`);
          console.log(`     ${find} → ${replace}`);
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

// 生成简单报告
function generateSimpleReport(results) {
  const report = `# 极简字段修复报告

执行时间: ${new Date().toLocaleString()}

## 修复统计
- 总修改数: ${results.totalChanges}
- 成功文件: ${results.results.filter(r => r.success).length}
- 失败文件: ${results.results.filter(r => !r.success).length}

## 修复详情
${results.results.map(r => 
  `- ${r.file}: ${r.success ? `✅ ${r.changes}处修改` : `❌ ${r.error}`}`
).join('\n')}

## 验证方法
1. 重启前端: \`./scripts/docker-dev.sh restart-frontend\`
2. 访问页面检查显示效果
3. 如有问题，恢复备份: \`mv file.backup file\`
`;

  fs.writeFileSync('output/minimal-fix-report.md', report);
  console.log('\n📋 报告已生成: output/minimal-fix-report.md');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  const results = executeMinimalFixes(dryRun);
  
  console.log('\n📊 执行完成');
  console.log(`修改总数: ${results.totalChanges}`);
  
  if (!dryRun && results.totalChanges > 0) {
    generateSimpleReport(results);
    console.log('\n🚀 建议重启前端服务:');
    console.log('./scripts/docker-dev.sh restart-frontend');
  }
  
  if (dryRun && results.totalChanges > 0) {
    console.log('\n✅ 预览完成，执行实际修复:');
    console.log('node scripts/minimal-safe-field-fix.js');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 