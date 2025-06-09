import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 字段匹配模式 - 用于从前端代码中提取字段名
const FIELD_PATTERNS = [
    // React组件中的字段引用
    /item\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /product\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /machine\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /consumable\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /sparePart\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    /accessory\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    
    // 表格列定义
    /key:\s*['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]/g,
    /dataIndex:\s*['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]/g,
    
    // 字段显示
    /{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
    
    // API字段引用
    /['"`]([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)['"`]/g,
    
    // 中文字段名
    /['"`](型号|电压|图片|料号|名称|品牌|规格|适用机型|形状|材质|厚度|膜宽|袋长|总长|包装方式|包装尺寸|净重|毛重|托盘尺寸|适配机型|易损|序列号|产品名称|频率|泡径)['"`]/g
];

// 页面文件映射
const PAGE_FILES = {
    '机器页面': [
        'frontend/src/pages/Machines/index.tsx',
        'frontend/src/pages/Machines/components/',
    ],
    '耗材页面': [
        'frontend/src/pages/Consumables/index.tsx',
    ],
    '备件页面': [
        'frontend/src/pages/SpareParts/index.tsx',
    ],
    '配件页面': [
        'frontend/src/pages/Accessories/index.tsx',
    ],
    '购物车': [
        'frontend/src/pages/Cart/index.tsx',
        'frontend/src/pages/Cart/CartPage.tsx',
    ],
    'PO页': [
        'frontend/src/pages/PO/index.tsx',
    ]
};

// 显示场景映射
const DISPLAY_CONTEXT_MAPPING = {
    'ProductList': '商品列表',
    'Cart': '购物车', 
    'Tooltip': 'tooltip',
    'POPage': 'PO页',
    'Table': '商品列表',
    'Detail': 'tooltip'
};

// 从文件中提取字段
function extractFieldsFromFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fields = new Set();
        
        // 应用所有匹配模式
        FIELD_PATTERNS.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const fieldName = match[1];
                if (fieldName && fieldName.length > 1 && !isCommonWord(fieldName)) {
                    fields.add(fieldName);
                }
            }
        });
        
        return Array.from(fields);
    } catch (error) {
        console.warn(`⚠️  无法读取文件: ${filePath} - ${error.message}`);
        return [];
    }
}

// 检查是否为常见单词（非字段名）
function isCommonWord(word) {
    const commonWords = [
        'map', 'filter', 'length', 'push', 'pop', 'shift', 'unshift', 
        'slice', 'splice', 'join', 'toString', 'key', 'value', 'index',
        'name', 'type', 'data', 'state', 'props', 'ref', 'current',
        'useState', 'useEffect', 'onClick', 'onChange', 'className',
        'style', 'width', 'height', 'color', 'display', 'flex'
    ];
    
    return commonWords.includes(word.toLowerCase()) || 
           word.length < 2 || 
           /^[0-9]+$/.test(word);
}

// 从目录中提取所有字段
function extractFieldsFromDirectory(dirPath) {
    const fields = new Set();
    
    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        
        files.forEach(file => {
            if (file.isDirectory()) {
                // 递归处理子目录
                const subFields = extractFieldsFromDirectory(path.join(dirPath, file.name));
                subFields.forEach(field => fields.add(field));
            } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
                const fileFields = extractFieldsFromFile(path.join(dirPath, file.name));
                fileFields.forEach(field => fields.add(field));
            }
        });
    } catch (error) {
        // 目录不存在，尝试作为文件处理
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isFile()) {
            const fileFields = extractFieldsFromFile(dirPath);
            fileFields.forEach(field => fields.add(field));
        }
    }
    
    return Array.from(fields);
}

// 分析前端实际使用的字段
function analyzeFrontendFields() {
    console.log('🔍 分析前端页面实际使用的字段...');
    
    const frontendFields = {};
    
    for (const [pageName, filePaths] of Object.entries(PAGE_FILES)) {
        console.log(`\n📄 分析 ${pageName}...`);
        const pageFields = new Set();
        
        filePaths.forEach(filePath => {
            const fullPath = path.resolve(__dirname, '..', filePath);
            console.log(`  检查: ${filePath}`);
            
            const fields = extractFieldsFromDirectory(fullPath);
            fields.forEach(field => pageFields.add(field));
            console.log(`    发现 ${fields.length} 个字段`);
        });
        
        frontendFields[pageName] = Array.from(pageFields).sort();
        console.log(`  ${pageName} 总共发现 ${frontendFields[pageName].length} 个字段`);
    }
    
    return frontendFields;
}

// 字段名标准化（用于匹配）
function normalizeFieldName(fieldName) {
    return fieldName
        .toLowerCase()
        .replace(/[_\-\s]/g, '')
        .replace(/[()（）]/g, '')
        .replace(/["']/g, '');
}

// 查找字段匹配
function findFieldMatches(frontendField, csvFields) {
    const normalizedFrontend = normalizeFieldName(frontendField);
    const matches = [];
    
    csvFields.forEach(csvField => {
        const normalizedCsv = normalizeFieldName(csvField.originalField);
        
        // 完全匹配
        if (normalizedFrontend === normalizedCsv) {
            matches.push({ field: csvField, matchType: 'exact', score: 1.0 });
            return;
        }
        
        // 包含匹配
        if (normalizedFrontend.includes(normalizedCsv) || normalizedCsv.includes(normalizedFrontend)) {
            matches.push({ field: csvField, matchType: 'contains', score: 0.8 });
            return;
        }
        
        // 英文名匹配
        const normalizedEnglish = normalizeFieldName(csvField.englishName || '');
        if (normalizedEnglish && normalizedFrontend === normalizedEnglish) {
            matches.push({ field: csvField, matchType: 'english', score: 0.9 });
            return;
        }
        
        // 部分匹配
        const frontendWords = normalizedFrontend.split(/[0-9]/);
        const csvWords = normalizedCsv.split(/[0-9]/);
        
        const commonWords = frontendWords.filter(word => 
            word.length > 2 && csvWords.some(csvWord => csvWord.includes(word) || word.includes(csvWord))
        );
        
        if (commonWords.length > 0) {
            const score = commonWords.length / Math.max(frontendWords.length, csvWords.length);
            if (score >= 0.3) {
                matches.push({ field: csvField, matchType: 'partial', score: score * 0.6 });
            }
        }
    });
    
    // 返回最佳匹配
    if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        return matches[0];
    }
    
    return null;
}

// 比较前端字段与CSV字段
function compareFields(frontendFields, csvFields) {
    console.log('\n🔄 开始字段比较分析...');
    
    const comparison = {};
    
    Object.keys(csvFields).forEach(pageName => {
        console.log(`\n📊 分析 ${pageName}:`);
        comparison[pageName] = {
            csvFields: {},
            frontendFields: frontendFields[pageName] || [],
            matches: [],
            csvOnly: [],
            frontendOnly: [],
            summary: {}
        };
        
        // 获取该页面的所有CSV字段
        const allCsvFields = [];
        Object.values(csvFields[pageName]).forEach(displayFields => {
            allCsvFields.push(...displayFields);
        });
        
        // 去重
        const uniqueCsvFields = [];
        const seen = new Set();
        allCsvFields.forEach(field => {
            const key = field.originalField + field.standardKey;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCsvFields.push(field);
            }
        });
        
        comparison[pageName].csvFields = csvFields[pageName];
        
        // 查找匹配的字段
        const frontendFieldsForPage = frontendFields[pageName] || [];
        
        frontendFieldsForPage.forEach(frontendField => {
            const match = findFieldMatches(frontendField, uniqueCsvFields);
            
            if (match) {
                comparison[pageName].matches.push({
                    frontendField,
                    csvField: match.field,
                    matchType: match.matchType,
                    score: match.score
                });
            } else {
                comparison[pageName].frontendOnly.push(frontendField);
            }
        });
        
        // 查找CSV中有但前端没有的字段
        const matchedCsvFields = new Set(
            comparison[pageName].matches.map(m => m.csvField.originalField)
        );
        
        uniqueCsvFields.forEach(csvField => {
            if (!matchedCsvFields.has(csvField.originalField)) {
                comparison[pageName].csvOnly.push(csvField);
            }
        });
        
        // 统计信息
        comparison[pageName].summary = {
            totalCsvFields: uniqueCsvFields.length,
            totalFrontendFields: frontendFieldsForPage.length,
            matchedFields: comparison[pageName].matches.length,
            csvOnlyFields: comparison[pageName].csvOnly.length,
            frontendOnlyFields: comparison[pageName].frontendOnly.length,
            coverageRate: uniqueCsvFields.length > 0 ? 
                (comparison[pageName].matches.length / uniqueCsvFields.length * 100).toFixed(1) : '0.0'
        };
        
        console.log(`  CSV字段: ${comparison[pageName].summary.totalCsvFields}`);
        console.log(`  前端字段: ${comparison[pageName].summary.totalFrontendFields}`);
        console.log(`  匹配字段: ${comparison[pageName].summary.matchedFields}`);
        console.log(`  覆盖率: ${comparison[pageName].summary.coverageRate}%`);
    });
    
    return comparison;
}

// 生成比较报告
function generateComparisonReport(comparison) {
    console.log('\n📋 生成字段比较报告...');
    
    const report = [];
    
    report.push('# 前端页面字段使用情况对比报告');
    report.push('');
    report.push(`生成时间: ${new Date().toISOString()}`);
    report.push('');
    report.push('## 📋 总体概览');
    report.push('');
    
    // 总体统计
    let totalCsvFields = 0;
    let totalFrontendFields = 0;
    let totalMatched = 0;
    
    Object.values(comparison).forEach(pageData => {
        totalCsvFields += pageData.summary.totalCsvFields;
        totalFrontendFields += pageData.summary.totalFrontendFields;
        totalMatched += pageData.summary.matchedFields;
    });
    
    report.push('| 页面 | CSV字段数 | 前端字段数 | 匹配字段数 | 覆盖率 | 状态 |');
    report.push('|------|-----------|------------|------------|---------|------|');
    
    Object.entries(comparison).forEach(([pageName, data]) => {
        const status = parseFloat(data.summary.coverageRate) >= 80 ? '✅ 良好' : 
                      parseFloat(data.summary.coverageRate) >= 50 ? '⚠️ 一般' : '❌ 需要改进';
        
        report.push(`| ${pageName} | ${data.summary.totalCsvFields} | ${data.summary.totalFrontendFields} | ${data.summary.matchedFields} | ${data.summary.coverageRate}% | ${status} |`);
    });
    
    report.push('');
    report.push(`**总计**: CSV字段 ${totalCsvFields} 个，前端字段 ${totalFrontendFields} 个，匹配 ${totalMatched} 个`);
    report.push('');
    
    // 详细分析
    Object.entries(comparison).forEach(([pageName, data]) => {
        report.push(`## 📄 ${pageName} 详细分析`);
        report.push('');
        
        // 匹配的字段
        if (data.matches.length > 0) {
            report.push('### ✅ 已匹配字段');
            report.push('');
            report.push('| 前端字段 | CSV字段 | 标准Key | 匹配类型 | 匹配分数 |');
            report.push('|----------|---------|---------|----------|----------|');
            
            data.matches.forEach(match => {
                const matchIcon = match.score >= 0.9 ? '🎯' : match.score >= 0.7 ? '✅' : '⚠️';
                report.push(`| ${match.frontendField} | ${match.csvField.originalField} | ${match.csvField.standardKey} | ${matchIcon} ${match.matchType} | ${match.score.toFixed(2)} |`);
            });
            report.push('');
        }
        
        // CSV中有但前端没有的字段
        if (data.csvOnly.length > 0) {
            report.push('### ❌ CSV中定义但前端未使用的字段');
            report.push('');
            report.push('| CSV字段 | 标准Key | 中文名 | 英文名 | 显示场景 |');
            report.push('|---------|---------|--------|--------|----------|');
            
            // 统计每个字段在哪些显示场景中出现
            const fieldContexts = {};
            Object.entries(data.csvFields).forEach(([context, fields]) => {
                fields.forEach(field => {
                    if (!fieldContexts[field.originalField]) {
                        fieldContexts[field.originalField] = {
                            field: field,
                            contexts: []
                        };
                    }
                    fieldContexts[field.originalField].contexts.push(context);
                });
            });
            
            data.csvOnly.forEach(field => {
                const contexts = fieldContexts[field.originalField]?.contexts || [];
                report.push(`| ${field.originalField} | ${field.standardKey} | ${field.chineseName} | ${field.englishName} | ${contexts.join(', ')} |`);
            });
            report.push('');
        }
        
        // 前端有但CSV没有的字段  
        if (data.frontendOnly.length > 0) {
            report.push('### ⚠️ 前端使用但CSV未定义的字段');
            report.push('');
            data.frontendOnly.forEach(field => {
                report.push(`- \`${field}\``);
            });
            report.push('');
        }
        
        // 建议
        report.push('### 💡 改进建议');
        report.push('');
        
        if (parseFloat(data.summary.coverageRate) < 80) {
            report.push('- 🎯 **提高字段覆盖率**: 当前覆盖率较低，建议检查前端是否完整实现了CSV中定义的字段显示');
        }
        
        if (data.csvOnly.length > 0) {
            report.push(`- 📝 **补充前端实现**: 有 ${data.csvOnly.length} 个CSV定义的字段未在前端使用，需要确认是否需要实现`);
        }
        
        if (data.frontendOnly.length > 0) {
            report.push(`- 📋 **完善CSV定义**: 有 ${data.frontendOnly.length} 个前端使用的字段未在CSV中定义，建议添加到标准化字段中`);
        }
        
        const lowScoreMatches = data.matches.filter(m => m.score < 0.8);
        if (lowScoreMatches.length > 0) {
            report.push(`- 🔍 **确认字段映射**: 有 ${lowScoreMatches.length} 个字段匹配度较低，请人工确认是否为同一字段`);
        }
        
        report.push('');
    });
    
    return report.join('\n');
}

// 主函数
function main() {
    console.log('🚀 开始前端字段分析...');
    
    try {
        // 1. 加载CSV标准化字段数据
        const csvFieldsPath = path.resolve(__dirname, '../output/standardized-fields.json');
        const csvFields = JSON.parse(fs.readFileSync(csvFieldsPath, 'utf8'));
        
        // 2. 分析前端实际使用的字段
        const frontendFields = analyzeFrontendFields();
        
        // 3. 比较前端字段与CSV字段
        const comparison = compareFields(frontendFields, csvFields);
        
        // 4. 保存分析结果
        const analysisPath = path.resolve(__dirname, '../output/frontend-field-analysis.json');
        fs.writeFileSync(analysisPath, JSON.stringify({
            frontendFields,
            comparison,
            generatedAt: new Date().toISOString()
        }, null, 2), 'utf8');
        
        // 5. 生成比较报告
        const report = generateComparisonReport(comparison);
        const reportPath = path.resolve(__dirname, '../output/frontend-field-comparison-report.md');
        fs.writeFileSync(reportPath, report, 'utf8');
        
        console.log('\n✅ 前端字段分析完成!');
        console.log(`📊 分析结果: ${analysisPath}`);
        console.log(`📋 比较报告: ${reportPath}`);
        
        // 输出简要统计
        console.log('\n📈 简要统计:');
        Object.entries(comparison).forEach(([pageName, data]) => {
            console.log(`  ${pageName}: ${data.summary.matchedFields}/${data.summary.totalCsvFields} 字段匹配 (${data.summary.coverageRate}%)`);
        });
        
    } catch (error) {
        console.error('❌ 分析失败:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 执行主函数
main(); 