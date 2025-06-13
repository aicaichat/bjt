// 单位制智能切换验证脚本
console.log('🔄 开始验证单位制智能切换功能...');

const validateUnitSystemSwitching = () => {
  const tests = [
    {
      name: '认证系统集成验证',
      test: () => {
        // 检查useAuth是否可用
        const authAvailable = typeof window.useAuth === 'function' || 
                             document.querySelector('[data-auth-context]') ||
                             document.querySelector('.unit-system-toggle');
        
        console.log(`认证系统可用: ${authAvailable ? '是' : '否'}`);
        return authAvailable;
      }
    },
    
    {
      name: '单位制切换组件存在性',
      test: () => {
        const toggleExists = document.querySelector('.unit-system-toggle');
        const switchExists = document.querySelector('.unit-system-switch');
        
        console.log(`切换组件存在: ${toggleExists ? '是' : '否'}`);
        console.log(`开关组件存在: ${switchExists ? '是' : '否'}`);
        
        return toggleExists && switchExists;
      }
    },
    
    {
      name: '智能字段值组件',
      test: () => {
        const smartFields = document.querySelectorAll('.smart-field-value');
        const fieldCount = smartFields.length;
        
        console.log(`智能字段数量: ${fieldCount}`);
        
        // 检查字段是否有data-field属性
        let fieldsWithData = 0;
        smartFields.forEach(field => {
          if (field.getAttribute('data-field')) {
            fieldsWithData++;
          }
        });
        
        console.log(`带数据属性的字段: ${fieldsWithData}/${fieldCount}`);
        
        return fieldCount > 0 && fieldsWithData > 0;
      }
    },
    
    {
      name: '实时切换响应',
      test: () => {
        return new Promise((resolve) => {
          // 获取切换前的字段状态
          const beforeSwitch = Array.from(document.querySelectorAll('[data-field]')).map(el => ({
            element: el,
            field: el.getAttribute('data-field'),
            value: el.textContent
          }));
          
          console.log(`切换前字段状态:`, beforeSwitch.map(item => `${item.field}: ${item.value}`));
          
          // 模拟切换单位制
          const toggleButton = document.querySelector('.unit-system-switch input') || 
                              document.querySelector('.ant-switch');
          
          if (toggleButton) {
            // 触发切换
            toggleButton.click();
            
            // 等待状态更新
            setTimeout(() => {
              const afterSwitch = Array.from(document.querySelectorAll('[data-field]')).map(el => ({
                element: el,
                field: el.getAttribute('data-field'),
                value: el.textContent
              }));
              
              console.log(`切换后字段状态:`, afterSwitch.map(item => `${item.field}: ${item.value}`));
              
              // 检查是否有字段发生变化
              let hasChanged = false;
              beforeSwitch.forEach((before, index) => {
                const after = afterSwitch[index];
                if (after && (before.field !== after.field || before.value !== after.value)) {
                  hasChanged = true;
                  console.log(`字段变化: ${before.field}(${before.value}) -> ${after.field}(${after.value})`);
                }
              });
              
              console.log(`切换响应: ${hasChanged ? '正常' : '异常'}`);
              resolve(hasChanged);
            }, 500);
          } else {
            console.log('未找到切换按钮');
            resolve(false);
          }
        });
      }
    },
    
    {
      name: '字段映射正确性',
      test: () => {
        const smartFields = document.querySelectorAll('.smart-field-value[data-field]');
        let correctMappings = 0;
        let totalMappings = 0;
        
        smartFields.forEach(field => {
          const fieldName = field.getAttribute('data-field');
          totalMappings++;
          
          // 检查字段名是否符合预期格式
          if (fieldName && (
            fieldName.includes('_kg') || fieldName.includes('_lbs') ||
            fieldName.includes('_cm') || fieldName.includes('_inch') ||
            fieldName.includes('_m') || fieldName.includes('_ft') ||
            fieldName.includes('_um') || fieldName.includes('_mil') ||
            fieldName === 'voltage' || fieldName === 'frequency' ||
            fieldName === 'spec' || fieldName === 'spec_imperial'
          )) {
            correctMappings++;
          }
        });
        
        console.log(`字段映射正确性: ${correctMappings}/${totalMappings}`);
        return totalMappings > 0 && (correctMappings / totalMappings) >= 0.8;
      }
    },
    
    {
      name: '单位显示功能',
      test: () => {
        const smartFields = document.querySelectorAll('.smart-field-value');
        let fieldsWithUnits = 0;
        let totalFields = 0;
        
        smartFields.forEach(field => {
          const text = field.textContent || '';
          const fieldName = field.getAttribute('data-field') || '';
          totalFields++;
          
          // 检查是否包含预期的单位
          if (
            text.includes('kg') || text.includes('lbs') ||
            text.includes('cm') || text.includes('inch') ||
            text.includes('m') || text.includes('ft') ||
            text.includes('μm') || text.includes('mil') ||
            text.includes('V') || text.includes('Hz') ||
            fieldName === 'spec' || fieldName === 'spec_imperial'  // 规格字段可能不包含单位
          ) {
            fieldsWithUnits++;
          }
        });
        
        console.log(`单位显示: ${fieldsWithUnits}/${totalFields} 字段包含单位`);
        
        // 检查具体的单位显示
        const examples = [];
        smartFields.forEach(field => {
          const text = field.textContent || '';
          const fieldName = field.getAttribute('data-field') || '';
          if (text && fieldName) {
            examples.push(`${fieldName}: "${text}"`);
          }
        });
        
        console.log('单位显示示例:', examples.slice(0, 5));
        
        return totalFields > 0 && (fieldsWithUnits / totalFields) >= 0.6;
      }
    },
    
    {
      name: '临时设置存储',
      test: () => {
        // 检查sessionStorage中的临时设置
        const tempSetting = sessionStorage.getItem('temp_unit_override');
        const hasTemporaryOverride = !!tempSetting;
        
        // 检查UI中的临时设置指示器
        const indicator = document.querySelector('.unit-system-toggle .text-blue-500');
        const showsOverrideIndicator = !!indicator;
        
        console.log(`临时设置存储: ${tempSetting || '无'}`);
        console.log(`显示覆盖指示器: ${showsOverrideIndicator ? '是' : '否'}`);
        
        return hasTemporaryOverride === showsOverrideIndicator;
      }
    },
    
    {
      name: '购物车页面集成',
      test: () => {
        // 检查购物车页面是否有单位制切换
        const isCartPage = window.location.pathname.includes('/cart');
        if (!isCartPage) {
          console.log('非购物车页面，跳过此测试');
          return true;
        }
        
        const cartToggle = document.querySelector('.cart-item-properties .smart-field-value') ||
                          document.querySelector('.required-part-cart-item .smart-field-value');
        
        console.log(`购物车页面集成: ${cartToggle ? '已集成' : '未集成'}`);
        return !!cartToggle;
      }
    }
  ];
  
  let passedTests = 0;
  const results = [];
  
  // 执行同步测试
  const syncTests = tests.filter(test => test.name !== '实时切换响应');
  syncTests.forEach((test, index) => {
    try {
      const result = test.test();
      const status = result ? '✅ 通过' : '❌ 失败';
      console.log(`${status} ${test.name}`);
      results.push({ name: test.name, passed: result });
      if (result) passedTests++;
    } catch (error) {
      console.error(`❌ ${test.name} - 测试异常:`, error);
      results.push({ name: test.name, passed: false, error });
    }
  });
  
  // 执行异步测试
  const asyncTest = tests.find(test => test.name === '实时切换响应');
  if (asyncTest) {
    asyncTest.test().then(result => {
      const status = result ? '✅ 通过' : '❌ 失败';
      console.log(`${status} ${asyncTest.name}`);
      results.push({ name: asyncTest.name, passed: result });
      if (result) passedTests++;
      
      // 输出最终结果
      const totalTests = tests.length;
      const successRate = (passedTests / totalTests) * 100;
      console.log(`\n📊 单位制切换验证结果: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
      
      // 详细结果
      console.table(results);
      
      if (successRate >= 80) {
        console.log('🎉 单位制智能切换功能验证通过！');
      } else {
        console.warn('⚠️ 单位制智能切换功能需要改进');
      }
      
      return successRate >= 80;
    }).catch(error => {
      console.error('异步测试执行失败:', error);
    });
  } else {
    // 输出同步测试结果
    const totalTests = syncTests.length;
    const successRate = (passedTests / totalTests) * 100;
    console.log(`\n📊 单位制切换验证结果: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
    
    // 详细结果
    console.table(results);
    
    if (successRate >= 80) {
      console.log('🎉 单位制智能切换功能验证通过！');
    } else {
      console.warn('⚠️ 单位制智能切换功能需要改进');
    }
    
    return successRate >= 80;
  }
};

// 页面加载完成后自动运行验证
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(validateUnitSystemSwitching, 1000);
  });
} else {
  setTimeout(validateUnitSystemSwitching, 1000);
}

// 导出验证函数供手动调用
window.validateUnitSystemSwitching = validateUnitSystemSwitching; 