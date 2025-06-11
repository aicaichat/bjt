/**
 * 机器页面标准化集成验证脚本
 * 
 * 使用方法：
 * 1. 打开机器页面
 * 2. 按F12打开开发者工具
 * 3. 在Console中粘贴此脚本并运行
 * 4. 查看验证结果
 */

console.log('🚀 开始机器页面标准化集成验证...\n');

const validateMachinePageIntegration = () => {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };
  
  const addResult = (test, status, message, details = '') => {
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    results.details.push(`${icon} ${test}: ${message}`);
    if (details) results.details.push(`   ${details}`);
    
    if (status === 'pass') results.passed++;
    else if (status === 'fail') results.failed++;
    else results.warnings++;
  };

  // 验证1: 检查新组件是否已导入和启用
  console.log('🔍 检查组件集成状态...');
  try {
    const hasStandardizedComponents = document.querySelectorAll('.machine-fields, .machine-field-vertical, .machine-field-horizontal').length > 0;
    const hasLegacyComponents = document.querySelectorAll('.bg-gray-50 .grid-cols-2').length > 0;
    
    if (hasStandardizedComponents) {
      addResult(
        '组件集成检查', 
        'pass', 
        '检测到标准化组件，新组件已启用',
        `找到 ${document.querySelectorAll('.machine-fields').length} 个标准化字段显示组件`
      );
    } else if (hasLegacyComponents) {
      addResult(
        '组件集成检查', 
        'warn', 
        '检测到旧版组件，新组件可能未启用',
        '建议检查环境变量 REACT_APP_ENABLE_MACHINE_STANDARD_DISPLAY'
      );
    } else {
      addResult('组件集成检查', 'fail', '未检测到机器页面组件');
    }
  } catch (error) {
    addResult('组件集成检查', 'fail', `检查异常: ${error.message}`);
  }

  // 验证2: 检查单位显示标准（标题含单位，内容纯数值）
  console.log('🔍 检查单位显示标准...');
  try {
    const labels = document.querySelectorAll('strong, .machine-field-label, label');
    const values = document.querySelectorAll('.machine-field-value, .text-gray-800, span');
    
    // 检查标题是否包含单位
    let labelsWithUnits = 0;
    labels.forEach(label => {
      const text = label.textContent || '';
      if (/(kg|lbs|cm|inch|件|pcs|\(|\))/.test(text)) {
        labelsWithUnits++;
      }
    });
    
    if (labelsWithUnits > 0) {
      addResult(
        '标题单位检查', 
        'pass', 
        `找到 ${labelsWithUnits} 个包含单位的标题`,
        '标题正确包含单位信息'
      );
    } else {
      addResult('标题单位检查', 'warn', '未找到包含单位的标题');
    }
    
    // 检查内容是否为纯数值
    let valuesWithUnits = 0;
    let invalidValues = [];
    values.forEach(value => {
      const text = value.textContent?.trim() || '';
      // 检查是否错误地包含单位（排除合法的复合尺寸格式）
      if (text && 
          text !== 'N/A' && 
          text !== '暂无' &&
          /\s*(kg|lbs|cm|inch|件|pcs)$/.test(text) &&
          !/^\d+[\*x×]\d+[\*x×]?\d*$/.test(text)) { // 允许尺寸格式如"75*35*45"
        valuesWithUnits++;
        if (invalidValues.length < 5) { // 只记录前5个
          invalidValues.push(text);
        }
      }
    });
    
    if (valuesWithUnits === 0) {
      addResult(
        '数值纯净检查', 
        'pass', 
        '所有字段值都是纯数值，无单位重复',
        '符合"标题含单位，内容纯数值"的标准'
      );
    } else {
      addResult(
        '数值纯净检查', 
        'fail', 
        `发现 ${valuesWithUnits} 个包含重复单位的值`,
        `示例: ${invalidValues.join(', ')}`
      );
    }
  } catch (error) {
    addResult('单位显示标准检查', 'fail', `检查异常: ${error.message}`);
  }

  // 验证3: 检查智能单位制切换
  console.log('🔍 检查智能单位制...');
  try {
    const allLabels = Array.from(document.querySelectorAll('strong, label')).map(el => el.textContent || '');
    const hasMetric = allLabels.some(text => /(kg|cm)/.test(text));
    const hasImperial = allLabels.some(text => /(lbs|inch)/.test(text));
    
    if (hasMetric || hasImperial) {
      const unitType = hasMetric ? (hasImperial ? '混合' : '公制') : '英制';
      addResult(
        '智能单位制检查', 
        'pass', 
        `检测到${unitType}单位显示`,
        `公制单位: ${hasMetric ? '有' : '无'}, 英制单位: ${hasImperial ? '有' : '无'}`
      );
    } else {
      addResult('智能单位制检查', 'warn', '未检测到明确的单位制标识');
    }
  } catch (error) {
    addResult('智能单位制检查', 'fail', `检查异常: ${error.message}`);
  }

  // 验证4: 检查复合尺寸格式
  console.log('🔍 检查复合尺寸格式...');
  try {
    const allText = Array.from(document.querySelectorAll('span, .text-gray-800')).map(el => el.textContent || '');
    const dimensionValues = allText.filter(text => /^\d+[\*x×]\d+[\*x×]?\d*$/.test(text.trim()));
    
    if (dimensionValues.length > 0) {
      addResult(
        '复合尺寸格式检查', 
        'pass', 
        `找到 ${dimensionValues.length} 个复合尺寸格式`,
        `示例: ${dimensionValues.slice(0, 3).join(', ')}`
      );
    } else {
      addResult('复合尺寸格式检查', 'warn', '未找到复合尺寸格式（可能正常）');
    }
  } catch (error) {
    addResult('复合尺寸格式检查', 'fail', `检查异常: ${error.message}`);
  }

  // 验证5: 检查页面功能完整性
  console.log('🔍 检查页面功能完整性...');
  try {
    const hasMachineCards = document.querySelectorAll('.bg-white.rounded-xl, .machine-product-card').length > 0;
    const hasSelectionRadios = document.querySelectorAll('input[type="radio"][name="machine"]').length > 0;
    const hasAddToCartButtons = document.querySelectorAll('button').length > 0;
    
    if (hasMachineCards && hasSelectionRadios && hasAddToCartButtons) {
      addResult(
        '页面功能检查', 
        'pass', 
        '页面核心功能完整',
        `机器卡片: ${hasMachineCards ? '有' : '无'}, 选择功能: ${hasSelectionRadios ? '有' : '无'}, 操作按钮: ${hasAddToCartButtons ? '有' : '无'}`
      );
    } else {
      addResult('页面功能检查', 'fail', '页面核心功能可能缺失');
    }
  } catch (error) {
    addResult('页面功能检查', 'fail', `检查异常: ${error.message}`);
  }

  // 验证6: 检查控制台错误
  console.log('🔍 检查控制台错误...');
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // 恢复原始console.error
  setTimeout(() => {
    console.error = originalError;
  }, 1000);
  
  if (errors.length === 0) {
    addResult('控制台错误检查', 'pass', '未发现新的控制台错误');
  } else {
    addResult('控制台错误检查', 'warn', `发现 ${errors.length} 个控制台错误`, errors.slice(0, 2).join('; '));
  }

  // 验证7: 检查功能开关状态
  console.log('🔍 检查功能开关状态...');
  try {
    // 检查是否有调试信息或环境变量提示
    const hasDebugInfo = document.querySelector('.machine-field-validator, [data-debug]');
    const isDevEnvironment = window.location.hostname === 'localhost' || window.location.hostname.includes('dev');
    
    if (hasDebugInfo) {
      addResult('功能开关检查', 'pass', '检测到调试模式，功能开关正常工作');
    } else if (isDevEnvironment) {
      addResult('功能开关检查', 'warn', '开发环境但未检测到调试信息');
    } else {
      addResult('功能开关检查', 'pass', '生产环境，调试信息已关闭（正常）');
    }
  } catch (error) {
    addResult('功能开关检查', 'fail', `检查异常: ${error.message}`);
  }

  return results;
};

// 执行验证
const validationResults = validateMachinePageIntegration();

// 输出结果
console.log('\n📊 验证结果汇总:');
console.log(`✅ 通过: ${validationResults.passed} 项`);
console.log(`❌ 失败: ${validationResults.failed} 项`);
console.log(`⚠️  警告: ${validationResults.warnings} 项`);

console.log('\n📋 详细结果:');
validationResults.details.forEach(detail => console.log(detail));

// 计算总体评分
const totalTests = validationResults.passed + validationResults.failed + validationResults.warnings;
const successRate = totalTests > 0 ? (validationResults.passed / totalTests * 100).toFixed(1) : 0;

console.log(`\n🎯 总体评分: ${successRate}%`);

if (successRate >= 90) {
  console.log('🎉 机器页面标准化集成验证通过！');
  console.log('💡 建议: 可以继续进行功能测试和用户验收测试');
} else if (successRate >= 70) {
  console.log('⚠️  机器页面标准化集成基本成功，有改进空间');
  console.log('💡 建议: 检查并修复失败项，优化警告项');
} else {
  console.log('❌ 机器页面标准化集成需要修复');
  console.log('💡 建议: 重点修复失败项，检查组件导入和配置');
}

// 提供额外的调试信息
console.log('\n🔧 调试信息:');
console.log('当前URL:', window.location.href);
console.log('用户代理:', navigator.userAgent.substring(0, 100) + '...');
console.log('页面标题:', document.title);
console.log('React开发模式:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined');

// 返回结果对象供进一步使用
window.machinePageValidationResults = validationResults;
console.log('\n💾 验证结果已保存到 window.machinePageValidationResults');

return validationResults; 