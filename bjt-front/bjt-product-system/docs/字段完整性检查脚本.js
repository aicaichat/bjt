/**
 * 备件页面字段完整性检查脚本
 * 用于验证前端实现是否完整包含所有必需字段
 */

// 必需字段定义（根据三个文档的交集）
const REQUIRED_FIELDS = {
  // 筛选字段 
  filters: [
    'productType',      // 主机或配件
    'app_model',        // 适用机型
    'is_consumable'     // 是否易损
  ],
  
  // 列表显示字段
  listDisplay: [
    'app_model',        // 适配机型
    'image_url',        // 产品图片
    'part_number',      // 料号
    'name_zh',          // 名称(中文)
    'name_en',          // 名称(英文)  
    'spec',             // Spec.
    'spec_imperial',    // Spec.(英制)
    'id',               // productId ⚠️ 当前缺失
    'pcs_per_box'       // 单箱数量
  ],
  
  // Tooltip字段
  tooltip: [
    'app_sn',           // 适配序列号
    'package_size_cm',  // 包装尺寸 cm
    'package_size_inch',// 包装尺寸 inch
    'net_weight_kg',    // 单件净重 kg
    'net_weight_lbs'    // 单件净重 lbs
  ],
  
  // 购物车字段
  cart: [
    'app_model',        // 适配机型
    'image_url',        // 产品图片
    'part_number',      // 料号
    'name_zh',          // 名称
    'name_en',          // 名称
    'spec',             // Spec.
    'app_sn',           // 适配序列号
    'package_size_cm',  // 包装尺寸 cm
    'package_size_inch',// 包装尺寸 inch
    'net_weight_kg',    // 单件净重 kg
    'net_weight_lbs',   // 单件净重 lbs
    'pcs_per_box'       // 单箱数量
  ]
};

// 数据类型验证规则
const FIELD_TYPES = {
  'id': 'number',
  'part_number': 'string',
  'name_zh': 'string',
  'name_en': 'string', 
  'spec': 'string',
  'spec_imperial': 'string',
  'app_model': 'string',
  'app_sn': 'string',
  'image_url': 'string',
  'package_size_cm': 'string',
  'package_size_inch': 'string',
  'net_weight_kg': 'number',
  'net_weight_lbs': 'number',
  'pcs_per_box': 'number',
  'is_consumable': 'number' // ⚠️ 必须是数字：1/2/3
};

// is_consumable值验证
const IS_CONSUMABLE_VALUES = [1, 2, 3]; // 1=易损, 2=非易损, 3=不展示

/**
 * 检查单个备件数据的字段完整性
 * @param {Object} sparePart - 备件数据对象
 * @param {string} context - 检查上下文 ('list'|'tooltip'|'cart')
 * @returns {Object} 检查结果
 */
function checkSparePartFields(sparePart, context = 'list') {
  const results = {
    missing: [],
    typeErrors: [],
    valueErrors: [],
    warnings: [],
    isValid: true
  };
  
  // 获取对应上下文的必需字段
  let requiredFields = [];
  switch(context) {
    case 'list':
      requiredFields = REQUIRED_FIELDS.listDisplay;
      break;
    case 'tooltip':
      requiredFields = REQUIRED_FIELDS.tooltip;
      break;
    case 'cart':
      requiredFields = REQUIRED_FIELDS.cart;
      break;
    default:
      requiredFields = REQUIRED_FIELDS.listDisplay;
  }
  
  // 检查字段是否存在
  requiredFields.forEach(field => {
    if (!(field in sparePart)) {
      results.missing.push(field);
      results.isValid = false;
    } else {
      // 检查数据类型
      const expectedType = FIELD_TYPES[field];
      const actualValue = sparePart[field];
      const actualType = typeof actualValue;
      
      if (expectedType && actualType !== expectedType && actualValue !== null) {
        results.typeErrors.push({
          field,
          expected: expectedType,
          actual: actualType,
          value: actualValue
        });
        results.isValid = false;
      }
      
      // 特殊值验证
      if (field === 'is_consumable') {
        if (!IS_CONSUMABLE_VALUES.includes(actualValue)) {
          results.valueErrors.push({
            field,
            value: actualValue,
            expected: IS_CONSUMABLE_VALUES
          });
          results.isValid = false;
        }
      }
      
      // 空值警告
      if (actualValue === null || actualValue === undefined || actualValue === '') {
        results.warnings.push(`${field} 为空值`);
      }
    }
  });
  
  return results;
}

/**
 * 检查前端组件是否渲染了所有必需字段
 * @param {string} context - 检查上下文
 * @returns {Object} 检查结果
 */
function checkFrontendRendering(context = 'list') {
  const results = {
    rendered: [],
    missing: [],
    isValid: true
  };
  
  let requiredFields = [];
  let containerSelector = '';
  
  switch(context) {
    case 'list':
      requiredFields = REQUIRED_FIELDS.listDisplay;
      containerSelector = '.spare-parts-list-container';
      break;
    case 'tooltip':
      requiredFields = REQUIRED_FIELDS.tooltip;
      containerSelector = '.custom-tooltip';
      break;
    case 'cart':
      requiredFields = REQUIRED_FIELDS.cart;
      containerSelector = '.cart-modal-content';
      break;
  }
  
  const container = document.querySelector(containerSelector);
  if (!container) {
    results.missing.push(`容器未找到: ${containerSelector}`);
    results.isValid = false;
    return results;
  }
  
  // 检查每个必需字段是否有对应的DOM元素
  requiredFields.forEach(field => {
    // 查找包含字段数据的元素（可能需要调整选择器）
    const fieldElement = container.querySelector(`[data-field="${field}"]`) ||
                        container.querySelector(`.${field}`) ||
                        container.querySelector(`[class*="${field}"]`);
    
    if (fieldElement) {
      results.rendered.push(field);
    } else {
      results.missing.push(field);
      results.isValid = false;
    }
  });
  
  return results;
}

/**
 * 检查筛选器字段
 * @returns {Object} 检查结果
 */
function checkFilterFields() {
  const results = {
    implemented: [],
    missing: [],
    isValid: true
  };
  
  // 检查产品类型筛选
  const productTypeButtons = document.querySelectorAll('[data-product-type]');
  if (productTypeButtons.length > 0) {
    results.implemented.push('productType');
  } else {
    results.missing.push('productType');
    results.isValid = false;
  }
  
  // 检查适用机型筛选
  const modelSelect = document.querySelector('select[name="model"]') ||
                     document.querySelector('#model-select');
  if (modelSelect) {
    results.implemented.push('app_model');
  } else {
    results.missing.push('app_model');
    results.isValid = false;
  }
  
  // 检查易损类型筛选
  const consumableButtons = document.querySelectorAll('[data-consumable-type]');
  if (consumableButtons.length > 0) {
    results.implemented.push('is_consumable');
  } else {
    results.missing.push('is_consumable');
    results.isValid = false;
  }
  
  return results;
}

/**
 * 生成完整性检查报告
 * @param {Array} sparePartsData - 备件数据数组
 * @returns {Object} 完整检查报告
 */
function generateComplianceReport(sparePartsData = []) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      warnings: 0
    },
    filters: checkFilterFields(),
    dataCompliance: [],
    renderingCompliance: {
      list: checkFrontendRendering('list'),
      tooltip: checkFrontendRendering('tooltip'),
      cart: checkFrontendRendering('cart')
    }
  };
  
  // 检查数据合规性
  sparePartsData.forEach((part, index) => {
    const listCheck = checkSparePartFields(part, 'list');
    const tooltipCheck = checkSparePartFields(part, 'tooltip');
    const cartCheck = checkSparePartFields(part, 'cart');
    
    report.dataCompliance.push({
      index,
      partNumber: part.part_number || `未知-${index}`,
      list: listCheck,
      tooltip: tooltipCheck,
      cart: cartCheck
    });
    
    // 统计问题
    [listCheck, tooltipCheck, cartCheck].forEach(check => {
      report.summary.totalIssues += check.missing.length + check.typeErrors.length + check.valueErrors.length;
      report.summary.criticalIssues += check.missing.length + check.typeErrors.length + check.valueErrors.length;
      report.summary.warnings += check.warnings.length;
    });
  });
  
  return report;
}

/**
 * 打印检查报告
 * @param {Object} report - 检查报告
 */
function printReport(report) {
  console.log('🔍 备件页面字段完整性检查报告');
  console.log('=' .repeat(50));
  console.log(`检查时间: ${report.timestamp}`);
  console.log(`总问题数: ${report.summary.totalIssues}`);
  console.log(`关键问题: ${report.summary.criticalIssues}`);
  console.log(`警告数量: ${report.summary.warnings}`);
  
  // 筛选器检查结果
  console.log('\n📋 筛选器字段检查:');
  console.log(`已实现: ${report.filters.implemented.join(', ')}`);
  if (report.filters.missing.length > 0) {
    console.log(`❌ 缺失: ${report.filters.missing.join(', ')}`);
  }
  
  // 渲染检查结果
  ['list', 'tooltip', 'cart'].forEach(context => {
    const contextName = {list: '列表', tooltip: 'Tooltip', cart: '购物车'}[context];
    const result = report.renderingCompliance[context];
    console.log(`\n🎨 ${contextName}渲染检查:`);
    console.log(`已渲染: ${result.rendered.join(', ')}`);
    if (result.missing.length > 0) {
      console.log(`❌ 缺失: ${result.missing.join(', ')}`);
    }
  });
  
  // 数据合规性检查
  console.log('\n📊 数据合规性检查:');
  report.dataCompliance.forEach(item => {
    const hasIssues = !item.list.isValid || !item.tooltip.isValid || !item.cart.isValid;
    if (hasIssues) {
      console.log(`❌ ${item.partNumber}:`);
      ['list', 'tooltip', 'cart'].forEach(context => {
        const check = item[context];
        if (!check.isValid) {
          if (check.missing.length > 0) {
            console.log(`  ${context} 缺失字段: ${check.missing.join(', ')}`);
          }
          if (check.typeErrors.length > 0) {
            console.log(`  ${context} 类型错误:`, check.typeErrors);
          }
          if (check.valueErrors.length > 0) {
            console.log(`  ${context} 值错误:`, check.valueErrors);
          }
        }
      });
    }
  });
}

// 导出检查函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkSparePartFields,
    checkFrontendRendering,
    checkFilterFields,
    generateComplianceReport,
    printReport,
    REQUIRED_FIELDS,
    FIELD_TYPES
  };
}

// 浏览器环境下自动执行检查
if (typeof window !== 'undefined') {
  // 等待页面加载完成后执行检查
  window.addEventListener('load', () => {
    setTimeout(() => {
      // 尝试获取页面上的备件数据进行检查
      const sparePartsData = window.sparePartsData || [];
      const report = generateComplianceReport(sparePartsData);
      printReport(report);
      
      // 将报告添加到全局对象，方便调试
      window.fieldComplianceReport = report;
    }, 1000);
  });
} 