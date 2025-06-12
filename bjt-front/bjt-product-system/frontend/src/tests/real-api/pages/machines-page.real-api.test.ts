/**
 * 设备页面真实API集成测试
 * 测试设备页面与后端API的实际集成功能
 */

import { TestResult, ApiMetrics, ApiCall } from '../types';

// API基础URL，可通过环境变量覆盖
const BASE_URL = process.env.API_BASE || 'http://localhost/wp-json/bjt/v1';

// 获取主机料号表
async function getHostParts(token?: string) {
  const res = await fetch(`${BASE_URL}/machineparts?page=1&per_page=10&status=publish`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

// 获取主机下一级配件
async function getMachineAccessories(hostPartNumber: string, token?: string) {
  const res = await fetch(`${BASE_URL}/machines/${hostPartNumber}/accessories?region=CN&lang=zh&status=publish`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

// 获取配件的下一级配件
async function getAccessoryChildren(accessoryPartNumber: string, token?: string) {
  const res = await fetch(`${BASE_URL}/accessories/${accessoryPartNumber}/children?region=CN&lang=zh&page=1&per_page=5&status=publish`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

export async function runRealMachinesPageTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  details: TestResult[];
  apiMetrics: ApiMetrics;
}> {
  const testResults: TestResult[] = [];
  const apiCalls: ApiCall[] = [];

  // 记录API调用
  const recordApiCall = (endpoint: string, time: number, success: boolean) => {
    apiCalls.push({ endpoint, time, success });
  };

  // 添加测试结果
  const addTestResult = (
    test: string,
    status: 'pass' | 'fail' | 'skip',
    error?: string,
    apiCall?: string,
    responseTime?: number,
    statusCode?: number
  ) => {
    testResults.push({ test, status, error, apiCall, responseTime, statusCode });
  };

  // 获取主机料号表
  let hostPartNumber = '';
  try {
    const start = Date.now();
    const data = await getHostParts();
    const end = Date.now();
    recordApiCall('/machineparts', end - start, data.success);
    if (data && data.success && data.data && data.data.items && data.data.items.length > 0) {
      hostPartNumber = data.data.items[0].part_number;
      addTestResult('获取主机料号表', 'pass', undefined, '/machineparts', end - start);
    } else {
      addTestResult('获取主机料号表', 'fail', '未获取到主机料号', '/machineparts', end - start);
    }
  } catch (error: unknown) {
    addTestResult('获取主机料号表', 'fail', `网络错误: ${error instanceof Error ? error.message : String(error)}`, '/machineparts');
  }

  // 获取主机下一级配件
  let accessoryPartNumber = '';
  if (hostPartNumber) {
    try {
      const start = Date.now();
      const data = await getMachineAccessories(hostPartNumber);
      const end = Date.now();
      recordApiCall(`/machines/${hostPartNumber}/accessories`, end - start, data.success);
      if (data && data.success && data.data && data.data.items && data.data.items.length > 0) {
        accessoryPartNumber = data.data.items[0].parts && data.data.items[0].parts[0] && data.data.items[0].parts[0].part_number;
        addTestResult('获取主机下一级配件', 'pass', undefined, `/machines/${hostPartNumber}/accessories`, end - start);
      } else {
        addTestResult('获取主机下一级配件', 'fail', '未获取到主机配件', `/machines/${hostPartNumber}/accessories`, end - start);
      }
    } catch (error: unknown) {
      addTestResult('获取主机下一级配件', 'fail', `网络错误: ${error instanceof Error ? error.message : String(error)}`, `/machines/${hostPartNumber}/accessories`);
    }
  } else {
    addTestResult('获取主机下一级配件', 'skip', '无主机料号，跳过', '/machines/{hostPartNumber}/accessories');
  }

  // 获取配件的下一级配件
  if (accessoryPartNumber) {
    try {
      const start = Date.now();
      const data = await getAccessoryChildren(accessoryPartNumber);
      const end = Date.now();
      recordApiCall(`/accessories/${accessoryPartNumber}/children`, end - start, data.success);
      if (data && data.success) {
        addTestResult('获取配件的下一级配件', 'pass', undefined, `/accessories/${accessoryPartNumber}/children`, end - start);
      } else {
        addTestResult('获取配件的下一级配件', 'fail', '未获取到配件子项', `/accessories/${accessoryPartNumber}/children`, end - start);
      }
    } catch (error: unknown) {
      addTestResult('获取配件的下一级配件', 'fail', `网络错误: ${error instanceof Error ? error.message : String(error)}`, `/accessories/${accessoryPartNumber}/children`);
    }
  } else {
    addTestResult('获取配件的下一级配件', 'skip', '无配件料号，跳过', '/accessories/{accessoryPartNumber}/children');
  }

  // 计算统计信息
  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const skipped = testResults.filter(r => r.status === 'skip').length;

  // 计算API指标
  const successfulCalls = apiCalls.filter(call => call.success);
  const totalResponseTime = apiCalls.reduce((sum, call) => sum + call.time, 0);

  const apiMetrics: ApiMetrics = {
    totalCalls: apiCalls.length,
    averageResponseTime: apiCalls.length > 0 ? totalResponseTime / apiCalls.length : 0,
    slowestCall: apiCalls.length > 0
      ? apiCalls.reduce<{ endpoint: string; time: number } | null>((slowest, call) => {
          if (!slowest || call.time > slowest.time) {
            return { endpoint: call.endpoint, time: call.time };
          }
          return slowest;
        }, null)
      : null,
    fastestCall: apiCalls.length > 0
      ? apiCalls.reduce<{ endpoint: string; time: number } | null>((fastest, call) => {
          if (!fastest || call.time < fastest.time) {
            return { endpoint: call.endpoint, time: call.time };
          }
          return fastest;
        }, null)
      : null,
    errorRate: apiCalls.length > 0 ? (apiCalls.length - successfulCalls.length) / apiCalls.length : 0
  };

  return {
    total,
    passed,
    failed,
    skipped,
    details: testResults,
    apiMetrics
  };
} 