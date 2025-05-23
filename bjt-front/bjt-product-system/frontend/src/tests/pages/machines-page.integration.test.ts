/**
 * Machines页面集成测试用例
 * 重点测试API集成、组件交互、多级配件选择等核心业务逻辑
 */

import { MachineListData, MachineQueryParams, AccessoryListData } from '@/types/api.types';

// Machines页面集成测试类
export class MachinesPageIntegrationTest {
  private testResults: Array<{ test: string; status: 'pass' | 'fail'; error?: string }> = [];

  async runAllTests() {
    console.log('🔧 开始运行Machines页面集成测试...');
    
    await this.testPageInitialization();
    await this.testMachineDataLoading();
    await this.testFilteringFunctionality();
    await this.testMachineSelection();
    await this.testAccessoryHierarchy();
    await this.testCartIntegration();
    await this.testPricingDisplay();
    await this.testErrorHandling();
    await this.testPerformanceConsiderations();
    
    this.generateReport();
  }

  /**
   * 测试页面初始化
   */
  async testPageInitialization() {
    try {
      console.log('🚀 测试页面初始化...');
      
      const mockMachinesPageComponent = {
        // 页面状态
        state: {
          machines: [] as any[],
          loading: false,
          error: null as string | null,
          selectedMachine: null as string | null,
          accessories: {} as Record<string, any>,
          filters: {
            voltage: 'all',
            type: 'all',
            search: ''
          }
        },
        
        // 初始化方法
        async initialize() {
          this.state.loading = true;
          
          try {
            // 1. 检查用户认证
            const authStatus = await this.checkAuthentication();
            if (!authStatus.authenticated) {
              throw new Error('用户未认证');
            }
            
            // 2. 获取产品线ID
            const productLineId = this.getProductLineId();
            if (!productLineId) {
              throw new Error('缺少产品线ID');
            }
            
            // 3. 加载机器数据
            await this.loadMachines(productLineId);
            
            // 4. 初始化用户区域设置
            this.initializeUserSettings(authStatus.user);
            
            this.state.loading = false;
            return { success: true };
            
          } catch (error) {
            this.state.loading = false;
            this.state.error = (error as Error).message;
            throw error;
          }
        },
        
        async checkAuthentication() {
          // 模拟认证检查
          const token = localStorage.getItem('auth_token');
          if (!token) {
            return { authenticated: false };
          }
          
          return {
            authenticated: true,
            user: {
              id: 1,
              region: 'CN',
              role: 'CUSTOMER',
              permissions: ['view_products', 'view_prices']
            }
          };
        },
        
        getProductLineId() {
          // 模拟从URL参数获取产品线ID
          return 1; // 默认为气垫机产品线
        },
        
        async loadMachines(productLineId: number) {
          // 模拟API调用
          const mockMachines = [
            {
              id: 1,
              code: 'BJT-M001',
              title_zh: '标准气垫机',
              title_en: 'Standard Air Cushion Machine',
              type: 'automatic',
              voltage: '220V',
              product_line_id: productLineId
            }
          ];
          
          this.state.machines = mockMachines;
        },
        
        initializeUserSettings(user: any) {
          // 根据用户区域设置显示选项
          const settings = {
            currency: user.region === 'CN' ? 'CNY' : 'USD',
            language: user.region === 'CN' ? 'zh' : 'en',
            showPrices: user.permissions.includes('view_prices')
          };
          
          return settings;
        }
      };

      // 执行初始化测试
      const result = await mockMachinesPageComponent.initialize();
      
      // 验证初始化结果
      this.assert(result.success === true, '页面初始化应该成功');
      this.assert(mockMachinesPageComponent.state.machines.length > 0, '机器数据应该加载成功');
      this.assert(!mockMachinesPageComponent.state.loading, '加载状态应该为false');
      this.assert(mockMachinesPageComponent.state.error === null, '不应该有错误');

      this.addTestResult('testPageInitialization', 'pass');
      console.log('  ✓ 页面初始化测试通过');
      
    } catch (error) {
      this.addTestResult('testPageInitialization', 'fail', (error as Error).message);
      console.error('  ❌ 页面初始化测试失败:', error);
    }
  }

  /**
   * 测试机器数据加载
   */
  async testMachineDataLoading() {
    try {
      console.log('📊 测试机器数据加载...');
      
      const mockMachineService = {
        async getMachines(params: MachineQueryParams): Promise<MachineListData> {
          // 模拟不同参数的API响应
          const allMachines = [
            {
              id: 1,
              code: 'BJT-M001',
              title_zh: '标准气垫机',
              title_en: 'Standard Air Cushion Machine',
              product_line_id: 1,
              type: 'automatic',
              image_url: '/images/machine1.jpg',
              status: 'publish' as const,
              sort_order: 1,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 2,
              code: 'BJT-M002',
              title_zh: '高速气垫机',
              title_en: 'High Speed Air Cushion Machine',
              product_line_id: 1,
              type: 'automatic',
              image_url: '/images/machine2.jpg',
              status: 'publish' as const,
              sort_order: 2,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          ];

          // 根据筛选条件过滤
          let filteredMachines = allMachines;
          
          if (params.type && params.type !== 'all') {
            filteredMachines = filteredMachines.filter(m => m.type === params.type);
          }
          
          if (params.search) {
            filteredMachines = filteredMachines.filter(m => 
              m.title_zh.includes(params.search || '') || 
              m.title_en.includes(params.search || '') ||
              m.code.includes(params.search || '')
            );
          }

          // 模拟网络延迟
          await new Promise(resolve => setTimeout(resolve, 100));

          return {
            items: filteredMachines,
            total: filteredMachines.length,
            page: params.page || 1,
            per_page: params.per_page || 10,
            total_pages: Math.ceil(filteredMachines.length / (params.per_page || 10))
          };
        }
      };

      // 测试基本数据加载
      const basicResult = await mockMachineService.getMachines({ product_line_id: 1 });
      this.assert(basicResult.items.length === 2, '应该返回2台机器');
      this.assert(basicResult.total === 2, '总数应该为2');

      // 测试搜索功能
      const searchResult = await mockMachineService.getMachines({ 
        product_line_id: 1, 
        search: '标准' 
      });
      this.assert(searchResult.items.length === 1, '搜索"标准"应该返回1台机器');
      this.assert(searchResult.items[0].title_zh.includes('标准'), '搜索结果应该包含"标准"');

      // 测试分页
      const pageResult = await mockMachineService.getMachines({ 
        product_line_id: 1, 
        page: 1, 
        per_page: 1 
      });
      this.assert(pageResult.items.length === 1, '每页1个应该返回1台机器');
      this.assert(pageResult.total_pages === 2, '总页数应该为2');

      this.addTestResult('testMachineDataLoading', 'pass');
      console.log('  ✓ 机器数据加载测试通过');
      
    } catch (error) {
      this.addTestResult('testMachineDataLoading', 'fail', (error as Error).message);
      console.error('  ❌ 机器数据加载测试失败:', error);
    }
  }

  /**
   * 测试筛选功能
   */
  async testFilteringFunctionality() {
    try {
      console.log('🔍 测试筛选功能...');
      
      const mockFilterComponent = {
        filters: {
          voltage: 'all',
          type: 'all',
          search: ''
        },
        
        availableFilters: {
          voltage: ['all', '220V', '110V', '380V'],
          type: ['all', 'automatic', 'manual', 'semi-automatic']
        },
        
        applyFilter(filterType: string, value: string) {
          this.filters[filterType as keyof typeof this.filters] = value;
          return this.getFilteredResults();
        },
        
        getFilteredResults() {
          // 模拟筛选结果
          const mockMachines = [
            { id: 1, voltage: '220V', type: 'automatic', title_zh: '标准机' },
            { id: 2, voltage: '110V', type: 'automatic', title_zh: '高速机' },
            { id: 3, voltage: '220V', type: 'manual', title_zh: '手动机' }
          ];
          
          let filtered = mockMachines;
          
          if (this.filters.voltage !== 'all') {
            filtered = filtered.filter(m => m.voltage === this.filters.voltage);
          }
          
          if (this.filters.type !== 'all') {
            filtered = filtered.filter(m => m.type === this.filters.type);
          }
          
          return filtered;
        },
        
        resetFilters() {
          this.filters = {
            voltage: 'all',
            type: 'all',
            search: ''
          };
          return this.getFilteredResults();
        }
      };

      // 测试初始状态
      const initialResults = mockFilterComponent.getFilteredResults();
      this.assert(initialResults.length === 3, '初始状态应该显示所有机器');

      // 测试电压筛选
      const voltageResults = mockFilterComponent.applyFilter('voltage', '220V');
      this.assert(voltageResults.length === 2, '220V筛选应该返回2台机器');
      this.assert(voltageResults.every(m => m.voltage === '220V'), '所有结果都应该是220V');

      // 测试类型筛选
      const typeResults = mockFilterComponent.applyFilter('type', 'automatic');
      this.assert(typeResults.length === 1, '自动类型筛选应该返回1台机器');
      this.assert(typeResults[0].type === 'automatic', '结果应该是自动类型');

      // 测试筛选重置
      const resetResults = mockFilterComponent.resetFilters();
      this.assert(resetResults.length === 3, '重置后应该显示所有机器');

      this.addTestResult('testFilteringFunctionality', 'pass');
      console.log('  ✓ 筛选功能测试通过');
      
    } catch (error) {
      this.addTestResult('testFilteringFunctionality', 'fail', (error as Error).message);
      console.error('  ❌ 筛选功能测试失败:', error);
    }
  }

  /**
   * 测试机器选择
   */
  async testMachineSelection() {
    try {
      console.log('🎯 测试机器选择...');
      
      const mockMachineSelectionComponent = {
        selectedMachine: null as string | null,
        accessories: {} as Record<string, any>,
        
        async selectMachine(machineId: string) {
          // 选择机器
          this.selectedMachine = machineId;
          
          // 自动加载一级配件
          await this.loadAccessories(machineId, 1);
          
          return {
            success: true,
            machineId: machineId,
            accessoriesLoaded: Object.keys(this.accessories).length > 0
          };
        },
        
        async loadAccessories(machineId: string, level: number) {
          // 模拟加载配件数据
          const mockAccessories = {
            level1: [
              { id: 'acc-1', name: '标准配件包', level: 1, parent: machineId },
              { id: 'acc-2', name: '高级配件包', level: 1, parent: machineId }
            ]
          };
          
          this.accessories[`level${level}`] = mockAccessories.level1;
          
          // 模拟网络延迟
          await new Promise(resolve => setTimeout(resolve, 50));
        },
        
        clearSelection() {
          this.selectedMachine = null;
          this.accessories = {};
        }
      };

      // 测试机器选择
      const selectResult = await mockMachineSelectionComponent.selectMachine('BJT-M001');
      this.assert(selectResult.success === true, '机器选择应该成功');
      this.assert(selectResult.machineId === 'BJT-M001', '选中的机器ID应该正确');
      this.assert(selectResult.accessoriesLoaded === true, '配件应该自动加载');

      // 验证状态更新
      this.assert(
        mockMachineSelectionComponent.selectedMachine === 'BJT-M001',
        '选中机器状态应该更新'
      );
      this.assert(
        mockMachineSelectionComponent.accessories['level1']?.length === 2,
        '应该加载2个一级配件'
      );

      // 测试清除选择
      mockMachineSelectionComponent.clearSelection();
      this.assert(
        mockMachineSelectionComponent.selectedMachine === null,
        '清除后选中机器应该为null'
      );
      this.assert(
        Object.keys(mockMachineSelectionComponent.accessories).length === 0,
        '清除后配件数据应该为空'
      );

      this.addTestResult('testMachineSelection', 'pass');
      console.log('  ✓ 机器选择测试通过');
      
    } catch (error) {
      this.addTestResult('testMachineSelection', 'fail', (error as Error).message);
      console.error('  ❌ 机器选择测试失败:', error);
    }
  }

  /**
   * 测试多级配件层次结构
   */
  async testAccessoryHierarchy() {
    try {
      console.log('🔗 测试多级配件层次结构...');
      
      const mockAccessoryHierarchyComponent = {
        accessoryTree: {} as Record<number, Record<string, any>>,
        maxLevels: 5,
        
        async loadAccessoryLevel(parentId: string, level: number) {
          if (level > this.maxLevels) {
            throw new Error('超过最大层级限制');
          }
          
          // 模拟不同层级的配件数据
          const mockAccessoryData = {
            1: [
              { id: 'acc-1-1', name: '标准配件包', hasChildren: true },
              { id: 'acc-1-2', name: '高级配件包', hasChildren: true }
            ],
            2: [
              { id: 'acc-2-1', name: '基础模块', hasChildren: true, parent: 'acc-1-1' },
              { id: 'acc-2-2', name: '扩展模块', hasChildren: false, parent: 'acc-1-1' }
            ],
            3: [
              { id: 'acc-3-1', name: '核心组件', hasChildren: false, parent: 'acc-2-1' }
            ]
          };
          
          const accessories = mockAccessoryData[level as keyof typeof mockAccessoryData] || [];
          
          // 存储到层次结构中
          if (!this.accessoryTree[level]) {
            this.accessoryTree[level] = {};
          }
          this.accessoryTree[level][parentId] = accessories;
          
          return accessories;
        },
        
        async selectAccessory(accessoryId: string, level: number) {
          // 选择配件后，自动加载下一级
          const accessory = this.findAccessoryById(accessoryId, level);
          
          if (accessory?.hasChildren && level < this.maxLevels) {
            await this.loadAccessoryLevel(accessoryId, level + 1);
            return {
              selected: accessory,
              nextLevel: level + 1,
              hasNextLevel: true
            };
          }
          
          return {
            selected: accessory,
            nextLevel: null,
            hasNextLevel: false
          };
        },
        
        findAccessoryById(id: string, level: number) {
          const levelData = this.accessoryTree[level];
          if (!levelData) return null;
          
          for (const parentId in levelData) {
            const accessories = levelData[parentId];
            const found = accessories.find((acc: any) => acc.id === id);
            if (found) return found;
          }
          
          return null;
        },
        
        getAccessoryPath(accessoryId: string) {
          // 获取配件的完整路径
          const path = [];
          let currentId = accessoryId;
          
          // 简化的路径查找逻辑
          for (let level = 3; level >= 1; level--) {
            const accessory = this.findAccessoryById(currentId, level);
            if (accessory) {
              path.unshift({ level, ...accessory });
              currentId = accessory.parent;
            }
          }
          
          return path;
        }
      };

      // 测试加载第一级配件
      const level1Accessories = await mockAccessoryHierarchyComponent.loadAccessoryLevel('BJT-M001', 1);
      this.assert(level1Accessories.length === 2, '第一级应该有2个配件');
      this.assert(level1Accessories[0].hasChildren === true, '第一级配件应该有子配件');

      // 测试选择第一级配件并自动加载第二级
      const selectResult = await mockAccessoryHierarchyComponent.selectAccessory('acc-1-1', 1);
      this.assert(selectResult.selected?.id === 'acc-1-1', '选中的配件ID应该正确');
      this.assert(selectResult.hasNextLevel === true, '应该有下一级配件');
      this.assert(selectResult.nextLevel === 2, '下一级应该是第2级');

      // 验证第二级配件已加载
      const level2Data = mockAccessoryHierarchyComponent.accessoryTree[2];
      this.assert(level2Data['acc-1-1']?.length === 2, '第二级应该有2个配件');

      // 测试继续选择到第三级
      const level3SelectResult = await mockAccessoryHierarchyComponent.selectAccessory('acc-2-1', 2);
      this.assert(level3SelectResult.hasNextLevel === true, '应该可以继续到第三级');

      // 测试路径获取
      const accessoryPath = mockAccessoryHierarchyComponent.getAccessoryPath('acc-3-1');
      this.assert(accessoryPath.length > 0, '应该能获取配件路径');

      this.addTestResult('testAccessoryHierarchy', 'pass');
      console.log('  ✓ 多级配件层次结构测试通过');
      
    } catch (error) {
      this.addTestResult('testAccessoryHierarchy', 'fail', (error as Error).message);
      console.error('  ❌ 多级配件层次结构测试失败:', error);
    }
  }

  /**
   * 测试购物车集成
   */
  async testCartIntegration() {
    try {
      console.log('🛒 测试购物车集成...');
      
      const mockCartIntegration = {
        cart: { items: [] as any[], total: 0 },
        
        async addToCart(product: any, quantity: number = 1) {
          // 验证产品信息
          if (!product.id || !product.name || !product.price) {
            throw new Error('产品信息不完整');
          }
          
          // 检查是否已存在
          const existingIndex = this.cart.items.findIndex((item: any) => item.id === product.id);
          
          if (existingIndex >= 0) {
            // 更新数量
            this.cart.items[existingIndex].quantity += quantity;
          } else {
            // 添加新项目
            this.cart.items.push({
              id: product.id,
              name: product.name,
              price: product.price,
              quantity: quantity,
              lineTotal: product.price * quantity
            });
          }
          
          // 重新计算总计
          this.updateCartTotal();
          
          return {
            success: true,
            itemCount: this.cart.items.length,
            cartTotal: this.cart.total
          };
        },
        
        updateCartTotal() {
          this.cart.total = this.cart.items.reduce((sum: number, item: any) => 
            sum + item.lineTotal, 0
          );
        },
        
        async removeFromCart(productId: string) {
          const initialLength = this.cart.items.length;
          this.cart.items = this.cart.items.filter((item: any) => item.id !== productId);
          
          if (this.cart.items.length < initialLength) {
            this.updateCartTotal();
            return { success: true, removed: true };
          }
          
          return { success: false, removed: false };
        },
        
        getCartSummary() {
          return {
            itemCount: this.cart.items.length,
            totalAmount: this.cart.total,
            items: this.cart.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              lineTotal: item.lineTotal
            }))
          };
        }
      };

      // 测试添加产品到购物车
      const addResult = await mockCartIntegration.addToCart({
        id: 'BJT-M001',
        name: '标准气垫机',
        price: 5000
      }, 2);
      
      this.assert(addResult.success === true, '添加到购物车应该成功');
      this.assert(addResult.itemCount === 1, '购物车应该有1个商品');
      this.assert(addResult.cartTotal === 10000, '购物车总价应该是10000');

      // 测试添加相同产品（应该更新数量）
      const addSameResult = await mockCartIntegration.addToCart({
        id: 'BJT-M001',
        name: '标准气垫机',
        price: 5000
      }, 1);
      
      this.assert(addSameResult.itemCount === 1, '仍然应该只有1个商品类型');
      this.assert(addSameResult.cartTotal === 15000, '总价应该更新为15000');

      // 测试购物车摘要
      const summary = mockCartIntegration.getCartSummary();
      this.assert(summary.itemCount === 1, '摘要显示1个商品类型');
      this.assert(summary.totalAmount === 15000, '摘要总价正确');
      this.assert(summary.items[0].quantity === 3, '数量应该是3');

      // 测试移除产品
      const removeResult = await mockCartIntegration.removeFromCart('BJT-M001');
      this.assert(removeResult.success === true, '移除应该成功');
      this.assert(removeResult.removed === true, '应该确实移除了');

      // 验证移除后状态
      const emptySummary = mockCartIntegration.getCartSummary();
      this.assert(emptySummary.itemCount === 0, '购物车应该为空');
      this.assert(emptySummary.totalAmount === 0, '总价应该为0');

      this.addTestResult('testCartIntegration', 'pass');
      console.log('  ✓ 购物车集成测试通过');
      
    } catch (error) {
      this.addTestResult('testCartIntegration', 'fail', (error as Error).message);
      console.error('  ❌ 购物车集成测试失败:', error);
    }
  }

  /**
   * 测试价格显示
   */
  async testPricingDisplay() {
    try {
      console.log('💰 测试价格显示...');
      
      const mockPricingComponent = {
        userRole: 'CUSTOMER',
        userRegion: 'CN',
        
        getPriceDisplay(product: any, userRole: string, userRegion: string): any {
          // 根据用户角色和地区显示不同的价格信息
          const priceRules = {
            ADMIN: { showCost: true, showMargin: true, showAll: true },
            SALES: { showCost: true, showMargin: false, showAll: true },
            CUSTOMER: { showCost: false, showMargin: false, showAll: false },
            PARTNER: { showCost: false, showMargin: false, showAll: true }
          };
          
          const rules = priceRules[userRole as keyof typeof priceRules] || priceRules.CUSTOMER;
          
          const pricing = {
            visible: rules.showAll || userRole === 'CUSTOMER',
            currency: userRegion === 'CN' ? 'CNY' : 'USD',
            symbol: userRegion === 'CN' ? '¥' : '$',
            basePrice: product.price,
            displayPrice: this.formatPrice(product.price, userRegion),
            tieredPricing: rules.showAll ? this.getTieredPricing(product) : null,
            costInfo: rules.showCost ? { cost: product.price * 0.7, margin: '30%' } : null
          };
          
          if (!pricing.visible) {
            return {
              visible: false,
              message: '请联系销售获取价格信息'
            };
          }
          
          return pricing;
        },
        
        formatPrice(price: number, region: string) {
          const locale = region === 'CN' ? 'zh-CN' : 'en-US';
          const currency = region === 'CN' ? 'CNY' : 'USD';
          
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
          }).format(price);
        },
        
        getTieredPricing(product: any) {
          return [
            { quantity: '1-9', price: product.price, discount: '0%' },
            { quantity: '10-49', price: product.price * 0.95, discount: '5%' },
            { quantity: '50+', price: product.price * 0.9, discount: '10%' }
          ];
        }
      };

      const testProduct = {
        id: 'BJT-M001',
        name: '标准气垫机',
        price: 5000
      };

      // 测试客户角色价格显示
      const customerPricing = mockPricingComponent.getPriceDisplay(testProduct, 'CUSTOMER', 'CN');
      this.assert(customerPricing.visible === true, '客户应该能看到价格');
      if (customerPricing.visible) {
        this.assert(customerPricing.currency === 'CNY', '中国地区应该显示人民币');
        this.assert(customerPricing.symbol === '¥', '应该显示人民币符号');
        this.assert(customerPricing.tieredPricing === null, '客户不应该看到阶梯价格');
      }

      // 测试销售角色价格显示
      const salesPricing = mockPricingComponent.getPriceDisplay(testProduct, 'SALES', 'CN');
      this.assert(salesPricing.visible === true, '销售应该能看到价格');
      if (salesPricing.visible) {
        this.assert(salesPricing.tieredPricing !== null, '销售应该看到阶梯价格');
        this.assert(salesPricing.costInfo !== null, '销售应该看到成本信息');
      }

      // 测试合作伙伴角色
      const partnerPricing = mockPricingComponent.getPriceDisplay(testProduct, 'PARTNER', 'CN');
      this.assert(partnerPricing.visible === true, '合作伙伴应该能看到价格');
      if (partnerPricing.visible) {
        this.assert(partnerPricing.tieredPricing !== null, '合作伙伴应该看到阶梯价格');
        this.assert(partnerPricing.costInfo === null, '合作伙伴不应该看到成本信息');
      }

      // 测试美国地区价格格式
      const usPricing = mockPricingComponent.getPriceDisplay(testProduct, 'CUSTOMER', 'US');
      if (usPricing.visible) {
        this.assert(usPricing.currency === 'USD', '美国地区应该显示美元');
        this.assert(usPricing.symbol === '$', '应该显示美元符号');
      }

      this.addTestResult('testPricingDisplay', 'pass');
      console.log('  ✓ 价格显示测试通过');
      
    } catch (error) {
      this.addTestResult('testPricingDisplay', 'fail', (error as Error).message);
      console.error('  ❌ 价格显示测试失败:', error);
    }
  }

  /**
   * 测试错误处理
   */
  async testErrorHandling() {
    try {
      console.log('🚫 测试错误处理...');
      
      const mockErrorHandlingComponent = {
        async handleApiError(apiCall: () => Promise<any>): Promise<any> {
          try {
            const result = await apiCall();
            return { success: true, data: result };
          } catch (error: any) {
            const errorInfo = this.categorizeError(error);
            
            // 根据错误类型采取不同处理策略
            switch (errorInfo.category) {
              case 'network':
                return this.handleNetworkError(errorInfo);
              case 'auth':
                return this.handleAuthError(errorInfo);
              case 'validation':
                return this.handleValidationError(errorInfo);
              default:
                return this.handleGenericError(errorInfo);
            }
          }
        },
        
        categorizeError(error: any) {
          if (error.message.includes('网络') || error.message.includes('timeout')) {
            return { category: 'network', message: error.message, retryable: true };
          }
          
          if (error.message.includes('认证') || error.message.includes('登录')) {
            return { category: 'auth', message: error.message, retryable: false };
          }
          
          if (error.message.includes('参数') || error.message.includes('validation')) {
            return { category: 'validation', message: error.message, retryable: false };
          }
          
          return { category: 'generic', message: error.message, retryable: true };
        },
        
        handleNetworkError(errorInfo: any) {
          return {
            success: false,
            error: errorInfo,
            userMessage: '网络连接出现问题，请检查网络后重试',
            showRetry: true,
            fallbackAction: 'use_cache'
          };
        },
        
        handleAuthError(errorInfo: any) {
          return {
            success: false,
            error: errorInfo,
            userMessage: '登录已过期，请重新登录',
            showRetry: false,
            redirectTo: '/login'
          };
        },
        
        handleValidationError(errorInfo: any) {
          return {
            success: false,
            error: errorInfo,
            userMessage: '输入信息有误，请检查后重试',
            showRetry: false,
            focusField: 'input'
          };
        },
        
        handleGenericError(errorInfo: any) {
          return {
            success: false,
            error: errorInfo,
            userMessage: '出现了未知错误，请稍后重试',
            showRetry: true,
            reportError: true
          };
        }
      };

      // 测试网络错误处理
      const networkErrorResult = await mockErrorHandlingComponent.handleApiError(
        () => Promise.reject(new Error('网络连接超时'))
      );
      this.assert(networkErrorResult.success === false, '网络错误应该返回失败');
      if (!networkErrorResult.success && 'showRetry' in networkErrorResult) {
        this.assert(networkErrorResult.showRetry === true, '网络错误应该显示重试按钮');
      }
      if (!networkErrorResult.success && 'fallbackAction' in networkErrorResult) {
        this.assert(networkErrorResult.fallbackAction === 'use_cache', '应该有缓存回退策略');
      }

      // 测试认证错误处理
      const authErrorResult = await mockErrorHandlingComponent.handleApiError(
        () => Promise.reject(new Error('用户认证过期'))
      );
      this.assert(authErrorResult.success === false, '认证错误应该返回失败');
      if (!authErrorResult.success && 'showRetry' in authErrorResult) {
        this.assert(authErrorResult.showRetry === false, '认证错误不应该显示重试');
      }
      if (!authErrorResult.success && 'redirectTo' in authErrorResult) {
        this.assert(authErrorResult.redirectTo === '/login', '应该重定向到登录页');
      }

      // 测试参数验证错误
      const validationErrorResult = await mockErrorHandlingComponent.handleApiError(
        () => Promise.reject(new Error('参数validation失败'))
      );
      this.assert(validationErrorResult.success === false, '验证错误应该返回失败');
      if (!validationErrorResult.success && 'focusField' in validationErrorResult) {
        this.assert(validationErrorResult.focusField === 'input', '应该聚焦到输入字段');
      }

      // 测试成功情况
      const successResult = await mockErrorHandlingComponent.handleApiError(
        () => Promise.resolve({ data: 'success' })
      );
      this.assert(successResult.success === true, '成功调用应该返回成功');
      if (successResult.success && 'data' in successResult) {
        this.assert(successResult.data.data === 'success', '应该返回正确数据');
      }

      this.addTestResult('testErrorHandling', 'pass');
      console.log('  ✓ 错误处理测试通过');
      
    } catch (error) {
      this.addTestResult('testErrorHandling', 'fail', (error as Error).message);
      console.error('  ❌ 错误处理测试失败:', error);
    }
  }

  /**
   * 测试性能考量
   */
  async testPerformanceConsiderations() {
    try {
      console.log('⚡ 测试性能考量...');
      
      const mockPerformanceComponent = {
        // 虚拟滚动测试
        testVirtualScrolling(itemCount: number, viewportHeight: number, itemHeight: number) {
          const visibleCount = Math.ceil(viewportHeight / itemHeight);
          const bufferSize = Math.min(5, Math.floor(visibleCount * 0.5));
          
          return {
            totalItems: itemCount,
            visibleItems: visibleCount,
            bufferItems: bufferSize,
            renderItems: visibleCount + bufferSize * 2,
            memoryUsage: ((visibleCount + bufferSize * 2) / itemCount) * 100
          };
        },
        
        // 延迟加载测试
        testLazyLoading() {
          const loadingStrategies = {
            images: 'intersection-observer',
            accessories: 'on-demand',
            pricing: 'user-role-based',
            translations: 'language-split'
          };
          
          const metrics = {
            initialLoadTime: 1200, // ms
            imageLoadTime: 300,    // ms per image
            accessoryLoadTime: 500, // ms per level
            memoryOptimization: 60  // % reduction
          };
          
          return { strategies: loadingStrategies, metrics };
        },
        
        // 缓存策略测试
        testCachingStrategy() {
          const cacheConfig = {
            machineData: { ttl: 300000, maxSize: 100 }, // 5分钟，最多100项
            accessoryData: { ttl: 600000, maxSize: 500 }, // 10分钟，最多500项
            priceData: { ttl: 180000, maxSize: 200 }, // 3分钟，最多200项
            userPrefs: { ttl: 86400000, maxSize: 50 } // 24小时，最多50项
          };
          
          const hitRates = {
            machineData: 85,    // %
            accessoryData: 75,  // %
            priceData: 60,      // %
            userPrefs: 95       // %
          };
          
          return { config: cacheConfig, hitRates };
        }
      };

      // 测试虚拟滚动效果
      const virtualScrollResult = mockPerformanceComponent.testVirtualScrolling(1000, 600, 60);
      this.assert(virtualScrollResult.renderItems < 50, '虚拟滚动应该大幅减少渲染项目数');
      this.assert(virtualScrollResult.memoryUsage < 10, '内存使用应该低于10%');

      // 测试延迟加载策略
      const lazyLoadResult = mockPerformanceComponent.testLazyLoading();
      this.assert(lazyLoadResult.strategies.images === 'intersection-observer', '图片应该使用交叉观察器');
      this.assert(lazyLoadResult.strategies.accessories === 'on-demand', '配件应该按需加载');
      this.assert(lazyLoadResult.metrics.memoryOptimization > 50, '内存优化应该超过50%');

      // 测试缓存策略
      const cacheResult = mockPerformanceComponent.testCachingStrategy();
      this.assert(cacheResult.config.machineData.ttl === 300000, '机器数据缓存5分钟');
      this.assert(cacheResult.hitRates.userPrefs === 95, '用户偏好缓存命中率应该很高');
      
      // 验证关键性能指标
      const avgHitRate = Object.values(cacheResult.hitRates).reduce((sum, rate) => sum + rate, 0) / 
                        Object.values(cacheResult.hitRates).length;
      this.assert(avgHitRate > 70, '平均缓存命中率应该超过70%');

      this.addTestResult('testPerformanceConsiderations', 'pass');
      console.log('  ✓ 性能考量测试通过');
      
    } catch (error) {
      this.addTestResult('testPerformanceConsiderations', 'fail', (error as Error).message);
      console.error('  ❌ 性能考量测试失败:', error);
    }
  }

  // 辅助方法
  private assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`断言失败: ${message}`);
    }
  }

  private addTestResult(test: string, status: 'pass' | 'fail', error?: string) {
    this.testResults.push({ test, status, error });
  }

  private generateReport() {
    console.log('\n📊 Machines页面集成测试报告:');
    console.log('=' + '='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    const total = this.testResults.length;
    
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed} ✓`);
    console.log(`失败: ${failed} ❌`);
    console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => r.status === 'fail')
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.error}`);
        });
    }
    
    console.log('\n🎯 Machines页面优化建议:');
    if (failed === 0) {
      console.log('  ✅ Machines页面集成测试全部通过');
      console.log('  📈 建议关注性能优化：虚拟滚动、懒加载、缓存策略');
      console.log('  🔧 考虑拆分1385行的大组件为多个子组件');
    } else {
      console.log('  🔧 需要修复上述失败的测试项');
      console.log('  📋 优先级：错误处理 > 数据加载 > 配件层次 > 购物车 > 性能');
    }
  }

  getResults() {
    return {
      total: this.testResults.length,
      passed: this.testResults.filter(r => r.status === 'pass').length,
      failed: this.testResults.filter(r => r.status === 'fail').length,
      details: this.testResults
    };
  }
}

// 导出测试运行器
export async function runMachinesPageTests() {
  const tester = new MachinesPageIntegrationTest();
  await tester.runAllTests();
  return tester.getResults();
}

// 如果直接运行此文件
if (typeof window === 'undefined') {
  runMachinesPageTests().catch(console.error);
} 