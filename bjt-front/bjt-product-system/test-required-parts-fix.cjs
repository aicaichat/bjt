#!/usr/bin/env node

/**
 * 必选备件功能修复验证脚本
 * 测试前端和后端的必选备件处理逻辑
 */

const https = require('https');
const http = require('http');

// 测试配置
const BACKEND_URL = 'http://localhost:8080';
const FRONTEND_URL = 'http://localhost:5173';

// 测试用例
const TEST_CASES = [
  {
    name: 'FR8002 收卷车 (110V)',
    part_number: '60A11002',
    expected_required_parts: ['05A0101289', '05A0101290'],
    expected_quantities: [2, 2]
  },
  {
    name: 'FR8004 收卷车 (110V)', 
    part_number: '60A11009',
    expected_required_parts: ['05A0101289', '05A0101290'],
    expected_quantities: [2, 2]
  },
  {
    name: 'EC2005 推车',
    part_number: '60A04005',
    expected_required_parts: ['05A0101289', '05A0101290'],
    expected_quantities: [2, 2]
  }
];

// HTTP请求工具函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 测试后端API
async function testBackendAPI(testCase) {
  console.log(`\n🔍 测试后端API: ${testCase.name}`);
  console.log(`   料号: ${testCase.part_number}`);
  
  try {
    const url = `${BACKEND_URL}/wp-json/bjt/v1/accessories?part_number=${testCase.part_number}`;
    const response = await makeRequest(url);
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.status === 200 && response.data.items) {
      const accessory = response.data.items[0];
      if (accessory && accessory.required_parts) {
        console.log(`   ✅ 找到必选备件:`, accessory.required_parts);
        
        // 验证必选备件
        const actualParts = accessory.required_parts.map(p => p.part_number);
        const actualQuantities = accessory.required_parts.map(p => p.quantity);
        
        const partsMatch = JSON.stringify(actualParts.sort()) === JSON.stringify(testCase.expected_required_parts.sort());
        const quantitiesMatch = JSON.stringify(actualQuantities.sort()) === JSON.stringify(testCase.expected_quantities.sort());
        
        if (partsMatch && quantitiesMatch) {
          console.log(`   ✅ 必选备件验证通过`);
          return { success: true, data: accessory.required_parts };
        } else {
          console.log(`   ❌ 必选备件验证失败`);
          console.log(`      期望备件: ${testCase.expected_required_parts.join(',')}`);
          console.log(`      实际备件: ${actualParts.join(',')}`);
          console.log(`      期望数量: ${testCase.expected_quantities.join(',')}`);
          console.log(`      实际数量: ${actualQuantities.join(',')}`);
          return { success: false, error: '必选备件不匹配' };
        }
      } else {
        console.log(`   ❌ 未找到必选备件信息`);
        return { success: false, error: '无必选备件信息' };
      }
    } else {
      console.log(`   ❌ API请求失败: ${response.status}`);
      console.log(`   响应: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false, error: `API请求失败: ${response.status}` };
    }
  } catch (error) {
    console.log(`   ❌ 请求异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 测试前端代理
async function testFrontendProxy(testCase) {
  console.log(`\n🌐 测试前端代理: ${testCase.name}`);
  
  try {
    const url = `${FRONTEND_URL}/wp-json/bjt/v1/accessories?part_number=${testCase.part_number}`;
    const response = await makeRequest(url);
    
    console.log(`   状态码: ${response.status}`);
    
    if (response.status === 200 && response.data.items) {
      console.log(`   ✅ 前端代理工作正常`);
      return { success: true };
    } else {
      console.log(`   ❌ 前端代理失败: ${response.status}`);
      if (response.parseError) {
        console.log(`   解析错误: ${response.parseError}`);
      }
      return { success: false, error: `代理失败: ${response.status}` };
    }
  } catch (error) {
    console.log(`   ❌ 代理请求异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始必选备件功能验证测试\n');
  console.log('=' * 50);
  
  const results = {
    backend: { passed: 0, failed: 0, errors: [] },
    frontend: { passed: 0, failed: 0, errors: [] }
  };
  
  // 测试后端API
  console.log('\n📡 后端API测试');
  console.log('-' * 30);
  
  for (const testCase of TEST_CASES) {
    const result = await testBackendAPI(testCase);
    if (result.success) {
      results.backend.passed++;
    } else {
      results.backend.failed++;
      results.backend.errors.push(`${testCase.name}: ${result.error}`);
    }
  }
  
  // 测试前端代理
  console.log('\n🌐 前端代理测试');
  console.log('-' * 30);
  
  for (const testCase of TEST_CASES) {
    const result = await testFrontendProxy(testCase);
    if (result.success) {
      results.frontend.passed++;
    } else {
      results.frontend.failed++;
      results.frontend.errors.push(`${testCase.name}: ${result.error}`);
    }
  }
  
  // 输出测试结果
  console.log('\n📊 测试结果汇总');
  console.log('=' * 50);
  
  console.log(`\n后端API测试:`);
  console.log(`  ✅ 通过: ${results.backend.passed}/${TEST_CASES.length}`);
  console.log(`  ❌ 失败: ${results.backend.failed}/${TEST_CASES.length}`);
  
  if (results.backend.errors.length > 0) {
    console.log(`  错误详情:`);
    results.backend.errors.forEach(error => console.log(`    - ${error}`));
  }
  
  console.log(`\n前端代理测试:`);
  console.log(`  ✅ 通过: ${results.frontend.passed}/${TEST_CASES.length}`);
  console.log(`  ❌ 失败: ${results.frontend.failed}/${TEST_CASES.length}`);
  
  if (results.frontend.errors.length > 0) {
    console.log(`  错误详情:`);
    results.frontend.errors.forEach(error => console.log(`    - ${error}`));
  }
  
  // 总体结果
  const totalPassed = results.backend.passed + results.frontend.passed;
  const totalTests = TEST_CASES.length * 2;
  
  console.log(`\n🎯 总体结果: ${totalPassed}/${totalTests} 测试通过`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 所有测试通过！必选备件功能修复成功！');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，需要进一步调试');
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testBackendAPI, testFrontendProxy }; 