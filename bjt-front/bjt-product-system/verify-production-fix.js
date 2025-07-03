// 生产环境修复验证脚本
// 在生产环境浏览器控制台运行此脚本

console.log('🔍 BJT 生产环境修复验证开始...');

// 1. 检查页面是否加载了最新代码
console.log('1. 检查代码版本...');
const scripts = Array.from(document.querySelectorAll('script[src]'));
const viteScripts = scripts.filter(script => script.src.includes('assets/index-'));
console.log('构建文件:', viteScripts.map(s => s.src));

// 2. 检查环境变量
console.log('\n2. 检查环境变量...');
const envVars = {
  'VITE_USE_STANDARDIZED_FIELDS': import.meta.env.VITE_USE_STANDARDIZED_FIELDS,
  'VITE_ENABLE_STANDARD_FIELDS': import.meta.env.VITE_ENABLE_STANDARD_FIELDS,
  'NODE_ENV': import.meta.env.NODE_ENV,
  'PROD': import.meta.env.PROD
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// 3. 检查当前页面类型
console.log('\n3. 检查当前页面...');
const currentPath = window.location.pathname;
console.log('当前路径:', currentPath);

if (!currentPath.includes('consumables')) {
  console.log('⚠️ 请导航到耗材页面进行测试');
  console.log('建议访问: /consumables 或类似的耗材页面');
}

// 4. 等待页面加载完成后检查产品
setTimeout(() => {
  console.log('\n4. 检查产品显示...');
  
  // 查找所有产品卡片
  const productCards = document.querySelectorAll('.consumable-product-card, .product-card, [class*="product"]');
  console.log(`找到 ${productCards.length} 个产品卡片`);
  
  let zeroQtyCount = 0;
  let totalProducts = 0;
  
  productCards.forEach((card, index) => {
    const text = card.textContent || '';
    totalProducts++;
    
    // 检查是否包含 QTY PER CARTON: 0 或类似文本
    const hasZeroQty = text.match(/(QTY PER CARTON|单箱数量|Qty per Carton).*?:?\s*0/i);
    
    if (hasZeroQty) {
      zeroQtyCount++;
      console.log(`产品 ${index + 1}: 发现零值显示`, {
        text: hasZeroQty[0],
        element: card.className,
        fullText: text.substring(0, 200) + '...'
      });
    }
  });
  
  // 5. 结果分析
  console.log('\n5. 分析结果...');
  console.log(`总产品数: ${totalProducts}`);
  console.log(`显示零值的产品数: ${zeroQtyCount}`);
  
  if (zeroQtyCount > 0) {
    console.log('❌ 问题仍然存在：发现显示零值的产品');
    console.log('💡 可能的原因:');
    console.log('1. 浏览器缓存未清除');
    console.log('2. 服务器缓存未清除');
    console.log('3. 使用了不同的组件路径');
    console.log('4. 环境变量配置不正确');
    
    // 检查是否使用了标准化组件
    const hasStandardized = envVars.VITE_USE_STANDARDIZED_FIELDS === 'true';
    console.log(`\n使用标准化字段: ${hasStandardized}`);
    
    if (!hasStandardized) {
      console.log('🔧 建议: 检查环境变量 VITE_USE_STANDARDIZED_FIELDS 是否设置为 true');
    }
  } else {
    console.log('✅ 修复成功：未发现显示零值的产品');
    console.log('🎉 pcs_per_box=0 的产品已正确隐藏该字段');
  }
  
  // 6. 提供具体的修复建议
  console.log('\n6. 修复建议...');
  if (zeroQtyCount > 0) {
    console.log('请尝试以下步骤:');
    console.log('1. 强制刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)');
    console.log('2. 清除浏览器缓存和Cookie');
    console.log('3. 检查服务器是否重启了前端服务');
    console.log('4. 确认环境变量配置正确');
    console.log('5. 检查是否有多个版本的代码在运行');
  }
  
}, 2000); // 等待2秒让页面完全加载

console.log('\n⏳ 等待页面加载完成...');
console.log('如果2秒后没有看到产品检查结果，请手动刷新页面后重新运行此脚本'); 