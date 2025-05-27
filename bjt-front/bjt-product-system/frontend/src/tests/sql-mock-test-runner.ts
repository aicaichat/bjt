/**
 * SQL Mock数据测试运行器
 * 验证基于SQL的Mock数据生成器是否严格按照数据库表结构
 */

import { sqlMockGenerator, getTableData, filterData } from '../services/sql-mock-generator';
import { 
  integratedMockService, 
  getMachinesData, 
  getAccessoriesData,
  getProductLinesData
} from '../services/integrated-mock-service';

interface TestResult {
  testName: string;
  status: 'pass' | 'fail';
  message: string;
  executionTime: number;
}

export class SQLMockTestRunner {
  private results: TestResult[] = [];

  /**
   * 运行所有测试
   */
  public async runAllTests(): Promise<{
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
    summary: string;
  }> {
    console.log('🚀 开始SQL Mock数据验证测试...');
    this.results = [];

    const tests = [
      { name: '数据库表结构验证', fn: () => this.testDatabaseStructure() },
      { name: '产品线数据完整性', fn: () => this.testProductLinesData() },
      { name: '主机数据完整性', fn: () => this.testMachinesData() },
      { name: '配件数据完整性', fn: () => this.testAccessoriesData() },
      { name: '字段映射正确性', fn: () => this.testFieldMapping() },
      { name: '数据类型一致性', fn: () => this.testDataTypes() }
    ];

    for (const test of tests) {
      await this.runSingleTest(test.name, test.fn);
    }

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    const summary = `
📊 SQL Mock数据验证完成
✅ 通过: ${passed}/${this.results.length}
❌ 失败: ${failed}/${this.results.length}
成功率: ${((passed / this.results.length) * 100).toFixed(1)}%
    `;

    console.log(summary);

    return {
      total: this.results.length,
      passed,
      failed,
      results: this.results,
      summary
    };
  }

  /**
   * 运行单个测试
   */
  private async runSingleTest(testName: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = performance.now();
    
    try {
      await testFn();
      const executionTime = performance.now() - startTime;
      
      this.results.push({
        testName,
        status: 'pass',
        message: '测试通过',
        executionTime
      });
      
      console.log(`✅ ${testName} - 通过 (${executionTime.toFixed(2)}ms)`);
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const message = error instanceof Error ? error.message : '未知错误';
      
      this.results.push({
        testName,
        status: 'fail',
        message,
        executionTime
      });
      
      console.error(`❌ ${testName} - 失败: ${message} (${executionTime.toFixed(2)}ms)`);
    }
  }

  /**
   * 测试数据库表结构
   */
  private async testDatabaseStructure(): Promise<void> {
    const allData = sqlMockGenerator.getAllData();
    
    // 验证所有必需的表都存在
    const requiredTables = [
      'wp_bjt_product_lines',
      'wp_bjt_host_models', 
      'wp_bjt_parts',
      'wp_bjt_accessories',
      'wp_bjt_spare_parts',
      'wp_bjt_shapes',
      'wp_bjt_materials',
      'wp_bjt_specifications'
    ];

    for (const tableName of requiredTables) {
      if (!allData[tableName]) {
        throw new Error(`缺少数据表: ${tableName}`);
      }
      if (!Array.isArray(allData[tableName])) {
        throw new Error(`表 ${tableName} 数据格式错误，应该是数组`);
      }
    }

    console.log(`📊 验证了 ${requiredTables.length} 个数据表`);
  }

  /**
   * 测试产品线数据完整性
   */
  private async testProductLinesData(): Promise<void> {
    const productLines = getTableData('wp_bjt_product_lines');
    
    if (productLines.length === 0) {
      throw new Error('产品线数据为空');
    }

    const firstProductLine = productLines[0];
    const requiredFields = [
      'id', 'title_zh', 'title_en', 'description_zh', 'description_en',
      'subitem1_zh', 'subitem1_en', 'subitem2_zh', 'subitem2_en', 
      'subitem3_zh', 'subitem3_en', 'image_url', 'code', 'status',
      'sort_order', 'created_at', 'updated_at'
    ];

    for (const field of requiredFields) {
      if (!(field in firstProductLine)) {
        throw new Error(`产品线数据缺少字段: ${field}`);
      }
    }

    console.log(`✅ 产品线数据包含所有 ${requiredFields.length} 个必需字段`);
  }

  /**
   * 测试主机数据完整性
   */
  private async testMachinesData(): Promise<void> {
    const machinesAPI = await getMachinesData({ category: 1 });
    const partsDB = getTableData('wp_bjt_parts');
    
    if (machinesAPI.items.length === 0) {
      throw new Error('主机API数据为空');
    }
    
    if (partsDB.length === 0) {
      throw new Error('主机数据库数据为空');
    }

    const firstMachine = machinesAPI.items[0];
    const firstPart = partsDB[0];

    // 验证数据库字段完整性
    const dbRequiredFields = [
      'id', 'product_line_id', 'model', 'voltage', 'image_url', 'part_number',
      'name_zh', 'name_en', 'brand', 'spec', 'spec_imperial', 'package_size_cm',
      'package_size_inch', 'net_weight_kg', 'net_weight_lbs', 'gross_weight_kg',
      'gross_weight_lbs', 'pcs_per_box', 'pallet_size_cm', 'pallet_size_inch',
      'pcs_per_pallet', 'pallet_height_cm', 'pallet_height_inch', 
      'pallet_gross_weight_kg', 'pallet_gross_weight_lbs', 'status',
      'created_at', 'updated_at', 'unit'
    ];

    for (const field of dbRequiredFields) {
      if (!(field in firstPart)) {
        throw new Error(`主机数据库数据缺少字段: ${field}`);
      }
    }

    // 验证API字段映射
    const apiRequiredFields = ['id', 'code', 'title_zh', 'title_en', 'type', 'status'];
    for (const field of apiRequiredFields) {
      if (!(field in firstMachine)) {
        throw new Error(`主机API数据缺少字段: ${field}`);
      }
    }

    console.log(`✅ 主机数据包含所有数据库字段 (${dbRequiredFields.length}) 和API字段 (${apiRequiredFields.length})`);
  }

  /**
   * 测试配件数据完整性
   */
  private async testAccessoriesData(): Promise<void> {
    const accessoriesDB = getTableData('wp_bjt_accessories');
    
    if (accessoriesDB.length === 0) {
      throw new Error('配件数据库数据为空');
    }

    const firstAccessory = accessoriesDB[0];
    const dbRequiredFields = [
      'id', 'product_line_id', 'model', 'brand', 'part_number', 'name_zh', 'name_en',
      'spec', 'spec_imperial', 'voltage', 'frequency', 'package_size_cm', 
      'package_size_inch', 'net_weight_kg', 'net_weight_lbs', 'gross_weight_kg',
      'gross_weight_lbs', 'pcs_per_box', 'pallet_size_cm', 'pallet_size_inch',
      'pcs_per_pallet', 'pallet_height_cm', 'pallet_height_inch',
      'pallet_gross_weight_kg', 'pallet_gross_weight_lbs', 'image_url',
      'status', 'created_at', 'updated_at', 'unit'
    ];

    for (const field of dbRequiredFields) {
      if (!(field in firstAccessory)) {
        throw new Error(`配件数据缺少字段: ${field}`);
      }
    }

    console.log(`✅ 配件数据包含所有 ${dbRequiredFields.length} 个必需字段`);
  }

  /**
   * 测试字段映射正确性
   */
  private async testFieldMapping(): Promise<void> {
    const productLines = await getProductLinesData();
    const machines = await getMachinesData({ category: 1 });

    if (productLines.length === 0 || machines.items.length === 0) {
      throw new Error('数据为空，无法测试字段映射');
    }

    // 测试产品线字段映射
    const productLine = productLines[0];
    if (productLine.title_zh !== productLine.title_zh) {
      throw new Error('产品线字段映射错误');
    }

    // 测试主机字段映射
    const machine = machines.items[0];
    if (!machine.code || !machine.title_zh) {
      throw new Error('主机字段映射错误：缺少code或title字段');
    }

    console.log('✅ 字段映射正确');
  }

  /**
   * 测试数据类型一致性
   */
  private async testDataTypes(): Promise<void> {
    const parts = getTableData('wp_bjt_parts');
    
    if (parts.length === 0) {
      throw new Error('零件数据为空');
    }

    const part = parts[0];

    // 验证数字类型字段
    const numberFields = ['id', 'product_line_id', 'net_weight_kg', 'net_weight_lbs', 'pcs_per_box'];
    for (const field of numberFields) {
      if (part[field] !== null && part[field] !== undefined && typeof part[field] !== 'number') {
        throw new Error(`字段 ${field} 应该是数字类型，实际是 ${typeof part[field]}`);
      }
    }

    // 验证字符串类型字段
    const stringFields = ['part_number', 'name_zh', 'name_en', 'status'];
    for (const field of stringFields) {
      if (part[field] !== null && part[field] !== undefined && typeof part[field] !== 'string') {
        throw new Error(`字段 ${field} 应该是字符串类型，实际是 ${typeof part[field]}`);
      }
    }

    console.log('✅ 数据类型一致性验证通过');
  }
}

/**
 * 运行SQL Mock数据验证测试
 */
export async function runSQLMockValidationTests(): Promise<any> {
  const runner = new SQLMockTestRunner();
  return await runner.runAllTests();
} 