#!/usr/bin/env node

/**
 * 🔍 CDN配置检查工具
 * 验证购物车API是否正确配置了防缓存设置
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// 配置项
const CONFIG = {
  domain: 'eorder.lockedair.com',
  apis: [
    // 🛒 购物车相关API（高优先级）
    '/wp-json/bjt/v1/cart',
    '/wp-json/bjt/v1/order',
    '/wp-json/bjt/v1/login',
    
    // 🔐 认证和用户API
    '/wp-json/bjt/v1/auth',
    '/wp-json/bjt/v1/user',
    
    // 🔧 Admin管理API（新增）
    '/wp-json/bjt/v1/product-lines',
    '/wp-json/bjt/v1/host-models',
    '/wp-json/bjt/v1/machineparts',
    '/wp-json/bjt/v1/relations',
    '/wp-json/bjt/v1/accessory-models',
    '/wp-json/bjt/v1/accessories',
    '/wp-json/bjt/v1/consumables',
    '/wp-json/bjt/v1/shapes',
    '/wp-json/bjt/v1/materials',
    '/wp-json/bjt/v1/settings',
    '/wp-json/bjt/v1/admin/import',
    '/wp-json/bjt/v1/admin/export'
  ],
  timeout: 10000,
  userAgent: 'CDN-Config-Checker/1.0'
};

// 输出样式
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// HTTP请求封装
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: CONFIG.timeout
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// 检查单个API的缓存配置
async function checkApiCacheConfig(apiPath) {
  const url = `https://${CONFIG.domain}${apiPath}`;
  
  try {
    console.log(`\n${colorize('🔍 检查:', 'cyan')} ${apiPath}`);
    console.log(`${colorize('📡 URL:', 'blue')} ${url}`);
    
    const response = await makeRequest(url, 'HEAD');
    
    // 检查响应状态
    const statusOk = response.statusCode >= 200 && response.statusCode < 300;
    console.log(`${colorize('📊 状态码:', 'blue')} ${statusOk ? colorize(response.statusCode, 'green') : colorize(response.statusCode, 'red')}`);
    
    // 检查缓存相关头部
    const headers = response.headers;
    const cacheControl = headers['cache-control'] || '';
    const pragma = headers['pragma'] || '';
    const expires = headers['expires'] || '';
    const etag = headers['etag'] || '';
    const lastModified = headers['last-modified'] || '';
    
    console.log(`${colorize('🔧 缓存头部分析:', 'yellow')}`);
    
    // Cache-Control 检查
    const hasNoCache = cacheControl.includes('no-cache');
    const hasNoStore = cacheControl.includes('no-store');
    const hasMustRevalidate = cacheControl.includes('must-revalidate');
    
    console.log(`   Cache-Control: ${cacheControl ? colorize(cacheControl, hasNoCache ? 'green' : 'red') : colorize('未设置', 'red')}`);
    console.log(`      ✓ no-cache: ${hasNoCache ? colorize('✓', 'green') : colorize('✗', 'red')}`);
    console.log(`      ✓ no-store: ${hasNoStore ? colorize('✓', 'green') : colorize('✗', 'red')}`);
    console.log(`      ✓ must-revalidate: ${hasMustRevalidate ? colorize('✓', 'green') : colorize('✗', 'red')}`);
    
    // Pragma 检查
    const pragmaOk = pragma.includes('no-cache');
    console.log(`   Pragma: ${pragma ? colorize(pragma, pragmaOk ? 'green' : 'red') : colorize('未设置', 'red')}`);
    
    // Expires 检查
    const expiresOk = expires && (new Date(expires) < new Date());
    console.log(`   Expires: ${expires ? colorize(expires, expiresOk ? 'green' : 'red') : colorize('未设置', 'red')}`);
    
    // ETag 和 Last-Modified 检查
    if (etag) {
      console.log(`   ETag: ${colorize(etag, 'yellow')} ${colorize('(注意：动态API不应设置ETag)', 'yellow')}`);
    }
    if (lastModified) {
      console.log(`   Last-Modified: ${colorize(lastModified, 'yellow')} ${colorize('(注意：动态API不应设置Last-Modified)', 'yellow')}`);
    }
    
    // 综合评分
    const score = (hasNoCache ? 1 : 0) + (hasNoStore ? 1 : 0) + (hasMustRevalidate ? 1 : 0) + (pragmaOk ? 1 : 0) + (expiresOk ? 1 : 0);
    const maxScore = 5;
    const percentage = (score / maxScore) * 100;
    
    let grade, gradeColor;
    if (percentage >= 80) {
      grade = '优秀';
      gradeColor = 'green';
    } else if (percentage >= 60) {
      grade = '良好';
      gradeColor = 'yellow';
    } else {
      grade = '需要修复';
      gradeColor = 'red';
    }
    
    console.log(`${colorize('📈 配置评分:', 'blue')} ${colorize(`${score}/${maxScore} (${percentage.toFixed(0)}%)`, gradeColor)} - ${colorize(grade, gradeColor)}`);
    
    return {
      apiPath,
      statusCode: response.statusCode,
      score,
      maxScore,
      percentage,
      grade,
      issues: {
        noCache: !hasNoCache,
        noStore: !hasNoStore,
        mustRevalidate: !hasMustRevalidate,
        pragma: !pragmaOk,
        expires: !expiresOk,
        hasETag: !!etag,
        hasLastModified: !!lastModified
      }
    };
    
  } catch (error) {
    console.log(`${colorize('❌ 错误:', 'red')} ${error.message}`);
    return {
      apiPath,
      error: error.message,
      score: 0,
      maxScore: 5,
      percentage: 0,
      grade: '检查失败'
    };
  }
}

// 生成修复建议
function generateFixSuggestions(results) {
  console.log(`\n${colorize('🔧 修复建议:', 'bold')}`);
  
  const failedApis = results.filter(r => r.percentage < 80);
  
  if (failedApis.length === 0) {
    console.log(`${colorize('🎉 所有API配置都很完美！', 'green')}`);
    return;
  }
  
  console.log(`\n${colorize('需要修复的API:', 'red')}`);
  failedApis.forEach(api => {
    console.log(`  • ${api.apiPath} (${api.percentage.toFixed(0)}%)`);
  });
  
  console.log(`\n${colorize('阿里云CDN配置步骤:', 'yellow')}`);
  console.log(`${colorize('1. 缓存规则配置:', 'blue')}`);
  console.log(`   - 进入CDN控制台 → 缓存配置 → 缓存规则`);
  console.log(`   - 为每个API路径添加"不缓存"规则`);
  console.log(`   - 设置优先级10-6（购物车API优先级最高）`);
  
  console.log(`\n${colorize('2. HTTP头管理:', 'blue')}`);
  console.log(`   - 进入CDN控制台 → 高级配置 → HTTP头管理`);
  console.log(`   - 为每个API路径添加以下响应头：`);
  console.log(`     * Cache-Control: no-cache, no-store, must-revalidate`);
  console.log(`     * Pragma: no-cache`);
  console.log(`     * Expires: Thu, 01 Jan 1970 00:00:00 GMT`);
  
  console.log(`\n${colorize('3. 缓存刷新:', 'blue')}`);
  console.log(`   - 进入CDN控制台 → 刷新缓存 → 缓存刷新`);
  console.log(`   - 选择"目录刷新"，输入API路径`);
  console.log(`   - 等待5-10分钟生效`);
  
  console.log(`\n${colorize('4. 快速修复命令:', 'cyan')}`);
  console.log(`   如果你有阿里云CLI，可以使用以下命令：`);
  failedApis.forEach(api => {
    console.log(`   aliyun cdn RefreshObjectCaches --ObjectPath="${api.apiPath}" --ObjectType=Directory`);
  });
}

// 实时测试购物车功能
async function testShoppingCartFunction() {
  console.log(`\n${colorize('🛒 购物车功能测试:', 'bold')}`);
  
  const testUrl = `https://${CONFIG.domain}/wp-json/bjt/v1/cart`;
  
  try {
    console.log(`${colorize('📡 测试URL:', 'blue')} ${testUrl}`);
    
    // 模拟获取购物车
    const getResponse = await makeRequest(testUrl, 'GET');
    console.log(`${colorize('GET请求:', 'green')} ${getResponse.statusCode}`);
    
    // 检查响应时间
    const startTime = Date.now();
    await makeRequest(testUrl, 'GET');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`${colorize('响应时间:', 'blue')} ${responseTime}ms ${responseTime < 500 ? colorize('(快)', 'green') : colorize('(慢)', 'red')}`);
    
    // 检查是否返回JSON
    const isJson = getResponse.headers['content-type']?.includes('application/json');
    console.log(`${colorize('响应格式:', 'blue')} ${isJson ? colorize('JSON ✓', 'green') : colorize('非JSON ✗', 'red')}`);
    
    return {
      working: getResponse.statusCode === 200,
      responseTime,
      isJson
    };
    
  } catch (error) {
    console.log(`${colorize('❌ 购物车测试失败:', 'red')} ${error.message}`);
    return {
      working: false,
      error: error.message
    };
  }
}

// 主函数
async function main() {
  console.log(`${colorize('🚀 CDN配置检查工具', 'bold')}`);
  console.log(`${colorize('域名:', 'blue')} ${CONFIG.domain}`);
  console.log(`${colorize('检查时间:', 'blue')} ${new Date().toLocaleString()}`);
  
  console.log(`\n${colorize('═'.repeat(60), 'cyan')}`);
  console.log(`${colorize('开始检查API缓存配置...', 'bold')}`);
  
  const results = [];
  
  // 逐个检查API
  for (const apiPath of CONFIG.apis) {
    const result = await checkApiCacheConfig(apiPath);
    results.push(result);
    
    // 添加分隔线
    if (apiPath !== CONFIG.apis[CONFIG.apis.length - 1]) {
      console.log(`${colorize('─'.repeat(50), 'cyan')}`);
    }
  }
  
  // 生成总结报告
  console.log(`\n${colorize('═'.repeat(60), 'cyan')}`);
  console.log(`${colorize('📊 检查结果总结:', 'bold')}`);
  
  const successCount = results.filter(r => r.percentage >= 80).length;
  const warningCount = results.filter(r => r.percentage >= 60 && r.percentage < 80).length;
  const errorCount = results.filter(r => r.percentage < 60).length;
  
  console.log(`${colorize('✅ 配置优秀:', 'green')} ${successCount} 个API`);
  console.log(`${colorize('⚠️  配置良好:', 'yellow')} ${warningCount} 个API`);
  console.log(`${colorize('❌ 需要修复:', 'red')} ${errorCount} 个API`);
  
  const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
  console.log(`${colorize('📈 平均分数:', 'blue')} ${averageScore.toFixed(1)}%`);
  
  // 生成修复建议
  generateFixSuggestions(results);
  
  // 测试购物车功能
  const cartTest = await testShoppingCartFunction();
  
  console.log(`\n${colorize('🎯 最终状态:', 'bold')}`);
  if (successCount === CONFIG.apis.length && cartTest.working) {
    console.log(`${colorize('🎉 所有配置完美！购物车功能正常！', 'green')}`);
  } else {
    console.log(`${colorize('⚠️  需要继续优化配置', 'yellow')}`);
  }
  
  console.log(`\n${colorize('📚 相关文档:', 'blue')}`);
  console.log(`   • 快速配置清单: ./QUICK_CDN_SETUP_CHECKLIST.md`);
  console.log(`   • 详细配置指南: ./ALIYUN_CDN_DETAILED_CONFIG.md`);
  console.log(`   • 综合配置文档: ./CDN_CACHE_CONFIGURATION.md`);
  
  console.log(`\n${colorize('💡 提示: 配置更改后需要5-10分钟生效时间', 'yellow')}`);
}

// 命令行参数处理
if (process.argv.length > 2) {
  const command = process.argv[2];
  
  if (command === '--help' || command === '-h') {
    console.log(`
${colorize('🔍 CDN配置检查工具', 'bold')}

用法:
  node check-cdn-config.js [选项]

选项:
  --help, -h     显示此帮助信息
  --domain, -d   指定域名 (默认: ${CONFIG.domain})
  --api, -a      指定单个API路径进行检查
  --verbose, -v  显示详细信息

示例:
  node check-cdn-config.js
  node check-cdn-config.js --domain eorder.lockedair.com
  node check-cdn-config.js --api /wp-json/bjt/v1/cart
`);
    process.exit(0);
  } else if (command === '--domain' || command === '-d') {
    CONFIG.domain = process.argv[3] || CONFIG.domain;
  } else if (command === '--api' || command === '-a') {
    CONFIG.apis = [process.argv[3] || CONFIG.apis[0]];
  }
}

// 启动检查
main().catch(console.error); 