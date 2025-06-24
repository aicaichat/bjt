#!/usr/bin/env node

/**
 * API集成验证脚本
 * 验证前后端API集成状态，包括字段映射、订单号一致性等
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始验证API后端集成...\n');

// 验证配置
const verifications = {
  configFiles: [
    'src/api/config.ts',
    'src/services/apiAdapter.ts',
    'src/services/orderService.ts',
    'src/utils/orderNumberUtils.ts'
  ],
  backendFiles: [
    '../plugins/bjt-core-entities/controllers/class-order-controller.php',
    '../plugins/bjt-core-entities/bjt-product-api.php'
  ],
  testFiles: [
    'public/test-api-integration.html'
  ]
};

let passedChecks = 0;
let totalChecks = 0;

function checkFile(filePath, description) {
  totalChecks++;
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}: 存在`);
    passedChecks++;
    return true;
  } else {
    console.log(`❌ ${description}: 缺失 (${filePath})`);
    return false;
  }
}

function checkFileContent(filePath, patterns, description) {
  totalChecks++;
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${description}: 文件不存在 (${filePath})`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const missingPatterns = patterns.filter(pattern => !content.includes(pattern));
    
    if (missingPatterns.length === 0) {
      console.log(`✅ ${description}: 内容验证通过`);
      passedChecks++;
      return true;
    } else {
      console.log(`❌ ${description}: 缺少内容 - ${missingPatterns.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: 读取文件失败 - ${error.message}`);
    return false;
  }
}

// 1. 验证配置文件
console.log('📋 验证前端配置文件:');
verifications.configFiles.forEach(file => {
  checkFile(file, `配置文件 ${file}`);
});

// 2. 验证后端文件
console.log('\n📋 验证后端文件:');
verifications.backendFiles.forEach(file => {
  checkFile(file, `后端文件 ${file}`);
});

// 3. 验证测试文件
console.log('\n📋 验证测试文件:');
verifications.testFiles.forEach(file => {
  checkFile(file, `测试文件 ${file}`);
});

// 4. 验证API适配器内容
console.log('\n🔧 验证API适配器实现:');
checkFileContent('src/services/apiAdapter.ts', [
  'convertOrderToApiFormat',
  'convertApiResponseToFrontend',
  'OrderApiAdapter',
  'order_number',
  'orderNumber'
], 'API适配器字段映射');

// 5. 验证订单号管理器
console.log('\n🔧 验证订单号管理器:');
checkFileContent('src/utils/orderNumberUtils.ts', [
  'PO-',
  'YYYYMMDDHHMM',
  'generateOrderNumber',
  'extractFromApiResponse'
], '订单号统一格式');

// 6. 验证后端订单号生成
console.log('\n🔧 验证后端订单号生成:');
checkFileContent('../plugins/bjt-core-entities/controllers/class-order-controller.php', [
  'PO-',
  'YmdHi',
  'generate_order_number'
], '后端订单号格式');

// 7. 验证环境变量配置
console.log('\n🔧 验证环境配置:');
const envFiles = ['.env', '.env.local', '.env.development'];
let envFound = false;

envFiles.forEach(envFile => {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    if (content.includes('VITE_API_URL') || content.includes('VITE_USE_MOCK_DATA')) {
      console.log(`✅ 环境配置: 在 ${envFile} 中找到API配置`);
      envFound = true;
    }
  }
});

if (!envFound) {
  console.log('⚠️ 环境配置: 未找到API配置，将使用默认值');
}

// 8. 验证Mock数据禁用
console.log('\n🔧 验证Mock数据禁用:');
checkFileContent('src/config/appConfig.ts', [
  'USE_MOCK_DATA: false'
], 'Mock数据禁用配置');

checkFileContent('src/services/mockService.ts', [
  'return false'
], 'Mock服务禁用');

// 9. 验证订单服务更新
console.log('\n🔧 验证订单服务更新:');
checkFileContent('src/services/orderService.ts', [
  'OrderApiAdapter',
  '使用API适配器'
], '订单服务API适配器集成');

// 10. 生成集成报告
console.log('\n📊 API集成验证报告:');
console.log('='.repeat(50));
console.log(`总检查项: ${totalChecks}`);
console.log(`通过检查: ${passedChecks}`);
console.log(`失败检查: ${totalChecks - passedChecks}`);
console.log(`通过率: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 所有检查通过！API后端集成状态良好。');
} else if (passedChecks / totalChecks >= 0.8) {
  console.log('\n⚠️ 大部分检查通过，但仍有一些问题需要解决。');
} else {
  console.log('\n❌ 多项检查失败，需要完善API集成。');
}

// 11. 提供修复建议
console.log('\n💡 修复建议:');
console.log('1. 确保所有配置文件存在且配置正确');
console.log('2. 检查API适配器的字段映射是否完整');
console.log('3. 验证订单号格式在前后端保持一致');
console.log('4. 确保Mock数据已完全禁用');
console.log('5. 测试API端点是否可访问');

console.log('\n🔧 下一步操作:');
console.log('1. 运行 npm run dev 启动开发服务器');
console.log('2. 访问 http://localhost:5173/test-api-integration.html 进行集成测试');
console.log('3. 检查浏览器控制台的API调用日志');
console.log('4. 验证订单创建和数据保存流程');

process.exit(passedChecks === totalChecks ? 0 : 1); 