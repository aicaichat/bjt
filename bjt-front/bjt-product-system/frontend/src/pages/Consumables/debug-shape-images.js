// 🔧 形状图片调试脚本
// 在浏览器控制台中运行，检查形状数据和图片URL

console.log('🔍 开始调试形状图片问题...');

// 检查API数据中的shapes配置
fetch('http://localhost:8080/wp-json/bjt/v1/consumables?page=1&per_page=5')
  .then(response => response.json())
  .then(data => {
    console.log('📡 API响应数据结构:', data);
    
    // 检查filterOptions中的shapes数据
    const filterOptions = data.data?.filterOptions || data.filterOptions;
    if (filterOptions && filterOptions.shapes) {
      console.log('🎯 形状配置数据:', filterOptions.shapes);
      
      filterOptions.shapes.forEach((shape, index) => {
        console.log(`🔍 形状 ${index + 1}:`, {
          id: shape.id,
          name_zh: shape.name_zh,
          name_en: shape.name_en,
          image_url: shape.image_url,
          image_exists: !!shape.image_url,
          full_url: shape.image_url ? `http://localhost:8080${shape.image_url}` : 'No image'
        });
        
        // 测试图片是否可以加载
        if (shape.image_url) {
          const img = new Image();
          img.onload = () => console.log(`✅ 图片加载成功: ${shape.name_zh} - ${shape.image_url}`);
          img.onerror = () => console.error(`❌ 图片加载失败: ${shape.name_zh} - ${shape.image_url}`);
          img.src = `http://localhost:8080${shape.image_url}`;
        }
      });
    } else {
      console.warn('⚠️ 没有找到shapes配置数据');
    }
    
    // 检查实际的耗材数据中的shape字段
    const items = data.data?.items || data.data || data;
    if (Array.isArray(items)) {
      console.log('📊 耗材数据中的shape字段分析:');
      const shapeStats = {};
      items.forEach(item => {
        if (item.shape) {
          shapeStats[item.shape] = (shapeStats[item.shape] || 0) + 1;
        }
      });
      console.log('📈 shape字段统计:', shapeStats);
    }
  })
  .catch(error => {
    console.error('❌ API调用失败:', error);
  });

// 检查当前页面的形状选项数据
setTimeout(() => {
  console.log('🔍 检查当前页面的智能筛选选项...');
  
  // 假设smartFilterOptions在全局作用域中可用
  if (window.debugSmartFilterOptions) {
    console.log('📊 当前智能筛选选项:', window.debugSmartFilterOptions);
  }
  
  // 检查页面中的形状图片元素
  const shapeImages = document.querySelectorAll('[alt*="形状"], [alt*="Shape"], img[src*="shape"]');
  console.log(`🖼️ 找到 ${shapeImages.length} 个形状相关图片元素`);
  
  shapeImages.forEach((img, index) => {
    console.log(`🖼️ 图片 ${index + 1}:`, {
      src: img.src,
      alt: img.alt,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      error: img.error || 'no error'
    });
  });
}, 2000); 