import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 耗材页面场景定义
const CONSUMABLES_SCENARIOS = {
  '筛选项': {
    description: '页面顶部的筛选控件区域',
    expectedFields: ['适用机型', '形状', '材质', '厚度/克重um/gsm', '厚度/克重mil/#', '膜宽cm', '膜宽inch', '袋长cm', '袋长inch'],
    frontendPatterns: [
      /filter.*Model/i,
      /filter.*Shape/i, 
      /filter.*Material/i,
      /filter.*Thickness/i,
      /filter.*Width/i,
      /filter.*Length/i,
      /selectedModel/i,
      /selectedShape/i,
      /selectedMaterial/i,
      /thickness.*Range/i,
      /width.*Range/i,
      /length.*Range/i
    ]
  },
  '商品列表': {
    description: '耗材产品列表展示区域',
    expectedFields: ['适用机型', '名称(英文)新增需求', '形状', '产品图片袋型实物', '料号', '型号（公制）', '型号(英制)', 'Spec.', 'Spec.(英制)', '泡径cm', '泡径inch', 'productId', '单箱数量'],
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
    expectedFields: ['适用机型', '名称(英文)新增需求', '产品图片袋型实物', '料号', '型号（公制）', '型号(英制)', 'Spec.', 'Spec.(英制)', '泡径cm', '泡径inch', 'productId', '单箱数量'],
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
    expectedFields: ['材质', '厚度/克重um/gsm', '厚度/克重mil/#', '膜宽cm', '膜宽inch', '袋长cm', '袋长inch', '名称(英文)新增需求', '总长m', '总长ft', '包装方式', '包装尺寸cm', '包装尺寸inch', '单件净重kg', '单件净重lbs', '包装实物图片', '托盘尺寸cm', '一托卷数A', '整托毛重Akg', '整托毛重Albs', '打托高度Acm', '打托高度Ainch', '一托卷数B', '整盘毛重kg', '整盘毛重Blbs', '打托高度cm', '打托高度Binch', '一托卷数C', '整托毛重kg', '整托毛重Clbs', '打托高度Ccm', '打托高度Cinch', '纸筒内径cm', '纸筒内径inch'],
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
  }
};

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
  
  const consumablesFilePath = path.resolve(__dirname, '../frontend/src/pages/Consumables/index.tsx');
  const cartFilePath = path.resolve(__dirname, '../frontend/src/pages/Cart/index.tsx');
  
  if (!fs.existsSync(consumablesFilePath)) {
    console.error('❌ 耗材页面文件不存在:', consumablesFilePath);
    return { fields: [], content: '' };
  }
  
  const content = fs.readFileSync(consumablesFilePath, 'utf8');
  const fields = new Set();
  
  // 应用所有字段提取模式
  DETAILED_FIELD_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fieldName = match[1];
      if (fieldName && fieldName.length > 1 && !isCommonWord(fieldName)) {
        fields.add(fieldName);
      }
    }
  });
  
  console.log(`📊 从耗材页面提取到 ${fields.size} 个字段`);
  return { fields: Array.from(fields).sort(), content };
}

// 检查是否为常见单词
function isCommonWord(word) {
  const commonWords = [
    'map', 'filter', 'length', 'push', 'pop', 'slice', 'join', 'toString',
    'key', 'value', 'index', 'name', 'type', 'data', 'state', 'props',
    'useState', 'useEffect', 'onClick', 'onChange', 'className', 'style',
    'loading', 'error', 'success', 'response', 'request', 'config'
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
      expectedField.replace(/[\/\-]/g, '_')
    ];
    
    let found = false;
    variations.forEach(variation => {
      if (content.includes(variation) || content.includes(`"${variation}"`) || content.includes(`'${variation}'`)) {
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
  
  const standardFieldsNormalized = standardFields.map(field => ({
    original: field.originalField,
    normalized: normalizeField(field.originalField),
    standardKey: field.standardKey,
    englishName: field.englishName
  }));
  
  // 查找前端字段的映射
  frontendFields.forEach(frontendField => {
    const normalizedFrontend = normalizeField(frontendField);
    let bestMatch = null;
    let bestScore = 0;
    
    standardFieldsNormalized.forEach(standardField => {
      // 完全匹配
      if (normalizedFrontend === standardField.normalized) {
        bestMatch = { ...standardField, matchType: 'exact', score: 1.0 };
        bestScore = 1.0;
        return;
      }
      
      // 英文名匹配
      if (standardField.englishName && normalizeField(standardField.englishName) === normalizedFrontend) {
        bestMatch = { ...standardField, matchType: 'english', score: 0.9 };
        bestScore = 0.9;
        return;
      }
      
      // 包含匹配
      if (normalizedFrontend.includes(standardField.normalized) || standardField.normalized.includes(normalizedFrontend)) {
        const score = Math.max(normalizedFrontend.length, standardField.normalized.length) / 
                     Math.min(normalizedFrontend.length, standardField.normalized.length);
        if (score > bestScore && score >= 0.6) {
          bestMatch = { ...standardField, matchType: 'contains', score };
          bestScore = score;
        }
      }
    });
    
    if (bestMatch) {
      if (bestMatch.score >= 0.9) {
        mappingResults.exactMatches.push({
          frontendField,
          standardField: bestMatch.original,
          standardKey: bestMatch.standardKey,
          matchType: bestMatch.matchType,
          score: bestMatch.score
        });
      } else {
        mappingResults.partialMatches.push({
          frontendField,
          standardField: bestMatch.original,
          standardKey: bestMatch.standardKey,
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
  
  standardFields.forEach(field => {
    if (!mappedStandardFields.has(field.originalField)) {
      mappingResults.unmappedStandard.push(field);
    }
  });
  
  return mappingResults;
}

// 生成耗材页面字段差异报告
function generateConsumablesFieldGapReport(frontendAnalysis, scenarioAnalysis, mappingAnalysis, standardFields) {
  console.log('\n📋 生成耗材页面字段差异报告...');
  
  const report = [];
  
  report.push('# 耗材页面字段使用情况差异分析报告');
  report.push('');
  report.push(`生成时间: ${new Date().toISOString()}`);
  report.push('');
  report.push('## 📋 总体概述');
  report.push('');
  report.push(`- **前端字段总数**: ${frontendAnalysis.fields.length}`);
  report.push(`- **标准字段总数**: ${standardFields.length}`);
  report.push(`- **完全匹配**: ${mappingAnalysis.exactMatches.length}`);
  report.push(`- **部分匹配**: ${mappingAnalysis.partialMatches.length}`);
  report.push(`- **前端独有**: ${mappingAnalysis.unmappedFrontend.length}`);
  report.push(`- **标准未实现**: ${mappingAnalysis.unmappedStandard.length}`);
  report.push('');
  
  // 场景分析概览
  report.push('## 🎯 各场景字段覆盖率');
  report.push('');
  report.push('| 场景 | 预期字段数 | 已实现 | 缺失 | 覆盖率 | 状态 |');
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
    report.push('');
    
    if (analysis.found.length > 0) {
      report.push('### ✅ 已实现字段');
      report.push('');
      analysis.found.forEach(field => {
        report.push(`- \`${field}\``);
      });
      report.push('');
    }
    
    if (analysis.missing.length > 0) {
      report.push('### ❌ 缺失字段');
      report.push('');
      analysis.missing.forEach(field => {
        // 查找对应的标准字段信息
        const standardField = standardFields.find(sf => sf.originalField === field);
        if (standardField) {
          report.push(`- **\`${field}\`** → 标准Key: \`${standardField.standardKey}\` (${standardField.englishName})`);
        } else {
          report.push(`- **\`${field}\`**`);
        }
      });
      report.push('');
    }
    
    // 场景特定修复建议
    report.push('### 💡 修复建议');
    report.push('');
    
    switch (scenario) {
      case '筛选项':
        report.push('- 🔍 **筛选控件完整性**: 确保所有7个筛选维度都有对应的UI控件');
        report.push('- 🎛️ **智能单位制**: 根据用户地区智能显示公制/英制筛选项');
        report.push('- 📊 **筛选逻辑**: 实现前端筛选为主的策略，避免频繁API调用');
        break;
      case '商品列表':
        report.push('- 📋 **字段显示**: 按CSV第7行√标记实现所有必需字段');
        report.push('- 🖼️ **图片显示**: 确保产品图片和包装图片正确显示');
        report.push('- 🏷️ **规格信息**: 智能显示公制/英制规格，避免单位重复');
        break;
      case '购物车':
        report.push('- 🛒 **购物车字段**: 与商品列表保持一致的字段显示');
        report.push('- 📦 **数量信息**: 正确显示单箱数量等包装信息');
        report.push('- 🔢 **规格标识**: 确保型号、料号等关键标识完整显示');
        break;
      case 'tooltip':
        report.push('- 📝 **详细信息**: 实现33个详细信息字段的完整显示');
        report.push('- 📏 **托盘配置**: 支持A/B/C三种托盘配置的动态显示');
        report.push('- 🎯 **条件显示**: 根据产品类型条件显示相关字段（如气泡类型显示泡径）');
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
    report.push('| 前端字段 | 标准字段 | 标准Key | 匹配类型 |');
    report.push('|----------|----------|---------|----------|');
    
    mappingAnalysis.exactMatches.forEach(match => {
      report.push(`| \`${match.frontendField}\` | ${match.standardField} | ${match.standardKey} | ${match.matchType} |`);
    });
    report.push('');
  }
  
  if (mappingAnalysis.partialMatches.length > 0) {
    report.push('### ⚠️ 部分匹配字段');
    report.push('');
    report.push('| 前端字段 | 标准字段 | 标准Key | 匹配类型 | 分数 |');
    report.push('|----------|----------|---------|----------|------|');
    
    mappingAnalysis.partialMatches.forEach(match => {
      report.push(`| \`${match.frontendField}\` | ${match.standardField} | ${match.standardKey} | ${match.matchType} | ${match.score.toFixed(2)} |`);
    });
    report.push('');
  }
  
  if (mappingAnalysis.unmappedStandard.length > 0) {
    report.push('### ❌ 未实现的标准字段');
    report.push('');
    report.push('| 标准字段 | 标准Key | 英文名 | 显示场景 |');
    report.push('|----------|---------|--------|----------|');
    
    mappingAnalysis.unmappedStandard.forEach(field => {
      // 查找该字段在哪些场景中需要显示
      const scenarios = [];
      if (CONSUMABLES_SCENARIOS['商品列表'].expectedFields.includes(field.originalField)) scenarios.push('商品列表');
      if (CONSUMABLES_SCENARIOS['购物车'].expectedFields.includes(field.originalField)) scenarios.push('购物车');
      if (CONSUMABLES_SCENARIOS['tooltip'].expectedFields.includes(field.originalField)) scenarios.push('tooltip');
      
      report.push(`| ${field.originalField} | ${field.standardKey} | ${field.englishName} | ${scenarios.join(', ')} |`);
    });
    report.push('');
  }
  
  // 优先级修复建议
  report.push('## 🎯 优先级修复计划');
  report.push('');
  
  report.push('### P0 - 关键字段（立即修复）');
  report.push('');
  const criticalFields = ['料号', '型号（公制）', '型号(英制)', 'Spec.', 'Spec.(英制)', '适用机型'];
  const missingCritical = mappingAnalysis.unmappedStandard.filter(field => 
    criticalFields.includes(field.originalField)
  );
  
  if (missingCritical.length > 0) {
    missingCritical.forEach(field => {
      report.push(`- **${field.originalField}** → \`${field.standardKey}\` - 产品核心标识信息`);
    });
  } else {
    report.push('- ✅ 所有关键字段已实现');
  }
  report.push('');
  
  report.push('### P1 - 重要字段（本周修复）');
  report.push('');
  const importantFields = ['形状', '材质', '厚度/克重um/gsm', '膜宽cm', '袋长cm', '单箱数量'];
  const missingImportant = mappingAnalysis.unmappedStandard.filter(field => 
    importantFields.includes(field.originalField)
  );
  
  if (missingImportant.length > 0) {
    missingImportant.forEach(field => {
      report.push(`- **${field.originalField}** → \`${field.standardKey}\` - 筛选和展示核心字段`);
    });
  } else {
    report.push('- ✅ 所有重要字段已实现');
  }
  report.push('');
  
  report.push('### P2 - 增强字段（下周修复）');
  report.push('');
  const enhancementFields = mappingAnalysis.unmappedStandard.filter(field => 
    !criticalFields.includes(field.originalField) && 
    !importantFields.includes(field.originalField)
  );
  
  enhancementFields.slice(0, 10).forEach(field => { // 只显示前10个
    report.push(`- **${field.originalField}** → \`${field.standardKey}\` - 详细信息增强`);
  });
  
  if (enhancementFields.length > 10) {
    report.push(`- ... 还有 ${enhancementFields.length - 10} 个增强字段`);
  }
  report.push('');
  
  // 代码修复示例
  report.push('## 💻 代码修复示例');
  report.push('');
  
  report.push('### 筛选项修复示例');
  report.push('');
  report.push('```typescript');
  report.push('// ✅ 正确：完整的筛选项实现');
  report.push('const ConsumablesFilters = () => {');
  report.push('  const [selectedModel, setSelectedModel] = useState(\'all\');');
  report.push('  const [selectedShape, setSelectedShape] = useState(\'all\');');
  report.push('  const [selectedMaterial, setSelectedMaterial] = useState(\'all\');');
  report.push('  const [thicknessRange, setThicknessRange] = useState(null);');
  report.push('  const [widthRange, setWidthRange] = useState(null);');
  report.push('  const [lengthRange, setLengthRange] = useState(null);');
  report.push('  ');
  report.push('  return (');
  report.push('    <div className="filters-container">');
  report.push('      <ModelFilter value={selectedModel} onChange={setSelectedModel} />');
  report.push('      <ShapeFilter value={selectedShape} onChange={setSelectedShape} />');
  report.push('      <MaterialFilter value={selectedMaterial} onChange={setSelectedMaterial} />');
  report.push('      <ThicknessRangeFilter value={thicknessRange} onChange={setThicknessRange} />');
  report.push('      <WidthRangeFilter value={widthRange} onChange={setWidthRange} />');
  report.push('      <LengthRangeFilter value={lengthRange} onChange={setLengthRange} />');
  report.push('    </div>');
  report.push('  );');
  report.push('};');
  report.push('```');
  report.push('');
  
  report.push('### 商品列表字段修复示例');
  report.push('');
  report.push('```typescript');
  report.push('// ✅ 正确：按CSV标准显示所有必需字段');
  report.push('const ConsumableCard = ({ item }) => {');
  report.push('  return (');
  report.push('    <div className="consumable-card">');
  report.push('      <img src={item.image_url} alt={item.shape} />');
  report.push('      <div className="details">');
  report.push('        <h3>{item.app_model}</h3>');
  report.push('        <p><strong>料号:</strong> {item.part_number}</p>');
  report.push('        <p><strong>型号(公制):</strong> {item.model}</p>');
  report.push('        <p><strong>型号(英制):</strong> {item.model_imperial}</p>');
  report.push('        <p><strong>规格(公制):</strong> {item.spec}</p>');
  report.push('        <p><strong>规格(英制):</strong> {item.spec_imperial}</p>');
  report.push('        {item.bubble_diameter_met && (');
  report.push('          <p><strong>泡径(cm):</strong> {item.bubble_diameter_met}</p>');
  report.push('        )}');
  report.push('        <p><strong>单箱数量:</strong> {item.pcs_per_box}</p>');
  report.push('      </div>');
  report.push('    </div>');
  report.push('  );');
  report.push('};');
  report.push('```');
  report.push('');
  
  return report.join('\n');
}

// 主函数
function main() {
  console.log('🚀 开始耗材页面字段差异分析...');
  
  try {
    // 1. 加载标准化字段数据
    const standardFieldsPath = path.resolve(__dirname, '../output/standardized-fields.json');
    const standardData = JSON.parse(fs.readFileSync(standardFieldsPath, 'utf8'));
    
    if (!standardData['耗材页面']) {
      console.error('❌ 标准化数据中未找到耗材页面定义');
      return;
    }
    
    // 获取耗材页面的所有标准字段
    const consumablesStandardFields = [];
    Object.values(standardData['耗材页面']).forEach(fields => {
      consumablesStandardFields.push(...fields);
    });
    
    // 去重
    const uniqueStandardFields = [];
    const seen = new Set();
    consumablesStandardFields.forEach(field => {
      const key = field.originalField + field.standardKey;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueStandardFields.push(field);
      }
    });
    
    console.log(`📋 标准字段总数: ${uniqueStandardFields.length}`);
    
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
    const mappingAnalysis = analyzeFieldMapping(frontendAnalysis.fields, uniqueStandardFields);
    
    // 5. 生成详细报告
    const report = generateConsumablesFieldGapReport(
      frontendAnalysis,
      scenarioAnalysis,
      mappingAnalysis,
      uniqueStandardFields
    );
    
    // 6. 保存报告
    const reportPath = path.resolve(__dirname, '../output/consumables-field-gap-analysis.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    
    // 7. 保存详细数据
    const dataPath = path.resolve(__dirname, '../output/consumables-field-gap-data.json');
    fs.writeFileSync(dataPath, JSON.stringify({
      frontendAnalysis,
      scenarioAnalysis,
      mappingAnalysis,
      standardFields: uniqueStandardFields,
      generatedAt: new Date().toISOString()
    }, null, 2), 'utf8');
    
    console.log('\n✅ 耗材页面字段差异分析完成!');
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
    console.log(`  标准未实现: ${mappingAnalysis.unmappedStandard.length}`);
    
  } catch (error) {
    console.error('❌ 分析失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 执行主函数
main(); 