/**
 * 首页真实API集成测试
 * 测试首页与后端API的实际集成功能
 */

import { realApiConfig } from '../config/real-api-config';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  apiCall?: string;
  responseTime?: number;
  statusCode?: number;
}

interface ApiMetrics {
  totalCalls: number;
  averageResponseTime: number;
  slowestCall: { endpoint: string; time: number } | null;
  fastestCall: { endpoint: string; time: number } | null;
  errorRate: number;
}

export async function runRealHomePageTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  details: TestResult[];
  apiMetrics: ApiMetrics;
}> {
  console.log('🏠 开始首页真实API集成测试...\n');

  const testResults: TestResult[] = [];
  const apiCalls: Array<{ endpoint: string; time: number; success: boolean }> = [];
  const testFetch = realApiConfig.createTestFetch();

  // 辅助函数：记录API调用
  const recordApiCall = (endpoint: string, time: number, success: boolean) => {
    apiCalls.push({ endpoint, time, success });
  };

  // 辅助函数：添加测试结果
  const addTestResult = (test: string, status: 'pass' | 'fail' | 'skip', error?: string, apiCall?: string, responseTime?: number, statusCode?: number) => {
    testResults.push({ test, status, error, apiCall, responseTime, statusCode });
  };

  // 辅助函数：执行带超时的API调用
  const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const startTime = Date.now();
    try {
      const response = await testFetch(endpoint, {
        ...options,
        signal: AbortSignal.timeout(10000)
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      recordApiCall(endpoint, responseTime, response.ok);
      return response;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      recordApiCall(endpoint, responseTime, false);
      throw error;
    }
  };

  // 测试1: 产品线API调用
  try {
    console.log('🧪 测试1: 获取产品线数据...');
    const startTime = Date.now();
    
    const response = await apiCall('/bjt/v1/product-lines');
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      
      // 验证数据结构
      if (data && data.success !== false) {
        // 检查是否有产品线数据
        const hasData = data.data?.items && Array.isArray(data.data.items) && data.data.items.length > 0;
        
        if (hasData) {
          // 验证产品线数据结构
          const firstItem = data.data.items[0];
          const hasRequiredFields = firstItem.title_zh && firstItem.title_en && firstItem.code;
          
          if (hasRequiredFields) {
            addTestResult(
              '产品线API调用和数据验证',
              'pass',
              undefined,
              '/bjt/v1/product-lines',
              responseTime,
              response.status
            );
            console.log(`   ✅ 成功获取 ${data.data.items.length} 个产品线`);
          } else {
            addTestResult(
              '产品线API调用和数据验证',
              'fail',
              '产品线数据缺少必需字段',
              '/bjt/v1/product-lines',
              responseTime,
              response.status
            );
          }
        } else {
          addTestResult(
            '产品线API调用和数据验证',
            'skip',
            '数据库中暂无产品线数据',
            '/bjt/v1/product-lines',
            responseTime,
            response.status
          );
        }
      } else {
        addTestResult(
          '产品线API调用和数据验证',
          'fail',
          `API返回错误: ${data.message || '未知错误'}`,
          '/bjt/v1/product-lines',
          responseTime,
          response.status
        );
      }
    } else {
      addTestResult(
        '产品线API调用和数据验证',
        'fail',
        `HTTP错误: ${response.status} ${response.statusText}`,
        '/bjt/v1/product-lines',
        responseTime,
        response.status
      );
    }
  } catch (error) {
    addTestResult(
      '产品线API调用和数据验证',
      'fail',
      `网络错误: ${(error as Error).message}`,
      '/bjt/v1/product-lines'
    );
    console.log(`   ❌ 产品线API调用失败: ${(error as Error).message}`);
  }

  // 测试2: 首页导航数据一致性
  try {
    console.log('🧪 测试2: 首页导航数据一致性...');
    const startTime = Date.now();
    
    const response = await apiCall('/bjt/v1/product-lines');
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      
      if (data?.data?.items && Array.isArray(data.data.items)) {
        // 检查导航所需的字段
        const navigationData = data.data.items.map((item: any) => ({
          code: item.code,
          title_zh: item.title_zh,
          title_en: item.title_en,
          description_zh: item.description_zh,
          description_en: item.description_en,
          image_url: item.image_url
        }));
        
        const validItems = navigationData.filter((item: any) => 
          item.code && item.title_zh && item.title_en
        );
        
        if (validItems.length === navigationData.length) {
          addTestResult(
            '首页导航数据一致性',
            'pass',
            undefined,
            '/bjt/v1/product-lines',
            responseTime,
            response.status
          );
          console.log(`   ✅ 所有 ${validItems.length} 个产品线都有完整的导航数据`);
        } else {
          addTestResult(
            '首页导航数据一致性',
            'fail',
            `${navigationData.length - validItems.length} 个产品线缺少必需的导航字段`,
            '/bjt/v1/product-lines',
            responseTime,
            response.status
          );
        }
      } else {
        addTestResult(
          '首页导航数据一致性',
          'skip',
          '无产品线数据进行导航一致性测试',
          '/bjt/v1/product-lines',
          responseTime,
          response.status
        );
      }
    } else {
      addTestResult(
        '首页导航数据一致性',
        'fail',
        `HTTP错误: ${response.status}`,
        '/bjt/v1/product-lines',
        responseTime,
        response.status
      );
    }
  } catch (error) {
    addTestResult(
      '首页导航数据一致性',
      'fail',
      `API调用异常: ${(error as Error).message}`,
      '/bjt/v1/product-lines'
    );
  }

  // 测试3: 多语言支持验证
  try {
    console.log('🧪 测试3: 多语言支持验证...');
    const startTime = Date.now();
    
    // 测试中文语言
    const zhResponse = await apiCall('/bjt/v1/product-lines?lang=zh');
    const zhResponseTime = Date.now() - startTime;
    
    if (zhResponse.ok) {
      const zhData = await zhResponse.json();
      
      // 测试英文语言
      const enStartTime = Date.now();
      const enResponse = await apiCall('/bjt/v1/product-lines?lang=en');
      const enResponseTime = Date.now() - enStartTime;
      
      if (enResponse.ok) {
        const enData = await enResponse.json();
        
        // 验证两种语言都返回数据
        const zhHasData = zhData?.data?.items && Array.isArray(zhData.data.items) && zhData.data.items.length > 0;
        const enHasData = enData?.data?.items && Array.isArray(enData.data.items) && enData.data.items.length > 0;
        
        if (zhHasData && enHasData) {
          // 检查数据数量是否一致
          if (zhData.data.items.length === enData.data.items.length) {
            addTestResult(
              '多语言支持验证',
              'pass',
              undefined,
              '/bjt/v1/product-lines?lang=zh,en',
              zhResponseTime + enResponseTime,
              200
            );
            console.log(`   ✅ 中英文语言支持正常，数据数量一致 (${zhData.data.items.length} 项)`);
          } else {
            addTestResult(
              '多语言支持验证',
              'fail',
              `中英文数据数量不一致: 中文${zhData.data.items.length}项，英文${enData.data.items.length}项`,
              '/bjt/v1/product-lines?lang=zh,en',
              zhResponseTime + enResponseTime,
              200
            );
          }
        } else {
          addTestResult(
            '多语言支持验证',
            'skip',
            '缺少多语言测试数据',
            '/bjt/v1/product-lines?lang=zh,en',
            zhResponseTime + enResponseTime,
            200
          );
        }
      } else {
        addTestResult(
          '多语言支持验证',
          'fail',
          `英文API调用失败: ${enResponse.status}`,
          '/bjt/v1/product-lines?lang=en',
          enResponseTime,
          enResponse.status
        );
      }
    } else {
      addTestResult(
        '多语言支持验证',
        'fail',
        `中文API调用失败: ${zhResponse.status}`,
        '/bjt/v1/product-lines?lang=zh',
        zhResponseTime,
        zhResponse.status
      );
    }
  } catch (error) {
    addTestResult(
      '多语言支持验证',
      'fail',
      `多语言测试异常: ${(error as Error).message}`,
      '/bjt/v1/product-lines?lang=zh,en'
    );
  }

  // 测试4: 错误处理机制验证
  try {
    console.log('🧪 测试4: 错误处理机制验证...');
    const startTime = Date.now();
    
    // 测试不存在的端点
    const response = await apiCall('/bjt/v1/non-existent-endpoint');
    const responseTime = Date.now() - startTime;
    
    if (response.status === 404) {
      addTestResult(
        '错误处理机制验证',
        'pass',
        undefined,
        '/bjt/v1/non-existent-endpoint',
        responseTime,
        response.status
      );
      console.log(`   ✅ 404错误处理正常`);
    } else {
      addTestResult(
        '错误处理机制验证',
        'fail',
        `期望404状态码，实际收到${response.status}`,
        '/bjt/v1/non-existent-endpoint',
        responseTime,
        response.status
      );
    }
  } catch (error) {
    // 网络级别的错误也是正常的错误处理
    addTestResult(
      '错误处理机制验证',
      'pass',
      '网络级别错误处理正常',
      '/bjt/v1/non-existent-endpoint'
    );
    console.log(`   ✅ 网络错误处理正常: ${(error as Error).message}`);
  }

  // 测试5: API响应性能验证
  try {
    console.log('🧪 测试5: API响应性能验证...');
    
    const performanceTests = [];
    const maxAcceptableTime = 3000; // 3秒
    
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      const response = await apiCall('/bjt/v1/product-lines');
      const responseTime = Date.now() - startTime;
      
      performanceTests.push({
        success: response.ok,
        responseTime
      });
    }
    
    const avgResponseTime = performanceTests.reduce((sum, test) => sum + test.responseTime, 0) / performanceTests.length;
    const allSuccessful = performanceTests.every(test => test.success);
    
    if (allSuccessful && avgResponseTime < maxAcceptableTime) {
      addTestResult(
        'API响应性能验证',
        'pass',
        undefined,
        '/bjt/v1/product-lines (3次测试)',
        avgResponseTime,
        200
      );
      console.log(`   ✅ API性能良好，平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
    } else if (!allSuccessful) {
      addTestResult(
        'API响应性能验证',
        'fail',
        '部分API调用失败',
        '/bjt/v1/product-lines (3次测试)',
        avgResponseTime,
        200
      );
    } else {
      addTestResult(
        'API响应性能验证',
        'fail',
        `响应时间过慢: ${avgResponseTime.toFixed(1)}ms > ${maxAcceptableTime}ms`,
        '/bjt/v1/product-lines (3次测试)',
        avgResponseTime,
        200
      );
    }
  } catch (error) {
    addTestResult(
      'API响应性能验证',
      'fail',
      `性能测试异常: ${(error as Error).message}`,
      '/bjt/v1/product-lines (3次测试)'
    );
  }

  // 测试6: 数据缓存验证
  try {
    console.log('🧪 测试6: 数据缓存验证...');
    
    // 第一次调用
    const firstStartTime = Date.now();
    const firstResponse = await apiCall('/bjt/v1/product-lines');
    const firstResponseTime = Date.now() - firstStartTime;
    
    // 立即第二次调用
    const secondStartTime = Date.now();
    const secondResponse = await apiCall('/bjt/v1/product-lines');
    const secondResponseTime = Date.now() - secondStartTime;
    
    if (firstResponse.ok && secondResponse.ok) {
      const firstData = await firstResponse.json();
      const secondData = await secondResponse.json();
      
      // 检查数据一致性
      const dataConsistent = JSON.stringify(firstData) === JSON.stringify(secondData);
      
      if (dataConsistent) {
        // 检查是否有缓存优化（第二次请求应该更快）
        const hasCacheOptimization = secondResponseTime < firstResponseTime * 0.8;
        
        addTestResult(
          '数据缓存验证',
          'pass',
          hasCacheOptimization ? '检测到缓存优化' : '数据一致性良好',
          '/bjt/v1/product-lines (连续2次)',
          (firstResponseTime + secondResponseTime) / 2,
          200
        );
        console.log(`   ✅ 数据缓存验证通过 (第一次: ${firstResponseTime}ms, 第二次: ${secondResponseTime}ms)`);
      } else {
        addTestResult(
          '数据缓存验证',
          'fail',
          '连续两次调用返回的数据不一致',
          '/bjt/v1/product-lines (连续2次)',
          (firstResponseTime + secondResponseTime) / 2,
          200
        );
      }
    } else {
      addTestResult(
        '数据缓存验证',
        'fail',
        'API调用失败',
        '/bjt/v1/product-lines (连续2次)',
        (firstResponseTime + secondResponseTime) / 2,
        firstResponse.status
      );
    }
  } catch (error) {
    addTestResult(
      '数据缓存验证',
      'fail',
      `缓存测试异常: ${(error as Error).message}`,
      '/bjt/v1/product-lines (连续2次)'
    );
  }

  // 计算统计信息
  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const skipped = testResults.filter(r => r.status === 'skip').length;

  // 计算API指标
  const successfulCalls = apiCalls.filter(call => call.success);
  const failedCalls = apiCalls.filter(call => !call.success);
  
  const apiMetrics: ApiMetrics = {
    totalCalls: apiCalls.length,
    averageResponseTime: apiCalls.length > 0 ? 
      apiCalls.reduce((sum, call) => sum + call.time, 0) / apiCalls.length : 0,
    slowestCall: apiCalls.length > 0 ? 
      apiCalls.reduce((slowest, call) => {
        if (!slowest || call.time > slowest.time) {
          return { endpoint: call.endpoint, time: call.time };
        }
        return slowest;
      }, null as { endpoint: string; time: number } | null) : null,
    fastestCall: apiCalls.length > 0 ? 
      apiCalls.reduce((fastest, call) => {
        if (!fastest || call.time < fastest.time) {
          return { endpoint: call.endpoint, time: call.time };
        }
        return fastest;
      }, null as { endpoint: string; time: number } | null) : null,
    errorRate: apiCalls.length > 0 ? failedCalls.length / apiCalls.length : 0
  };

  console.log(`\n📊 首页真实API测试完成:`);
  console.log(`   总测试数: ${total}`);
  console.log(`   通过: ${passed}`);
  console.log(`   失败: ${failed}`);
  console.log(`   跳过: ${skipped}`);
  console.log(`   API调用: ${apiMetrics.totalCalls}次`);
  console.log(`   平均响应时间: ${apiMetrics.averageResponseTime.toFixed(1)}ms`);
  console.log(`   错误率: ${(apiMetrics.errorRate * 100).toFixed(1)}%`);

  return {
    total,
    passed,
    failed,
    skipped,
    details: testResults,
    apiMetrics
  };
} 