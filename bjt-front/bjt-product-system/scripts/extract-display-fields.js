import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义要处理的CSV文件
const csvFiles = {
    '机器页面': 'machine.csv',
    '耗材页面': 'consumabe.csv', 
    '备件页面': 'sparepart.csv',
    '配件页面': 'accesory.csv'
};

// 定义要查找的行标识
const targetRows = {
    '商品列表': '选型页的商品展示',
    '购物车': '购物车与PO确认',
    'tooltip': '选型和购物车的"详细信息"弹气泡显示',
    'PO页': 'PO页'
};

// 处理单个CSV文件的函数
function processCSVFile(filePath, fileName) {
    console.log(`\n📄 处理文件: ${fileName}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // 找到以"属性名称"开头的行，这是表头的开始
    let headerStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('属性名称')) {
            headerStartIndex = i;
            break;
        }
    }

    if (headerStartIndex === -1) {
        console.log(`【ERROR】未找到"属性名称"开头的表头行: ${fileName}`);
        return {};
    }

    // 合并表头行（可能跨多行）
    let headerLine = lines[headerStartIndex];
    let nextIndex = headerStartIndex + 1;

    // 如果下一行不是以已知的行标识开头，说明是表头的延续
    while (nextIndex < lines.length && 
           !lines[nextIndex].startsWith('页面显示效果') &&
           !lines[nextIndex].startsWith('选型值来源') &&
           !lines[nextIndex].startsWith('商品属性来源') &&
           !lines[nextIndex].startsWith('选型页的商品展示')) {
        if (lines[nextIndex].trim()) {
            headerLine += lines[nextIndex];
        }
        nextIndex++;
    }

    // 解析表头
    const headers = headerLine.split(',');
    console.log(`   表头字段数: ${headers.length}`);

    // 提取字段
    const result = {};
    for (const [displayType, identifier] of Object.entries(targetRows)) {
        // 使用更灵活的匹配方式
        const targetLine = lines.find(line => {
            if (displayType === 'tooltip') {
                // 对tooltip行使用包含匹配，因为可能有引号字符差异
                return line.includes('选型和购物车的') && line.includes('详细信息') && line.includes('弹气泡显示');
            } else {
                return line.startsWith(identifier);
            }
        });
        
        if (targetLine) {
            const values = targetLine.split(',');
            const fields = [];
            for (let i = 0; i < Math.min(values.length, headers.length); i++) {
                if (values[i].trim() === '√' && headers[i] && headers[i].trim()) {
                    // 清理字段名，去除换行符
                    const cleanFieldName = headers[i].replace(/\n/g, ' ').trim().replace(/^"|"$/g, '');
                    fields.push(cleanFieldName);
                }
            }
            result[displayType] = fields;
            console.log(`   ${displayType}: ${fields.length} 个字段`);
        } else {
            console.log(`   ⚠️ 未找到 ${displayType} 行`);
        }
    }

    return result;
}

// 主函数
function main() {
    console.log('🚀 开始提取所有页面的字段要求...\n');
    
    const allResults = {};
    
    // 处理每个CSV文件
    for (const [pageName, fileName] of Object.entries(csvFiles)) {
        const csvPath = path.resolve(__dirname, '../generated_sql_imports', fileName);
        
        if (fs.existsSync(csvPath)) {
            allResults[pageName] = processCSVFile(csvPath, fileName);
        } else {
            console.log(`❌ 文件不存在: ${fileName}`);
        }
    }

    // 输出结果
    console.log('\n' + '='.repeat(60));
    console.log('📋 所有页面字段提取结果');
    console.log('='.repeat(60));

    for (const [pageName, pageResults] of Object.entries(allResults)) {
        console.log(`\n🔸 ${pageName}`);
        console.log('-'.repeat(40));
        
        for (const [displayType, fields] of Object.entries(pageResults)) {
            console.log(`\n【${displayType}】(${fields.length} 个字段)`);
            fields.forEach((field, index) => {
                console.log(`  ${index + 1}. ${field}`);
            });
        }
        console.log();
    }

    // 保存到文件
    const outputPath = path.resolve(__dirname, '../output/all-pages-display-fields.json');
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf8');
    console.log(`\n💾 结果已保存到: ${outputPath}`);

    // 生成统计报告
    console.log('\n📊 统计报告:');
    for (const [pageName, pageResults] of Object.entries(allResults)) {
        const totalFields = Object.values(pageResults).reduce((sum, fields) => sum + fields.length, 0);
        console.log(`  ${pageName}: 总计 ${totalFields} 个字段`);
        
        for (const [displayType, fields] of Object.entries(pageResults)) {
            console.log(`    - ${displayType}: ${fields.length} 个字段`);
        }
    }
}

// 执行主函数
main(); 