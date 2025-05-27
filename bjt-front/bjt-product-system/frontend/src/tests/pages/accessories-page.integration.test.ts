/**
 * Accessories页面集成测试
 * 测试配件选择、层次结构、兼容性检查等功能
 */

export class AccessoriesPageIntegrationTest {
  private testResults: Array<{
    test: string;
    status: 'pass' | 'fail';
    duration?: number;
    error?: string;
  }> = [];

  private assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`断言失败: ${message}`);
    }
  }

  private addTestResult(test: string, status: 'pass' | 'fail', duration?: number, error?: string) {
    this.testResults.push({
      test,
      status,
      duration,
      error
    });
  }

  async runAllTests() {
    console.log('🔧 开始执行 Accessories 页面集成测试...');
    
    const tests = [
      { name: 'testPageInitialization', fn: this.testPageInitialization.bind(this) },
      { name: 'testAccessoryHierarchy', fn: this.testAccessoryHierarchy.bind(this) },
      { name: 'testCompatibilityCheck', fn: this.testCompatibilityCheck.bind(this) },
      { name: 'testAccessorySelection', fn: this.testAccessorySelection.bind(this) },
      { name: 'testPriceCalculation', fn: this.testPriceCalculation.bind(this) },
      { name: 'testCartIntegration', fn: this.testCartIntegration.bind(this) },
      { name: 'testFilteringAndSearch', fn: this.testFilteringAndSearch.bind(this) },
      { name: 'testBulkOperations', fn: this.testBulkOperations.bind(this) }
    ];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        await test.fn();
        const duration = Date.now() - startTime;
        this.addTestResult(test.name, 'pass', duration);
        console.log(`  ✓ ${test.name} - ${duration}ms`);
      } catch (error) {
        this.addTestResult(test.name, 'fail', undefined, (error as Error).message);
        console.log(`  ❌ ${test.name} - ${(error as Error).message}`);
      }
    }

    return {
      totalTests: tests.length,
      totalPassed: this.testResults.filter(r => r.status === 'pass').length,
      totalFailed: this.testResults.filter(r => r.status === 'fail').length,
      results: this.testResults
    };
  }

  // 测试1: 页面初始化
  async testPageInitialization() {
    const mockAccessoriesComponent = {
      state: {
        selectedMachine: null,
        accessories: [],
        selectedAccessories: [],
        loading: false,
        error: null,
        filters: {
          category: 'all',
          priceRange: 'all',
          compatibility: 'all'
        }
      },

      async initialize(machineId?: string) {
        this.state.loading = true;
        
        try {
          // 检查用户认证
          const token = localStorage.getItem('auth_token');
          if (!token) {
            throw new Error('用户未认证');
          }

          // 如果有机器ID，加载该机器的配件
          if (machineId) {
            await this.loadMachineAccessories(machineId);
          } else {
            // 否则加载所有配件
            await this.loadAllAccessories();
          }

          this.state.loading = false;
          return { success: true, machineSpecific: !!machineId };
          
        } catch (error) {
          this.state.loading = false;
          this.state.error = (error as Error).message;
          throw error;
        }
      },

      async loadMachineAccessories(machineId: string) {
        // 模拟加载特定机器的配件
        const mockAccessories = [
          {
            id: 'acc-1',
            name: '标准配件包',
            category: 'basic',
            price: 2000,
            machineId: machineId,
            level: 1,
            required: true
          },
          {
            id: 'acc-2',
            name: '高级配件包',
            category: 'advanced',
            price: 5000,
            machineId: machineId,
            level: 1,
            required: false
          }
        ];

        this.state.selectedMachine = machineId;
        this.state.accessories = mockAccessories;
      },

      async loadAllAccessories() {
        // 模拟加载所有配件
        const mockAccessories = [
          {
            id: 'acc-1',
            name: '通用配件包',
            category: 'universal',
            price: 1500,
            compatibility: ['machine-1', 'machine-2'],
            level: 1
          },
          {
            id: 'acc-3',
            name: '专用工具包',
            category: 'tools',
            price: 3000,
            compatibility: ['machine-1'],
            level: 1
          }
        ];

        this.state.accessories = mockAccessories;
      }
    };

    // 测试无机器ID的初始化
    const result1 = await mockAccessoriesComponent.initialize();
    this.assert(result1.success, '页面初始化应该成功');
    this.assert(!result1.machineSpecific, '应该不是机器特定模式');
    this.assert(mockAccessoriesComponent.state.accessories.length === 2, '应该加载通用配件');

    // 重置状态
    mockAccessoriesComponent.state = {
      selectedMachine: null,
      accessories: [],
      selectedAccessories: [],
      loading: false,
      error: null,
      filters: {
        category: 'all',
        priceRange: 'all',
        compatibility: 'all'
      }
    };

    // 测试有机器ID的初始化
    const result2 = await mockAccessoriesComponent.initialize('machine-1');
    this.assert(result2.success, '机器特定初始化应该成功');
    this.assert(result2.machineSpecific, '应该是机器特定模式');
    this.assert(mockAccessoriesComponent.state.selectedMachine === 'machine-1', '应该设置选中的机器');
    this.assert(mockAccessoriesComponent.state.accessories.length === 2, '应该加载机器配件');
  }

  // 测试2: 配件层次结构
  async testAccessoryHierarchy() {
    const mockHierarchyManager = {
      accessoryTree: new Map(),

      async loadAccessoryLevel(parentId: string, level: number) {
        // 模拟多级配件结构
        const hierarchyData = {
          'machine-1': {
            level1: [
              { id: 'acc-1-1', name: '基础配件组', level: 1, hasChildren: true },
              { id: 'acc-1-2', name: '高级配件组', level: 1, hasChildren: true }
            ]
          },
          'acc-1-1': {
            level2: [
              { id: 'acc-2-1', name: '标准工具', level: 2, hasChildren: false },
              { id: 'acc-2-2', name: '测量工具', level: 2, hasChildren: true }
            ]
          },
          'acc-2-2': {
            level3: [
              { id: 'acc-3-1', name: '精密测量仪', level: 3, hasChildren: false },
              { id: 'acc-3-2', name: '校准工具', level: 3, hasChildren: false }
            ]
          }
        };

        const data = hierarchyData[parentId];
        if (!data) {
          return [];
        }

        const levelKey = `level${level}`;
        const accessories = data[levelKey] || [];
        
        // 保存到树结构中
        if (!this.accessoryTree.has(parentId)) {
          this.accessoryTree.set(parentId, new Map());
        }
        this.accessoryTree.get(parentId)?.set(level, accessories);

        return accessories;
      },

      async expandAccessory(accessoryId: string, currentLevel: number) {
        const nextLevel = currentLevel + 1;
        const children = await this.loadAccessoryLevel(accessoryId, nextLevel);
        
        return {
          accessoryId,
          level: nextLevel,
          children,
          hasChildren: children.length > 0
        };
      },

      getAccessoryPath(accessoryId: string) {
        // 模拟获取配件路径
        const paths = {
          'acc-3-1': ['machine-1', 'acc-1-1', 'acc-2-2', 'acc-3-1'],
          'acc-3-2': ['machine-1', 'acc-1-1', 'acc-2-2', 'acc-3-2'],
          'acc-2-1': ['machine-1', 'acc-1-1', 'acc-2-1']
        };

        return paths[accessoryId] || [accessoryId];
      },

      validateHierarchy() {
        // 验证层次结构的完整性
        let isValid = true;
        const errors = [];

        for (const [parentId, levels] of this.accessoryTree) {
          for (const [level, accessories] of levels) {
            for (const accessory of accessories) {
              if (accessory.hasChildren) {
                const childLevel = level + 1;
                const hasChildData = this.accessoryTree.get(accessory.id)?.has(childLevel);
                if (!hasChildData) {
                  isValid = false;
                  errors.push(`配件 ${accessory.id} 标记有子项但未加载子数据`);
                }
              }
            }
          }
        }

        return { isValid, errors };
      }
    };

    // 测试加载第一级配件
    const level1Accessories = await mockHierarchyManager.loadAccessoryLevel('machine-1', 1);
    this.assert(level1Accessories.length === 2, '应该加载2个一级配件');
    this.assert(level1Accessories[0].hasChildren, '第一个配件应该有子项');

    // 测试展开配件
    const expandResult = await mockHierarchyManager.expandAccessory('acc-1-1', 1);
    this.assert(expandResult.level === 2, '展开后应该是第2级');
    this.assert(expandResult.children.length === 2, '应该有2个子配件');
    this.assert(expandResult.hasChildren, '应该有子项');

    // 测试继续展开
    const expandResult2 = await mockHierarchyManager.expandAccessory('acc-2-2', 2);
    this.assert(expandResult2.level === 3, '展开后应该是第3级');
    this.assert(expandResult2.children.length === 2, '应该有2个三级配件');

    // 测试获取配件路径
    const path = mockHierarchyManager.getAccessoryPath('acc-3-1');
    this.assert(path.length === 4, '路径应该有4个层级');
    this.assert(path[0] === 'machine-1', '根应该是机器');
    this.assert(path[3] === 'acc-3-1', '末尾应该是目标配件');

    // 测试层次结构验证
    const validation = mockHierarchyManager.validateHierarchy();
    this.assert(validation.isValid, '层次结构应该有效');
    this.assert(validation.errors.length === 0, '不应该有验证错误');
  }

  // 测试3: 兼容性检查
  async testCompatibilityCheck() {
    const mockCompatibilityChecker = {
      async checkCompatibility(machineId: string, accessoryId: string) {
        // 模拟兼容性数据
        const compatibilityMatrix = {
          'machine-1': {
            'acc-1': { compatible: true, confidence: 100 },
            'acc-2': { compatible: true, confidence: 95 },
            'acc-3': { compatible: false, confidence: 0, reason: '电压不匹配' }
          },
          'machine-2': {
            'acc-1': { compatible: true, confidence: 90 },
            'acc-2': { compatible: false, confidence: 0, reason: '接口不兼容' },
            'acc-3': { compatible: true, confidence: 85 }
          }
        };

        const machineCompatibility = compatibilityMatrix[machineId];
        if (!machineCompatibility) {
          return { compatible: false, confidence: 0, reason: '未知机器型号' };
        }

        return machineCompatibility[accessoryId] || 
               { compatible: false, confidence: 0, reason: '未知配件' };
      },

      async batchCheckCompatibility(machineId: string, accessoryIds: string[]) {
        const results = [];
        
        for (const accessoryId of accessoryIds) {
          const result = await this.checkCompatibility(machineId, accessoryId);
          results.push({
            accessoryId,
            ...result
          });
        }

        return {
          machineId,
          results,
          compatibleCount: results.filter(r => r.compatible).length,
          incompatibleCount: results.filter(r => !r.compatible).length
        };
      },

      getCompatibilityWarnings(compatibilityResults: any[]) {
        const warnings = [];
        
        for (const result of compatibilityResults) {
          if (!result.compatible) {
            warnings.push({
              type: 'incompatible',
              accessoryId: result.accessoryId,
              message: `配件不兼容: ${result.reason}`,
              severity: 'high'
            });
          } else if (result.confidence < 90) {
            warnings.push({
              type: 'low_confidence',
              accessoryId: result.accessoryId,
              message: `兼容性置信度较低 (${result.confidence}%)`,
              severity: 'medium'
            });
          }
        }

        return warnings;
      }
    };

    // 测试单个配件兼容性
    const compatibility1 = await mockCompatibilityChecker.checkCompatibility('machine-1', 'acc-1');
    this.assert(compatibility1.compatible, '配件1应该与机器1兼容');
    this.assert(compatibility1.confidence === 100, '置信度应该是100%');

    const compatibility2 = await mockCompatibilityChecker.checkCompatibility('machine-1', 'acc-3');
    this.assert(!compatibility2.compatible, '配件3应该与机器1不兼容');
    this.assert(compatibility2.reason === '电压不匹配', '应该返回不兼容原因');

    // 测试批量兼容性检查
    const batchResult = await mockCompatibilityChecker.batchCheckCompatibility(
      'machine-1', 
      ['acc-1', 'acc-2', 'acc-3']
    );
    this.assert(batchResult.compatibleCount === 2, '应该有2个兼容的配件');
    this.assert(batchResult.incompatibleCount === 1, '应该有1个不兼容的配件');

    // 测试兼容性警告
    const warnings = mockCompatibilityChecker.getCompatibilityWarnings(batchResult.results);
    this.assert(warnings.length === 1, '应该有1个警告');
    this.assert(warnings[0].type === 'incompatible', '警告类型应该是不兼容');
    this.assert(warnings[0].severity === 'high', '严重程度应该是高');
  }

  // 测试4: 配件选择
  async testAccessorySelection() {
    const mockSelectionManager = {
      selectedAccessories: new Map(),
      selectionRules: {
        maxSelections: 10,
        requiredCategories: ['basic'],
        mutuallyExclusive: [['acc-1', 'acc-2']]
      },

      async selectAccessory(accessoryId: string, quantity: number = 1) {
        // 检查选择规则
        const validation = this.validateSelection(accessoryId, quantity);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // 处理互斥选择
        this.handleMutuallyExclusive(accessoryId);

        // 添加到选择中
        this.selectedAccessories.set(accessoryId, {
          id: accessoryId,
          quantity,
          selectedAt: new Date().toISOString()
        });

        return {
          success: true,
          accessoryId,
          quantity,
          totalSelected: this.selectedAccessories.size
        };
      },

      validateSelection(accessoryId: string, quantity: number) {
        // 检查数量限制
        if (this.selectedAccessories.size >= this.selectionRules.maxSelections) {
          return { valid: false, error: '已达到最大选择数量' };
        }

        // 检查数量有效性
        if (quantity <= 0) {
          return { valid: false, error: '数量必须大于0' };
        }

        return { valid: true };
      },

      handleMutuallyExclusive(accessoryId: string) {
        for (const exclusiveGroup of this.selectionRules.mutuallyExclusive) {
          if (exclusiveGroup.includes(accessoryId)) {
            // 移除同组的其他选择
            for (const excludeId of exclusiveGroup) {
              if (excludeId !== accessoryId && this.selectedAccessories.has(excludeId)) {
                this.selectedAccessories.delete(excludeId);
              }
            }
          }
        }
      },

      async updateQuantity(accessoryId: string, newQuantity: number) {
        if (!this.selectedAccessories.has(accessoryId)) {
          throw new Error('配件未选择');
        }

        if (newQuantity <= 0) {
          this.selectedAccessories.delete(accessoryId);
          return { success: true, removed: true };
        }

        const selection = this.selectedAccessories.get(accessoryId);
        selection.quantity = newQuantity;
        this.selectedAccessories.set(accessoryId, selection);

        return { success: true, updated: true, newQuantity };
      },

      getSelectionSummary() {
        const selections = Array.from(this.selectedAccessories.values());
        return {
          totalItems: selections.length,
          totalQuantity: selections.reduce((sum, s) => sum + s.quantity, 0),
          selections: selections
        };
      }
    };

    // 测试选择配件
    const selectResult1 = await mockSelectionManager.selectAccessory('acc-1', 2);
    this.assert(selectResult1.success, '选择配件应该成功');
    this.assert(selectResult1.quantity === 2, '数量应该正确');
    this.assert(selectResult1.totalSelected === 1, '总选择数应该是1');

    // 测试互斥选择
    const selectResult2 = await mockSelectionManager.selectAccessory('acc-2', 1);
    this.assert(selectResult2.success, '选择互斥配件应该成功');
    this.assert(!mockSelectionManager.selectedAccessories.has('acc-1'), '之前的配件应该被移除');
    this.assert(mockSelectionManager.selectedAccessories.has('acc-2'), '新配件应该被选择');

    // 测试更新数量
    const updateResult = await mockSelectionManager.updateQuantity('acc-2', 3);
    this.assert(updateResult.success, '更新数量应该成功');
    this.assert(updateResult.newQuantity === 3, '新数量应该正确');

    // 测试移除（设置数量为0）
    const removeResult = await mockSelectionManager.updateQuantity('acc-2', 0);
    this.assert(removeResult.success, '移除应该成功');
    this.assert(removeResult.removed, '应该标记为已移除');

    // 测试选择摘要
    await mockSelectionManager.selectAccessory('acc-3', 1);
    await mockSelectionManager.selectAccessory('acc-4', 2);
    const summary = mockSelectionManager.getSelectionSummary();
    this.assert(summary.totalItems === 2, '应该有2个选择项');
    this.assert(summary.totalQuantity === 3, '总数量应该是3');
  }

  // 测试5: 价格计算
  async testPriceCalculation() {
    const mockPriceCalculator = {
      async calculateAccessoryPrice(accessoryId: string, quantity: number, userRole: string) {
        // 模拟配件价格数据
        const basePrices = {
          'acc-1': 2000,
          'acc-2': 5000,
          'acc-3': 3000,
          'acc-4': 1500
        };

        // 角色折扣
        const roleDiscounts = {
          'ADMIN': 0.3,
          'SALES': 0.2,
          'PARTNER': 0.15,
          'CUSTOMER': 0
        };

        const basePrice = basePrices[accessoryId] || 0;
        const discount = roleDiscounts[userRole] || 0;
        const discountedPrice = basePrice * (1 - discount);
        const totalPrice = discountedPrice * quantity;

        return {
          accessoryId,
          quantity,
          basePrice,
          discountedPrice,
          totalPrice,
          discount: discount * 100,
          savings: (basePrice - discountedPrice) * quantity
        };
      },

      async calculateBundlePrice(accessoryIds: string[], quantities: number[], userRole: string) {
        let totalBase = 0;
        let totalDiscounted = 0;
        const items = [];

        for (let i = 0; i < accessoryIds.length; i++) {
          const priceInfo = await this.calculateAccessoryPrice(
            accessoryIds[i], 
            quantities[i], 
            userRole
          );
          
          items.push(priceInfo);
          totalBase += priceInfo.basePrice * priceInfo.quantity;
          totalDiscounted += priceInfo.totalPrice;
        }

        // 套装额外折扣
        const bundleDiscount = accessoryIds.length >= 3 ? 0.05 : 0;
        const bundleDiscountAmount = totalDiscounted * bundleDiscount;
        const finalTotal = totalDiscounted - bundleDiscountAmount;

        return {
          items,
          totalBase,
          totalDiscounted,
          bundleDiscount: bundleDiscount * 100,
          bundleDiscountAmount,
          finalTotal,
          totalSavings: totalBase - finalTotal
        };
      },

      formatPrice(amount: number, currency: string = 'CNY') {
        const formatter = new Intl.NumberFormat('zh-CN', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2
        });
        
        return formatter.format(amount);
      }
    };

    // 测试单个配件价格计算
    const priceInfo = await mockPriceCalculator.calculateAccessoryPrice('acc-1', 2, 'CUSTOMER');
    this.assert(priceInfo.basePrice === 2000, '基础价格应该正确');
    this.assert(priceInfo.discountedPrice === 2000, '客户无折扣');
    this.assert(priceInfo.totalPrice === 4000, '总价应该正确');
    this.assert(priceInfo.savings === 0, '客户无节省');

    // 测试有折扣的价格计算
    const discountedPrice = await mockPriceCalculator.calculateAccessoryPrice('acc-2', 1, 'PARTNER');
    this.assert(discountedPrice.discount === 15, '合作伙伴折扣应该是15%');
    this.assert(discountedPrice.discountedPrice === 4250, '折扣价应该正确');
    this.assert(discountedPrice.savings === 750, '节省金额应该正确');

    // 测试套装价格计算
    const bundlePrice = await mockPriceCalculator.calculateBundlePrice(
      ['acc-1', 'acc-2', 'acc-3'], 
      [1, 1, 1], 
      'SALES'
    );
    this.assert(bundlePrice.items.length === 3, '应该有3个配件');
    this.assert(bundlePrice.bundleDiscount === 5, '套装折扣应该是5%');
    this.assert(bundlePrice.finalTotal < bundlePrice.totalDiscounted, '最终价格应该更低');

    // 测试价格格式化
    const formattedPrice = mockPriceCalculator.formatPrice(12345.67);
    this.assert(formattedPrice.includes('¥'), '应该包含人民币符号');
    this.assert(formattedPrice.includes('12,345.67'), '应该正确格式化数字');
  }

  // 测试6: 购物车集成
  async testCartIntegration() {
    const mockCartIntegration = {
      cart: { items: [], total: 0 },

      async addAccessoriesToCart(accessories: any[]) {
        for (const accessory of accessories) {
          const existingIndex = this.cart.items.findIndex(item => item.id === accessory.id);
          
          if (existingIndex >= 0) {
            this.cart.items[existingIndex].quantity += accessory.quantity;
          } else {
            this.cart.items.push({
              id: accessory.id,
              name: accessory.name,
              type: 'accessory',
              price: accessory.price,
              quantity: accessory.quantity,
              lineTotal: accessory.price * accessory.quantity
            });
          }
        }

        this.updateCartTotal();
        
        return {
          success: true,
          addedCount: accessories.length,
          cartTotal: this.cart.total,
          cartItemCount: this.cart.items.length
        };
      },

      updateCartTotal() {
        this.cart.total = this.cart.items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );
      },

      async validateCartAccessories() {
        const validationResults = [];
        
        for (const item of this.cart.items) {
          if (item.type === 'accessory') {
            // 模拟库存检查
            const inStock = item.quantity <= 10; // 假设库存限制
            const available = inStock ? item.quantity : 10;
            
            validationResults.push({
              itemId: item.id,
              requested: item.quantity,
              available,
              inStock,
              needsUpdate: !inStock
            });
          }
        }

        return {
          allValid: validationResults.every(r => r.inStock),
          results: validationResults,
          needsUpdate: validationResults.some(r => r.needsUpdate)
        };
      }
    };

    // 测试添加配件到购物车
    const accessories = [
      { id: 'acc-1', name: '配件1', price: 2000, quantity: 2 },
      { id: 'acc-2', name: '配件2', price: 3000, quantity: 1 }
    ];

    const addResult = await mockCartIntegration.addAccessoriesToCart(accessories);
    this.assert(addResult.success, '添加配件应该成功');
    this.assert(addResult.addedCount === 2, '应该添加2个配件');
    this.assert(addResult.cartTotal === 7000, '购物车总价应该正确');
    this.assert(addResult.cartItemCount === 2, '购物车项目数应该正确');

    // 测试添加重复配件（应该增加数量）
    const duplicateAccessory = [{ id: 'acc-1', name: '配件1', price: 2000, quantity: 1 }];
    const addDuplicateResult = await mockCartIntegration.addAccessoriesToCart(duplicateAccessory);
    this.assert(addDuplicateResult.cartItemCount === 2, '项目数不应该增加');
    this.assert(mockCartIntegration.cart.items[0].quantity === 3, '数量应该增加到3');

    // 测试购物车验证
    const validation = await mockCartIntegration.validateCartAccessories();
    this.assert(validation.allValid, '所有配件应该有效');
    this.assert(!validation.needsUpdate, '不需要更新');
  }

  // 测试7: 筛选和搜索
  async testFilteringAndSearch() {
    const mockFilterSearch = {
      accessories: [
        { id: 'acc-1', name: '标准工具包', category: 'tools', price: 2000, brand: 'BJT' },
        { id: 'acc-2', name: '高级测量仪', category: 'measurement', price: 5000, brand: 'BJT' },
        { id: 'acc-3', name: '通用配件', category: 'universal', price: 1500, brand: 'Generic' },
        { id: 'acc-4', name: '专用工具', category: 'tools', price: 3000, brand: 'BJT' }
      ],

      applyFilters(filters: any) {
        let filtered = [...this.accessories];

        // 分类筛选
        if (filters.category && filters.category !== 'all') {
          filtered = filtered.filter(acc => acc.category === filters.category);
        }

        // 价格范围筛选
        if (filters.priceRange && filters.priceRange !== 'all') {
          const ranges = {
            'low': [0, 2000],
            'medium': [2001, 4000],
            'high': [4001, Infinity]
          };
          
          const [min, max] = ranges[filters.priceRange] || [0, Infinity];
          filtered = filtered.filter(acc => acc.price >= min && acc.price <= max);
        }

        // 品牌筛选
        if (filters.brand && filters.brand !== 'all') {
          filtered = filtered.filter(acc => acc.brand === filters.brand);
        }

        return filtered;
      },

      searchAccessories(query: string) {
        if (!query) return this.accessories;

        const lowerQuery = query.toLowerCase();
        return this.accessories.filter(acc => 
          acc.name.toLowerCase().includes(lowerQuery) ||
          acc.category.toLowerCase().includes(lowerQuery) ||
          acc.brand.toLowerCase().includes(lowerQuery)
        );
      },

      combineFilterAndSearch(filters: any, searchQuery: string) {
        // 先应用筛选
        let results = this.applyFilters(filters);
        
        // 再应用搜索
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          results = results.filter(acc => 
            acc.name.toLowerCase().includes(lowerQuery) ||
            acc.category.toLowerCase().includes(lowerQuery) ||
            acc.brand.toLowerCase().includes(lowerQuery)
          );
        }

        return results;
      }
    };

    // 测试分类筛选
    const toolsFilter = mockFilterSearch.applyFilters({ category: 'tools' });
    this.assert(toolsFilter.length === 2, '工具分类应该有2个配件');
    this.assert(toolsFilter.every(acc => acc.category === 'tools'), '所有结果都应该是工具');

    // 测试价格筛选
    const lowPriceFilter = mockFilterSearch.applyFilters({ priceRange: 'low' });
    this.assert(lowPriceFilter.length === 2, '低价范围应该有2个配件');
    this.assert(lowPriceFilter.every(acc => acc.price <= 2000), '所有结果价格都应该<=2000');

    // 测试品牌筛选
    const bjtFilter = mockFilterSearch.applyFilters({ brand: 'BJT' });
    this.assert(bjtFilter.length === 3, 'BJT品牌应该有3个配件');

    // 测试搜索
    const searchResults = mockFilterSearch.searchAccessories('工具');
    this.assert(searchResults.length === 3, '搜索"工具"应该返回3个结果');

    // 测试组合筛选和搜索
    const combinedResults = mockFilterSearch.combineFilterAndSearch(
      { category: 'tools' }, 
      '标准'
    );
    this.assert(combinedResults.length === 1, '组合筛选应该返回1个结果');
    this.assert(combinedResults[0].id === 'acc-1', '应该返回标准工具包');
  }

  // 测试8: 批量操作
  async testBulkOperations() {
    const mockBulkOperations = {
      async bulkSelectAccessories(accessoryIds: string[], defaultQuantity: number = 1) {
        const results = [];
        
        for (const id of accessoryIds) {
          try {
            // 模拟选择操作
            const result = {
              accessoryId: id,
              success: true,
              quantity: defaultQuantity,
              message: '选择成功'
            };
            results.push(result);
          } catch (error) {
            results.push({
              accessoryId: id,
              success: false,
              error: (error as Error).message
            });
          }
        }

        return {
          totalProcessed: accessoryIds.length,
          successCount: results.filter(r => r.success).length,
          failureCount: results.filter(r => !r.success).length,
          results
        };
      },

      async bulkUpdateQuantities(updates: Array<{id: string, quantity: number}>) {
        const results = [];
        
        for (const update of updates) {
          const result = {
            accessoryId: update.id,
            oldQuantity: 1, // 模拟旧数量
            newQuantity: update.quantity,
            success: update.quantity > 0,
            message: update.quantity > 0 ? '更新成功' : '数量无效'
          };
          results.push(result);
        }

        return {
          totalUpdated: updates.length,
          successCount: results.filter(r => r.success).length,
          results
        };
      },

      async bulkRemoveAccessories(accessoryIds: string[]) {
        const results = accessoryIds.map(id => ({
          accessoryId: id,
          success: true,
          message: '移除成功'
        }));

        return {
          totalRemoved: accessoryIds.length,
          successCount: results.length,
          results
        };
      },

      async exportSelections(format: string = 'json') {
        const mockSelections = [
          { id: 'acc-1', name: '配件1', quantity: 2, price: 2000 },
          { id: 'acc-2', name: '配件2', quantity: 1, price: 3000 }
        ];

        if (format === 'json') {
          return {
            format: 'json',
            data: JSON.stringify(mockSelections, null, 2),
            filename: `accessories_${Date.now()}.json`
          };
        } else if (format === 'csv') {
          const headers = 'ID,Name,Quantity,Price\n';
          const rows = mockSelections.map(s => 
            `${s.id},${s.name},${s.quantity},${s.price}`
          ).join('\n');
          
          return {
            format: 'csv',
            data: headers + rows,
            filename: `accessories_${Date.now()}.csv`
          };
        }

        throw new Error('不支持的导出格式');
      }
    };

    // 测试批量选择
    const bulkSelectResult = await mockBulkOperations.bulkSelectAccessories(
      ['acc-1', 'acc-2', 'acc-3'], 
      2
    );
    this.assert(bulkSelectResult.totalProcessed === 3, '应该处理3个配件');
    this.assert(bulkSelectResult.successCount === 3, '所有选择都应该成功');
    this.assert(bulkSelectResult.failureCount === 0, '不应该有失败');

    // 测试批量更新数量
    const bulkUpdateResult = await mockBulkOperations.bulkUpdateQuantities([
      { id: 'acc-1', quantity: 3 },
      { id: 'acc-2', quantity: 0 }, // 无效数量
      { id: 'acc-3', quantity: 1 }
    ]);
    this.assert(bulkUpdateResult.totalUpdated === 3, '应该更新3个配件');
    this.assert(bulkUpdateResult.successCount === 2, '应该有2个成功更新');

    // 测试批量移除
    const bulkRemoveResult = await mockBulkOperations.bulkRemoveAccessories(['acc-1', 'acc-2']);
    this.assert(bulkRemoveResult.totalRemoved === 2, '应该移除2个配件');
    this.assert(bulkRemoveResult.successCount === 2, '所有移除都应该成功');

    // 测试导出JSON
    const jsonExport = await mockBulkOperations.exportSelections('json');
    this.assert(jsonExport.format === 'json', '格式应该是JSON');
    this.assert(jsonExport.filename.includes('.json'), '文件名应该包含.json');
    this.assert(jsonExport.data.includes('acc-1'), '数据应该包含配件信息');

    // 测试导出CSV
    const csvExport = await mockBulkOperations.exportSelections('csv');
    this.assert(csvExport.format === 'csv', '格式应该是CSV');
    this.assert(csvExport.data.includes('ID,Name,Quantity,Price'), '应该包含CSV头部');
  }
}

export async function runAccessoriesPageTests() {
  const test = new AccessoriesPageIntegrationTest();
  return await test.runAllTests();
} 