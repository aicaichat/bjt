#!/usr/bin/env node

/**
 * 订单页面字段标准化修复工具
 * 基于CSV标准，修复订单页面的字段显示问题
 */

import fs from 'fs';
import path from 'path';

// 订单页面字段标准化修复映射 - 基于CSV标准
const ORDER_FIELD_FIXES = [
  {
    file: 'frontend/src/i18n/locales/en/order.json',
    fixes: [
      // 1. Part Number → Part No. 标准化
      {
        find: '"Part Number"',
        replace: '"Part No."',
        reason: 'Part Number 标准化为 Part No.'
      },
      // 2. Pieces per Box → Qty per Carton 标准化
      {
        find: '"Pieces per Box"',
        replace: '"Qty per Carton"',
        reason: 'Pieces per Box 标准化为 Qty per Carton'
      },
      // 3. Pieces per Pallet → Packs per Pallet 标准化
      {
        find: '"Pieces per Pallet"',
        replace: '"Packs per Pallet"',
        reason: 'Pieces per Pallet 标准化为 Packs per Pallet'
      },
      // 4. Package Size → Packaging Dim. 标准化
      {
        find: '"Package Size"',
        replace: '"Packaging Dim."',
        reason: 'Package Size 标准化为 Packaging Dim.'
      },
      {
        find: '"Package Size \\(cm\\)"',
        replace: '"Packaging Dim.(cm)"',
        reason: 'Package Size (cm) 标准化为 Packaging Dim.(cm)'
      },
      // 5. Pallet Size → Pallet Size 保持不变（符合CSV标准）
      {
        find: '"Pallet Size \\(cm\\)"',
        replace: '"Pallet Size(cm)"',
        reason: 'Pallet Size (cm) 格式标准化'
      },
      // 6. Net Weight → Net Weight 保持不变（符合CSV标准）
      {
        find: '"Net Weight \\(kg\\)"',
        replace: '"Net Weight(kg)"',
        reason: 'Net Weight (kg) 格式标准化'
      },
      // 7. Gross Weight → Gross Weight 保持不变（符合CSV标准）
      {
        find: '"Gross Weight \\(kg\\)"',
        replace: '"Gross Weight(kg)"',
        reason: 'Gross Weight (kg) 格式标准化'
      }
    ]
  },
  {
    file: 'frontend/src/i18n/locales/zh/order.json',
    fixes: [
      // 对应的中文字段标准化
      {
        find: '"单托数量"',
        replace: '"一托数量"',
        reason: '中文单托数量标准化为一托数量'
      }
    ]
  }
];

// 执行订单页面字段修复
function executeOrderFieldFixes(dryRun = false) {
  console.log('🔧 订单页面字段标准化修复');
  console.log(`模式: ${dryRun ? '预览' : '执行修复'}`);
  console.log('🎯 主要修复: 字段名称标准化');
  console.log('');
  
  let totalChanges = 0;
  const results = [];
  
  ORDER_FIELD_FIXES.forEach(({ file, fixes }) => {
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

// 生成订单页面修复报告
function generateOrderReport(results) {
  const report = `# 订单页面字段标准化修复报告

执行时间: ${new Date().toLocaleString()}

## 📊 修复统计
- 总修改数: ${results.totalChanges}
- 成功文件: ${results.results.filter(r => r.success).length}
- 失败文件: ${results.results.filter(r => !r.success).length}

## 🎯 核心修复重点

### 英文字段标准化
- **"Part Number" → "Part No."** - 料号字段标准化
- **"Pieces per Box" → "Qty per Carton"** - 单箱数量字段标准化  
- **"Pieces per Pallet" → "Packs per Pallet"** - 托盘数量字段标准化
- **"Package Size" → "Packaging Dim."** - 包装尺寸字段标准化
- **单位格式标准化** - 统一括号格式 (kg)、(cm)

### 中文字段标准化
- **"单托数量" → "一托数量"** - 中文托盘数量字段标准化

## 📋 修复详情
${results.results.map(r => 
  `- ${r.file}: ${r.success ? `✅ ${r.changes}处修改` : `❌ ${r.error}`}`
).join('\n')}

## ✅ 验证方法
1. 重启前端服务: \`./scripts/docker-dev.sh restart-frontend\`
2. 访问订单页面: http://localhost:5173/orders
3. 创建订单查看产品字段显示
4. 检查订单详情中的产品字段是否符合CSV标准
5. 测试多语言切换功能

## 🔄 回滚方法
如需回滚修改：
\`\`\`bash
# 恢复备份文件
find frontend/src/i18n/locales -name "*.backup" -exec sh -c 'mv "\$1" "\${1%.backup}"' _ {} \\;
./scripts/docker-dev.sh restart-frontend
\`\`\`

## 📊 预期效果
修复后，订单页面将显示：
- ✅ **"Part No."** 而不是 "Part Number"
- ✅ **"Qty per Carton"** 而不是 "Pieces per Box"  
- ✅ **"Packs per Pallet"** 而不是 "Pieces per Pallet"
- ✅ **"Packaging Dim."** 而不是 "Package Size"
- ✅ **"Packaging Dim.(cm)"** 而不是 "Package Size (cm)"
- ✅ **"一托数量"** 而不是 "单托数量"
- ✅ 统一的单位格式 "(kg)"、"(cm)" 等

## ⚠️ 安全保证
- ✅ 只修改翻译文件，不触碰功能代码
- ✅ 不影响订单创建、查看、支付功能
- ✅ 保留所有业务逻辑
- ✅ 自动备份所有修改文件
`;

  const reportPath = 'output/order-field-fix-report.md';
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 修复报告已生成: ${reportPath}`);
  
  return report;
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  console.log('🎯 订单页面字段标准化修复工具');
  console.log('基于CSV标准要求');
  console.log('');
  
  if (dryRun) {
    console.log('🔍 预览模式 - 不会实际修改文件');
  } else {
    console.log('⚡ 执行模式 - 将实际修改文件');
  }
  
  const results = executeOrderFieldFixes(dryRun);
  
  console.log('\n📊 修复结果:');
  console.log(`总修改数: ${results.totalChanges}`);
  console.log(`成功文件: ${results.results.filter(r => r.success).length}`);
  console.log(`失败文件: ${results.results.filter(r => !r.success).length}`);
  
  if (!dryRun && results.totalChanges > 0) {
    generateOrderReport(results);
    
    console.log('\n🚀 下一步操作:');
    console.log('1. 重启前端服务: ./scripts/docker-dev.sh restart-frontend');
    console.log('2. 访问订单页面验证: http://localhost:5173/orders');
    console.log('3. 检查字段标准化效果');
  }
  
  if (dryRun) {
    console.log('\n💡 要执行实际修复，请运行: node scripts/order-field-fix.js');
  }
}

// 运行主程序
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { executeOrderFieldFixes, generateOrderReport }; 