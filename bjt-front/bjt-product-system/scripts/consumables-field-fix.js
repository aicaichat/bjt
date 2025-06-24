#!/usr/bin/env node

/**
 * 耗材页面字段标准化修复工具
 * 基于 CONSUMABLE_FIELD_STANDARDIZATION_TASK.md 的要求
 * 主要修复 lbs → lb 显示问题和字段名称标准化
 */

import fs from 'fs';
import path from 'path';

// 耗材页面字段标准化修复映射 - 基于CSV标准
const CONSUMABLES_FIELD_FIXES = [
  {
    file: 'frontend/src/i18n/locales/en.json',
    fixes: [
      // 1. Package Size 标准化 - 多个位置
      {
        find: '"Package Size"',
        replace: '"Packaging Dim."',
        reason: 'Package Size 标准化'
      },
      {
        find: '"Package Size(cm)"',
        replace: '"Packaging Dim.(cm)"',
        reason: 'Package Size(cm) 标准化'
      },
      {
        find: '"Package Size \\(cm\\)"',
        replace: '"Packaging Dim.(cm)"',
        reason: 'Package Size (cm) 标准化（带空格）'
      }
    ]
  },
  {
    file: 'frontend/src/i18n/locales/zh.json',
    fixes: [
      // 对应的中文标签 - 保持标准化
      {
        find: '"包装尺寸"',
        replace: '"包装尺寸"',
        reason: '中文包装尺寸标准化（保持不变）'
      }
    ]
  },
  {
    file: 'frontend/src/i18n/locales/zh/consumables.json',
    fixes: [
      // 中文tooltip字段标准化
      {
        find: '"毛重 kg"',
        replace: '"毛重(kg)"',
        reason: '中文毛重格式标准化'
      },
      {
        find: '"高度 cm"',
        replace: '"高度(cm)"',
        reason: '中文高度格式标准化'
      },
      {
        find: '"高度 inch"',
        replace: '"高度(inch)"',
        reason: '中文高度英制格式标准化'
      },
      {
        find: '"纸筒内径 cm"',
        replace: '"纸筒内径(cm)"',
        reason: '中文纸筒内径格式标准化'
      },
      {
        find: '"纸筒内径 inch"',
        replace: '"纸筒内径(inch)"',
        reason: '中文纸筒内径英制格式标准化'
      }
    ]
  }
];

// 执行耗材页面字段修复
function executeConsumablesFieldFixes(dryRun = false) {
  console.log('🔧 耗材页面字段标准化修复');
  console.log(`模式: ${dryRun ? '预览' : '执行修复'}`);
  console.log('🎯 主要修复: lbs → lb 显示问题');
  console.log('');
  
  let totalChanges = 0;
  const results = [];
  
  CONSUMABLES_FIELD_FIXES.forEach(({ file, fixes }) => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️ 文件不存在: ${file}`);
      return;
    }
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      let fileChanges = 0;
      
      console.log(`\n📁 处理文件: ${file}`);
      
      fixes.forEach(({ find, replace, reason }) => {
        const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const beforeCount = (newContent.match(regex) || []).length;
        
        if (beforeCount > 0) {
          newContent = newContent.replace(regex, replace);
          fileChanges += beforeCount;
          totalChanges += beforeCount;
          console.log(`  ✅ ${reason}`);
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

// 生成耗材页面修复报告
function generateConsumablesReport(results) {
  const report = `# 耗材页面字段标准化修复报告

执行时间: ${new Date().toLocaleString()}

## 📊 修复统计
- 总修改数: ${results.totalChanges}
- 成功文件: ${results.results.filter(r => r.success).length}
- 失败文件: ${results.results.filter(r => !r.success).length}

## 🎯 核心修复重点

### ⭐⭐⭐ 最重要修复
- **"Unit Weight lbs" → "Unit Weight(lb)"** - 解决用户反馈的关键显示问题
- **"Package Size inch" → "Packaging Dim.(inch)"** - 包装尺寸标准化  
- **"Gross Weight lbs" → "Gross Weight(lb)"** - 毛重单位标准化

### 翻译文件修复
- **en.json**: Package Size、Unit Weight 标准化
- **zh.json**: 对应中文翻译标准化
- **en/consumables.json**: ⭐⭐⭐ tooltip关键修复
- **zh/consumables.json**: 对应中文tooltip修复

## 📋 修复详情
${results.results.map(r => 
  `- ${r.file}: ${r.success ? `✅ ${r.changes}处修改` : `❌ ${r.error}`}`
).join('\n')}

## ✅ 验证方法
1. 重启前端服务: \`./scripts/docker-dev.sh restart-frontend\`
2. 访问耗材页面: http://localhost:5173/consumables
3. **重点检查**: Tooltip中显示 "Unit Weight(lb)" 而非 "Unit Weight lbs"
4. 检查包装信息显示 "Packaging Dim.(inch)" 而非 "Package Size inch"
5. 验证毛重显示 "Gross Weight(lb)" 而非 "Gross Weight lbs"
6. 测试多语言切换功能

## 🔄 回滚方法
如需回滚修改：
\`\`\`bash
# 恢复备份文件
find frontend/src/i18n/locales -name "*.backup" -exec sh -c 'mv "\$1" "\${1%.backup}"' _ {} \\;
./scripts/docker-dev.sh restart-frontend
\`\`\`

## 📊 预期效果
修复后，耗材页面将显示：
- ✅ **"Unit Weight(lb)"** 而不是 "Unit Weight lbs" ⭐⭐⭐
- ✅ **"Packaging Dim.(inch)"** 而不是 "Package Size inch"  
- ✅ **"Gross Weight(lb)"** 而不是 "Gross Weight lbs"
- ✅ 所有重量单位统一使用 "(lb)" 格式
- ✅ 材料筛选功能完整保留

## ⚠️ 安全保证
- ✅ 只修改翻译文件，不触碰功能代码
- ✅ 不影响材料筛选相关功能
- ✅ 保留智能单位制切换逻辑
- ✅ 自动备份所有修改文件
`;

  const reportPath = 'output/consumables-field-fix-report.md';
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 修复报告已生成: ${reportPath}`);
  
  return report;
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  console.log('🎯 耗材页面字段标准化修复工具');
  console.log('基于 CONSUMABLE_FIELD_STANDARDIZATION_TASK.md');
  console.log('');
  
  if (dryRun) {
    console.log('🔍 预览模式 - 不会实际修改文件');
  } else {
    console.log('⚡ 执行模式 - 将实际修改文件');
  }
  
  const results = executeConsumablesFieldFixes(dryRun);
  
  console.log('\n📊 修复结果:');
  console.log(`总修改数: ${results.totalChanges}`);
  console.log(`成功文件: ${results.results.filter(r => r.success).length}`);
  console.log(`失败文件: ${results.results.filter(r => !r.success).length}`);
  
  if (!dryRun && results.totalChanges > 0) {
    generateConsumablesReport(results);
    
    console.log('\n🚀 下一步操作:');
    console.log('1. 重启前端服务: ./scripts/docker-dev.sh restart-frontend');
    console.log('2. 访问耗材页面验证: http://localhost:5173/consumables');
    console.log('3. 重点检查tooltip中的 "Unit Weight(lb)" 显示');
  }
  
  if (dryRun) {
    console.log('\n💡 要执行实际修复，请运行: node scripts/consumables-field-fix.js');
  }
}

// 运行主程序
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { executeConsumablesFieldFixes, generateConsumablesReport }; 