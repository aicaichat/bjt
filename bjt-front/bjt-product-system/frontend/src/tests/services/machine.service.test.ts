// 机器服务测试用例
// 运行: npm test -- machine.service.test.ts

import { MachineListData, MachineQueryParams } from '@/types/api.types';

// 简化的测试框架（用于演示测试思路）
class TestFramework {
  static async runTests() {
    console.log('开始运行机器服务测试...');
    
    await this.testGetMachines();
    await this.testErrorHandling();
    await this.testParameterValidation();
    
    console.log('✅ 所有测试通过');
  }

  static async testGetMachines() {
    console.log('🧪 测试获取机器列表...');
    
    // Mock数据
    const mockResponse: MachineListData = {
      items: [
        {
          id: 1,
          code: 'BJT-M001',
          title_zh: '测试设备',
          title_en: 'Test Machine',
          product_line_id: 1,
          type: 'automatic',
          image_url: '/images/machine1.jpg',
          status: 'publish',
          sort_order: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1
    };

    // 模拟API调用
    const mockMachineService = {
      async getMachines(params: MachineQueryParams): Promise<MachineListData> {
        // 验证必需参数
        if (!params.product_line_id) {
          throw new Error('product_line_id is required');
        }
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return mockResponse;
      }
    };

    // 执行测试
    const params: MachineQueryParams = {
      product_line_id: 1,
      region: 'CN',
      lang: 'zh'
    };

    const result = await mockMachineService.getMachines(params);
    
    // 断言
    this.assertEqual(result.items.length, 1);
    this.assertEqual(result.items[0].code, 'BJT-M001');
    this.assertEqual(result.total, 1);
    
    console.log('  ✓ 机器列表获取测试通过');
  }

  static async testErrorHandling() {
    console.log('🧪 测试错误处理...');
    
    const mockMachineServiceWithError = {
      async getMachines(params: MachineQueryParams): Promise<MachineListData> {
        if (params.product_line_id === 999) {
          throw new Error('Product line not found');
        }
        
        if (!params.product_line_id) {
          throw new Error('Missing required parameter: product_line_id');
        }
        
        return { items: [], total: 0, page: 1, per_page: 10, total_pages: 0 };
      }
    };

    // 测试参数缺失错误
    try {
      await mockMachineServiceWithError.getMachines({});
      throw new Error('Should have thrown an error');
    } catch (error) {
      this.assertTrue((error as Error).message.includes('product_line_id'));
    }

    // 测试资源不存在错误
    try {
      await mockMachineServiceWithError.getMachines({ product_line_id: 999 });
      throw new Error('Should have thrown an error');
    } catch (error) {
      this.assertTrue((error as Error).message.includes('not found'));
    }
    
    console.log('  ✓ 错误处理测试通过');
  }

  static async testParameterValidation() {
    console.log('🧪 测试参数验证...');
    
    const mockMachineService = {
      async getMachines(params: MachineQueryParams): Promise<MachineListData> {
        // 验证页码参数
        if (params.page && params.page < 1) {
          throw new Error('Page must be greater than 0');
        }
        
        // 验证每页大小
        if (params.per_page && (params.per_page < 1 || params.per_page > 100)) {
          throw new Error('Per page must be between 1 and 100');
        }
        
        return { items: [], total: 0, page: 1, per_page: 10, total_pages: 0 };
      }
    };

    // 测试有效参数
    const validParams: MachineQueryParams = {
      product_line_id: 1,
      page: 1,
      per_page: 10,
      region: 'CN',
      lang: 'zh'
    };
    
    const result = await mockMachineService.getMachines(validParams);
    this.assertNotNull(result);

    // 测试无效页码
    try {
      await mockMachineService.getMachines({ product_line_id: 1, page: 0 });
      throw new Error('Should have thrown an error');
    } catch (error) {
      this.assertTrue((error as Error).message.includes('Page must be greater'));
    }

    // 测试无效每页大小
    try {
      await mockMachineService.getMachines({ product_line_id: 1, per_page: 101 });
      throw new Error('Should have thrown an error');
    } catch (error) {
      this.assertTrue((error as Error).message.includes('Per page must be between'));
    }
    
    console.log('  ✓ 参数验证测试通过');
  }

  // 简单断言方法
  static assertEqual<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`断言失败: 期望 ${expected}, 实际 ${actual}`);
    }
  }

  static assertTrue(condition: boolean): void {
    if (!condition) {
      throw new Error('断言失败: 期望条件为true');
    }
  }

  static assertNotNull<T>(value: T): void {
    if (value === null || value === undefined) {
      throw new Error('断言失败: 期望值不为null或undefined');
    }
  }
}

// E2E测试用例
export class MachineServiceE2ETests {
  static async runE2ETests() {
    console.log('开始运行E2E测试...');
    
    await this.testCompleteUserFlow();
    await this.testErrorRecovery();
    
    console.log('✅ 所有E2E测试通过');
  }

  static async testCompleteUserFlow() {
    console.log('🌐 测试完整用户流程...');
    
    // 模拟完整的用户选择机器流程
    const mockFlow = {
      step1_getProductLines: async () => {
        return [
          { id: 1, name: 'Air Cushion Machines' },
          { id: 2, name: 'Void Fill Systems' }
        ];
      },
      
      step2_getMachines: async (productLineId: number) => {
        return {
          items: [
            { id: 1, code: 'BJT-M001', name: 'Test Machine' }
          ],
          total: 1
        };
      },
      
      step3_getMachineDetails: async (machineId: number) => {
        return {
          id: machineId,
          specifications: { voltage: '220V', power: '2kW' },
          accessories: [
            { id: 1, name: 'Accessory 1' }
          ]
        };
      }
    };

    // 执行完整流程
    const productLines = await mockFlow.step1_getProductLines();
    TestFramework.assertTrue(productLines.length > 0);
    
    const machines = await mockFlow.step2_getMachines(productLines[0].id);
    TestFramework.assertTrue(machines.items.length > 0);
    
    const machineDetails = await mockFlow.step3_getMachineDetails(machines.items[0].id);
    TestFramework.assertNotNull(machineDetails.specifications);
    
    console.log('  ✓ 完整用户流程测试通过');
  }

  static async testErrorRecovery() {
    console.log('🌐 测试错误恢复...');
    
    const mockServiceWithRetry = {
      retryCount: 0,
      maxRetries: 3,
      
      async getMachinesWithRetry(params: MachineQueryParams): Promise<MachineListData> {
        this.retryCount++;
        
        // 模拟前两次失败，第三次成功
        if (this.retryCount < 3) {
          throw new Error('Network Error');
        }
        
        return {
          items: [{ 
            id: 1, 
            code: 'BJT-M001', 
            title_zh: '测试设备',
            title_en: 'Test Machine',
            product_line_id: 1,
            type: 'automatic',
            image_url: '/images/machine1.jpg',
            status: 'publish',
            sort_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }],
          total: 1,
          page: 1,
          per_page: 10,
          total_pages: 1
        };
      }
    };

    // 测试重试机制
    const result = await mockServiceWithRetry.getMachinesWithRetry({ product_line_id: 1 });
    TestFramework.assertEqual(mockServiceWithRetry.retryCount, 3);
    TestFramework.assertEqual(result.items.length, 1);
    
    console.log('  ✓ 错误恢复测试通过');
  }
}

// 性能测试用例
export class MachineServicePerformanceTests {
  static async runPerformanceTests() {
    console.log('开始运行性能测试...');
    
    await this.testResponseTime();
    await this.testConcurrentRequests();
    
    console.log('✅ 所有性能测试通过');
  }

  static async testResponseTime() {
    console.log('⚡ 测试响应时间...');
    
    const mockService = {
      async getMachines(params: MachineQueryParams): Promise<MachineListData> {
        // 模拟网络延迟
        const delay = Math.random() * 100 + 50; // 50-150ms
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return {
          items: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            code: `BJT-M00${i + 1}`,
            title_zh: `测试设备${i + 1}`,
            title_en: `Test Machine ${i + 1}`,
            product_line_id: 1,
            type: 'automatic',
            image_url: `/images/machine${i + 1}.jpg`,
            status: 'publish',
            sort_order: i + 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          })),
          total: 10,
          page: 1,
          per_page: 10,
          total_pages: 1
        };
      }
    };

    const startTime = performance.now();
    await mockService.getMachines({ product_line_id: 1 });
    const endTime = performance.now();
    
    const responseTime = endTime - startTime;
    console.log(`  响应时间: ${responseTime.toFixed(2)}ms`);
    
    // 响应时间应该在合理范围内（< 2000ms）
    TestFramework.assertTrue(responseTime < 2000);
    
    console.log('  ✓ 响应时间测试通过');
  }

  static async testConcurrentRequests() {
    console.log('⚡ 测试并发请求...');
    
    const mockService = {
      async getMachines(params: MachineQueryParams): Promise<MachineListData> {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { items: [], total: 0, page: 1, per_page: 10, total_pages: 0 };
      }
    };

    const concurrentRequests = Array.from({ length: 5 }, (_, i) => 
      mockService.getMachines({ product_line_id: i + 1 })
    );

    const startTime = performance.now();
    const results = await Promise.all(concurrentRequests);
    const endTime = performance.now();
    
    const totalTime = endTime - startTime;
    console.log(`  并发请求总时间: ${totalTime.toFixed(2)}ms`);
    
    // 并发请求应该比串行请求快
    TestFramework.assertTrue(totalTime < 300); // 应该远小于 5 * 100ms
    TestFramework.assertEqual(results.length, 5);
    
    console.log('  ✓ 并发请求测试通过');
  }
}

// 导出测试运行器
export async function runAllTests() {
  try {
    await TestFramework.runTests();
    await MachineServiceE2ETests.runE2ETests();
    await MachineServicePerformanceTests.runPerformanceTests();
    
    console.log('🎉 所有测试套件运行完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (typeof window === 'undefined') {
  // Node.js环境下运行
  runAllTests().catch(console.error);
} 