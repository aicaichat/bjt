const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function analyzeRealData() {
  console.log('🔍 开始分析数据库真实数据...');
  
  try {
    // 使用curl获取数据
    console.log('📡 正在获取API数据...');
    const { stdout } = await execAsync('curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?page=1&per_page=1000"');
    const data = JSON.parse(stdout);
    
    console.log('📊 API响应格式:', {
      success: data.success,
      hasData: !!data.data,
      hasItems: Array.isArray(data.data?.items),
      itemsCount: data.data?.items?.length || 0
    });
    
    const items = data.data?.items || [];
    console.log(`\n📋 总共获取到 ${items.length} 个产品\n`);
    
    if (items.length === 0) {
      console.error('❌ 没有获取到任何产品数据');
      return;
    }
    
    // 1. 分析数据结构
    console.log('🔍 === 数据结构分析 ===');
    const sample = items[0];
    console.log('📄 第一个产品的关键字段:');
    console.log({
      id: sample.id,
      name: sample.name,
      shape: sample.shape,
      material: sample.material,
      app_model: sample.app_model,
      width_met: sample.width_met,
      length_met: sample.length_met,
      thickness_met: sample.thickness_met,
      bag_type: sample.bag_type,
      specs: sample.specs
    });
    
    // 2. 分析关键字段的分布
    console.log('\n🎯 === SHAPE字段分析 ===');
    const shapeStats = {};
    items.forEach((item, index) => {
      const shape = item.shape;
      if (shape) {
        shapeStats[shape] = (shapeStats[shape] || 0) + 1;
      } else {
        console.log(`⚠️ 产品 ${item.id} 没有shape字段`);
      }
    });
    
    console.log('📊 Shape字段统计:');
    Object.entries(shapeStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([shape, count]) => {
        console.log(`  ${shape}: ${count}个产品`);
      });
    
    // 3. 分析Material字段
    console.log('\n🧪 === MATERIAL字段分析 ===');
    const materialStats = {};
    items.forEach(item => {
      const material = item.material;
      if (material) {
        materialStats[material] = (materialStats[material] || 0) + 1;
      } else {
        console.log(`⚠️ 产品 ${item.id} 没有material字段`);
      }
    });
    
    console.log('📊 Material字段统计:');
    Object.entries(materialStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([material, count]) => {
        console.log(`  ${material}: ${count}个产品`);
      });
    
    // 4. 分析app_model字段
    console.log('\n📱 === APP_MODEL字段分析 ===');
    const modelStats = {};
    const modelParsingIssues = [];
    items.forEach(item => {
      const appModel = item.app_model;
      if (appModel) {
        // 尝试解析复杂格式
        try {
          const models = appModel.split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
          models.forEach(model => {
            if (model && model.length > 0) {
              modelStats[model] = (modelStats[model] || 0) + 1;
            }
          });
        } catch (e) {
          modelParsingIssues.push({
            id: item.id,
            app_model: appModel,
            error: e.message
          });
        }
      }
    });
    
    console.log('📊 App_model字段统计:');
    Object.entries(modelStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([model, count]) => {
        console.log(`  ${model}: ${count}个产品`);
      });
    
    // 5. 检查规格字段
    console.log('\n📏 === 规格字段分析 ===');
    const specFields = ['width_met', 'length_met', 'thickness_met'];
    specFields.forEach(field => {
      const stats = {};
      const invalidValues = [];
      
      items.forEach(item => {
        const value = item[field];
        if (value !== null && value !== undefined && value !== '') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            stats[numValue] = (stats[numValue] || 0) + 1;
          } else {
            invalidValues.push({
              id: item.id,
              [field]: value
            });
          }
        }
      });
      
      console.log(`📐 ${field}字段统计:`);
      Object.entries(stats)
        .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
        .forEach(([value, count]) => {
          console.log(`  ${value}: ${count}个产品`);
        });
      
      if (invalidValues.length > 0) {
        console.log(`⚠️ ${field}字段无效值:`, invalidValues.slice(0, 3));
      }
    });
    
    // 6. 查找可能的字段映射问题
    console.log('\n🔍 === 字段映射检查 ===');
    const allFields = new Set();
    items.forEach(item => {
      Object.keys(item).forEach(key => allFields.add(key));
    });
    
    const importantFields = ['shape', 'material', 'app_model', 'width_met', 'length_met', 'thickness_met', 'bag_type', 'specs'];
    console.log('📋 重要字段检查:');
    importantFields.forEach(field => {
      const hasValue = items.some(item => item[field] !== null && item[field] !== undefined && item[field] !== '');
      const valueCount = items.filter(item => item[field] !== null && item[field] !== undefined && item[field] !== '').length;
      console.log(`  ${field}: ${hasValue ? '✅' : '❌'} (${valueCount}/${items.length})`);
    });
    
    // 7. 详细分析几个关键产品
    console.log('\n🔍 === 关键产品详细分析 ===');
    const sampleProducts = items.slice(0, 3);
    sampleProducts.forEach((product, index) => {
      console.log(`\n📦 产品 ${index + 1} (ID: ${product.id}):`);
      console.log(`  名称: ${product.name}`);
      console.log(`  形状: ${product.shape}`);
      console.log(`  材质: ${product.material}`);
      console.log(`  适用型号: ${product.app_model}`);
      console.log(`  宽度: ${product.width_met}`);
      console.log(`  长度: ${product.length_met}`);
      console.log(`  厚度: ${product.thickness_met}`);
      if (product.bag_type) console.log(`  bag_type: ${product.bag_type}`);
    });
    
    // 8. 交叉验证筛选逻辑
    console.log('\n🔍 === 筛选逻辑验证 ===');
    
    // 验证Shape筛选
    console.log('🎯 Shape筛选验证:');
    ['Pillow', 'Bubble', 'Tube'].forEach(targetShape => {
      const filtered = items.filter(item => item.shape === targetShape);
      console.log(`  ${targetShape}: ${filtered.length}个产品`);
      if (filtered.length > 0) {
        const samples = filtered.slice(0, 2).map(item => `${item.id}(${item.name})`);
        console.log(`    样本: ${samples.join(', ')}`);
      }
    });
    
    // 验证Material筛选
    console.log('\n🧪 Material筛选验证:');
    ['HDPE', '50% HDPE', 'PAPE'].forEach(targetMaterial => {
      const filtered = items.filter(item => item.material === targetMaterial);
      console.log(`  ${targetMaterial}: ${filtered.length}个产品`);
      if (filtered.length > 0) {
        const samples = filtered.slice(0, 2).map(item => `${item.id}(${item.name})`);
        console.log(`    样本: ${samples.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ 数据分析失败:', error);
  }
}

// 运行分析
analyzeRealData(); 