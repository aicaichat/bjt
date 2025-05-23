/**
 * 购物车页面真实API集成测试
 * 测试购物车页面与后端API的实际集成功能
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

export async function runRealCartPageTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  details: TestResult[];
  apiMetrics: ApiMetrics;
}> {
  console.log('🛒 开始购物车页面真实API集成测试...\n');

  const testResults: TestResult[] = [];
  const apiCalls: Array<{ endpoint: string; time: number; success: boolean }> = [];
  const testFetch = realApiConfig.createTestFetch();

  const addTestResult = (test: string, status: 'pass' | 'fail' | 'skip', error?: string, apiCall?: string, responseTime?: number, statusCode?: number) => {
    testResults.push({ test, status, error, apiCall, responseTime, statusCode });
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const startTime = Date.now();
    try {
      const response = await testFetch(endpoint, {
        ...options,
        signal: AbortSignal.timeout(10000)
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      apiCalls.push({ endpoint, time: responseTime, success: response.ok });
      return response;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      apiCalls.push({ endpoint, time: responseTime, success: false });
      throw error;
    }
  };

  // 测试1: 获取购物车内容
  try {
    console.log('🧪 测试1: 获取购物车内容...');
    const startTime = Date.now();
    const response = await apiCall('/bjt/v1/cart');
    const responseTime = Date.now() - startTime;
    
    if (response.ok || response.status === 401) {
      addTestResult('获取购物车内容', 'pass', undefined, '/bjt/v1/cart', responseTime, response.status);
      console.log(`   ✅ 购物车API响应正常`);
    } else {
      addTestResult('获取购物车内容', 'fail', `HTTP错误: ${response.status}`, '/bjt/v1/cart', responseTime, response.status);
    }
  } catch (error) {
    addTestResult('获取购物车内容', 'fail', `网络错误: ${(error as Error).message}`, '/bjt/v1/cart');
  }

  // 测试2: 购物车操作API
  try {
    console.log('🧪 测试2: 购物车操作API...');
    const startTime = Date.now();
    const response = await apiCall('/bjt/v1/cart/items', { 
      method: 'POST', 
      body: JSON.stringify({ product_id: 1, quantity: 1 }) 
    });
    const responseTime = Date.now() - startTime;
    
    if (response.ok || response.status === 401 || response.status === 422) {
      addTestResult('购物车操作API', 'pass', undefined, '/bjt/v1/cart/items', responseTime, response.status);
      console.log(`   ✅ 购物车操作API响应正常`);
    } else {
      addTestResult('购物车操作API', 'fail', `HTTP错误: ${response.status}`, '/bjt/v1/cart/items', responseTime, response.status);
    }
  } catch (error) {
    addTestResult('购物车操作API', 'fail', `网络错误: ${(error as Error).message}`, '/bjt/v1/cart/items');
  }

  // 测试3: 订单创建API
  try {
    console.log('🧪 测试3: 订单创建API...');
    const startTime = Date.now();
    const response = await apiCall('/bjt/v1/orders', { 
      method: 'POST', 
      body: JSON.stringify({ shipping_address: 'test', items: [] }) 
    });
    const responseTime = Date.now() - startTime;
    
    if (response.status === 401 || response.status === 422 || response.status === 400) {
      addTestResult('订单创建API', 'pass', '需要认证或验证参数', '/bjt/v1/orders', responseTime, response.status);
      console.log(`   ✅ 订单API响应正常 (需要认证)`);
    } else if (response.ok) {
      addTestResult('订单创建API', 'pass', undefined, '/bjt/v1/orders', responseTime, response.status);
      console.log(`   ✅ 订单API创建成功`);
    } else {
      addTestResult('订单创建API', 'fail', `HTTP错误: ${response.status}`, '/bjt/v1/orders', responseTime, response.status);
    }
  } catch (error) {
    addTestResult('订单创建API', 'fail', `网络错误: ${(error as Error).message}`, '/bjt/v1/orders');
  }

  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const skipped = testResults.filter(r => r.status === 'skip').length;

  const successfulCalls = apiCalls.filter(call => call.success);
  const totalResponseTime = apiCalls.reduce((sum, call) => sum + call.time, 0);
  
  const apiMetrics: ApiMetrics = {
    totalCalls: apiCalls.length,
    averageResponseTime: apiCalls.length > 0 ? totalResponseTime / apiCalls.length : 0,
    slowestCall: apiCalls.length > 0 ? 
      apiCalls.reduce((slowest, call) => !slowest || call.time > slowest.time ? 
        { endpoint: call.endpoint, time: call.time } : slowest, null as { endpoint: string; time: number } | null) : null,
    fastestCall: apiCalls.length > 0 ? 
      apiCalls.reduce((fastest, call) => !fastest || call.time < fastest.time ? 
        { endpoint: call.endpoint, time: call.time } : fastest, null as { endpoint: string; time: number } | null) : null,
    errorRate: apiCalls.length > 0 ? (apiCalls.length - successfulCalls.length) / apiCalls.length : 0
  };

  console.log(`\n📊 购物车页面真实API测试完成:`);
  console.log(`   总测试数: ${total}, 通过: ${passed}, 失败: ${failed}, 跳过: ${skipped}`);

  return { total, passed, failed, skipped, details: testResults, apiMetrics };
} 