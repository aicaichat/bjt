import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 简单的CSV解析函数
function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim().replace(/^"|"$/g, ''));
            currentField = '';
        } else {
            currentField += char;
        }
    }
    
    fields.push(currentField.trim().replace(/^"|"$/g, ''));
    return fields;
}

// 读取name统一.csv文件，建立标准化映射
function loadStandardMapping() {
    console.log('📊 读取 name统一.csv 标准化映射...');
    
    const csvPath = path.resolve(__dirname, '../generated_sql_imports/name统一.csv');
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const mapping = {};
    
    // 跳过标题行，处理数据
    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        const [category, attribute, chineseName, englishName, unit, example] = fields;
        
        if (attribute && attribute.trim()) {
            const cleanAttribute = attribute.trim();
            
            mapping[cleanAttribute] = {
                category: category || '未分类',
                attribute: cleanAttribute,
                chineseName: chineseName || '',
                englishName: englishName || '',
                unit: unit || '',
                example: example || ''
            };
        }
    }
    
    console.log(`✅ 加载了 ${Object.keys(mapping).length} 个标准化字段映射`);
    return mapping;
}

// 字段匹配函数 - 支持模糊匹配
function findBestMatch(fieldName, standardMapping) {
    // 1. 完全匹配
    if (standardMapping[fieldName]) {
        return { type: 'exact', field: fieldName, score: 1.0 };
    }
    
    // 2. 清理字段名后匹配
    const cleanFieldName = fieldName
        .replace(/\s+/g, '')  // 去除空格
        .replace(/[()（）]/g, '')  // 去除括号
        .replace(/["'"]/g, '')  // 去除引号
        .toLowerCase();
    
    const matches = [];
    
    for (const [key, value] of Object.entries(standardMapping)) {
        const cleanKey = key
            .replace(/\s+/g, '')
            .replace(/[()（）]/g, '')
            .replace(/["'"]/g, '')
            .toLowerCase();
        
        // 完全匹配（忽略格式）
        if (cleanFieldName === cleanKey) {
            matches.push({ type: 'clean_exact', field: key, score: 0.95 });
            continue;
        }
        
        // 包含匹配
        if (cleanFieldName.includes(cleanKey) || cleanKey.includes(cleanFieldName)) {
            matches.push({ type: 'contains', field: key, score: 0.8 });
            continue;
        }
        
        // 关键词匹配
        const fieldKeywords = cleanFieldName.split(/[\/\-_]/);
        const keyKeywords = cleanKey.split(/[\/\-_]/);
        
        const matchedKeywords = fieldKeywords.filter(keyword => 
            keyword && keyKeywords.some(kk => kk.includes(keyword) || keyword.includes(kk))
        );
        
        if (matchedKeywords.length > 0) {
            const score = matchedKeywords.length / Math.max(fieldKeywords.length, keyKeywords.length);
            if (score >= 0.4) {
                matches.push({ type: 'keywords', field: key, score: score * 0.6 });
            }
        }
    }
    
    // 返回最佳匹配
    if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        return matches[0];
    }
    
    return null;
}

// 标准化字段信息
function standardizeFields(fieldsData, standardMapping) {
    console.log('\n🔄 开始字段标准化...');
    
    const standardizedData = {};
    
    for (const [pageName, pageData] of Object.entries(fieldsData)) {
        console.log(`\n📄 处理 ${pageName}:`);
        standardizedData[pageName] = {};
        
        for (const [displayType, fields] of Object.entries(pageData)) {
            console.log(`  处理 ${displayType}: ${fields.length} 个字段`);
            standardizedData[pageName][displayType] = [];
            
            for (const fieldName of fields) {
                const match = findBestMatch(fieldName, standardMapping);
                
                if (match) {
                    const standard = standardMapping[match.field];
                    const standardizedField = {
                        originalField: fieldName,
                        standardKey: standard.englishName || match.field,
                        chineseName: standard.chineseName || fieldName,
                        englishName: standard.englishName || fieldName,
                        category: standard.category,
                        unit: standard.unit,
                        example: standard.example,
                        matchType: match.type,
                        matchScore: match.score
                    };
                    
                    standardizedData[pageName][displayType].push(standardizedField);
                    
                    if (match.score < 0.9) {
                        console.log(`    ⚠️ ${fieldName} -> ${match.field} (${match.type}, ${match.score.toFixed(2)})`);
                    }
                } else {
                    // 未找到匹配的字段
                    const unmatchedField = {
                        originalField: fieldName,
                        standardKey: fieldName.replace(/\s+/g, '_').toLowerCase(),
                        chineseName: fieldName,
                        englishName: fieldName,
                        category: '未标准化',
                        unit: '',
                        example: '',
                        matchType: 'unmatched',
                        matchScore: 0
                    };
                    
                    standardizedData[pageName][displayType].push(unmatchedField);
                    console.log(`    ❌ 未找到匹配: ${fieldName}`);
                }
            }
        }
    }
    
    return standardizedData;
}

// 生成标准化报告
function generateReport(standardizedData) {
    console.log('\n📋 生成标准化报告...');
    
    const report = [];
    let totalFields = 0;
    let matchedFields = 0;
    let perfectMatches = 0;
    
    report.push('# 字段标准化报告');
    report.push('');
    report.push(`生成时间: ${new Date().toISOString()}`);
    report.push('');
    
    for (const [pageName, pageData] of Object.entries(standardizedData)) {
        report.push(`## ${pageName}`);
        report.push('');
        
        for (const [displayType, fields] of Object.entries(pageData)) {
            report.push(`### ${displayType} (${fields.length} 个字段)`);
            report.push('');
            report.push('| 原始字段 | 标准Key | 中文名 | 英文名 | 分类 | 单位 | 匹配类型 |');
            report.push('|---------|--------|--------|--------|------|------|----------|');
            
            for (const field of fields) {
                totalFields++;
                if (field.matchType !== 'unmatched') {
                    matchedFields++;
                    if (field.matchScore >= 0.95) {
                        perfectMatches++;
                    }
                }
                
                const matchIcon = field.matchType === 'unmatched' ? '❌' : 
                                field.matchScore >= 0.95 ? '✅' : '⚠️';
                
                report.push(`| ${field.originalField} | ${field.standardKey} | ${field.chineseName} | ${field.englishName} | ${field.category} | ${field.unit} | ${matchIcon} ${field.matchType} |`);
            }
            report.push('');
        }
    }
    
    // 统计信息
    report.push('## 📊 统计信息');
    report.push('');
    report.push(`- 总字段数: ${totalFields}`);
    report.push(`- 已匹配字段: ${matchedFields} (${(matchedFields/totalFields*100).toFixed(1)}%)`);
    report.push(`- 完美匹配: ${perfectMatches} (${(perfectMatches/totalFields*100).toFixed(1)}%)`);
    report.push(`- 未匹配字段: ${totalFields - matchedFields} (${((totalFields-matchedFields)/totalFields*100).toFixed(1)}%)`);
    
    return report.join('\n');
}

// 主函数
function main() {
    console.log('🚀 开始字段标准化处理...');
    
    try {
        // 1. 读取提取的字段数据
        const fieldsPath = path.resolve(__dirname, '../output/all-pages-display-fields.json');
        const fieldsData = JSON.parse(fs.readFileSync(fieldsPath, 'utf8'));
        
        // 2. 加载标准化映射
        const standardMapping = loadStandardMapping();
        
        // 3. 标准化字段
        const standardizedData = standardizeFields(fieldsData, standardMapping);
        
        // 4. 保存标准化结果
        const outputPath = path.resolve(__dirname, '../output/standardized-fields.json');
        fs.writeFileSync(outputPath, JSON.stringify(standardizedData, null, 2), 'utf8');
        
        // 5. 生成并保存报告
        const report = generateReport(standardizedData);
        const reportPath = path.resolve(__dirname, '../output/field-standardization-report.md');
        fs.writeFileSync(reportPath, report, 'utf8');
        
        console.log('\n✅ 字段标准化完成!');
        console.log(`📄 标准化结果: ${outputPath}`);
        console.log(`📋 详细报告: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ 处理失败:', error.message);
        process.exit(1);
    }
}

// 执行主函数
main(); 