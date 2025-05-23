/**
 * BJT真实API测试运行器
 * 专门用于测试页面与真实后端API的集成
 */

import { realApiConfig } from './config/real-api-config';
import { apiHealthCheck } from './utils/api-health-check';
import { runRealHomePageTests } from './pages/home-page.real-api.test';
import { runRealMachinesPageTests } from './pages/machines-page.real-api.test';
import { runRealCartPageTests } from './pages/cart-page.real-api.test';

// 真实API测试结果接口
interface RealApiTestResult {
  page: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  details: Array<{
    test: string;
    status: 'pass' | 'fail' | 'skip';
    error?: string;
    apiCall?: string;
    responseTime?: number;
    statusCode?: number;
  }>;
  duration: number;
  apiMetrics: {
    totalCalls: number;
    averageResponseTime: number;
    slowestCall: { endpoint: string; time: number } | null;
    fastestCall: { endpoint: string; time: number } | null;
    errorRate: number;
  };
}

// 环境检查结果
interface EnvironmentCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export class RealApiTestRunner {
  private results: RealApiTestResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;
  private environmentChecks: EnvironmentCheck[] = [];

  async runAllTests(): Promise<void> {
    console.log('🌐 开始真实API集成测试...\n');
    this.startTime = Date.now();
    
    try {
      // 1. 环境检查
      await this.performEnvironmentChecks();
      
      // 2. 检查环境是否就绪
      if (!this.isEnvironmentReady()) {
        console.log('⚠️ 环境检查未通过，跳过测试执行\n');
        this.generateFinalReport();
        return;
      }
      
      // 3. API健康检查
      console.log('🩺 执行API健康检查...');
      const healthCheck = await this.performApiHealthCheck();
      if (!healthCheck.healthy) {
        console.log(`❌ API健康检查失败: ${healthCheck.message}\n`);
      } else {
        console.log(`✅ API健康检查通过: ${healthCheck.message}\n`);
      }
      
      // 4. 运行页面测试
      console.log('🧪 开始页面测试...\n');
      
      // 首页测试
      await this.runPageTest('首页', async () => {
        const { runRealHomePageTests } = await import('./pages/home-page.real-api.test');
        return await runRealHomePageTests();
      });
      
      // 设备页面测试
      await this.runPageTest('设备页面', async () => {
        const { runRealMachinesPageTests } = await import('./pages/machines-page.real-api.test');
        return await runRealMachinesPageTests();
      });
      
      // 购物车页面测试
      await this.runPageTest('购物车页面', async () => {
        const { runRealCartPageTests } = await import('./pages/cart-page.real-api.test');
        return await runRealCartPageTests();
      });
      
    } catch (error) {
      console.error('❌ 测试执行异常:', error);
    } finally {
      this.endTime = Date.now();
      this.generateFinalReport();
    }
  }

  private async performEnvironmentChecks(): Promise<void> {
    console.log('🔍 执行环境检查...\n');

    // 检查API配置
    this.environmentChecks.push(await this.checkApiConfiguration());
    
    // 检查网络连接
    this.environmentChecks.push(await this.checkNetworkConnectivity());
    
    // 检查数据库连接
    this.environmentChecks.push(await this.checkDatabaseConnection());
    
    // 检查认证配置
    this.environmentChecks.push(await this.checkAuthConfiguration());

    // 打印环境检查结果
    this.environmentChecks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
      console.log(`${icon} ${check.name}: ${check.message}`);
      if (check.details) {
        console.log(`   详情: ${JSON.stringify(check.details, null, 2)}`);
      }
    });
    console.log('');
  }

  private async checkApiConfiguration(): Promise<EnvironmentCheck> {
    try {
      const config = realApiConfig.getConfig();
      
      if (!config.baseUrl) {
        return {
          name: 'API配置检查',
          status: 'fail',
          message: 'API基础URL未配置',
          details: { baseUrl: config.baseUrl }
        };
      }

      // 检查URL格式
      const url = new URL(config.baseUrl);
      
      return {
        name: 'API配置检查',
        status: 'pass',
        message: `API配置正常 (${url.origin})`,
        details: { baseUrl: config.baseUrl, timeout: config.timeout }
      };
    } catch (error) {
      return {
        name: 'API配置检查',
        status: 'fail',
        message: `API配置错误: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkNetworkConnectivity(): Promise<EnvironmentCheck> {
    try {
      const config = realApiConfig.getConfig();
      const url = new URL('/wp-json/wp/v2', config.baseUrl);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return {
          name: '网络连接检查',
          status: 'pass',
          message: `网络连接正常 (${response.status})`,
          details: { status: response.status, url: url.toString() }
        };
      } else {
        return {
          name: '网络连接检查',
          status: 'warning',
          message: `网络连接异常 (${response.status})`,
          details: { status: response.status, statusText: response.statusText }
        };
      }
    } catch (error) {
      return {
        name: '网络连接检查',
        status: 'fail',
        message: `网络连接失败: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkDatabaseConnection(): Promise<EnvironmentCheck> {
    try {
      const config = realApiConfig.getConfig();
      const url = new URL('/bjt/v1/product-lines', config.baseUrl);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: realApiConfig.getHeaders(),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          name: '数据库连接检查',
          status: 'pass',
          message: '数据库连接正常',
          details: { 
            status: response.status,
            hasData: Array.isArray(data?.data?.items) && data.data.items.length > 0
          }
        };
      } else {
        return {
          name: '数据库连接检查',
          status: 'fail',
          message: `数据库连接失败 (${response.status})`,
          details: { status: response.status, statusText: response.statusText }
        };
      }
    } catch (error) {
      return {
        name: '数据库连接检查',
        status: 'fail',
        message: `数据库连接错误: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkAuthConfiguration(): Promise<EnvironmentCheck> {
    try {
      const config = realApiConfig.getConfig();
      
      if (config.authRequired && !config.authToken) {
        return {
          name: '认证配置检查',
          status: 'warning',
          message: '需要认证但未配置认证令牌',
          details: { authRequired: true, hasToken: false }
        };
      }

      // 如果有认证令牌，测试认证API
      if (config.authToken) {
        const url = new URL('/bjt/v1/auth/verify', config.baseUrl);
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            ...realApiConfig.getHeaders(),
            'Authorization': `Bearer ${config.authToken}`
          },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          return {
            name: '认证配置检查',
            status: 'pass',
            message: '认证配置正常',
            details: { hasToken: true, tokenValid: true }
          };
        } else {
          return {
            name: '认证配置检查',
            status: 'warning',
            message: `认证令牌可能已过期 (${response.status})`,
            details: { hasToken: true, tokenValid: false, status: response.status }
          };
        }
      }

      return {
        name: '认证配置检查',
        status: 'pass',
        message: '无需认证或认证配置正常',
        details: { authRequired: false }
      };
    } catch (error) {
      return {
        name: '认证配置检查',
        status: 'fail',
        message: `认证检查失败: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }

  private isEnvironmentReady(): boolean {
    return !this.environmentChecks.some(check => check.status === 'fail');
  }

  private async performApiHealthCheck(): Promise<{ healthy: boolean; message: string; details?: any }> {
    console.log('🩺 执行API健康检查...\n');
    
    try {
      const healthResult = await apiHealthCheck.performHealthCheck();
      
      if (healthResult.healthy) {
        console.log('✅ API健康检查通过');
        console.log(`   响应时间: ${healthResult.responseTime}ms`);
        console.log(`   API版本: ${healthResult.version || 'N/A'}`);
        console.log(`   服务状态: ${healthResult.status}\n`);
      } else {
        console.log('❌ API健康检查失败');
        console.log(`   错误: ${healthResult.message}\n`);
      }
      
      return healthResult;
    } catch (error) {
      return {
        healthy: false,
        message: `健康检查异常: ${(error as Error).message}`,
        details: { error: (error as Error).message }
      };
    }
  }

  private async runPageTest(pageName: string, testRunner: () => Promise<any>): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 运行 ${pageName} 真实API集成测试`);
    console.log(`${'='.repeat(60)}`);

    const pageStartTime = Date.now();
    
    try {
      const result = await testRunner();
      const pageEndTime = Date.now();
      
      this.results.push({
        page: pageName,
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped || 0,
        details: result.details,
        duration: pageEndTime - pageStartTime,
        apiMetrics: result.apiMetrics || this.getDefaultApiMetrics()
      });

      console.log(`\n✅ ${pageName} 真实API测试完成`);
      console.log(`   通过: ${result.passed}/${result.total}`);
      console.log(`   失败: ${result.failed}`);
      console.log(`   跳过: ${result.skipped || 0}`);
      console.log(`   耗时: ${pageEndTime - pageStartTime}ms`);
      
      if (result.apiMetrics) {
        console.log(`   API调用: ${result.apiMetrics.totalCalls}次`);
        console.log(`   平均响应时间: ${result.apiMetrics.averageResponseTime}ms`);
        console.log(`   错误率: ${(result.apiMetrics.errorRate * 100).toFixed(1)}%`);
      }
      
    } catch (error) {
      console.error(`\n❌ ${pageName} 真实API测试运行失败:`, error);
      
      this.results.push({
        page: pageName,
        total: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        details: [{ 
          test: 'testRunner', 
          status: 'fail', 
          error: (error as Error).message,
          apiCall: 'testRunner'
        }],
        duration: Date.now() - pageStartTime,
        apiMetrics: this.getDefaultApiMetrics()
      });
    }
  }

  private getDefaultApiMetrics() {
    return {
      totalCalls: 0,
      averageResponseTime: 0,
      slowestCall: null,
      fastestCall: null,
      errorRate: 0
    };
  }

  private generateFinalReport(): void {
    const totalDuration = this.endTime - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 BJT真实API集成测试最终报告');
    console.log('='.repeat(80));
    
    // 总体统计
    const totalTests = this.results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${totalPassed} ✅`);
    console.log(`失败: ${totalFailed} ❌`);
    console.log(`跳过: ${totalSkipped} ⏭️`);
    console.log(`成功率: ${successRate}%`);
    console.log(`总耗时: ${totalDuration}ms`);
    
    // API性能统计
    const totalApiCalls = this.results.reduce((sum, r) => sum + r.apiMetrics.totalCalls, 0);
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.apiMetrics.averageResponseTime, 0) / this.results.length;
    const avgErrorRate = this.results.reduce((sum, r) => sum + r.apiMetrics.errorRate, 0) / this.results.length;
    
    console.log(`\n🌐 API性能统计:`);
    console.log(`API调用总数: ${totalApiCalls}`);
    console.log(`平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
    console.log(`平均错误率: ${(avgErrorRate * 100).toFixed(1)}%`);
    
    // 最慢和最快的API调用
    const allCalls = this.results.flatMap(r => [r.apiMetrics.slowestCall, r.apiMetrics.fastestCall]).filter(Boolean);
    if (allCalls.length > 0) {
      const slowest = allCalls.reduce((max, call) => call!.time > (max?.time || 0) ? call : max, null);
      const fastest = allCalls.reduce((min, call) => call!.time < (min?.time || Infinity) ? call : min, null);
      
      if (slowest) console.log(`最慢API: ${slowest.endpoint} (${slowest.time}ms)`);
      if (fastest) console.log(`最快API: ${fastest.endpoint} (${fastest.time}ms)`);
    }
    
    // 各页面详情
    console.log('\n📋 各页面测试详情:');
    this.results.forEach(result => {
      const pageSuccessRate = result.total > 0 ? 
        ((result.passed / result.total) * 100).toFixed(1) : '0';
      
      console.log(`\n🔸 ${result.page}:`);
      console.log(`   测试数: ${result.total}`);
      console.log(`   通过: ${result.passed}`);
      console.log(`   失败: ${result.failed}`);
      console.log(`   跳过: ${result.skipped}`);
      console.log(`   成功率: ${pageSuccessRate}%`);
      console.log(`   耗时: ${result.duration}ms`);
      console.log(`   API调用: ${result.apiMetrics.totalCalls}次`);
      console.log(`   平均响应时间: ${result.apiMetrics.averageResponseTime}ms`);
      
      if (result.failed > 0) {
        console.log(`   失败项目:`);
        result.details
          .filter(d => d.status === 'fail')
          .forEach(d => {
            console.log(`     - ${d.test}: ${d.error}`);
            if (d.apiCall) console.log(`       API: ${d.apiCall}`);
            if (d.statusCode) console.log(`       状态码: ${d.statusCode}`);
          });
      }
    });
    
    // 真实API集成建议
    this.generateRealApiRecommendations();
  }

  private generateRealApiRecommendations(): void {
    console.log('\n🎯 真实API集成优化建议:');
    
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const avgErrorRate = this.results.reduce((sum, r) => sum + r.apiMetrics.errorRate, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.apiMetrics.averageResponseTime, 0) / this.results.length;
    
    if (totalFailed === 0 && avgErrorRate < 0.05) {
      console.log('  ✨ 所有真实API集成测试通过！系统与后端集成良好');
      console.log('  📈 建议关注API性能优化和缓存策略');
      console.log('  🔧 考虑添加更多边界情况和异常处理测试');
    } else {
      console.log('  🔧 需要修复的API集成问题:');
      
      if (avgErrorRate > 0.1) {
        console.log('     - API错误率较高，需要改进错误处理');
      }
      
      if (avgResponseTime > 2000) {
        console.log('     - API响应时间较慢，需要性能优化');
      }
      
      console.log('\n  📋 修复优先级建议:');
      console.log('     1. API错误处理 - 确保系统稳定性');
      console.log('     2. 响应时间优化 - 提高用户体验');
      console.log('     3. 数据一致性 - 保证业务逻辑正确');
      console.log('     4. 缓存策略 - 减少不必要的API调用');
    }
  }

  // 生成JSON格式报告
  generateJSONReport(): string {
    return JSON.stringify({
      summary: {
        total: this.results.reduce((sum, r) => sum + r.total, 0),
        passed: this.results.reduce((sum, r) => sum + r.passed, 0),
        failed: this.results.reduce((sum, r) => sum + r.failed, 0),
        skipped: this.results.reduce((sum, r) => sum + r.skipped, 0),
        duration: this.endTime - this.startTime,
        timestamp: new Date().toISOString()
      },
      environment: this.environmentChecks,
      results: this.results
    }, null, 2);
  }

  getResults(): RealApiTestResult[] {
    return this.results;
  }
}

// 导出运行函数
export async function runRealApiTests(): Promise<RealApiTestRunner> {
  const runner = new RealApiTestRunner();
  await runner.runAllTests();
  return runner;
} 