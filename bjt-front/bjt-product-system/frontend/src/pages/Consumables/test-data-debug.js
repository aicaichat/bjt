// 🔍 数据调试脚本 - 在浏览器控制台运行
// 检查当前页面的数据加载状态

console.log('🔍 开始调试耗材页面数据问题...');

// 1. 检查API响应
fetch('http://localhost:8080/wp-json/bjt/v1/consumables?page=1&per_page=10')
  .then(response => response.json())
  .then(data => {
    console.log('📡 API响应数据:', data);
    
    // 分析数据结构
    if (data.success && data.data) {
      console.log('✅ API返回格式正确');
      console.log('📊 产品数量:', Array.isArray(data.data.items) ? data.data.items.length : 'items字段不是数组');
      console.log('🔧 筛选选项:', data.data.filterOptions ? '存在' : '不存在');
      
      if (Array.isArray(data.data.items) && data.data.items.length > 0) {
        const sample = data.data.items[0];
        console.log('📋 产品数据样本:', {
          id: sample.id,
          name: sample.name,
          shape: sample.shape,
          material: sample.material,
          app_model: sample.app_model,
          width_met: sample.width_met,
          length_met: sample.length_met,
          thickness_met: sample.thickness_met,
          specs: sample.specs
        });
        
        // 检查shape字段分布
        const shapes = {};
        data.data.items.forEach(item => {
          if (item.shape) {
            shapes[item.shape] = (shapes[item.shape] || 0) + 1;
          }
        });
        console.log('🎯 形状分布:', shapes);
        
        // 检查material字段分布
        const materials = {};
        data.data.items.forEach(item => {
          if (item.material) {
            materials[item.material] = (materials[item.material] || 0) + 1;
          }
        });
        console.log('🧪 材质分布:', materials);
      }
    } else {
      console.warn('⚠️ API返回格式异常:', data);
    }
  })
  .catch(error => {
    console.error('❌ API调用失败:', error);
  });

// 2. 检查页面state（如果可以访问）
setTimeout(() => {
  console.log('🔍 检查页面元素...');
  
  // 检查形状选项显示
  const shapeInputs = document.querySelectorAll('input[name="shape"]');
  console.log(`📊 找到 ${shapeInputs.length} 个形状选项`);
  
  // 检查数量显示
  const countElements = document.querySelectorAll('[class*="text-blue-500"]:not(.absolute)');
  console.log('🔢 数量显示元素:', Array.from(countElements).map(el => el.textContent));
  
  // 检查是否有产品列表
  const productItems = document.querySelectorAll('[class*="bg-white rounded-2xl shadow-lg"]');
  console.log(`📦 找到 ${productItems.length} 个产品项`);
  
}, 2000); 