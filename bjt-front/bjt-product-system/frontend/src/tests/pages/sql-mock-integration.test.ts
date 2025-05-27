/**
 * SQL Mock数据集成测试
 * 展示如何使用基于SQL数据的Mock服务进行页面测试
 */

import { 
  integratedMockService, 
  getMachinesData, 
  getAccessoriesData, 
  getConsumablesData, 
  getSparePartsData,
  getProductLinesData,
  getMockServiceStatus
} from '../../services/integrated-mock-service';

interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  data?: any;
  executionTime: number;
}

export class SQLMockIntegrationTest {
  private testResults: TestResult[] = [];
  
  /**
   * 运行所有SQL Mock集成测试
   */
  public async runAllTests(): Promise<{
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    results: TestResult[];
    summary: string;
  }> {
    console.log('🚀 开始SQL Mock数据集成测试...');
    
    const tests = [
      { name: 'Mock服务状态检查', fn: () => this.testMockServiceStatus() },
      { name: '产品线数据获取测试', fn: () => this.testProductLinesData() },
      { name: '主机数据获取测试', fn: () => this.testMachinesData() },
      { name: '配件数据获取测试', fn: () => this.testAccessoriesData() },
      { name: '耗材数据获取测试', fn: () => this.testConsumablesData() },
      { name: '备件数据获取测试', fn: () => this.testSparePartsData() },
      { name: '数据筛选功能测试', fn: () => this.testDataFiltering() },
      { name: '分页功能测试', fn: () => this.testPagination() },
      { name: '搜索功能测试', fn: () => this.testSearchFunctionality() },
      { name: '数据结构一致性测试', fn: () => this.testDataStructureConsistency() },
    ];

    for (const test of tests) {
      try {
        await this.runSingleTest(test.name, test.fn);
      } catch (error) {
        this.addTestResult(test.name, 'fail', `测试执行异常: ${error}`, null, 0);
      }
    }

    return this.generateTestReport();
  }

  /**
   * 执行单个测试
   */
  private async runSingleTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = performance.now();
    
    try {
      await testFn();
      const executionTime = performance.now() - startTime;
      console.log(`✅ ${testName} - 通过 (${executionTime.toFixed(2)}ms)`);
    } catch (error) {
      const executionTime = performance.now() - startTime;
      console.log(`❌ ${testName} - 失败 (${executionTime.toFixed(2)}ms)`, error);
      throw error;
    }
  }

  /**
   * 测试Mock服务状态
   */
  private async testMockServiceStatus(): Promise<void> {
    const status = getMockServiceStatus();
    
    this.assert(status.isActive, 'Mock服务应该处于活跃状态');
    this.assert(status.dataSource === 'SQL Database', '数据源应该是SQL Database');
    this.assert(status.totalTables > 0, '应该有可用的数据表');
    this.assert(status.totalRecords > 0, '应该有可用的数据记录');
    
    this.addTestResult(
      'Mock服务状态检查',
      'pass',
      `Mock服务正常运行，共有${status.totalTables}个表，${status.totalRecords}条记录`,
      status,
      0
    );
  }

  /**
   * 测试产品线数据获取
   */
  private async testProductLinesData(): Promise<void> {
    const productLines = await getProductLinesData();
    
    this.assert(Array.isArray(productLines), '产品线数据应该是数组');
    this.assert(productLines.length > 0, '应该有产品线数据');
    
    const firstProductLine = productLines[0];
    this.assert(!!firstProductLine.id, '产品线应该有ID');
    this.assert(!!firstProductLine.title_zh, '产品线应该有中文标题');
    this.assert(!!firstProductLine.title_en, '产品线应该有英文标题');
    this.assert(!!firstProductLine.code, '产品线应该有代码');
    
    this.addTestResult(
      '产品线数据获取测试',
      'pass',
      `成功获取${productLines.length}个产品线`,
      { count: productLines.length, sample: firstProductLine },
      0
    );
  }

  /**
   * 测试主机数据获取
   */
  private async testMachinesData(): Promise<void> {
    // 测试无参数获取
    const allMachines = await getMachinesData();
    this.assert(allMachines.items.length > 0, '应该有主机数据');
    this.assert(allMachines.total > 0, '总数应该大于0');
    
    // 测试按类别筛选
    const categoryMachines = await getMachinesData({ category: 1 });
    this.assert(categoryMachines.items.length > 0, '按类别筛选应该有结果');
    
    // 验证数据结构
    const firstMachine = allMachines.items[0];
    this.assert(!!firstMachine.id, '主机应该有ID');
    this.assert(!!firstMachine.code, '主机应该有编码');
    this.assert(!!firstMachine.title_zh, '主机应该有中文标题');
    this.assert(!!firstMachine.title_en, '主机应该有英文标题');
    this.assert(firstMachine.status === 'publish', '主机状态应该是publish');
    
    this.addTestResult(
      '主机数据获取测试',
      'pass',
      `成功获取${allMachines.total}台主机，按类别筛选得到${categoryMachines.total}台`,
      { 
        totalMachines: allMachines.total,
        categoryMachines: categoryMachines.total,
        sample: firstMachine
      },
      0
    );
  }

  /**
   * 测试配件数据获取
   */
  private async testAccessoriesData(): Promise<void> {
    const accessories = await getAccessoriesData({ category: 1 });
    
    this.assert(accessories.items.length > 0, '应该有配件数据');
    this.assert(accessories.total > 0, '配件总数应该大于0');
    
    const firstAccessory = accessories.items[0];
    this.assert(!!firstAccessory.id, '配件应该有ID');
    this.assert(!!firstAccessory.part_number, '配件应该有料号');
    this.assert(!!firstAccessory.name, '配件应该有名称');
    this.assert(!!firstAccessory.brand, '配件应该有品牌');
    this.assert(Array.isArray(firstAccessory.pricing), '配件应该有价格信息');
    this.assert(Array.isArray(firstAccessory.inventory), '配件应该有库存信息');
    
    this.addTestResult(
      '配件数据获取测试',
      'pass',
      `成功获取${accessories.total}个配件`,
      { count: accessories.total, sample: firstAccessory },
      0
    );
  }

  /**
   * 测试耗材数据获取
   */
  private async testConsumablesData(): Promise<void> {
    const consumables = await getConsumablesData({ category: 1 });
    
    this.assert(consumables.items.length > 0, '应该有耗材数据');
    this.assert(consumables.total > 0, '耗材总数应该大于0');
    
    const firstConsumable = consumables.items[0];
    this.assert(!!firstConsumable.id, '耗材应该有ID');
    this.assert(!!firstConsumable.code, '耗材应该有编码');
    this.assert(!!firstConsumable.name, '耗材应该有名称');
    this.assert(!!firstConsumable.specs, '耗材应该有规格信息');
    this.assert(!!firstConsumable.specs.material, '耗材应该有材料信息');
    this.assert(!!firstConsumable.specs.shape, '耗材应该有形状信息');
    this.assert(!!firstConsumable.specs.thickness, '耗材应该有厚度信息');
    
    this.addTestResult(
      '耗材数据获取测试',
      'pass',
      `成功获取${consumables.total}个耗材，包含形状和材料组合`,
      { count: consumables.total, sample: firstConsumable },
      0
    );
  }

  /**
   * 测试备件数据获取
   */
  private async testSparePartsData(): Promise<void> {
    // 测试所有备件
    const allSpareParts = await getSparePartsData();
    this.assert(allSpareParts.items.length > 0, '应该有备件数据');
    
    // 测试易损件筛选
    const consumableParts = await getSparePartsData({ isConsumable: true });
    this.assert(consumableParts.items.length > 0, '应该有易损件数据');
    
    // 测试非易损件筛选
    const nonConsumableParts = await getSparePartsData({ isConsumable: false });
    
    const firstSparePart = allSpareParts.items[0];
    this.assert(!!firstSparePart.id, '备件应该有ID');
    this.assert(!!firstSparePart.part_number, '备件应该有料号');
    this.assert(!!firstSparePart.name, '备件应该有名称');
    this.assert(typeof firstSparePart.is_consumable === 'boolean', '备件应该有易损件标识');
    
    this.addTestResult(
      '备件数据获取测试',
      'pass',
      `成功获取${allSpareParts.total}个备件，其中${consumableParts.total}个易损件，${nonConsumableParts.total}个非易损件`,
      { 
        total: allSpareParts.total,
        consumable: consumableParts.total,
        nonConsumable: nonConsumableParts.total,
        sample: firstSparePart
      },
      0
    );
  }

  /**
   * 测试数据筛选功能
   */
  private async testDataFiltering(): Promise<void> {
    // 测试耗材按形状筛选
    const fhapeFilteredConsumables = await getConsumablesData({ 
      category: 1, 
      shape: 'FTB' 
    });
    
    // 测试耗材按材料筛选
    const materialFilteredConsumables = await getConsumablesData({ 
      category: 1, 
      material: 'HDPE' 
    });
    
    // 验证筛选结果
    if (fhapeFilteredConsumables.items.length > 0) {
      const item = fhapeFilteredConsumables.items[0];
      this.assert(item.specs.shape === 'FTB', '按形状筛选的结果应该匹配');
    }
    
    if (materialFilteredConsumables.items.length > 0) {
      const item = materialFilteredConsumables.items[0];
      this.assert(item.specs.material === 'HDPE', '按材料筛选的结果应该匹配');
    }
    
    this.addTestResult(
      '数据筛选功能测试',
      'pass',
      `筛选功能正常，形状筛选得到${fhapeFilteredConsumables.total}个结果，材料筛选得到${materialFilteredConsumables.total}个结果`,
      {
        shapeFiltered: fhapeFilteredConsumables.total,
        materialFiltered: materialFilteredConsumables.total
      },
      0
    );
  }

  /**
   * 测试分页功能
   */
  private async testPagination(): Promise<void> {
    // 测试第一页
    const page1 = await getMachinesData({ page: 1, pageSize: 2 });
    this.assert(page1.page === 1, '页码应该正确');
    this.assert(page1.per_page === 2, '每页数量应该正确');
    this.assert(page1.items.length <= 2, '返回数据不应超过每页数量');
    
    // 测试第二页
    const page2 = await getMachinesData({ page: 2, pageSize: 2 });
    this.assert(page2.page === 2, '第二页页码应该正确');
    
    // 验证分页一致性
    if (page1.total > 2) {
      this.assert(page1.total_pages > 1, '应该有多页');
      this.assert(page1.total === page2.total, '总数应该一致');
    }
    
    this.addTestResult(
      '分页功能测试',
      'pass',
      `分页功能正常，总计${page1.total}条数据，分为${page1.total_pages}页`,
      {
        total: page1.total,
        totalPages: page1.total_pages,
        page1Items: page1.items.length,
        page2Items: page2.items.length
      },
      0
    );
  }

  /**
   * 测试搜索功能
   */
  private async testSearchFunctionality(): Promise<void> {
    // 测试主机搜索
    const machineSearch = await getMachinesData({ search: 'LA-E4S' });
    
    // 测试配件搜索
    const accessorySearch = await getAccessoriesData({ search: 'ET400' });
    
    // 验证搜索结果
    if (machineSearch.items.length > 0) {
      const found = machineSearch.items.some(item => 
        item.title_zh.includes('LA-E4S') || 
        item.title_en.includes('LA-E4S') ||
        item.code.includes('LA-E4S')
      );
      this.assert(found, '主机搜索结果应该包含搜索关键词');
    }
    
    if (accessorySearch.items.length > 0) {
      const found = accessorySearch.items.some(item => 
        item.name.includes('ET400') || 
        item.part_number.includes('ET400')
      );
      this.assert(found, '配件搜索结果应该包含搜索关键词');
    }
    
    this.addTestResult(
      '搜索功能测试',
      'pass',
      `搜索功能正常，主机搜索得到${machineSearch.total}个结果，配件搜索得到${accessorySearch.total}个结果`,
      {
        machineSearchResults: machineSearch.total,
        accessorySearchResults: accessorySearch.total
      },
      0
    );
  }

  /**
   * 测试数据结构一致性
   */
  private async testDataStructureConsistency(): Promise<void> {
    const machines = await getMachinesData({ category: 1 });
    const accessories = await getAccessoriesData({ category: 1 });
    const consumables = await getConsumablesData({ category: 1 });
    const spareParts = await getSparePartsData({ category: 1 });
    
    // 检查数据结构
    if (machines.items.length > 0) {
      const machine = machines.items[0];
      this.assert(!!machine.id && !!machine.code && !!machine.title_zh, '主机数据结构完整');
    }
    
    if (accessories.items.length > 0) {
      const accessory = accessories.items[0];
      this.assert(!!accessory.id && !!accessory.part_number && !!accessory.name, '配件数据结构完整');
    }
    
    if (consumables.items.length > 0) {
      const consumable = consumables.items[0];
      this.assert(!!consumable.id && !!consumable.code && !!consumable.specs, '耗材数据结构完整');
    }
    
    if (spareParts.items.length > 0) {
      const sparePart = spareParts.items[0];
      this.assert(!!sparePart.id && !!sparePart.part_number && !!sparePart.name, '备件数据结构完整');
    }
    
    this.addTestResult(
      '数据结构一致性测试',
      'pass',
      '所有数据类型的结构都符合要求',
      {
        machineFields: machines.items[0] ? Object.keys(machines.items[0]).length : 0,
        accessoryFields: accessories.items[0] ? Object.keys(accessories.items[0]).length : 0,
        consumableFields: consumables.items[0] ? Object.keys(consumables.items[0]).length : 0,
        sparePartFields: spareParts.items[0] ? Object.keys(spareParts.items[0]).length : 0
      },
      0
    );
  }

  /**
   * 断言工具方法
   */
  private assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(`断言失败: ${message}`);
    }
  }

  /**
   * 添加测试结果
   */
  private addTestResult(
    testName: string, 
    status: 'pass' | 'fail' | 'skip', 
    message: string, 
    data: any = null, 
    executionTime: number
  ): void {
    this.testResults.push({
      testName,
      status,
      message,
      data,
      executionTime
    });
  }

  /**
   * 生成测试报告
   */
  private generateTestReport(): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    results: TestResult[];
    summary: string;
  } {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    const skipped = this.testResults.filter(r => r.status === 'skip').length;
    
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
    
    const summary = `
🎯 SQL Mock数据集成测试完成
📊 测试结果: ${passed}/${total} 通过 (成功率: ${successRate}%)
✅ 通过: ${passed}
❌ 失败: ${failed}
⏭️  跳过: ${skipped}

🔍 测试详情:
${this.testResults.map(r => 
  `${r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏭️'} ${r.testName}: ${r.message}`
).join('\n')}
    `.trim();

    console.log(summary);
    
    return {
      total,
      passed,
      failed,
      skipped,
      results: this.testResults,
      summary
    };
  }
}

// 导出测试运行函数
export async function runSQLMockIntegrationTests(): Promise<any> {
  const testRunner = new SQLMockIntegrationTest();
  return await testRunner.runAllTests();
} 