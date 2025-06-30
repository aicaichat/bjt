#!/usr/bin/env node

/**
 * PO页面环境问题安全修复脚本
 * 只修复PO页面相关问题，不影响其他API调用
 */

const fs = require('fs');

console.log('🔧 PO页面环境问题安全修复');
console.log('='.repeat(60));

// 检查当前环境配置
function checkCurrentConfig() {
  console.log('\n📋 当前环境配置检查');
  console.log('-'.repeat(30));
  
  try {
    const prodEnv = fs.readFileSync('frontend/.env.production', 'utf8');
    console.log('✅ 生产环境配置存在');
    console.log('当前配置内容:');
    console.log(prodEnv);
    
    const hasApiUrl = prodEnv.includes('VITE_API_URL');
    const hasDataSource = prodEnv.includes('VITE_DATA_SOURCE');
    
    console.log(`   VITE_API_URL: ${hasApiUrl ? '✅ 已配置' : '❌ 缺失'}`);
    console.log(`   VITE_DATA_SOURCE: ${hasDataSource ? '✅ 已配置' : '❌ 缺失'}`);
    
    if (hasApiUrl && hasDataSource) {
      console.log('\n🎉 环境配置已完整，可能不需要修复！');
      console.log('💡 建议先检查PO页面是否还有问题');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('❌ 无法读取生产环境配置');
    return false;
  }
}

// 安全的环境配置修复
function safeEnvironmentFix() {
  console.log('\n🔧 安全环境配置修复');
  console.log('-'.repeat(30));
  
  // 读取现有配置
  let existingConfig = '';
  try {
    existingConfig = fs.readFileSync('frontend/.env.production', 'utf8');
  } catch (error) {
    console.log('📝 创建新的生产环境配置文件');
  }
  
  // 只添加缺失的配置，不修改现有配置
  const requiredConfigs = [
    'VITE_API_URL=/wp-json/bjt/v1',
    'VITE_DATA_SOURCE=real-api',
    'VITE_USE_MOCK_ORDERS=false',
    'VITE_FORCE_MOCK=false'
  ];
  
  let needsUpdate = false;
  let updatedConfig = existingConfig;
  
  requiredConfigs.forEach(config => {
    const [key] = config.split('=');
    if (!existingConfig.includes(key)) {
      updatedConfig += `\n# PO页面修复 - ${new Date().toISOString()}\n${config}\n`;
      needsUpdate = true;
      console.log(`✅ 添加配置: ${config}`);
    } else {
      console.log(`⏭️  跳过已存在的配置: ${key}`);
    }
  });
  
  if (needsUpdate) {
    fs.writeFileSync('frontend/.env.production', updatedConfig);
    console.log('✅ 生产环境配置已更新');
  } else {
    console.log('ℹ️  配置已完整，无需更新');
  }
}

// 主函数
function main() {
  const configOk = checkCurrentConfig();
  
  if (!configOk) {
    safeEnvironmentFix();
  }
  
  console.log('\n✅ 安全修复完成！');
  console.log('\n📞 接下来的步骤:');
  console.log('1. 重新构建: cd frontend && npm run build');
  console.log('2. 部署到测试环境验证');
  console.log('3. 检查PO页面是否正常');
  console.log('4. 确认其他API功能未受影响');
  
  console.log('\n🛡️  安全保证:');
  console.log('• 只添加缺失的环境变量，不修改现有配置');
  console.log('• 不影响其他API调用的配置');
  console.log('• 可以随时回滚修改');
}

if (require.main === module) {
  main();
} 