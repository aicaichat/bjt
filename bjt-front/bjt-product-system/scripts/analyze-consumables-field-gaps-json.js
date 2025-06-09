import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 耗材页面场景定义 - 基于JSON标准
const CONSUMABLES_SCENARIOS = {
  '筛选项': {
    description: '页面顶部的筛选控件区域',
    // 基于商品列表字段推导出的筛选维度
    expectedFields: ['适用机型', '形状', '材质', '厚度/克重', '膜宽', '袋长', '泡径'],
    frontendPatterns: [
      /filter.*Model/i,
      /filter.*Shape/i, 
      /filter.*Material/i,
      /filter.*Thickness/i,
      /filter.*Width/i,
      /filter.*Length/i,
      /filter.*Bubble/i,
      /selectedModel/i,
      /selectedShape/i,
      /selectedMaterial/i
    ]
  },
  '商品列表': {
    description: '耗材产品列表展示区域',
    expectedFields: [], // 将从JSON文件动态加载
    frontendPatterns: [
      /item\.app_model/i,
      /item\.shape/i,
      /item\.image_url/i,
      /item\.part_number/i,
      /item\.model/i,
      /item\.spec/i,
      /item\.bubble_diameter/i,
      /item\.pcs_per_box/i,
      /product\..*model/i,
      /consumable\..*model/i
    ]
  },
  '购物车': {
    description: '购物车页面字段显示',
    expectedFields: [], // 将从JSON文件动态加载
    frontendPatterns: [
      /cart.*item\./i,
      /cartItem\./i,
      /addToCart/i,
      /cartQuantity/i,
      /cart.*model/i,
      /cart.*spec/i,
      /cart.*part_number/i
    ]
  },
  'tooltip': {
    description: '详细信息弹窗显示',
    expectedFields: [], // 将从JSON文件动态加载
    frontendPatterns: [
      /tooltip/i,
      /detail.*modal/i,
      /info.*popup/i,
      /material/i,
      /thickness/i,
      /width/i,
      /length/i,
      /package.*size/i,
      /net.*weight/i,
      /pallet/i
    ]
  },
  'PO页': {
    description: 'PO页面字段显示',
    expectedFields: [], // 将从JSON文件动态加载
    frontendPatterns: [
      /po.*item/i,
      /order.*item/i,
      /purchase.*order/i
    ]
  }
};

// 加载JSON标准字段定义
function loadJsonStandardFields() {
  console.log('📋 加载JSON标准字段定义...');
  
  const jsonPath = path.resolve(__dirname, '../output/all-pages-display-fields.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ JSON标准文件不存在:', jsonPath);
    return null;
  }
  
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  if (!jsonData['耗材页面']) {
    console.error('❌ JSON文件中未找到耗材页面定义');
    return null;
  }
  
  const consumablesFields = jsonData['耗材页面'];
  
  // 更新场景定义中的预期字段
  CONSUMABLES_SCENARIOS['商品列表'].expectedFields = consumablesFields['商品列表'] || [];
  CONSUMABLES_SCENARIOS['购物车'].expectedFields = consumablesFields['购物车'] || [];
  CONSUMABLES_SCENARIOS['tooltip'].expectedFields = consumablesFields['tooltip'] || [];
  CONSUMABLES_SCENARIOS['PO页'].expectedFields = consumablesFields['PO页'] || [];
  
  console.log('✅ JSON标准字段加载完成:');
  console.log(`  商品列表: ${CONSUMABLES_SCENARIOS['商品列表'].expectedFields.length} 个字段`);
  console.log(`  购物车: ${CONSUMABLES_SCENARIOS['购物车'].expectedFields.length} 个字段`);
  console.log(`  tooltip: ${CONSUMABLES_SCENARIOS['tooltip'].expectedFields.length} 个字段`);
  console.log(`  PO页: ${CONSUMABLES_SCENARIOS['PO页'].expectedFields.length} 个字段`);
  
  return consumablesFields;
}

// 从前端文件中提取字段的更精确模式
const DETAILED_FIELD_PATTERNS = [
  // 直接字段引用
  /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
  /item\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
  /product\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
  /consumable\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
  
  // 表格列定义
  /dataIndex:\s*['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]/g,
  /key:\s*['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]/g,
  
  // 筛选器字段
  /filter([A-Z][a-zA-Z]*)/g,
  /selected([A-Z][a-zA-Z]*)/g,
  
  // API响应字段
  /data\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
  /response\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
  
  // 中文字段名（直接匹配）
  /'(适用机型|形状|材质|厚度|膜宽|袋长|总长|包装方式|包装尺寸|净重|毛重|托盘尺寸|泡径|料号|型号|规格|品牌|单箱数量)'/g,
  /"(适用机型|形状|材质|厚度|膜宽|袋长|总长|包装方式|包装尺寸|净重|毛重|托盘尺寸|泡径|料号|型号|规格|品牌|单箱数量)"/g
];

// 读取耗材页面前端代码
function extractConsumablesPageFields() {
  console.log('🔍 提取耗材页面前端字段...');
  
  const frontendPaths = [
    path.resolve(__dirname, '../frontend/src/pages/Consumables/index.tsx'),
    path.resolve(__dirname, '../frontend/src/pages/Cart/index.tsx'),
    path.resolve(__dirname, '../frontend/src/components/ProductCard'),
    path.resolve(__dirname, '../frontend/src/components/ProductDetail')
  ];
  
  let allContent = '';
  const existingFiles = [];
  
  frontendPaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).isDirectory()) {
        // 如果是目录，读取其中的所有文件
        try {
          const files = fs.readdirSync(filePath);
          files.forEach(file => {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
              const fullPath = path.join(filePath, file);
              allContent += fs.readFileSync(fullPath, 'utf8') + '\n';
              existingFiles.push(fullPath);
            }
          });
        } catch (err) {
          console.warn(`⚠️ 无法读取目录: ${filePath}`);
        }
      } else {
        allContent += fs.readFileSync(filePath, 'utf8') + '\n';
        existingFiles.push(filePath);
      }
    }
  });
  
  console.log(`📁 已读取 ${existingFiles.length} 个文件`);
  
  const fields = new Set();
  
  // 应用所有字段提取模式
  DETAILED_FIELD_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(allContent)) !== null) {
      const fieldName = match[1];
      if (fieldName && fieldName.length > 1 && !isCommonWord(fieldName)) {
        fields.add(fieldName);
      }
    }
  });
  
  console.log(`📊 从前端代码提取到 ${fields.size} 个字段`);
  return { fields: Array.from(fields).sort(), content: allContent, files: existingFiles };
}

// 检查是否为常见单词
function isCommonWord(word) {
  const commonWords = [
    'map', 'filter', 'length', 'push', 'pop', 'slice', 'join', 'toString',
    'key', 'value', 'index', 'name', 'type', 'data', 'state', 'props',
    'useState', 'useEffect', 'onClick', 'onChange', 'className', 'style',
    'loading', 'error', 'success', 'response', 'request', 'config', 'params',
    'return', 'function', 'const', 'let', 'var', 'import', 'export'
  ];
  
  return commonWords.includes(word.toLowerCase()) || 
         word.length < 2 || 
         /^[0-9]+$/.test(word) ||
         /^[A-Z_]+$/.test(word); // 常量名
}

// 分析特定场景的字段使用
function analyzeScenarioFields(content, scenario, scenarioConfig) {
  console.log(`\n🔍 分析场景: ${scenario}`);
  
  const foundFields = [];
  const missingFields = [];
  
  // 在代码中查找该场景相关的字段使用
  scenarioConfig.frontendPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      foundFields.push(...matches);
    }
  });
  
  // 检查预期字段是否在代码中出现
  scenarioConfig.expectedFields.forEach(expectedField => {
    // 尝试多种匹配方式
    const variations = [
      expectedField,
      expectedField.replace(/[()（）]/g, ''),
      expectedField.replace(/\s+/g, '_'),
      expectedField.replace(/\s+/g, ''),
      expectedField.toLowerCase(),
      expectedField.replace(/[\/\-]/g, '_'),
      // 英文映射
      getEnglishMapping(expectedField)
    ].filter(Boolean);
    
    let found = false;
    variations.forEach(variation => {
      if (content.includes(variation) || 
          content.includes(`"${variation}"`) || 
          content.includes(`'${variation}'`) ||
          content.includes(`\`${variation}\``)) {
        found = true;
      }
    });
    
    if (found) {
      foundFields.push(expectedField);
    } else {
      missingFields.push(expectedField);
    }
  });
  
  return {
    found: [...new Set(foundFields)],
    missing: missingFields,
    coverage: scenarioConfig.expectedFields.length > 0 ? 
      ((scenarioConfig.expectedFields.length - missingFields.length) / scenarioConfig.expectedFields.length * 100).toFixed(1) : '0.0'
  };
}

// 字段英文映射
function getEnglishMapping(chineseField) {
  const mappings = {
    '适用机型': 'app_model',
    '名称(英文)新增需求': 'name_en',
    '形状': 'shape',
    '产品图片袋型实物': 'product_image_url',
    '料号': 'part_number',
    '型号（公制）': 'model_metric',
    '型号(英制)': 'model_imperial',
    'Spec.': 'spec',
    'Spec.(英制)': 'spec_imperial',
    '泡径cm': 'bubble_diameter_cm',
    '泡径inch': 'bubble_diameter_inch',
    'productId': 'product_id',
    '单箱数量': 'pcs_per_box',
    '材质': 'material',
    '厚度/克重um/gsm': 'thickness_um',
    '厚度/克重mil/#': 'thickness_mil',
    '膜宽cm': 'width_cm',
    '膜宽inch': 'width_inch',
    '袋长cm': 'length_cm',
    '袋长inch': 'length_inch',
    '总长m': 'total_length_m',
    '总长ft': 'total_length_ft',
    '包装方式': 'package_type',
    '包装尺寸cm': 'package_size_cm',
    '包装尺寸inch': 'package_size_inch',
    '单件净重kg': 'net_weight_kg',
    '单件净重lbs': 'net_weight_lbs',
    '包装实物图片': 'package_image_url',
    '托盘尺寸cm': 'pallet_size_cm',
    '品牌': 'brand'
  };
  
  return mappings[chineseField];
}

// 字段映射分析
function analyzeFieldMapping(frontendFields, standardFields) {
  console.log('\n🔄 分析字段映射关系...');
  
  const mappingResults = {
    exactMatches: [],
    partialMatches: [],
    unmappedFrontend: [],
    unmappedStandard: []
  };
  
  // 标准化字段名用于比较
  const normalizeField = (field) => {
    return field.toLowerCase()
      .replace(/[_\-\s()（）]/g, '')
      .replace(/[\/\\]/g, '')
      .replace(/['"]/g, '');
  };
  
  // 将标准字段转换为便于匹配的格式
  const allStandardFields = [];
  Object.entries(standardFields).forEach(([scenario, fields]) => {
    fields.forEach(field => {
      allStandardFields.push({
        originalField: field,
        scenario,
        englishMapping: getEnglishMapping(field)
      });
    });
  });
  
  // 查找前端字段的映射
  frontendFields.forEach(frontendField => {
    const normalizedFrontend = normalizeField(frontendField);
    let bestMatch = null;
    let bestScore = 0;
    
    allStandardFields.forEach(standardField => {
      const variations = [
        standardField.originalField,
        standardField.englishMapping,
        normalizeField(standardField.originalField),
        normalizeField(standardField.englishMapping || '')
      ].filter(Boolean);
      
      variations.forEach(variation => {
        const normalizedStandard = normalizeField(variation);
        
        // 完全匹配
        if (normalizedFrontend === normalizedStandard) {
          bestMatch = { ...standardField, matchType: 'exact', score: 1.0, matchedVariation: variation };
          bestScore = 1.0;
          return;
        }
        
        // 包含匹配
        if (normalizedFrontend.includes(normalizedStandard) || normalizedStandard.includes(normalizedFrontend)) {
          const score = Math.min(normalizedFrontend.length, normalizedStandard.length) / 
                       Math.max(normalizedFrontend.length, normalizedStandard.length);
          if (score > bestScore && score >= 0.6) {
            bestMatch = { ...standardField, matchType: 'contains', score, matchedVariation: variation };
            bestScore = score;
          }
        }
      });
    });
    
    if (bestMatch) {
      if (bestMatch.score >= 0.9) {
        mappingResults.exactMatches.push({
          frontendField,
          standardField: bestMatch.originalField,
          englishMapping: bestMatch.englishMapping,
          scenario: bestMatch.scenario,
          matchType: bestMatch.matchType,
          score: bestMatch.score
        });
      } else {
        mappingResults.partialMatches.push({
          frontendField,
          standardField: bestMatch.originalField,
          englishMapping: bestMatch.englishMapping,
          scenario: bestMatch.scenario,
          matchType: bestMatch.matchType,
          score: bestMatch.score
        });
      }
    } else {
      mappingResults.unmappedFrontend.push(frontendField);
    }
  });
  
  // 查找未映射的标准字段
  const mappedStandardFields = new Set([
    ...mappingResults.exactMatches.map(m => m.standardField),
    ...mappingResults.partialMatches.map(m => m.standardField)
  ]);
  
  allStandardFields.forEach(field => {
    if (!mappedStandardFields.has(field.originalField)) {
      mappingResults.unmappedStandard.push(field);
    }
  });
  
  return mappingResults;
}

// 生成基于JSON标准的耗材页面字段差异报告
function generateJsonBasedFieldGapReport(frontendAnalysis, scenarioAnalysis, mappingAnalysis, standardFields) {
  console.log('\n📋 生成基于JSON标准的耗材页面字段差异报告...');
  
  const report = [];
  
  report.push('# 耗材页面字段使用情况差异分析报告（基于JSON标准）');
  report.push('');
  report.push(`生成时间: ${new Date().toISOString()}`);
  report.push(`数据来源: output/all-pages-display-fields.json`);
  report.push('');
  
  // 标准字段统计
  const totalStandardFields = Object.values(standardFields).reduce((sum, fields) => sum + fields.length, 0);
  const uniqueStandardFields = [...new Set(Object.values(standardFields).flat())];
  
  report.push('## 📋 总体概述');
  report.push('');
  report.push(`- **前端字段总数**: ${frontendAnalysis.fields.length}`);
  report.push(`- **JSON标准字段总数**: ${totalStandardFields} (去重后: ${uniqueStandardFields.length})`);
  report.push(`- **完全匹配**: ${mappingAnalysis.exactMatches.length}`);
  report.push(`- **部分匹配**: ${mappingAnalysis.partialMatches.length}`);
  report.push(`- **前端独有**: ${mappingAnalysis.unmappedFrontend.length}`);
  report.push(`- **标准未实现**: ${mappingAnalysis.unmappedStandard.length}`);
  report.push('');
  
  // JSON标准字段详情
  report.push('## 📊 JSON标准字段定义');
  report.push('');
  Object.entries(standardFields).forEach(([scenario, fields]) => {
    report.push(`### ${scenario} (${fields.length}个字段)`);
    report.push('');
    fields.forEach((field, index) => {
      const englishMapping = getEnglishMapping(field);
      report.push(`${index + 1}. **${field}** ${englishMapping ? `→ \`${englishMapping}\`` : ''}`);
    });
    report.push('');
  });
  
  // 场景分析概览
  report.push('## 🎯 各场景字段覆盖率');
  report.push('');
  report.push('| 场景 | JSON标准字段数 | 已实现 | 缺失 | 覆盖率 | 状态 |');
  report.push('|------|------------|--------|------|---------|------|');
  
  Object.entries(scenarioAnalysis).forEach(([scenario, analysis]) => {
    const expectedCount = CONSUMABLES_SCENARIOS[scenario].expectedFields.length;
    const foundCount = analysis.found.length;
    const missingCount = analysis.missing.length;
    const coverage = analysis.coverage;
    const status = parseFloat(coverage) >= 80 ? '✅ 良好' : 
                  parseFloat(coverage) >= 60 ? '⚠️ 一般' : '❌ 需要改进';
    
    report.push(`| ${scenario} | ${expectedCount} | ${foundCount} | ${missingCount} | ${coverage}% | ${status} |`);
  });
  report.push('');
  
  // 详细场景分析
  Object.entries(scenarioAnalysis).forEach(([scenario, analysis]) => {
    const config = CONSUMABLES_SCENARIOS[scenario];
    
    report.push(`## 📄 ${scenario} 详细分析`);
    report.push('');
    report.push(`**场景说明**: ${config.description}`);
    report.push(`**JSON标准要求**: ${config.expectedFields.length} 个字段`);
    report.push('');
    
    if (analysis.found.length > 0) {
      report.push('### ✅ 已实现字段');
      report.push('');
      analysis.found.forEach(field => {
        const englishMapping = getEnglishMapping(field);
        report.push(`- **${field}** ${englishMapping ? `(\`${englishMapping}\`)` : ''}`);
      });
      report.push('');
    }
    
    if (analysis.missing.length > 0) {
      report.push('### ❌ 缺失字段');
      report.push('');
      analysis.missing.forEach(field => {
        const englishMapping = getEnglishMapping(field);
        report.push(`- **${field}** ${englishMapping ? `→ 需要实现: \`${englishMapping}\`` : ''}`);
      });
      report.push('');
    }
    
    // 场景特定修复建议
    report.push('### 💡 修复建议');
    report.push('');
    
    switch (scenario) {
      case '筛选项':
        report.push('- 🔍 **筛选控件完整性**: 基于商品列表字段实现相应的筛选功能');
        report.push('- 🎛️ **智能单位制**: 根据用户地区智能显示公制/英制筛选项');
        report.push('- 📊 **筛选逻辑**: 实现前端筛选为主的策略，避免频繁API调用');
        break;
      case '商品列表':
        report.push('- 📋 **字段显示**: 按JSON标准实现所有13个必需字段');
        report.push('- 🖼️ **图片显示**: 确保产品图片和包装图片正确显示');
        report.push('- 🏷️ **规格信息**: 智能显示公制/英制规格，避免单位重复');
        break;
      case '购物车':
        report.push('- 🛒 **购物车字段**: 按JSON标准实现所有12个必需字段');
        report.push('- 📦 **数量信息**: 正确显示单箱数量等包装信息');
        report.push('- 🔢 **规格标识**: 确保型号、料号等关键标识完整显示');
        break;
      case 'tooltip':
        report.push('- 📝 **详细信息**: 按JSON标准实现所有34个详细信息字段');
        report.push('- 📏 **托盘配置**: 支持A/B/C三种托盘配置的动态显示');
        report.push('- 🎯 **条件显示**: 根据产品类型条件显示相关字段（如气泡类型显示泡径）');
        break;
      case 'PO页':
        report.push('- 📄 **PO字段**: 按JSON标准实现所有8个必需字段');
        report.push('- 🏢 **商务信息**: 确保品牌、规格等商务信息完整显示');
        break;
    }
    report.push('');
  });
  
  // 字段映射分析
  report.push('## 🔄 字段映射分析');
  report.push('');
  
  if (mappingAnalysis.exactMatches.length > 0) {
    report.push('### ✅ 完全匹配字段');
    report.push('');
    report.push('| 前端字段 | JSON标准字段 | 英文映射 | 场景 | 匹配类型 |');
    report.push('|----------|-------------|----------|------|----------|');
    
    mappingAnalysis.exactMatches.forEach(match => {
      report.push(`| \`${match.frontendField}\` | ${match.standardField} | \`${match.englishMapping || 'N/A'}\` | ${match.scenario} | ${match.matchType} |`);
    });
    report.push('');
  }
  
  if (mappingAnalysis.partialMatches.length > 0) {
    report.push('### ⚠️ 部分匹配字段');
    report.push('');
    report.push('| 前端字段 | JSON标准字段 | 英文映射 | 场景 | 匹配类型 | 分数 |');
    report.push('|----------|-------------|----------|------|----------|------|');
    
    mappingAnalysis.partialMatches.forEach(match => {
      report.push(`| \`${match.frontendField}\` | ${match.standardField} | \`${match.englishMapping || 'N/A'}\` | ${match.scenario} | ${match.matchType} | ${match.score.toFixed(2)} |`);
    });
    report.push('');
  }
  
  if (mappingAnalysis.unmappedStandard.length > 0) {
    report.push('### ❌ 未实现的JSON标准字段');
    report.push('');
    report.push('| JSON标准字段 | 英文映射 | 场景 | 优先级 |');
    report.push('|-------------|----------|------|---------|');
    
    // 按优先级分组
    const criticalFields = ['料号', '型号（公制）', '型号(英制)', 'Spec.', 'Spec.(英制)', '适用机型'];
    const importantFields = ['形状', '材质', '单箱数量', '品牌'];
    
    mappingAnalysis.unmappedStandard.forEach(field => {
      let priority = 'P2-增强';
      if (criticalFields.includes(field.originalField)) {
        priority = 'P0-关键';
      } else if (importantFields.includes(field.originalField)) {
        priority = 'P1-重要';
      }
      
      report.push(`| ${field.originalField} | \`${field.englishMapping || 'N/A'}\` | ${field.scenario} | ${priority} |`);
    });
    report.push('');
  }
  
  // 优先级修复计划
  report.push('## 🎯 基于JSON标准的修复计划');
  report.push('');
  
  const criticalFields = ['料号', '型号（公制）', '型号(英制)', 'Spec.', 'Spec.(英制)', '适用机型'];
  const importantFields = ['形状', '材质', '单箱数量', '品牌'];
  
  const missingCritical = mappingAnalysis.unmappedStandard.filter(field => 
    criticalFields.includes(field.originalField)
  );
  
  const missingImportant = mappingAnalysis.unmappedStandard.filter(field => 
    importantFields.includes(field.originalField)
  );
  
  const missingEnhancement = mappingAnalysis.unmappedStandard.filter(field => 
    !criticalFields.includes(field.originalField) && 
    !importantFields.includes(field.originalField)
  );
  
  report.push('### P0 - 关键字段（立即修复）');
  report.push('');
  if (missingCritical.length > 0) {
    missingCritical.forEach(field => {
      report.push(`- **${field.originalField}** (${field.scenario}) → 实现: \`${field.englishMapping || field.originalField}\``);
    });
  } else {
    report.push('- ✅ 所有关键字段已实现');
  }
  report.push('');
  
  report.push('### P1 - 重要字段（本周修复）');
  report.push('');
  if (missingImportant.length > 0) {
    missingImportant.forEach(field => {
      report.push(`- **${field.originalField}** (${field.scenario}) → 实现: \`${field.englishMapping || field.originalField}\``);
    });
  } else {
    report.push('- ✅ 所有重要字段已实现');
  }
  report.push('');
  
  report.push('### P2 - 增强字段（下周修复）');
  report.push('');
  missingEnhancement.slice(0, 10).forEach(field => {
    report.push(`- **${field.originalField}** (${field.scenario}) → 实现: \`${field.englishMapping || field.originalField}\``);
  });
  
  if (missingEnhancement.length > 10) {
    report.push(`- ... 还有 ${missingEnhancement.length - 10} 个增强字段`);
  }
  report.push('');
  
  // 代码修复示例
  report.push('## 💻 基于JSON标准的代码修复示例');
  report.push('');
  
  report.push('### 商品列表字段修复示例');
  report.push('');
  report.push('```typescript');
  report.push('// ✅ 基于JSON标准的13个必需字段');
  report.push('interface ConsumableListItem {');
  CONSUMABLES_SCENARIOS['商品列表'].expectedFields.forEach(field => {
    const englishMapping = getEnglishMapping(field);
    if (englishMapping) {
      report.push(`  ${englishMapping}: string;    // ${field}`);
    }
  });
  report.push('}');
  report.push('');
  report.push('const ConsumableCard = ({ item }: { item: ConsumableListItem }) => (');
  report.push('  <div className="consumable-card">');
  report.push('    <img src={item.product_image_url} alt={item.shape} />');
  report.push('    <h3>{item.app_model}</h3>');
  report.push('    <p>料号: {item.part_number}</p>');
  report.push('    <p>型号(公制): {item.model_metric}</p>');
  report.push('    <p>型号(英制): {item.model_imperial}</p>');
  report.push('    <p>规格: {item.spec}</p>');
  report.push('    <p>规格(英制): {item.spec_imperial}</p>');
  report.push('    <p>泡径: {item.bubble_diameter_cm}cm</p>');
  report.push('    <p>单箱数量: {item.pcs_per_box}</p>');
  report.push('  </div>');
  report.push(');');
  report.push('```');
  report.push('');
  
  // 验收标准
  report.push('## 📊 基于JSON标准的验收标准');
  report.push('');
  report.push('修复完成后，各场景的字段覆盖率应达到：');
  Object.entries(CONSUMABLES_SCENARIOS).forEach(([scenario, config]) => {
    const targetCoverage = config.expectedFields.length >= 30 ? 85 : 
                          config.expectedFields.length >= 10 ? 95 : 100;
    report.push(`- **${scenario}**: ≥ ${targetCoverage}% (${config.expectedFields.length}个字段中至少实现${Math.ceil(config.expectedFields.length * targetCoverage / 100)}个)`);
  });
  report.push('');
  report.push('**总体目标**: 前端字段与JSON标准定义的匹配率达到90%以上');
  
  return report.join('\n');
}

// 主函数
function main() {
  console.log('🚀 开始基于JSON标准的耗材页面字段差异分析...');
  
  try {
    // 1. 加载JSON标准字段定义
    const standardFields = loadJsonStandardFields();
    if (!standardFields) {
      process.exit(1);
    }
    
    // 2. 提取前端实际字段
    const frontendAnalysis = extractConsumablesPageFields();
    
    // 3. 按场景分析字段使用情况
    const scenarioAnalysis = {};
    Object.entries(CONSUMABLES_SCENARIOS).forEach(([scenario, config]) => {
      scenarioAnalysis[scenario] = analyzeScenarioFields(
        frontendAnalysis.content, 
        scenario, 
        config
      );
    });
    
    // 4. 分析字段映射关系
    const mappingAnalysis = analyzeFieldMapping(frontendAnalysis.fields, standardFields);
    
    // 5. 生成详细报告
    const report = generateJsonBasedFieldGapReport(
      frontendAnalysis,
      scenarioAnalysis,
      mappingAnalysis,
      standardFields
    );
    
    // 6. 保存报告
    const reportPath = path.resolve(__dirname, '../output/consumables-json-field-gap-analysis.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    
    // 7. 保存详细数据
    const dataPath = path.resolve(__dirname, '../output/consumables-json-field-gap-data.json');
    fs.writeFileSync(dataPath, JSON.stringify({
      standardFields,
      frontendAnalysis,
      scenarioAnalysis,
      mappingAnalysis,
      generatedAt: new Date().toISOString()
    }, null, 2), 'utf8');
    
    console.log('\n✅ 基于JSON标准的耗材页面字段差异分析完成!');
    console.log(`📋 分析报告: ${reportPath}`);
    console.log(`📊 详细数据: ${dataPath}`);
    
    // 输出简要统计
    console.log('\n📈 简要统计:');
    Object.entries(scenarioAnalysis).forEach(([scenario, analysis]) => {
      console.log(`  ${scenario}: ${analysis.coverage}% 覆盖率`);
    });
    
    console.log(`\n🎯 字段映射统计:`);
    console.log(`  完全匹配: ${mappingAnalysis.exactMatches.length}`);
    console.log(`  部分匹配: ${mappingAnalysis.partialMatches.length}`);
    console.log(`  前端独有: ${mappingAnalysis.unmappedFrontend.length}`);
    console.log(`  JSON标准未实现: ${mappingAnalysis.unmappedStandard.length}`);
    
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行主函数
main(); 