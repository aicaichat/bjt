#!/usr/bin/env node

/**
 * 购物车多语言功能验证脚本
 * 验证i18n翻译文件和组件集成
 */

const fs = require('fs');
const path = require('path');

console.log('🌐 购物车多语言功能验证');
console.log('='.repeat(50));

// 测试翻译文件完整性
function testTranslationFiles() {
  console.log('\n📚 测试1: 翻译文件完整性检查');
  
  const zhCartPath = 'src/i18n/locales/zh/cart.json';
  const enCartPath = 'src/i18n/locales/en/cart.json';
  
  try {
    // 读取翻译文件
    const zhCart = JSON.parse(fs.readFileSync(zhCartPath, 'utf8'));
    const enCart = JSON.parse(fs.readFileSync(enCartPath, 'utf8'));
    
    console.log('  ✅ 中文翻译文件加载成功');
    console.log('  ✅ 英文翻译文件加载成功');
    
    // 检查关键翻译键
    const requiredKeys = [
      'title',
      'empty.title',
      'empty.description',
      'actions.remove',
      'actions.clear',
      'actions.checkout',
      'actions.continueShopping',
      'fields.partNumber',
      'unitSystem.label',
      'unitSystem.metric',
      'unitSystem.imperial',
      'mainItems',
      'requiredParts',
      'selectedTotal',
      'subtotal',
      'common.product',
      'common.notAvailable'
    ];
    
    const missingKeys = [];
    
    requiredKeys.forEach(key => {
      const zhValue = getNestedValue(zhCart, key);
      const enValue = getNestedValue(enCart, key);
      
      if (!zhValue) {
        missingKeys.push(`中文缺失: ${key}`);
      }
      if (!enValue) {
        missingKeys.push(`英文缺失: ${key}`);
      }
    });
    
    if (missingKeys.length === 0) {
      console.log('  ✅ 所有必需的翻译键都存在');
      console.log(`  📊 检查了 ${requiredKeys.length} 个关键翻译键`);
    } else {
      console.log('  ❌ 发现缺失的翻译键:');
      missingKeys.forEach(key => console.log(`    - ${key}`));
    }
    
    return missingKeys.length === 0;
    
  } catch (error) {
    console.error('  ❌ 翻译文件测试失败:', error.message);
    return false;
  }
}

// 获取嵌套对象值
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

// 测试翻译键值对照
function testTranslationPairs() {
  console.log('\n🔄 测试2: 中英文翻译对照检查');
  
  try {
    const zhCart = JSON.parse(fs.readFileSync('src/i18n/locales/zh/cart.json', 'utf8'));
    const enCart = JSON.parse(fs.readFileSync('src/i18n/locales/en/cart.json', 'utf8'));
    
    const testPairs = [
      { key: 'title', zh: '购物车', en: 'Shopping Cart' },
      { key: 'empty.title', zh: '购物车为空', en: 'Cart is Empty' },
      { key: 'actions.remove', zh: '删除商品', en: 'Remove Item' },
      { key: 'actions.checkout', zh: '立即结算', en: 'Checkout Now' },
      { key: 'unitSystem.metric', zh: '公制 (kg/cm)', en: 'Metric (kg/cm)' },
      { key: 'unitSystem.imperial', zh: '英制 (lbs/inch)', en: 'Imperial (lbs/inch)' },
      { key: 'mainItems', zh: '主商品', en: 'Main Items' },
      { key: 'requiredParts', zh: '必选备件', en: 'Required Parts' }
    ];
    
    let correctPairs = 0;
    
    testPairs.forEach(pair => {
      const zhValue = getNestedValue(zhCart, pair.key);
      const enValue = getNestedValue(enCart, pair.key);
      
      const zhMatch = zhValue === pair.zh;
      const enMatch = enValue === pair.en;
      
      if (zhMatch && enMatch) {
        console.log(`  ✅ ${pair.key}: "${zhValue}" | "${enValue}"`);
        correctPairs++;
      } else {
        console.log(`  ❌ ${pair.key}:`);
        if (!zhMatch) console.log(`    中文不匹配: 期望"${pair.zh}", 实际"${zhValue}"`);
        if (!enMatch) console.log(`    英文不匹配: 期望"${pair.en}", 实际"${enValue}"`);
      }
    });
    
    console.log(`  📊 翻译对照检查: ${correctPairs}/${testPairs.length} 正确`);
    return correctPairs === testPairs.length;
    
  } catch (error) {
    console.error('  ❌ 翻译对照测试失败:', error.message);
    return false;
  }
}

// 测试组件i18n集成
function testComponentIntegration() {
  console.log('\n🔧 测试3: 组件i18n集成检查');
  
  try {
    // 检查购物车页面
    const cartPagePath = 'src/pages/Cart/index.tsx';
    const cartListPath = 'src/components/Cart/CartList.tsx';
    
    if (!fs.existsSync(cartPagePath)) {
      console.log('  ❌ 购物车页面文件不存在');
      return false;
    }
    
    if (!fs.existsSync(cartListPath)) {
      console.log('  ❌ 购物车列表组件文件不存在');
      return false;
    }
    
    const cartPageContent = fs.readFileSync(cartPagePath, 'utf8');
    const cartListContent = fs.readFileSync(cartListPath, 'utf8');
    
    // 检查是否使用了useTranslation
    const hasUseTranslation = cartPageContent.includes('useTranslation') && 
                             cartListContent.includes('useTranslation');
    
    // 检查是否使用了t函数
    const usesTFunction = cartPageContent.includes('t(') && 
                         cartListContent.includes('t(');
    
    // 检查是否移除了硬编码中文
    const hasHardcodedChinese = /['"`][\u4e00-\u9fa5]/.test(cartPageContent) || 
                               /['"`][\u4e00-\u9fa5]/.test(cartListContent);
    
    console.log(`  ${hasUseTranslation ? '✅' : '❌'} useTranslation Hook 已导入`);
    console.log(`  ${usesTFunction ? '✅' : '❌'} t() 翻译函数已使用`);
    console.log(`  ${!hasHardcodedChinese ? '✅' : '❌'} 硬编码中文已移除`);
    
    return hasUseTranslation && usesTFunction && !hasHardcodedChinese;
    
  } catch (error) {
    console.error('  ❌ 组件集成测试失败:', error.message);
    return false;
  }
}

// 测试语言切换功能
function testLanguageSwitcher() {
  console.log('\n🔄 测试4: 语言切换功能检查');
  
  try {
    const cartPageContent = fs.readFileSync('src/pages/Cart/index.tsx', 'utf8');
    
    // 检查语言切换组件
    const hasLanguageSwitcher = cartPageContent.includes('LanguageSwitcher');
    const hasLanguageChange = cartPageContent.includes('i18n.changeLanguage');
    const hasLocalStorage = cartPageContent.includes('localStorage.setItem');
    
    console.log(`  ${hasLanguageSwitcher ? '✅' : '❌'} LanguageSwitcher 组件已实现`);
    console.log(`  ${hasLanguageChange ? '✅' : '❌'} 语言切换功能已实现`);
    console.log(`  ${hasLocalStorage ? '✅' : '❌'} 语言偏好保存已实现`);
    
    return hasLanguageSwitcher && hasLanguageChange && hasLocalStorage;
    
  } catch (error) {
    console.error('  ❌ 语言切换测试失败:', error.message);
    return false;
  }
}

// 运行所有测试
function runAllTests() {
  const tests = [
    { name: '翻译文件完整性', test: testTranslationFiles },
    { name: '中英文翻译对照', test: testTranslationPairs },
    { name: '组件i18n集成', test: testComponentIntegration },
    { name: '语言切换功能', test: testLanguageSwitcher }
  ];
  
  let passedTests = 0;
  
  tests.forEach(({ name, test }) => {
    try {
      const result = test();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ ${name} 测试异常:`, error);
    }
  });
  
  console.log('\n🎉 多语言功能验证完成！');
  console.log('='.repeat(50));
  console.log(`✅ 通过测试: ${passedTests}/${tests.length}`);
  console.log(`📊 成功率: ${(passedTests / tests.length * 100).toFixed(1)}%`);
  
  if (passedTests === tests.length) {
    console.log('\n🎊 恭喜！购物车多语言功能已完全实现！');
    console.log('📝 功能特性:');
    console.log('  - ✅ 完整的中英文翻译支持');
    console.log('  - ✅ 智能语言切换功能');
    console.log('  - ✅ 用户语言偏好保存');
    console.log('  - ✅ 无硬编码文本');
    console.log('  - ✅ 响应式多语言界面');
  } else {
    console.log('\n⚠️ 还有部分功能需要完善，请检查上述测试结果。');
  }
  
  return passedTests === tests.length;
}

// 执行测试
runAllTests(); 