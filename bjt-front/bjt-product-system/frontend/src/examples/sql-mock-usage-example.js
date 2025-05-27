/**
 * SQL Mock数据生成器使用示例
 * 展示如何在各个页面中使用基于数据库结构的Mock数据
 */

// 在你的Vue/React组件中使用示例：

console.log('📚 SQL Mock数据生成器使用示例');

// ========================================
// 示例1: 产品线页面
// ========================================
async function useInProductLinesPage() {
  console.log('\n1️⃣ 产品线页面使用示例:');
  
  // 模拟导入（在实际项目中使用）
  // import { getProductLinesData } from '@/services/integrated-mock-service';
  
  // 获取产品线数据
  const mockGetProductLines = () => Promise.resolve([
    {
      id: 1,
      title_zh: '气垫系列',
      title_en: 'Air Cushioning System',
      description_zh: '专业气垫机生产商...',
      code: 'air_cushion',
      image_url: '/uploads/product_lines/Air Cushioning System.jpg',
      status: 'publish'
    },
    {
      id: 2, 
      title_zh: '纸垫系列',
      title_en: 'Paper Cushioning Machine',
      description_zh: '专业牛皮纸缓冲机...',
      code: 'paper_machine',
      image_url: '/uploads/product_lines/Paper Cushioning Machine.jpg',
      status: 'publish'
    }
  ]);
  
  const productLines = await mockGetProductLines();
  console.log('   ✅ 获取到', productLines.length, '个产品线');
  console.log('   📄 第一个产品线:', productLines[0].title_zh);
  
  return productLines;
}

// ========================================
// 示例2: 主机页面
// ========================================
async function useInMachinesPage() {
  console.log('\n2️⃣ 主机页面使用示例:');
  
  // 获取主机数据 - 支持筛选和分页
  const mockGetMachines = (params = {}) => Promise.resolve({
    items: [
      {
        id: 1,
        code: '60A01143',
        title_zh: '"LA-E4S V2.0"主机-标准版',
        title_en: '"LA-E4S V2.0" Host-Standard',
        product_line_id: 1,
        type: 'machine',
        image_url: '/uploads/host/LA-E4S V2.0.jpg',
        voltage: '110V',
        brand: 'Lockdeair',
        price: 1250.00,
        inventory: 45
      }
    ],
    total: 1,
    page: params.page || 1,
    per_page: params.pageSize || 10,
    total_pages: 1
  });
  
  // 基本查询
  const allMachines = await mockGetMachines();
  console.log('   ✅ 获取所有主机:', allMachines.total, '台');
  
  // 按类别筛选
  const categoryMachines = await mockGetMachines({ category: 1 });
  console.log('   ✅ 气垫系列主机:', categoryMachines.items.length, '台');
  
  // 分页查询
  const pagedMachines = await mockGetMachines({ page: 1, pageSize: 5 });
  console.log('   ✅ 第1页数据:', pagedMachines.items.length, '条');
  
  return categoryMachines;
}

// ========================================
// 示例3: 配件页面
// ========================================
async function useInAccessoriesPage() {
  console.log('\n3️⃣ 配件页面使用示例:');
  
  const mockGetAccessories = (params = {}) => Promise.resolve({
    items: [
      {
        id: 1,
        part_number: '60A04038',
        name_zh: 'ET400 自动分离器',
        name_en: 'ET400 Auto Separator',
        model: 'ET400',
        brand: 'Lockedair',
        voltage: '110V',
        image_url: '/uploads/accessory/ET400.jpg',
        price: 850.00,
        inventory: 23
      }
    ],
    total: 1,
    page: params.page || 1,
    page_size: params.pageSize || 10,
    total_pages: 1
  });
  
  const accessories = await mockGetAccessories({ category: 1 });
  console.log('   ✅ 获取配件:', accessories.total, '个');
  console.log('   🔧 第一个配件:', accessories.items[0].name_zh);
  
  return accessories;
}

// ========================================
// 示例4: 耗材页面
// ========================================
async function useInConsumablesPage() {
  console.log('\n4️⃣ 耗材页面使用示例:');
  
  const mockGetConsumables = (params = {}) => Promise.resolve({
    items: [
      {
        id: 1,
        code: 'FTB-HDPE-20x10-25um',
        name: 'HDPE气垫膜',
        brand: 'Lockedair',
        specs: {
          material: 'HDPE',
          shape: 'FTB',
          thickness: { metric: '25um', imperial: '1.0mil' },
          width: { metric: '20cm', imperial: '8inch' },
          length: { metric: '10cm', imperial: '4inch' },
          compatibility: ['LA-E4S V2.0']
        },
        image_url: '/uploads/consumables/FTB-HDPE.jpg',
        price: 125.50,
        inventory: 156
      }
    ],
    total: 1,
    total_pages: 1,
    current_page: params.page || 1
  });
  
  // 基本查询
  const consumables = await mockGetConsumables({ category: 1 });
  console.log('   ✅ 获取耗材:', consumables.total, '种');
  
  // 按形状筛选
  const ftbConsumables = await mockGetConsumables({ shape: 'FTB' });
  console.log('   ✅ FTB气垫:', ftbConsumables.items.length, '种');
  
  // 按材料筛选
  const hdpeConsumables = await mockGetConsumables({ material: 'HDPE' });
  console.log('   ✅ HDPE材料:', hdpeConsumables.items.length, '种');
  
  return consumables;
}

// ========================================
// 示例5: 购物车功能
// ========================================
async function useInCartFunctionality() {
  console.log('\n5️⃣ 购物车功能使用示例:');
  
  // 模拟购物车操作
  let cart = [];
  
  // 添加主机到购物车
  const addToCart = (item, quantity = 1) => {
    const cartItem = {
      id: Date.now(),
      product_type: item.type || 'machine',
      product_id: item.id,
      part_number: item.code || item.part_number,
      name_zh: item.title_zh || item.name_zh,
      quantity: quantity,
      unit_price: item.price,
      line_total: item.price * quantity,
      image_url: item.image_url
    };
    cart.push(cartItem);
    return cartItem;
  };
  
  // 添加一些商品
  addToCart({ 
    id: 1, 
    code: '60A01143', 
    title_zh: 'LA-E4S主机', 
    price: 1250.00,
    type: 'machine',
    image_url: '/uploads/host/LA-E4S.jpg'
  }, 1);
  
  addToCart({ 
    id: 2, 
    part_number: '60A04038', 
    name_zh: 'ET400分离器', 
    price: 850.00,
    type: 'accessory',
    image_url: '/uploads/accessory/ET400.jpg'
  }, 2);
  
  console.log('   ✅ 购物车商品数:', cart.length);
  console.log('   💰 购物车总价:', cart.reduce((sum, item) => sum + item.line_total, 0));
  
  return cart;
}

// ========================================
// 示例6: 搜索和筛选
// ========================================
async function useSearchAndFilter() {
  console.log('\n6️⃣ 搜索和筛选使用示例:');
  
  // 模拟数据库查询函数
  const mockFilterData = (tableName, conditions) => {
    const mockData = {
      'wp_bjt_parts': [
        { id: 1, name_zh: 'LA-E4S主机', voltage: '110V', product_line_id: 1 },
        { id: 2, name_zh: 'LA-E4S主机', voltage: '220V', product_line_id: 1 },
        { id: 3, name_zh: 'Paper Machine', voltage: '110V', product_line_id: 2 }
      ],
      'wp_bjt_accessories': [
        { id: 1, name_zh: 'ET400分离器', model: 'ET400', product_line_id: 1 },
        { id: 2, name_zh: 'FR8002收卷车', model: 'FR8002', product_line_id: 1 }
      ]
    };
    
    let data = mockData[tableName] || [];
    
    // 应用筛选条件
    Object.entries(conditions).forEach(([key, value]) => {
      data = data.filter(item => item[key] === value);
    });
    
    return data;
  };
  
  // 按产品线筛选主机
  const airCushionMachines = mockFilterData('wp_bjt_parts', { product_line_id: 1 });
  console.log('   ✅ 气垫系列主机:', airCushionMachines.length, '台');
  
  // 按电压筛选
  const voltage110 = mockFilterData('wp_bjt_parts', { voltage: '110V' });
  console.log('   ✅ 110V设备:', voltage110.length, '台');
  
  // 按型号筛选配件
  const et400Accessories = mockFilterData('wp_bjt_accessories', { model: 'ET400' });
  console.log('   ✅ ET400配件:', et400Accessories.length, '个');
  
  return { airCushionMachines, voltage110, et400Accessories };
}

// ========================================
// 运行所有示例
// ========================================
async function runAllExamples() {
  try {
    await useInProductLinesPage();
    await useInMachinesPage();
    await useInAccessoriesPage();
    await useInConsumablesPage();
    await useInCartFunctionality();
    await useSearchAndFilter();
    
    console.log('\n🎉 所有使用示例运行完成！');
    console.log('\n📋 总结:');
    console.log('  ✅ 产品线数据获取');
    console.log('  ✅ 主机数据筛选分页');
    console.log('  ✅ 配件数据查询');
    console.log('  ✅ 耗材动态组合');
    console.log('  ✅ 购物车功能集成');
    console.log('  ✅ 搜索筛选功能');
    
    console.log('\n🚀 开始在你的项目中使用：');
    console.log('  1. 导入需要的服务函数');
    console.log('  2. 在组件中调用API获取数据');
    console.log('  3. 使用筛选和分页功能');
    console.log('  4. 处理数据展示和用户交互');
    
    console.log('\n📚 详细文档: docs/sql-mock-integration-guide.md');
    
  } catch (error) {
    console.error('❌ 示例运行失败:', error.message);
  }
}

// 执行示例
runAllExamples(); 