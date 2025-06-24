#!/usr/bin/env node

/**
 * 主机页面字段标准化修复脚本（完整版）
 * 修复所有遗漏的字段，包括units.lbs字段
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 翻译文件路径
  files: [
    'frontend/src/i18n/locales/en/machines.json',
    'frontend/src/i18n/locales/zh/machines.json'
  ],
  
  // 修复规则
  fixes: {
    // 英文修复
    'frontend/src/i18n/locales/en/machines.json': [
      {
        path: 'tableHeaders.packageSize',
        old: 'Package Size',
        new: 'Packaging Dim.',
        description: '表头包装尺寸字段标准化：Package Size → Packaging Dim.'
      },
      {
        path: 'tableHeaders.pcsPerBox',
        old: 'Pieces per Box',
        new: 'Qty per Carton',
        description: '表头单箱数量字段标准化：Pieces per Box → Qty per Carton'
      },
      {
        path: 'tableHeaders.pcsPerPallet',
        old: 'Pieces per Pallet',
        new: 'Packs per Pallet',
        description: '表头托盘数量字段标准化：Pieces per Pallet → Packs per Pallet'
      },
      {
        path: 'palletQty',
        old: 'Pieces per Pallet',
        new: 'Packs per Pallet',
        description: '托盘数量字段标准化：Pieces per Pallet → Packs per Pallet'
      },
      {
        path: 'specs.partNumber',
        old: 'Part Number',
        new: 'Part No.',
        description: '规格料号字段标准化：Part Number → Part No.'
      },
      {
        path: 'specs.compatibility',
        old: 'Compatible Models',
        new: 'Applicable Machine',
        description: '兼容性字段标准化：Compatible Models → Applicable Machine'
      },
      {
        path: 'units.lbs',
        old: 'lbs',
        new: 'lb',
        description: '⭐ 重量单位标准化：lbs → lb'
      }
    ],
    
    // 中文修复  
    'frontend/src/i18n/locales/zh/machines.json': [
      {
        path: 'specs.partNumber',
        old: '零件号',
        new: '料号',
        description: '料号字段标准化：零件号 → 料号'
      },
      {
        path: 'tableHeaders.pcsPerBox',
        old: '每箱数量',
        new: '单箱数量',
        description: '表头单箱数量字段标准化：每箱数量 → 单箱数量'
      },
      {
        path: 'units.lbs',
        old: 'lbs',
        new: 'lb',
        description: '⭐ 重量单位标准化：lbs → lb'
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
  magenta: '\x1b[35m',
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
  const backupPath = `${filePath}.backup-complete`;
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
    let criticalChanges = 0;
    const changes = [];

    // 应用修复规则
    for (const fix of fixes) {
      const currentValue = getNestedValue(data, fix.path);
      
      if (currentValue === fix.old) {
        if (!dryRun) {
          setNestedValue(data, fix.path, fix.new);
        }
        changeCount++;
        
        // 检查是否是关键修复（lbs → lb）
        if (fix.description.includes('⭐')) {
          criticalChanges++;
        }
        
        changes.push({
          path: fix.path,
          old: fix.old,
          new: fix.new,
          description: fix.description
        });
        
        const icon = dryRun ? '🔍' : '✅';
        const color = fix.description.includes('⭐') ? 'magenta' : (dryRun ? 'blue' : 'green');
        
        log(`${icon} ${fix.description}`, color);
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

    return { 
      success: true, 
      changes: changeCount, 
      criticalChanges: criticalChanges,
      changeDetails: changes 
    };
    
  } catch (error) {
    log(`❌ 处理文件失败 ${filePath}: ${error.message}`, 'red');
    return { success: false, changes: 0 };
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  
  log('🚀 主机页面字段标准化修复脚本（完整版）', 'blue');
  log('==========================================', 'blue');
  
  if (dryRun) {
    log('📋 预览模式 - 不会实际修改文件', 'yellow');
  } else {
    log('⚡ 执行模式 - 将直接修改文件', 'green');
  }
  
  log('');
  log('🎯 本次修复重点：遗漏的lbs → lb单位标准化', 'magenta');
  log('');

  let totalChanges = 0;
  let totalCriticalChanges = 0;
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
      totalCriticalChanges += result.criticalChanges || 0;
      
      if (result.changes > 0) {
        log(`✅ 完成 ${result.changes} 处修改`, 'green');
        if (result.criticalChanges > 0) {
          log(`⭐ 其中 ${result.criticalChanges} 处为关键修复(lbs→lb)`, 'magenta');
        }
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
  log(`关键修复: ${totalCriticalChanges}`, totalCriticalChanges > 0 ? 'magenta' : 'blue');
  
  if (dryRun && totalChanges > 0) {
    log('');
    log('💡 要执行实际修复，请运行:', 'yellow');
    log('   node scripts/machines-field-fix-complete.js', 'yellow');
  }
  
  if (!dryRun && totalChanges > 0) {
    log('');
    log('🔄 建议重启前端服务以应用更改:', 'yellow');
    log('   ./scripts/docker-dev.sh restart-frontend', 'yellow');
    
    if (totalCriticalChanges > 0) {
      log('');
      log('⭐ 关键修复已完成！截图中的lbs显示问题应该已解决。', 'magenta');
    }
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { fixFile, CONFIG }; 