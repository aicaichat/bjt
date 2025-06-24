#!/usr/bin/env node

/**
 * PO页面字段标准化修复脚本
 * 修复料号字段显示，符合CSV标准要求
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 翻译文件路径
  files: [
    'frontend/src/i18n/locales/en/po.json',
    'frontend/src/i18n/locales/zh/po.json'
  ],
  
  // 修复规则
  fixes: {
    // 英文修复
    'frontend/src/i18n/locales/en/po.json': [
      {
        path: 'table.columns.partNumber',
        old: 'Part No. #',
        new: 'Part No.',
        description: '料号字段标准化：移除多余的#符号'
      }
    ],
    
    // 中文修复  
    'frontend/src/i18n/locales/zh/po.json': [
      {
        path: 'table.columns.partNumber',
        old: '零件号',
        new: '料号', 
        description: '料号字段标准化：零件号→料号'
      }
    ]
  }
};

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 获取嵌套对象的值
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

// 设置嵌套对象的值
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// 备份文件
function backupFile(filePath) {
  const backupPath = `${filePath}.backup`;
  try {
    fs.copyFileSync(filePath, backupPath);
    log(`✅ 备份文件: ${backupPath}`, 'green');
    return true;
  } catch (error) {
    log(`❌ 备份失败 ${filePath}: ${error.message}`, 'red');
    return false;
  }
}

// 修复单个文件
function fixFile(filePath, fixes, dryRun = false) {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      log(`⚠️  文件不存在: ${filePath}`, 'yellow');
      return { success: false, changes: 0 };
    }

    // 读取文件
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    let changeCount = 0;
    const changes = [];

    // 应用修复规则
    for (const fix of fixes) {
      const currentValue = getNestedValue(data, fix.path);
      
      if (currentValue === fix.old) {
        if (!dryRun) {
          setNestedValue(data, fix.path, fix.new);
        }
        changeCount++;
        changes.push({
          path: fix.path,
          old: fix.old,
          new: fix.new,
          description: fix.description
        });
        
        log(`${dryRun ? '🔍' : '✅'} ${fix.description}`, dryRun ? 'blue' : 'green');
        log(`    ${fix.path}: "${fix.old}" → "${fix.new}"`, 'yellow');
      } else if (currentValue !== undefined) {
        log(`⚠️  字段值不匹配: ${fix.path}`, 'yellow');
        log(`    期望: "${fix.old}"`, 'yellow');
        log(`    实际: "${currentValue}"`, 'yellow');
      } else {
        log(`⚠️  字段不存在: ${fix.path}`, 'yellow');
      }
    }

    // 如果不是预览模式且有更改，写入文件
    if (!dryRun && changeCount > 0) {
      // 备份原文件
      if (!backupFile(filePath)) {
        return { success: false, changes: 0 };
      }
      
      // 写入修改后的内容
      const newContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, newContent, 'utf8');
      log(`✅ 已更新文件: ${filePath}`, 'green');
    }

    return { success: true, changes: changeCount, changeDetails: changes };
    
  } catch (error) {
    log(`❌ 处理文件失败 ${filePath}: ${error.message}`, 'red');
    return { success: false, changes: 0 };
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  
  log('🚀 PO页面字段标准化修复脚本', 'blue');
  log('=================================', 'blue');
  
  if (dryRun) {
    log('📋 预览模式 - 不会实际修改文件', 'yellow');
  } else {
    log('⚡ 执行模式 - 将直接修改文件', 'green');
  }
  
  log('');

  let totalChanges = 0;
  let processedFiles = 0;
  let successFiles = 0;

  // 处理每个文件
  for (const filePath of CONFIG.files) {
    const fixes = CONFIG.fixes[filePath];
    if (!fixes || fixes.length === 0) {
      log(`⚠️  没有为文件配置修复规则: ${filePath}`, 'yellow');
      continue;
    }

    log(`📁 处理文件: ${filePath}`, 'blue');
    processedFiles++;
    
    const result = fixFile(filePath, fixes, dryRun);
    
    if (result.success) {
      successFiles++;
      totalChanges += result.changes;
      
      if (result.changes > 0) {
        log(`✅ 完成 ${result.changes} 处修改`, 'green');
      } else {
        log(`ℹ️  无需修改`, 'blue');
      }
    }
    
    log(''); // 空行分隔
  }

  // 输出总结
  log('📊 修复总结', 'blue');
  log('=============', 'blue');
  log(`处理文件: ${processedFiles}`, 'blue');
  log(`成功文件: ${successFiles}`, 'green');
  log(`总修改数: ${totalChanges}`, totalChanges > 0 ? 'green' : 'blue');
  
  if (dryRun && totalChanges > 0) {
    log('');
    log('💡 要执行实际修复，请运行:', 'yellow');
    log('   node scripts/po-field-fix.js', 'yellow');
  }
  
  if (!dryRun && totalChanges > 0) {
    log('');
    log('🔄 建议重启前端服务以应用更改:', 'yellow');
    log('   ./scripts/docker-dev.sh restart-frontend', 'yellow');
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { fixFile, CONFIG }; 