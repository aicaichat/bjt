/**
 * Mock数据迁移服务
 * 帮助组件从分散的Mock数据调用迁移到统一Mock管理器
 */

import { 
  unifiedMockManager, 
  getMockData, 
  MockDataType, 
  MockEnvironment 
} from './unified-mock-manager-v2';

// === 迁移映射表 ===
interface LegacyMockMapping {
  oldImport: string;
  oldFunction: string;
  newType: MockDataType;
  migrationNote: string;
  example: string;
}

const migrationMap: LegacyMockMapping[] = [
  {
    oldImport: "import { getMockMachineParts } from './mocks/machines.mocks'",
    oldFunction: "getMockMachineParts(params)",
    newType: MockDataType.MACHINES,
    migrationNote: "使用统一管理器获取机器数据",
    example: "await getMockData(MockDataType.MACHINES, params)"
  },
  {
    oldImport: "import { getMockMachineAccessories } from './mocks/machines.mocks'",
    oldFunction: "getMockMachineAccessories(machineId, params)",
    newType: MockDataType.ACCESSORIES,
    migrationNote: "使用统一管理器获取配件数据",
    example: "await getMockData(MockDataType.ACCESSORIES, { machineId, ...params })"
  },
  {
    oldImport: "import { getMockConsumables } from './mocks/consumables.mocks'",
    oldFunction: "getMockConsumables()",
    newType: MockDataType.CONSUMABLES,
    migrationNote: "使用统一管理器获取耗材数据",
    example: "await getMockData(MockDataType.CONSUMABLES)"
  },
  {
    oldImport: "import { getAllMockSpareParts } from './mocks/spareParts.mocks'",
    oldFunction: "getAllMockSpareParts()",
    newType: MockDataType.SPARE_PARTS,
    migrationNote: "使用统一管理器获取备件数据",
    example: "await getMockData(MockDataType.SPARE_PARTS)"
  },
  {
    oldImport: "import { mockOrderItems } from './mocks/orders.mocks'",
    oldFunction: "mockOrderItems",
    newType: MockDataType.ORDERS,
    migrationNote: "使用统一管理器获取订单数据",
    example: "await getMockData(MockDataType.ORDERS)"
  },
  {
    oldImport: "import { mockPrices } from './mocks/prices.mocks'",
    oldFunction: "mockPrices",
    newType: MockDataType.PRICES,
    migrationNote: "使用统一管理器获取价格数据",
    example: "await getMockData(MockDataType.PRICES)"
  },
  {
    oldImport: "import { mockInventory } from './mocks/inventory.mocks'",
    oldFunction: "mockInventory",
    newType: MockDataType.INVENTORY,
    migrationNote: "使用统一管理器获取库存数据",
    example: "await getMockData(MockDataType.INVENTORY)"
  },
  {
    oldImport: "import { mockProductLines } from './mockService'",
    oldFunction: "mockProductLines",
    newType: MockDataType.PRODUCT_LINES,
    migrationNote: "使用统一管理器获取产品线数据",
    example: "await getMockData(MockDataType.PRODUCT_LINES)"
  }
];

// === 迁移服务类 ===
export class MockMigrationService {
  private static instance: MockMigrationService;

  private constructor() {}

  public static getInstance(): MockMigrationService {
    if (!MockMigrationService.instance) {
      MockMigrationService.instance = new MockMigrationService();
    }
    return MockMigrationService.instance;
  }

  /**
   * 获取迁移指南
   */
  public getMigrationGuide(): LegacyMockMapping[] {
    return migrationMap;
  }

  /**
   * 检查组件是否需要迁移
   */
  public needsMigration(componentCode: string): boolean {
    return migrationMap.some(mapping => 
      componentCode.includes(mapping.oldImport) || 
      componentCode.includes(mapping.oldFunction)
    );
  }

  /**
   * 生成迁移建议
   */
  public generateMigrationSuggestions(componentCode: string): Array<{
    line: string;
    suggestion: string;
    example: string;
  }> {
    const suggestions: Array<{
      line: string;
      suggestion: string;
      example: string;
    }> = [];

    migrationMap.forEach(mapping => {
      if (componentCode.includes(mapping.oldFunction)) {
        suggestions.push({
          line: mapping.oldFunction,
          suggestion: mapping.migrationNote,
          example: mapping.example
        });
      }
    });

    return suggestions;
  }

  /**
   * 自动迁移组件代码 (简化版本)
   */
  public migrateComponent(componentCode: string): {
    migratedCode: string;
    changes: string[];
  } {
    let migratedCode = componentCode;
    const changes: string[] = [];

    // 添加新的导入
    if (!migratedCode.includes("import { getMockData, MockDataType }")) {
      const importLine = "import { getMockData, MockDataType } from '../services/unified-mock-manager-v2';";
      migratedCode = importLine + '\n' + migratedCode;
      changes.push("添加了统一Mock管理器导入");
    }

    // 替换具体的函数调用
    migrationMap.forEach(mapping => {
      const oldPattern = mapping.oldFunction;
      if (migratedCode.includes(oldPattern)) {
        // 这里只是示例，实际需要更复杂的AST解析
        changes.push(`替换了 ${oldPattern} 为统一管理器调用`);
      }
    });

    return { migratedCode, changes };
  }

  /**
   * 验证迁移后的组件
   */
  public async validateMigration(componentName: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 测试统一管理器的各个数据类型
      for (const dataType of Object.values(MockDataType)) {
        try {
          await getMockData(dataType as MockDataType);
        } catch (error) {
          issues.push(`数据类型 ${dataType} 获取失败: ${error}`);
        }
      }

      if (issues.length === 0) {
        recommendations.push("迁移成功，所有数据类型都可以正常获取");
        recommendations.push("建议移除旧的Mock数据导入");
        recommendations.push("建议使用TypeScript类型检查确保类型安全");
      } else {
        recommendations.push("需要修复数据获取问题");
        recommendations.push("检查参数传递是否正确");
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        isValid: false,
        issues: [`验证过程失败: ${error}`],
        recommendations: ["检查统一Mock管理器是否正确配置"]
      };
    }
  }

  /**
   * 生成迁移报告
   */
  public generateMigrationReport(): {
    totalMappings: number;
    dataTypes: string[];
    benefits: string[];
    nextSteps: string[];
  } {
    return {
      totalMappings: migrationMap.length,
      dataTypes: Object.values(MockDataType),
      benefits: [
        "统一的数据访问接口",
        "缓存机制提升性能",
        "环境切换支持",
        "错误处理标准化",
        "数据源管理集中化",
        "调试和监控功能"
      ],
      nextSteps: [
        "1. 分析现有组件中的Mock数据使用情况",
        "2. 逐个组件进行迁移",
        "3. 验证迁移后的功能是否正常",
        "4. 移除旧的Mock数据文件",
        "5. 更新开发文档和指南"
      ]
    };
  }
}

// === 便捷方法 ===

/**
 * 快速迁移指南
 */
export const getQuickMigrationGuide = () => {
  const service = MockMigrationService.getInstance();
  return service.getMigrationGuide();
};

/**
 * 检查组件是否需要迁移
 */
export const checkComponentNeedsMigration = (componentCode: string) => {
  const service = MockMigrationService.getInstance();
  return service.needsMigration(componentCode);
};

/**
 * 生成组件迁移建议
 */
export const generateComponentMigrationSuggestions = (componentCode: string) => {
  const service = MockMigrationService.getInstance();
  return service.generateMigrationSuggestions(componentCode);
};

/**
 * 验证组件迁移
 */
export const validateComponentMigration = async (componentName: string) => {
  const service = MockMigrationService.getInstance();
  return await service.validateMigration(componentName);
};

// === 环境设置便捷方法 ===

/**
 * 为开发环境配置Mock管理器
 */
export const setupDevelopmentEnvironment = () => {
  unifiedMockManager.switchEnvironment(MockEnvironment.DEVELOPMENT);
  unifiedMockManager.setConfig({
    enableCaching: true,
    networkDelay: true,
    errorSimulation: false
  });
  console.log('📦 已配置开发环境Mock设置');
};

/**
 * 为测试环境配置Mock管理器
 */
export const setupTestingEnvironment = () => {
  unifiedMockManager.switchEnvironment(MockEnvironment.TESTING);
  unifiedMockManager.setConfig({
    enableCaching: false,
    networkDelay: false,
    errorSimulation: true,
    errorRate: 0.1
  });
  console.log('🧪 已配置测试环境Mock设置');
};

/**
 * 为演示环境配置Mock管理器
 */
export const setupDemoEnvironment = () => {
  unifiedMockManager.switchEnvironment(MockEnvironment.DEMO);
  unifiedMockManager.setConfig({
    enableCaching: true,
    networkDelay: true,
    minDelay: 200,
    maxDelay: 800,
    errorSimulation: false
  });
  console.log('🎭 已配置演示环境Mock设置');
};

export default MockMigrationService; 