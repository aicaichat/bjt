// 在生产环境浏览器控制台运行此脚本
// 用于诊断 pcs_per_box 显示问题

console.log('🔍 BJT 生产环境诊断开始...');

// 1. 检查环境变量
console.log('📋 环境变量检查:');
const envVars = {
  'VITE_USE_STANDARDIZED_FIELDS': import.meta.env.VITE_USE_STANDARDIZED_FIELDS,
  'VITE_ENABLE_STANDARD_FIELDS': import.meta.env.VITE_ENABLE_STANDARD_FIELDS,
  'NODE_ENV': import.meta.env.NODE_ENV,
  'MODE': import.meta.env.MODE
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// 2. 检查当前页面URL和环境
console.log('\n🌐 环境信息:');
console.log('当前URL:', window.location.href);
console.log('User Agent:', navigator.userAgent);
console.log('是否生产环境:', import.meta.env.PROD);

// 3. 检查页面中的产品显示
console.log('\n🔍 产品显示检查:');
const productCards = document.querySelectorAll('.consumable-product-card, .product-card, .spec-badge');
console.log(`找到 ${productCards.length} 个产品相关元素`);

let zeroQtyFound = false;
let totalQtyFields = 0;

// 查找所有可能包含 pcs_per_box 的元素
document.querySelectorAll('*').forEach(element => {
  const text = element.textContent || '';
  
  // 检查是否包含数量相关的文本
  if ((text.includes('Qty per Carton') || text.includes('单箱数量')) && 
      text.includes('0') && 
      !element.querySelector('*')) { // 确保是叶子节点
    
    totalQtyFields++;
    console.log('发现数量字段:', {
      element: element.tagName,
      class: element.className,
      text: text.trim(),
      parent: element.parentElement?.className
    });
    
    if (text.includes('0')) {
      zeroQtyFound = true;
    }
  }
});

// 4. 检查组件类型
console.log('\n🧩 组件类型检查:');
const hasStandardizedComponents = document.querySelector('.spec-badge') !== null;
const hasOldComponents = document.querySelector('.product-specs') !== null;

console.log('使用标准化组件:', hasStandardizedComponents);
console.log('使用旧版组件:', hasOldComponents);

// 5. 结果总结
console.log('\n📊 诊断结果:');
console.log(`总数量字段: ${totalQtyFields}`);
console.log(`发现零值显示: ${zeroQtyFound}`);

if (zeroQtyFound) {
  console.log('❌ 问题确认：生产环境仍在显示 pcs_per_box=0 的字段');
  console.log('💡 建议解决方案:');
  console.log('1. 检查代码版本是否为最新');
  console.log('2. 重新构建和部署前端应用');
  console.log('3. 清除浏览器和服务器缓存');
  console.log('4. 验证环境变量配置正确');
} else {
  console.log('✅ 未发现问题：pcs_per_box=0 的字段已正确隐藏');
}

// 6. 代码版本检查（如果可能）
console.log('\n🔍 尝试检查代码版本...');
try {
  // 查找可能的版本信息
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const viteScripts = scripts.filter(script => script.src.includes('assets/index-') || script.src.includes('.js'));
  
  if (viteScripts.length > 0) {
    console.log('找到构建文件:', viteScripts.map(s => s.src));
    console.log('💡 可以通过文件名hash判断是否为最新版本');
  }
} catch (e) {
  console.log('无法获取版本信息:', e.message);
}

console.log('\n✅ 诊断完成！请将结果发送给开发团队。');
