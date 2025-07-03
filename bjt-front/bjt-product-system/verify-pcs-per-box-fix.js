// 验证 pcs_per_box 显示修复的脚本
// 在浏览器控制台中运行此脚本来验证修复效果

console.log('🔍 开始验证 pcs_per_box 显示修复...');

// 检查环境变量
const checkEnvVars = () => {
  console.log('📋 环境变量检查:');
  console.log('VITE_USE_STANDARDIZED_FIELDS:', import.meta.env.VITE_USE_STANDARDIZED_FIELDS);
  console.log('VITE_ENABLE_STANDARD_FIELDS:', import.meta.env.VITE_ENABLE_STANDARD_FIELDS);
  console.log('VITE_FORCE_STANDARDIZED_DISPLAY:', import.meta.env.VITE_FORCE_STANDARDIZED_DISPLAY);
};

// 检查页面中的产品
const checkProductDisplay = () => {
  console.log('🔍 检查页面产品显示:');
  
  // 查找所有产品卡片
  const productCards = document.querySelectorAll('.consumable-product-card, .product-card');
  console.log(`找到 ${productCards.length} 个产品卡片`);
  
  let zeroQtyProducts = 0;
  let displayedZeroQtyProducts = 0;
  
  productCards.forEach((card, index) => {
    // 查找 pcs_per_box 相关的显示
    const qtyElements = card.querySelectorAll('[class*="pcs"], [class*="qty"], [class*="carton"]');
    
    qtyElements.forEach(element => {
      const text = element.textContent || '';
      if (text.includes('0') && (text.includes('Qty') || text.includes('单箱') || text.includes('Carton'))) {
        zeroQtyProducts++;
        if (element.style.display !== 'none' && !element.hidden) {
          displayedZeroQtyProducts++;
          console.log(`❌ 发现显示中的零值产品 #${index + 1}:`, text);
        }
      }
    });
  });
  
  console.log(`📊 统计结果:`);
  console.log(`- 总零值产品: ${zeroQtyProducts}`);
  console.log(`- 仍在显示的零值产品: ${displayedZeroQtyProducts}`);
  
  if (displayedZeroQtyProducts === 0) {
    console.log('✅ 修复成功！所有零值产品已正确隐藏');
  } else {
    console.log('❌ 修复未完全生效，仍有零值产品在显示');
  }
};

// 执行检查
checkEnvVars();
setTimeout(checkProductDisplay, 1000); // 等待页面加载完成

console.log('💡 提示: 如果仍有问题，请重启开发服务器并清除浏览器缓存');
