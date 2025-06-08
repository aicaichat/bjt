#!/usr/bin/env node

/**
 * 耗材页面修复验证脚本
 * 基于CSV文件要求验证修复结果
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证耗材页面修复结果...\n');

// 验证结果统计
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function addResult(type, message, details = '') {
  results[type]++;
  results.details.push({
    type,
    message,
    details,
    timestamp: new Date().toISOString()
  });
  
  const icon = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
  console.log(`${icon} ${message}`);
  if (details) {
    console.log(`   ${details}\n`);
  }
}

// 1. 验证服务文件字段映射
function validateServiceFile() {
  console.log('📋 1. 验证服务文件字段映射...');
  
  const servicePath = path.join(__dirname, '../frontend/src/services/consumablesService.ts');
  
  if (!fs.existsSync(servicePath)) {
    addResult('failed', '服务文件不存在', servicePath);
    return;
  }
  
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  
  // 检查必需字段
  const requiredFields = [
    'app_model: string',
    'shape: string', 
    'material: string',
    'part_number: string',
    'bubble_diameter_met',
    'bubble_diameter_imp',
    'thickness_met',
    'thickness_imp',
    'width_met',
    'width_imp',
    'length_met',
    'length_imp',
    'total_length_met',
    'total_length_imp',
    'pcs_per_box'
  ];
  
  let missingFields = [];
  requiredFields.forEach(field => {
    if (!serviceContent.includes(field)) {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length === 0) {
    addResult('passed', '服务文件字段映射完整');
  } else {
    addResult('failed', '服务文件缺少必需字段', `缺少: ${missingFields.join(', ')}`);
  }
  
  // 检查CSV注释
  if (serviceContent.includes('CSV文件定义的核心字段') && serviceContent.includes('CSV列')) {
    addResult('passed', 'CSV字段注释完整');
  } else {
    addResult('warnings', 'CSV字段注释不完整');
  }
}

// 2. 验证页面组件字段使用
function validatePageComponent() {
  console.log('📋 2. 验证页面组件字段使用...');
  
  const pagePath = path.join(__dirname, '../frontend/src/pages/Consumables/index.tsx');
  
  if (!fs.existsSync(pagePath)) {
    addResult('failed', '页面组件文件不存在', pagePath);
    return;
  }
  
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  
  // 检查新字段的使用
  const newFieldUsages = [
    'item.part_number',
    'item.app_model', 
    'item.shape',
    'item.material',
    'item.bubble_diameter_met',
    'item.bubble_diameter_imp',
    'item.thickness_met',
    'item.thickness_imp',
    'item.width_met',
    'item.width_imp',
    'item.length_met',
    'item.length_imp',
    'item.pcs_per_box'
  ];
  
  let usedFields = [];
  let missingFields = [];
  
  newFieldUsages.forEach(field => {
    if (pageContent.includes(field)) {
      usedFields.push(field);
    } else {
      missingFields.push(field);
    }
  });
  
  if (usedFields.length >= 8) { // 至少使用8个新字段
    addResult('passed', `页面组件使用新字段 (${usedFields.length}/${newFieldUsages.length})`);
  } else {
    addResult('failed', '页面组件新字段使用不足', `仅使用: ${usedFields.length}/${newFieldUsages.length}`);
  }
  
  // 检查智能单位制切换
  if (pageContent.includes('userRegion === \'na\' || userRegion === \'au\'')) {
    addResult('passed', '智能单位制切换逻辑存在');
  } else {
    addResult('warnings', '智能单位制切换逻辑缺失');
  }
  
  // 检查条件显示逻辑
  if (pageContent.includes('bubble') && pageContent.includes('MFB')) {
    addResult('passed', '泡径条件显示逻辑存在');
  } else {
    addResult('warnings', '泡径条件显示逻辑可能缺失');
  }
}

// 3. 验证CSV文件一致性
function validateCSVConsistency() {
  console.log('📋 3. 验证CSV文件一致性...');
  
  const csvPath = path.join(__dirname, '../generated_sql_imports/consumabe.csv');
  
  if (!fs.existsSync(csvPath)) {
    addResult('failed', 'CSV文件不存在', csvPath);
    return;
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  
  // 检查关键行
  if (lines.length >= 10) {
    addResult('passed', 'CSV文件结构完整');
    
    // 检查选型页展示标记（第7行）
    const displayLine = lines[6]; // 0-indexed
    if (displayLine && displayLine.includes('√')) {
      addResult('passed', 'CSV选型页展示标记存在');
    } else {
      addResult('warnings', 'CSV选型页展示标记可能缺失');
    }
  } else {
    addResult('failed', 'CSV文件结构不完整');
  }
}

// 4. 验证备份文件
function validateBackupFiles() {
  console.log('📋 4. 验证备份文件...');
  
  const backupDir = '/tmp';
  const backupPattern = /consumables_upgrade_backup_\d{8}_\d{6}/;
  
  try {
    const files = fs.readdirSync(backupDir);
    const backupDirs = files.filter(file => backupPattern.test(file));
    
    if (backupDirs.length > 0) {
      const latestBackup = backupDirs.sort().pop();
      const backupPath = path.join(backupDir, latestBackup);
      
      const backupFiles = fs.readdirSync(backupPath);
      const expectedFiles = [
        'Consumables_index.tsx.backup',
        'Consumables.css.backup', 
        'consumablesService.ts.backup',
        'current_git_commit.txt',
        'git_status.txt'
      ];
      
      const missingBackups = expectedFiles.filter(file => !backupFiles.includes(file));
      
      if (missingBackups.length === 0) {
        addResult('passed', '备份文件完整', `备份目录: ${backupPath}`);
      } else {
        addResult('warnings', '备份文件不完整', `缺少: ${missingBackups.join(', ')}`);
      }
    } else {
      addResult('warnings', '未找到备份目录');
    }
  } catch (error) {
    addResult('warnings', '无法检查备份文件', error.message);
  }
}

// 5. 验证类型安全
function validateTypeSafety() {
  console.log('📋 5. 验证类型安全...');
  
  const servicePath = path.join(__dirname, '../frontend/src/services/consumablesService.ts');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  
  // 检查必需字段标记
  const requiredFieldPattern = /app_model: string.*必需字段/;
  const shapeFieldPattern = /shape: string.*必需字段/;
  const materialFieldPattern = /material: string.*必需字段/;
  
  if (requiredFieldPattern.test(serviceContent) && 
      shapeFieldPattern.test(serviceContent) && 
      materialFieldPattern.test(serviceContent)) {
    addResult('passed', '必需字段类型定义正确');
  } else {
    addResult('failed', '必需字段类型定义不正确');
  }
  
  // 检查默认值提供
  if (serviceContent.includes('|| \'LA-E4S\'') && 
      serviceContent.includes('|| \'Pillow\'') && 
      serviceContent.includes('|| \'HDPE\'')) {
    addResult('passed', '必需字段默认值提供');
  } else {
    addResult('warnings', '必需字段默认值可能缺失');
  }
}

// 执行所有验证
async function runValidation() {
  validateServiceFile();
  validatePageComponent();
  validateCSVConsistency();
  validateBackupFiles();
  validateTypeSafety();
  
  // 输出总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证结果总结:');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${results.passed}`);
  console.log(`❌ 失败: ${results.failed}`);
  console.log(`⚠️  警告: ${results.warnings}`);
  console.log(`📝 总计: ${results.passed + results.failed + results.warnings}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 耗材页面修复验证通过！');
    console.log('✨ 所有关键功能已正确实现');
  } else {
    console.log('\n⚠️  耗材页面修复存在问题，请检查失败项');
  }
  
  // 输出详细结果
  if (process.argv.includes('--verbose')) {
    console.log('\n📋 详细结果:');
    results.details.forEach((detail, index) => {
      console.log(`${index + 1}. [${detail.type.toUpperCase()}] ${detail.message}`);
      if (detail.details) {
        console.log(`   ${detail.details}`);
      }
    });
  }
  
  console.log('\n💡 提示: 使用 --verbose 参数查看详细结果');
  
  // 返回退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

// 运行验证
runValidation().catch(error => {
  console.error('❌ 验证过程中发生错误:', error);
  process.exit(1);
}); 