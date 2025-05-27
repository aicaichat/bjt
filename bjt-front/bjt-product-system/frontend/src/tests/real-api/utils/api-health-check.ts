/**
 * API健康检查工具
 * 检查后端API服务的可用性和健康状态
 */

import { realApiConfig } from '../config/real-api-config';

export interface HealthCheckResult {
  healthy: boolean;
  message: string;
  responseTime: number;
  status?: string;
  version?: string;
  details?: {
    endpoints: Array<{
      endpoint: string;
      status: number;
      responseTime: number;
      healthy: boolean;
      error?: string;
    }>;
    database?: {
      connected: boolean;
      responseTime: number;
    };
    cache?: {
      available: boolean;
      responseTime: number;
    };
  };
}

class ApiHealthChecker {
  private testFetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor() {
    this.testFetch = realApiConfig.createTestFetch();
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // 检查核心端点
      const coreEndpoints = await this.checkCoreEndpoints();
      const databaseCheck = await this.checkDatabaseConnection();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 判断整体健康状态
      const allEndpointsHealthy = coreEndpoints.every(ep => ep.healthy);
      const databaseHealthy = databaseCheck.connected;
      
      const healthy = allEndpointsHealthy && databaseHealthy;
      
      return {
        healthy,
        message: healthy ? 'API服务健康' : 'API服务存在问题',
        responseTime,
        status: healthy ? 'OK' : 'ERROR',
        version: await this.getApiVersion(),
        details: {
          endpoints: coreEndpoints,
          database: databaseCheck
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: `健康检查失败: ${(error as Error).message}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkCoreEndpoints(): Promise<Array<{
    endpoint: string;
    status: number;
    responseTime: number;
    healthy: boolean;
    error?: string;
  }>> {
    const endpoints = [
      {
        name: 'WordPress Core API',
        path: '/wp/v2'
      },
      {
        name: 'BJT Product Lines API',
        path: '/bjt/v1/product-lines'
      },
      {
        name: 'BJT Machines API',
        path: '/bjt/v1/machines'
      },
      {
        name: 'BJT Auth API',
        path: '/bjt/v1/auth/verify'
      }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      const result = await this.checkSingleEndpoint(endpoint.path);
      results.push({
        endpoint: endpoint.name,
        ...result
      });
    }

    return results;
  }

  private async checkSingleEndpoint(path: string): Promise<{
    status: number;
    responseTime: number;
    healthy: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.testFetch(path, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const endTime = Date.now();
      
      return {
        status: response.status,
        responseTime: endTime - startTime,
        healthy: response.status >= 200 && response.status < 400,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        status: 0,
        responseTime: Date.now() - startTime,
        healthy: false,
        error: (error as Error).message
      };
    }
  }

  private async checkDatabaseConnection(): Promise<{
    connected: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.testFetch('/bjt/v1/product-lines', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const endTime = Date.now();
      
      if (response.ok) {
        const data = await response.json();
        // 检查是否返回了有效的数据结构
        const hasValidData = data && typeof data === 'object' && 
                           (data.success !== false || Array.isArray(data.data?.items));
        
        return {
          connected: hasValidData,
          responseTime: endTime - startTime
        };
      } else {
        return {
          connected: false,
          responseTime: endTime - startTime
        };
      }
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async getApiVersion(): Promise<string | undefined> {
    try {
      const response = await this.testFetch('/wp/v2', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        // WordPress REST API通常在根路径返回版本信息
        return data?.version || data?.description || 'Unknown';
      }
    } catch (error) {
      // 忽略版本获取错误
    }
    
    return undefined;
  }

  // 监控模式：持续检查API健康状态
  async startMonitoring(options: {
    interval: number; // 检查间隔（毫秒）
    duration: number; // 监控持续时间（毫秒）
    onUpdate: (result: HealthCheckResult) => void;
  }): Promise<void> {
    const startTime = Date.now();
    let checkCount = 0;
    
    console.log(`🔍 开始API健康监控 (间隔: ${options.interval}ms, 持续: ${options.duration}ms)`);
    
    const monitor = async () => {
      if (Date.now() - startTime >= options.duration) {
        console.log(`✅ API健康监控完成 (共检查 ${checkCount} 次)`);
        return;
      }
      
      checkCount++;
      console.log(`🩺 执行第 ${checkCount} 次健康检查...`);
      
      try {
        const result = await this.performHealthCheck();
        options.onUpdate(result);
        
        const status = result.healthy ? '✅' : '❌';
        console.log(`${status} 健康检查 #${checkCount}: ${result.message} (${result.responseTime}ms)`);
        
        if (result.details?.endpoints) {
          result.details.endpoints.forEach(ep => {
            const epStatus = ep.healthy ? '✅' : '❌';
            console.log(`   ${epStatus} ${ep.endpoint}: ${ep.status} (${ep.responseTime}ms)`);
          });
        }
      } catch (error) {
        console.error(`❌ 健康检查 #${checkCount} 失败:`, error);
      }
      
      setTimeout(monitor, options.interval);
    };
    
    await monitor();
  }

  // 压力测试：快速连续调用API
  async performStressTest(options: {
    endpoint: string;
    concurrency: number; // 并发数
    requests: number; // 总请求数
    timeout: number; // 单个请求超时
  }): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  }> {
    console.log(`🚀 开始API压力测试: ${options.endpoint}`);
    console.log(`   并发数: ${options.concurrency}, 总请求数: ${options.requests}`);
    
    const startTime = Date.now();
    const responseTimes: number[] = [];
    let successCount = 0;
    let failCount = 0;
    
    // 创建请求批次
    const batches: Promise<void>[][] = [];
    const requestsPerBatch = Math.ceil(options.requests / options.concurrency);
    
    for (let i = 0; i < options.concurrency; i++) {
      const batch: Promise<void>[] = [];
      const batchSize = Math.min(requestsPerBatch, options.requests - i * requestsPerBatch);
      
      for (let j = 0; j < batchSize; j++) {
        const requestPromise = this.performSingleStressRequest(options.endpoint, options.timeout)
          .then(({ success, responseTime }) => {
            if (success) {
              successCount++;
              responseTimes.push(responseTime);
            } else {
              failCount++;
            }
          })
          .catch(() => {
            failCount++;
          });
        
        batch.push(requestPromise);
      }
      
      batches.push(batch);
    }
    
    // 执行所有批次
    const batchPromises = batches.map(batch => Promise.all(batch));
    await Promise.all(batchPromises);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const results = {
      totalRequests: options.requests,
      successfulRequests: successCount,
      failedRequests: failCount,
      averageResponseTime: responseTimes.length > 0 ? 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      requestsPerSecond: (successCount / totalTime) * 1000,
      errorRate: failCount / options.requests
    };
    
    console.log(`📊 压力测试结果:`);
    console.log(`   成功请求: ${results.successfulRequests}/${results.totalRequests}`);
    console.log(`   失败请求: ${results.failedRequests}`);
    console.log(`   平均响应时间: ${results.averageResponseTime.toFixed(1)}ms`);
    console.log(`   最小响应时间: ${results.minResponseTime}ms`);
    console.log(`   最大响应时间: ${results.maxResponseTime}ms`);
    console.log(`   请求速率: ${results.requestsPerSecond.toFixed(1)} req/s`);
    console.log(`   错误率: ${(results.errorRate * 100).toFixed(1)}%`);
    
    return results;
  }

  private async performSingleStressRequest(endpoint: string, timeout: number): Promise<{
    success: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await this.testFetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(timeout)
      });
      
      const endTime = Date.now();
      
      return {
        success: response.ok,
        responseTime: endTime - startTime
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime
      };
    }
  }

  // 延迟测试：测试API在不同网络条件下的表现
  async performLatencyTest(endpoints: string[]): Promise<{
    [endpoint: string]: {
      attempts: number;
      averageLatency: number;
      minLatency: number;
      maxLatency: number;
      successRate: number;
    };
  }> {
    console.log('🌐 开始API延迟测试...');
    
    const results: { [endpoint: string]: any } = {};
    const attemptsPerEndpoint = 5;
    
    for (const endpoint of endpoints) {
      console.log(`  测试端点: ${endpoint}`);
      
      const latencies: number[] = [];
      let successCount = 0;
      
      for (let i = 0; i < attemptsPerEndpoint; i++) {
        const { success, responseTime } = await this.performSingleStressRequest(endpoint, 10000);
        
        if (success) {
          successCount++;
          latencies.push(responseTime);
        }
        
        // 请求间隔
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      results[endpoint] = {
        attempts: attemptsPerEndpoint,
        averageLatency: latencies.length > 0 ? 
          latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length : 0,
        minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
        maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
        successRate: successCount / attemptsPerEndpoint
      };
      
      console.log(`    平均延迟: ${results[endpoint].averageLatency.toFixed(1)}ms`);
      console.log(`    成功率: ${(results[endpoint].successRate * 100).toFixed(1)}%`);
    }
    
    return results;
  }
}

// 导出单例实例
export const apiHealthCheck = new ApiHealthChecker(); 