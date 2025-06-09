// 🧪 形状筛选修复验证脚本
// 在浏览器控制台中运行此脚本来验证修复效果

console.log('🔧 开始验证形状筛选修复效果...');

// 1. 检查页面上的"全部"选项数量
const allShapeOptions = document.querySelectorAll('input[name="shape"]');
console.log(`📊 找到 ${allShapeOptions.length} 个形状选项`);

const allOptions = Array.from(allShapeOptions).map(input => ({
  id: input.id,
  value: input.value || input.id.replace('shape-', ''),
  checked: input.checked,
  label: input.nextElementSibling?.textContent?.trim() || 'No label'
}));

console.log('📋 所有形状选项:', allOptions);

// 检查是否有重复的"全部"选项
const allOptionsCount = allOptions.filter(opt => 
  opt.id.includes('all') || opt.value === 'all' || opt.label.includes('全部')
).length;

console.log(`🔍 "全部"选项数量: ${allOptionsCount} ${allOptionsCount === 1 ? '✅' : '❌ 有重复!'}`);

// 2. 检查形状图片加载情况
const shapeImages = document.querySelectorAll('img[alt*="Pillow"], img[alt*="Bubble"], img[alt*="Tube"], img[src*="shape"]');
console.log(`🖼️ 找到 ${shapeImages.length} 个形状图片`);

shapeImages.forEach((img, index) => {
  const status = img.complete && img.naturalWidth > 0 ? '✅' : '❌';
  console.log(`🖼️ 图片 ${index + 1}: ${status}`, {
    src: img.src,
    alt: img.alt,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    complete: img.complete
  });
});

// 3. 检查数量显示是否正确
const shapeCountElements = document.querySelectorAll('[class*="text-blue-500"]:not(.absolute)');
console.log(`🔢 找到 ${shapeCountElements.length} 个数量显示元素`);

shapeCountElements.forEach((el, index) => {
  const text = el.textContent?.trim();
  if (text?.includes('(') && text?.includes(')')) {
    const count = text.match(/\((\d+)\)/)?.[1];
    console.log(`🔢 数量 ${index + 1}: ${text} - 提取数值: ${count}`);
    
    // 检查是否是不合理的数量（如96）
    if (count && parseInt(count) > 50) {
      console.warn(`⚠️ 可能的错误数量: ${count} (总共应该只有48个产品)`);
    }
  }
});

// 4. 检查中文显示
const chineseElements = document.querySelectorAll('span');
let hasChineseIssues = false;

chineseElements.forEach(el => {
  const text = el.textContent?.trim();
  if (text && (text.includes('ui.') || text.includes('filter.') || text.includes('t('))) {
    console.warn(`⚠️ 可能的国际化问题: "${text}"`);
    hasChineseIssues = true;
  }
});

if (!hasChineseIssues) {
  console.log('✅ 中文显示正常');
}

// 5. 总结报告
console.log('\n📋 修复效果总结:');
console.log(`  1. 重复"全部"选项: ${allOptionsCount === 1 ? '✅ 已修复' : '❌ 仍有问题'}`);
console.log(`  2. 形状图片加载: ${Array.from(shapeImages).every(img => img.complete && img.naturalWidth > 0) ? '✅ 全部正常' : '❌ 部分图片加载失败'}`);
console.log(`  3. 中文显示: ${!hasChineseIssues ? '✅ 正常' : '❌ 仍有国际化残留'}`);

// 6. 提供修复建议
if (allOptionsCount > 1) {
  console.log('\n🔧 修复建议:');
  console.log('  - 检查generateShapeOptions函数，确保不重复添加"全部"选项');
  console.log('  - 在UI渲染时过滤掉重复的选项');
}

if (Array.from(shapeImages).some(img => !img.complete || img.naturalWidth === 0)) {
  console.log('\n🔧 图片修复建议:');
  console.log('  - 检查filterOptions.shapes中的image_url字段');
  console.log('  - 确认图片文件在服务器上存在');
  console.log('  - 验证cleanImageUrl函数的处理逻辑');
} 