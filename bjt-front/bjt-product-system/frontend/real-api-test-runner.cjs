#!/usr/bin/env node

/**
 * BJT真实API测试运行器 (CommonJS)
 * 使用Node.js运行真实API集成测试
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出函数
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// 检查环境
function checkEnvironment() {
  log('cyan', '🔍 检查测试环境...\n');
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  log('blue', `Node.js版本: ${nodeVersion}`);
  
  if (parseInt(nodeVersion.slice(1)) < 16) {
    log('red', '❌ 需要Node.js 16或更高版本');
    process.exit(1);
  }
  
  // 检查包文件
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('red', '❌ 找不到package.json文件');
    process.exit(1);
  }
  
  // 检查测试文件
  const testDir = path.join(__dirname, 'src', 'tests', 'real-api');
  if (!fs.existsSync(testDir)) {
    log('red', '❌ 找不到真实API测试目录');
    process.exit(1);
  }
  
  log('green', '✅ 环境检查通过');
}

// 安装依赖
async function installDependencies() {
  log('cyan', '\n📦 检查依赖包...');
  
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('yellow', '⚠️ 未找到node_modules，开始安装依赖...');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          log('green', '✅ 依赖安装完成');
          resolve();
        } else {
          log('red', '❌ 依赖安装失败');
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  } else {
    log('green', '✅ 依赖已存在');
  }
}

// 配置API环境
function configureApiEnvironment() {
  log('cyan', '\n⚙️ 配置API测试环境...');
  
  // 检查环境变量
  const apiEnv = process.env.VITE_API_ENVIRONMENT || 'local';
  const apiUrl = process.env.VITE_API_URL || 'http://127.0.0.1:80/wp-json';
  const useAuth = process.env.VITE_USE_AUTH || 'false';
  
  log('blue', `API环境: ${apiEnv}`);
  log('blue', `API地址: ${apiUrl}`);
  log('blue', `使用认证: ${useAuth}`);
  
  // 写入测试配置文件
  const configContent = `
// 真实API测试配置 (自动生成)
export const TEST_CONFIG = {
  API_ENVIRONMENT: '${apiEnv}',
  API_URL: '${apiUrl}',
  USE_AUTH: ${useAuth === 'true'},
  GENERATED_AT: '${new Date().toISOString()}'
};
`;
  
  const configPath = path.join(__dirname, 'src', 'tests', 'real-api', 'test-config.ts');
  fs.writeFileSync(configPath, configContent);
  
  log('green', '✅ API环境配置完成');
}

// 运行TypeScript测试
async function runTypeScriptTests() {
  log('cyan', '\n🧪 运行真实API集成测试...\n');
  
  return new Promise((resolve, reject) => {
    // 使用简化的JavaScript测试运行器
    const testScriptPath = path.join(__dirname, 'src', 'tests', 'real-api', 'run-tests.cjs');
    
    // 检查测试文件是否存在
    if (!fs.existsSync(testScriptPath)) {
      log('red', `❌ 测试文件不存在: ${testScriptPath}`);
      reject(new Error('测试文件不存在'));
      return;
    }
    
    log('blue', '📦 使用Node.js运行JavaScript测试...');
    log('blue', `执行文件: ${testScriptPath}`);
    
    const child = spawn('node', [testScriptPath], {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log('green', '\n✅ 真实API测试执行完成！');
      } else {
        log('yellow', '\n⚠️ 部分测试失败，请查看详细报告');
      }
      resolve();
    });
    
    child.on('error', (error) => {
      log('red', `\n❌ 测试执行出错: ${error.message}`);
      reject(error);
    });
  });
}

// 生成使用指南
function generateUsageGuide() {
  log('cyan', '\n📚 真实API测试使用指南');
  log('white', '==========================================');
  
  console.log(`
${colors.white}基本用法:${colors.reset}
  node real-api-test-runner.cjs

${colors.white}环境变量配置:${colors.reset}
  VITE_API_ENVIRONMENT=local|docker|staging|production
  VITE_API_URL=http://your-api-url/wp-json
  VITE_USE_AUTH=true|false
  VITE_API_TEST_TOKEN=your-test-jwt-token

${colors.white}示例:${colors.reset}
  # 测试本地环境
  VITE_API_ENVIRONMENT=local node real-api-test-runner.cjs
  
  # 测试Docker环境
  VITE_API_ENVIRONMENT=docker VITE_API_URL=http://127.0.0.1:80/wp-json node real-api-test-runner.cjs
  
  # 测试带认证的环境
  VITE_USE_AUTH=true VITE_API_TEST_TOKEN=your-jwt-token node real-api-test-runner.cjs

${colors.white}输出文件:${colors.reset}
  - real-api-test-results.json: 详细的JSON格式测试报告
  - 控制台输出: 实时测试进度和结果摘要

${colors.white}测试覆盖范围:${colors.reset}
  ✓ 首页产品线API集成
  ✓ 设备页面API集成  
  ✓ 购物车页面API集成
  ✓ API健康检查和性能测试
  ✓ 错误处理和恢复机制
  ✓ 多语言支持验证
`);
  
  log('white', '==========================================');
}

// 主函数
async function main() {
  try {
    // 显示标题
    log('magenta', '\n🌐 BJT真实API集成测试运行器');
    log('magenta', '=====================================\n');
    
    // 检查命令行参数
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
      generateUsageGuide();
      return;
    }
    
    if (args.includes('--version') || args.includes('-v')) {
      const packageJson = require('./package.json');
      log('blue', `版本: ${packageJson.version}`);
      return;
    }
    
    // 执行测试流程
    checkEnvironment();
    await installDependencies();
    configureApiEnvironment();
    await runTypeScriptTests();
    
    log('green', '\n🎉 真实API测试完成！');
    log('blue', '📄 请查看 real-api-test-results.json 获取详细报告');
    
  } catch (error) {
    log('red', `\n❌ 测试运行失败: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  log('red', `\n💥 未捕获的异常: ${error.message}`);
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('red', `\n💥 未处理的Promise拒绝: ${reason}`);
  console.error('Promise:', promise);
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkEnvironment,
  installDependencies,
  configureApiEnvironment,
  runTypeScriptTests,
  generateUsageGuide
}; 