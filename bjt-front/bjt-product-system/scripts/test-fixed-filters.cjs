const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testFixedFilters() {
  console.log('🧪 测试修复后的筛选逻辑...');
  
  try {
    // 获取数据
    const { stdout } = await execAsync('curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?page=1&per_page=1000"');
    const data = JSON.parse(stdout);
    const items = data.data?.items || [];
    
    console.log(`📊 总数据: ${items.length} 个产品\n`);
    
    // 工具函数
    const normalize = (v) => (v ?? '').toString().toLowerCase().replace(/\s+/g, '').replace(/%/g, '');
    const extractNumber = (value) => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === 'number') return value;
      const numValue = parseFloat(String(value));
      return isNaN(numValue) ? undefined : numValue;
    };
    
    // 测试用例
    const testCases = [
      {
        name: 'Shape筛选测试',
        tests: [
          { field: 'shape', value: 'Bubble', expected: 21 },
          { field: 'shape', value: 'Pillow', expected: 15 },
          { field: 'shape', value: 'Tube', expected: 5 },
          { field: 'shape', value: 'Precut Air Pillow', expected: 5 },
          { field: 'shape', value: 'paper air Pillow', expected: 1 },
          { field: 'shape', value: 'paper Bubble', expected: 1 }
        ]
      },
      {
        name: 'Material筛选测试',
        tests: [
          { field: 'material', value: 'HDPE', expected: 17 },
          { field: 'material', value: '50% HDPE', expected: 13 },
          { field: 'material', value: 'PAPE', expected: 11 },
          { field: 'material', value: 'PAPER', expected: 2 },
          { field: 'material', value: '30% HDPE', expected: 2 },
          { field: 'material', value: 'LDPE', expected: 2 }
        ]
      },
      {
        name: 'App_Model筛选测试',
        tests: [
          { field: 'app_model', value: 'LA-E4S V2.0', expected: 40 },
          { field: 'app_model', value: 'LA-E4C', expected: 37 },
          { field: 'app_model', value: 'LA-F2', expected: 14 },
          { field: 'app_model', value: 'LA-E5P', expected: 5 },
          { field: 'app_model', value: 'LA-E4S(paper)', expected: 2 }
        ]
      }
    ];
    
    // 执行测试
    let totalTests = 0;
    let passedTests = 0;
    
    for (const testSuite of testCases) {
      console.log(`🔍 === ${testSuite.name} ===`);
      
      for (const test of testSuite.tests) {
        totalTests++;
        let actual = 0;
        
        if (test.field === 'shape') {
          actual = items.filter(item => normalize(item.shape) === normalize(test.value)).length;
        } else if (test.field === 'material') {
          actual = items.filter(item => normalize(item.material) === normalize(test.value)).length;
        } else if (test.field === 'app_model') {
          actual = items.filter(item => {
            const appModels = (item.app_model || '').split(',').map(m => m.trim().replace(/^[\"']|[\"']$/g, ''));
            return appModels.some(m => normalize(m) === normalize(test.value));
          }).length;
        }
        
        const passed = actual === test.expected;
        passedTests += passed ? 1 : 0;
        
        console.log(`  ${test.value}: ${passed ? '✅' : '❌'} 期望${test.expected}, 实际${actual}`);
        
        if (!passed) {
          // 显示不匹配的原因
          if (test.field === 'shape') {
            const unique = [...new Set(items.map(item => item.shape))].sort();
            console.log(`    可用形状: ${unique.join(', ')}`);
          } else if (test.field === 'material') {
            const unique = [...new Set(items.map(item => item.material))].sort();
            console.log(`    可用材质: ${unique.join(', ')}`);
          }
        }
      }
      console.log('');
    }
    
    // 测试结果汇总
    console.log(`📊 === 测试结果汇总 ===`);
    console.log(`总测试: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${totalTests - passedTests}`);
    console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有测试通过！筛选逻辑修复成功！');
    } else {
      console.log('⚠️ 仍有测试失败，需要继续调试');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFixedFilters(); 