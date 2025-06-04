import * as fs from 'fs';
import * as path from 'path';

/**
 * 替换文件中的 i18n 翻译键
 * @param content 文件内容
 * @param namespace 命名空间
 */
export function replaceI18nKeys(content: string, namespace: string): string {
  // 创建正则表达式来匹配 t('namespace.key') 模式
  const regex = new RegExp(`t\\('${namespace}\\.([^']+)'\\)`, 'g');
  
  // 替换所有匹配项
  return content.replace(regex, (match, key) => {
    return `t('${key}')`;
  });
}

/**
 * 批量替换目录下所有文件中的 i18n 翻译键
 * @param directory 目录路径
 * @param namespace 命名空间
 * @param fileExtensions 要处理的文件扩展名数组
 */
export function batchReplaceI18nKeys(
  directory: string,
  namespace: string,
  fileExtensions: string[] = ['.tsx', '.ts', '.jsx', '.js']
) {
  try {
    // 获取目录下所有文件
    const files = fs.readdirSync(directory);
    
    // 遍历所有文件
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // 递归处理子目录
        batchReplaceI18nKeys(filePath, namespace, fileExtensions);
      } else if (stats.isFile()) {
        // 检查文件扩展名
        const ext = path.extname(file);
        if (fileExtensions.includes(ext)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const newContent = replaceI18nKeys(content, namespace);
          fs.writeFileSync(filePath, newContent, 'utf8');
        }
      }
    });
    
    console.log(`✅ Successfully processed all files in ${directory}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing directory ${directory}:`, error);
    return false;
  }
}

// 使用示例：
// const content = fs.readFileSync('path/to/file.tsx', 'utf8');
// const newContent = replaceI18nKeys(content, 'machines');
// fs.writeFileSync('path/to/file.tsx', newContent, 'utf8');
// batchReplaceI18nKeys('frontend/src/pages', 'machines'); 