import * as fs from 'fs';
import * as path from 'path';
import { replaceI18nKeys } from '../src/utils/i18nKeyReplacer';

// 替换单个文件
console.log('🔍 Starting i18n key replacement...');

// 替换 Machines 页面的翻译键
const machinesFilePath = path.join(__dirname, '../src/pages/Machines/index.tsx');
console.log(`\n📝 Processing ${machinesFilePath}...`);

try {
  const content = fs.readFileSync(machinesFilePath, 'utf8');
  const newContent = replaceI18nKeys(content, 'machines');
  fs.writeFileSync(machinesFilePath, newContent, 'utf8');
  console.log('✅ Successfully replaced i18n keys in Machines page');
} catch (error) {
  console.error('❌ Error:', error);
}

// 如果需要批量处理整个 pages 目录
// console.log('\n📝 Processing all files in pages directory...');
// batchReplaceI18nKeys('src/pages', 'machines');

console.log('\n✅ i18n key replacement completed!'); 