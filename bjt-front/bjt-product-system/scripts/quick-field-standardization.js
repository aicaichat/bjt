#!/usr/bin/env node

/**
 * 快速字段标准化工具
 * 基于CSV标准和现有分析结果，批量修复翻译文件中的字段名称
 */

import fs from 'fs';
import path from 'path';

// CSV标准字段映射 (基于表单属性综合统一.csv)
const CSV_STANDARD_MAPPING = {
  // 基本信息字段
  "Name": "Item",
  "名称": "名称", 
  "Code": "Part No.",
  "料号": "料号",
  "Model": "Model", 
  "型号": "型号",
  "Brand": "Brand",
  "品牌": "品牌",
  
  // 单位标准化 - 重点修复lbs→lb
  "Unit Weight(lbs)": "Unit Weight(lb)",
  "Net Weight(lbs)": "Net Weight(lb)", 
  "Gross Weight(lbs)": "Gross Weight(lb)",
  "GW per Pallet(lbs)": "GW per Pallet(lb)",
  "单位重量(lbs)": "单位重量(lb)",
  "单件净重(lbs)": "单件净重(lb)",
  "包装毛重(lbs)": "包装毛重(lb)",
  "整托毛重(lbs)": "整托毛重(lb)",
  
  // 尺寸字段标准化
  "Package Size": "Packaging Dim.",
  "包装尺寸": "包装尺寸",
  "Pieces per Box": "Qty per Carton",
  "单箱数量": "单箱数量",
  "Qty per Box": "Qty per Carton",
  
  // 形状字段标准化
  "Shape": "Film Type",
  "形状": "袋型",
  "Filter by Shape": "Filter by Film Type",
  "按形状筛选": "按袋型筛选",
  "All Shapes": "All Film Types",
  "全部形状": "全部袋型",
  
  // 配件页面字段
  "Accessories": "Accessories",
  "配件": "配件",
  "Part Number": "Part No.",
  "零件号": "料号"
};

// 高优先级修复项目 (影响大、风险低)
const HIGH_PRIORITY_FIXES = [
  {
    pattern: /Unit Weight\(lbs\)/g,
    replacement: "Unit Weight(lb)",
    description: "修复重量单位lbs→lb"
  },
  {
    pattern: /Net Weight\(lbs\)/g, 
    replacement: "Net Weight(lb)",
    description: "修复净重单位"
  },
  {
    pattern: /Gross Weight\(lbs\)/g,
    replacement: "Gross Weight(lb)", 
    description: "修复毛重单位"
  },
  {
    pattern: /Package Size/g,
    replacement: "Packaging Dim.",
    description: "包装尺寸字段标准化"
  },
  {
    pattern: /Pieces per Box/g,
    replacement: "Qty per Carton",
    description: "单箱数量字段标准化"
  },
  {
    pattern: /"Shape"/g,
    replacement: '"Film Type"',
    description: "形状字段标准化为袋型"
  }
];

// 批量修复翻译文件
function batchFixTranslationFiles(targetDir, dryRun = false) {
  console.log('🚀 开始批量修复翻译文件...');
  
  const localesDir = path.join(targetDir, 'frontend/src/i18n/locales');
  const results = {
    filesProcessed: 0,
    changesApplied: 0,
    errors: []
  };
  
  // 遍历所有翻译文件
  const languages = ['en', 'zh'];
  const modules = ['consumables.json', 'spareParts.json', 'machines.json'];
  
  languages.forEach(lang => {
    modules.forEach(module => {
      const filePath = path.join(localesDir, lang, module);
      
      if (fs.existsSync(filePath)) {
        try {
          const originalContent = fs.readFileSync(filePath, 'utf8');
          let modifiedContent = originalContent;
          let fileChanges = 0;
          
          // 应用高优先级修复
          HIGH_PRIORITY_FIXES.forEach(fix => {
            const matches = modifiedContent.match(fix.pattern);
            if (matches) {
              modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
              fileChanges += matches.length;
              console.log(`  ✅ ${lang}/${module}: ${fix.description} (${matches.length}处)`);
            }
          });
          
          // 如果有修改且不是dry run，写入文件
          if (fileChanges > 0 && !dryRun) {
            // 备份原文件
            fs.writeFileSync(`${filePath}.backup`, originalContent);
            // 写入修改后的内容
            fs.writeFileSync(filePath, modifiedContent);
          }
          
          results.filesProcessed++;
          results.changesApplied += fileChanges;
          
          if (fileChanges > 0) {
            console.log(`📝 ${lang}/${module}: ${fileChanges} 处修改`);
          }
          
        } catch (error) {
          console.error(`❌ 处理文件失败: ${filePath}`, error.message);
          results.errors.push(`${filePath}: ${error.message}`);
        }
      }
    });
  });
  
  return results;
}

// 生成修复报告
function generateFixReport(results) {
  const reportPath = 'output/field-standardization-fix-report.md';
  
  const report = `# 字段标准化修复报告

生成时间: ${new Date().toISOString()}

## 📊 修复统计

- **处理文件数**: ${results.filesProcessed}
- **应用修改数**: ${results.changesApplied} 
- **错误数**: ${results.errors.length}

## 🎯 主要修复项目

${HIGH_PRIORITY_FIXES.map(fix => 
  `- **${fix.description}**: \`${fix.pattern.source}\` → \`${fix.replacement}\``
).join('\n')}

## ❌ 错误记录

${results.errors.length > 0 ? 
  results.errors.map(error => `- ${error}`).join('\n') : 
  '无错误'
}

## ✅ 修复建议

1. **立即重启前端服务**: \`./scripts/docker-dev.sh restart-frontend\`
2. **验证页面显示**: 检查耗材、备件、配件页面字段名称
3. **测试多语言切换**: 确保中英文显示正确
4. **功能测试**: 验证筛选、排序等功能正常

## 🔄 下一步优化

1. **配置文件修复**: 修改 \`machine-display-config.ts\`
2. **硬编码替换**: 逐步添加国际化支持  
3. **新字段添加**: 补充CSV标准中缺失的字段
`;

  fs.writeFileSync(reportPath, report);
  console.log(`📋 修复报告已生成: ${reportPath}`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetDir = args.find(arg => arg.startsWith('--target='))?.split('=')[1] || '.';
  
  console.log('🎯 字段标准化快速修复工具');
  console.log(`📁 目标目录: ${targetDir}`);
  console.log(`🔍 模式: ${dryRun ? 'Dry Run (预览)' : 'Live Fix (实际修复)'}`);
  console.log('');
  
  // 执行批量修复
  const results = batchFixTranslationFiles(targetDir, dryRun);
  
  // 输出结果
  console.log('\n📊 修复完成!');
  console.log(`  处理文件: ${results.filesProcessed}`);
  console.log(`  应用修改: ${results.changesApplied}`);
  console.log(`  错误数量: ${results.errors.length}`);
  
  if (!dryRun && results.changesApplied > 0) {
    generateFixReport(results);
    console.log('\n🚀 建议立即重启前端服务:');
    console.log('  ./scripts/docker-dev.sh restart-frontend');
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { batchFixTranslationFiles, generateFixReport }; 