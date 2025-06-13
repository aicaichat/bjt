#!/usr/bin/env node

/**
 * 验证checkout翻译键修复
 */

const fs = require('fs');

console.log('🔧 验证checkout翻译键修复');
console.log('='.repeat(40));

try {
  // 读取翻译文件
  const zhCart = JSON.parse(fs.readFileSync('src/i18n/locales/zh/cart.json', 'utf8'));
  const enCart = JSON.parse(fs.readFileSync('src/i18n/locales/en/cart.json', 'utf8'));
  
  console.log('\n📚 检查翻译文件结构:');
  
  // 检查是否有重复的checkout键
  const zhCheckoutKeys = [];
  const enCheckoutKeys = [];
  
  function findCheckoutKeys(obj, path = '', keys) {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      if (key === 'checkout') {
        keys.push({
          path: currentPath,
          type: typeof obj[key],
          value: typeof obj[key] === 'string' ? obj[key] : '[Object]'
        });
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        findCheckoutKeys(obj[key], currentPath, keys);
      }
    }
  }
  
  findCheckoutKeys(zhCart, '', zhCheckoutKeys);
  findCheckoutKeys(enCart, '', enCheckoutKeys);
  
  console.log('\n🇨🇳 中文翻译文件中的checkout键:');
  zhCheckoutKeys.forEach(item => {
    console.log(`  ${item.path}: ${item.type} = "${item.value}"`);
  });
  
  console.log('\n🇺🇸 英文翻译文件中的checkout键:');
  enCheckoutKeys.forEach(item => {
    console.log(`  ${item.path}: ${item.type} = "${item.value}"`);
  });
  
  // 检查actions.checkout是否存在
  const zhActionsCheckout = zhCart.actions?.checkout;
  const enActionsCheckout = enCart.actions?.checkout;
  
  console.log('\n✅ 关键检查结果:');
  console.log(`  actions.checkout (中文): ${zhActionsCheckout ? `"${zhActionsCheckout}"` : '❌ 不存在'}`);
  console.log(`  actions.checkout (英文): ${enActionsCheckout ? `"${enActionsCheckout}"` : '❌ 不存在'}`);
  
  // 检查是否还有根级别的checkout字符串
  const zhRootCheckout = zhCart.checkout;
  const enRootCheckout = enCart.checkout;
  
  console.log(`  根级checkout (中文): ${typeof zhRootCheckout === 'string' ? `"${zhRootCheckout}"` : typeof zhRootCheckout === 'object' ? '[Object - 正常]' : '❌ 不存在'}`);
  console.log(`  根级checkout (英文): ${typeof enRootCheckout === 'string' ? `"${enRootCheckout}"` : typeof enRootCheckout === 'object' ? '[Object - 正常]' : '❌ 不存在'}`);
  
  // 验证修复是否成功
  const isFixed = zhActionsCheckout && enActionsCheckout && 
                  typeof zhCart.checkout === 'object' && 
                  typeof enCart.checkout === 'object';
  
  console.log('\n🎉 修复状态:');
  if (isFixed) {
    console.log('  ✅ 修复成功！');
    console.log('  - actions.checkout 字符串键存在');
    console.log('  - checkout 对象键保持不变');
    console.log('  - 不再有重复的字符串checkout键');
  } else {
    console.log('  ❌ 修复未完成，请检查上述结果');
  }
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
} 