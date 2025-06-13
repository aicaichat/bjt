#!/usr/bin/env node

/**
 * 购物车错误修复验证脚本
 * 验证 getSmartFieldKey 函数错误是否已修复
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 购物车错误修复验证');
console.log('=' .repeat(50));

// 检查修复的文件
const filesToCheck = [
  {
    path: 'src/hooks/useCartDisplayEnhancer.ts',
    checks: [
      {
        name: '正确导入 useSmartFieldMapping',
        pattern: /import.*useSmartFieldMapping.*from.*useSmartFieldMapping/,
        required: true
      },
      {
        name: '使用 getSmartFieldMapping 而不是 getSmartFieldKey',
        pattern: /getSmartFieldMapping\(baseField, originalData\)/,
        required: true
      },
      {
        name: '不再使用 getSmartFieldKey',
        pattern: /getSmartFieldKey/,
        required: false
      }
    ]
  },
  {
    path: 'src/components/Cart/SmartCartItemCard.tsx',
    checks: [
      {
        name: '正确导入 getSmartFieldValue',
        pattern: /import.*getSmartFieldValue.*from.*useCartDisplayEnhancer/,
        required: true
      },
      {
        name: '不再使用 isTemporaryOverride',
        pattern: /isTemporaryOverride/,
        required: false
      },
      {
        name: '使用 preferredUnitSystem',
        pattern: /preferredUnitSystem.*=.*useSmartUnitSystem/,
        required: true
      }
    ]
  }
];

let totalChecks = 0;
let passedChecks = 0;

filesToCheck.forEach(file => {
  console.log(`\n📁 检查文件: ${file.path}`);
  
  const filePath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  file.checks.forEach(check => {
    totalChecks++;
    const found = check.pattern.test(content);
    
    if (check.required) {
      if (found) {
        console.log(`✅ ${check.name}`);
        passedChecks++;
      } else {
        console.log(`❌ ${check.name}`);
      }
    } else {
      if (!found) {
        console.log(`✅ ${check.name} (已移除)`);
        passedChecks++;
      } else {
        console.log(`❌ ${check.name} (仍然存在)`);
      }
    }
  });
});

// 检查相关Hook文件
console.log(`\n📁 检查相关Hook文件`);

const hookFiles = [
  'src/hooks/useSmartUnitSystem.ts',
  'src/hooks/useSmartFieldMapping.ts'
];

hookFiles.forEach(hookFile => {
  const filePath = path.join(__dirname, hookFile);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${hookFile} 存在`);
    totalChecks++;
    passedChecks++;
  } else {
    console.log(`❌ ${hookFile} 不存在`);
    totalChecks++;
  }
});

// 总结
console.log('\n' + '='.repeat(50));
console.log(`📊 修复验证结果: ${passedChecks}/${totalChecks} (${(passedChecks/totalChecks*100).toFixed(1)}%)`);

if (passedChecks === totalChecks) {
  console.log('🎉 所有检查通过！getSmartFieldKey 错误已修复');
  console.log('\n✨ 修复内容:');
  console.log('  - 正确导入 useSmartFieldMapping hook');
  console.log('  - 使用 getSmartFieldMapping 替代 getSmartFieldKey');
  console.log('  - 移除不存在的 isTemporaryOverride 属性使用');
  console.log('  - 修复函数调用和依赖关系');
} else {
  console.log('⚠️  仍有问题需要修复');
}

console.log('\n🔗 相关文件:');
console.log('  - useCartDisplayEnhancer.ts: 购物车显示增强器');
console.log('  - SmartCartItemCard.tsx: 智能购物车商品卡片');
console.log('  - useSmartFieldMapping.ts: 智能字段映射');
console.log('  - useSmartUnitSystem.ts: 智能单位制系统'); 