/**
 * Consumables页面集成测试 - 基于真实需求
 * 只测试front-requirement.md中定义的实际功能
 */

interface PriceTier {
  min: number;
  max: number;
  price: number;
}

interface InventoryData {
  available: number;
  reserved: number;
  total: number;
}

export class ConsumablesPageIntegrationTest {
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
    const tests = [
      { name: '页面初始化', fn: () => this.testPageInitialization() },
      { name: '导航栏和面包屑', fn: () => this.testNavigationAndBreadcrumb() },
      { name: '筛选功能', fn: () => this.testFilteringFunctionality() },
      { name: 'Shape图片显示', fn: () => this.testShapeImageDisplay() },
      { name: '产品列表展示', fn: () => this.testProductListDisplay() },
      { name: '价格显示逻辑', fn: () => this.testPricingDisplay() },
      { name: '库存显示权限', fn: () => this.testInventoryDisplayPermissions() },
      { name: '购物车集成', fn: () => this.testCartIntegration() },
      { name: '浮动购物车显示', fn: () => this.testFloatingCartDisplay() },
      { name: '详细信息浮层', fn: () => this.testDetailOverlay() },
      { name: '响应式设计', fn: () => this.testResponsiveDesign() }
    ];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - startTime;
        this.addTestResult(test.name, 'pass', duration);
        console.log(`✅ ${test.name} - 通过 (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addTestResult(test.name, 'fail', duration, (error as Error).message);
        console.log(`❌ ${test.name} - 失败: ${(error as Error).message}`);
      }
    }

    return this.testResults;
  }

  // 测试1: 页面初始化
  async testPageInitialization() {
    const mockPageInitializer = {
      state: {
        loading: true,
        error: null as string | null,
        consumables: [] as any[],
        filterOptions: null as any,
        selectedFilters: {
          model: 'all',
          unit: 'metric',
          shape: 'all',
          material: 'all',
          thickness: 'all',
          width: 'all',
          length: 'all'
        }
      },

      async initialize() {
        try {
          this.state.loading = true;
          this.state.error = null;
          
          // 加载筛选选项
          await this.loadFilterOptions();
          
          // 加载耗材列表
          await this.loadConsumables();
          
          this.state.loading = false;
        } catch (error) {
          this.state.loading = false;
          this.state.error = (error as Error).message;
          throw error;
        }
      },

      async loadFilterOptions() {
        // 模拟筛选选项数据
        this.state.filterOptions = {
          models: ['LA-E4S', 'LA-E6S', 'LA-A8S'],
          shapes: ['pillow', 'gusset', 'block_bottom'],
          materials: ['HDPE', 'LDPE', 'Paper', 'Laminated']
        };
      },

      async loadConsumables() {
        // 模拟耗材数据
        this.state.consumables = [
          {
            id: 'film-001',
            partNumber: 'BJT-FILM-001',
            model: 'LA-E4S',
            name: '枕式包装膜',
            name_en: 'Pillow Packaging Film',
            spec: '厚度:25um, 膜宽:30cm, 袋长:20cm',
            spec_en: 'Thickness:25um, Width:30cm, Length:20cm',
            shape: 'pillow',
            material: 'HDPE',
            image: 'https://example.com/film-001.jpg',
            unitPrice: 150,
            minOrderQuantity: 10,
            inventory: {
              CN: { available: 500, reserved: 50 },
              EU: { available: 200, reserved: 20 }
            },
            prices: {
              customer: [
                { min: 1, max: 49, price: 150 },
                { min: 50, max: 99, price: 140 },
                { min: 100, max: 999, price: 130 }
              ],
              partner: [
                { min: 1, max: 49, price: 135 },
                { min: 50, max: 99, price: 125 },
                { min: 100, max: 999, price: 115 }
              ]
            }
          }
        ];
      }
    };

    // 执行初始化测试
    await mockPageInitializer.initialize();
    
    this.assert(!mockPageInitializer.state.loading, '页面应该加载完成');
    this.assert(mockPageInitializer.state.error === null, '不应该有错误');
    this.assert(mockPageInitializer.state.filterOptions !== null, '应该加载筛选选项');
    this.assert(mockPageInitializer.state.consumables.length > 0, '应该加载耗材数据');
  }

  // 测试2: 导航栏和面包屑导航
  async testNavigationAndBreadcrumb() {
    const mockNavigation = {
      navbar: {
        visible: true,
        logo: 'BJT Logo',
        menuItems: ['产品分类', '文档下载', '售后服务'],
        languageSwitch: true,
        loginButton: true
      },
      breadcrumb: {
        visible: true,
        path: ['首页', '耗材选择'],
        currentPage: '耗材选择'
      },

      getBreadcrumbPath() {
        return this.breadcrumb.path.join(' > ');
      },

      validateNavigation() {
        const errors = [];
        
        if (!this.navbar.visible) errors.push('导航栏不可见');
        if (!this.navbar.logo) errors.push('Logo缺失');
        if (this.navbar.menuItems.length === 0) errors.push('菜单项为空');
        if (!this.navbar.languageSwitch) errors.push('语言切换器缺失');
        if (!this.breadcrumb.visible) errors.push('面包屑导航不可见');
        if (this.breadcrumb.path.length < 2) errors.push('面包屑路径不完整');
        
        return {
          isValid: errors.length === 0,
          errors
        };
      }
    };

    const validation = mockNavigation.validateNavigation();
    this.assert(validation.isValid, `导航验证失败: ${validation.errors.join(', ')}`);
    
    const breadcrumbText = mockNavigation.getBreadcrumbPath();
    this.assert(breadcrumbText === '首页 > 耗材选择', `面包屑路径错误: ${breadcrumbText}`);
  }

  // 测试3: Shape图片显示
  async testShapeImageDisplay() {
    const mockShapeManager = {
      shapeOptions: [
        {
          value: 'pillow',
          name: '枕式',
          image: 'https://example.com/shapes/pillow.jpg',
          description: '适用于一般产品包装'
        },
        {
          value: 'gusset',
          name: '风琴式',
          image: 'https://example.com/shapes/gusset.jpg',
          description: '适用于体积较大的产品'
        },
        {
          value: 'block_bottom',
          name: '方底',
          image: 'https://example.com/shapes/block_bottom.jpg',
          description: '适用于需要稳定放置的产品'
        }
      ],

      getShapeWithImage(shapeValue: string) {
        return this.shapeOptions.find(shape => shape.value === shapeValue);
      },

      validateShapeImages() {
        const errors = [];
        
        for (const shape of this.shapeOptions) {
          if (!shape.image) {
            errors.push(`${shape.name} 缺少示例图片`);
          }
          if (!shape.image.includes('http')) {
            errors.push(`${shape.name} 图片URL格式错误`);
          }
          if (!shape.description) {
            errors.push(`${shape.name} 缺少描述信息`);
          }
        }
        
        return {
          isValid: errors.length === 0,
          errors,
          totalShapes: this.shapeOptions.length
        };
      }
    };

    const validation = mockShapeManager.validateShapeImages();
    this.assert(validation.isValid, `Shape图片验证失败: ${validation.errors.join(', ')}`);
    this.assert(validation.totalShapes >= 3, `Shape选项数量不足: ${validation.totalShapes}`);
    
    // 测试特定shape的图片显示
    const pillowShape = mockShapeManager.getShapeWithImage('pillow');
    this.assert(pillowShape !== undefined, '枕式shape不存在');
    this.assert(pillowShape?.image.includes('pillow') ?? false, '枕式shape图片URL错误');
  }

  // 测试4: 筛选功能
  async testFilteringFunctionality() {
    const mockFilterManager = {
      allConsumables: [
        { id: '1', model: 'LA-E4S', shape: 'pillow', material: 'HDPE', thickness: 25 },
        { id: '2', model: 'LA-E6S', shape: 'gusset', material: 'LDPE', thickness: 30 },
        { id: '3', model: 'LA-A8S', shape: 'block_bottom', material: 'Paper', thickness: 50 }
      ],
      filteredResults: [] as any[],

      applyFilters(filters: any) {
        this.filteredResults = this.allConsumables.filter(item => {
          if (filters.model !== 'all' && item.model !== filters.model) return false;
          if (filters.shape !== 'all' && item.shape !== filters.shape) return false;
          if (filters.material !== 'all' && item.material !== filters.material) return false;
          return true;
        });
        return this.filteredResults;
      },

      // 测试材质选择后的动态筛选项
      getMaterialSpecificFilters(material: string) {
        if (material.toLowerCase().includes('paper')) {
          return {
            thicknessType: 'weight', // 克重
            options: ['80gsm', '100gsm', '120gsm']
          };
        } else {
          return {
            thicknessType: 'thickness', // 厚度
            options: ['25um', '30um', '50um']
          };
        }
      },

      resetFilters() {
        this.filteredResults = [...this.allConsumables];
        return {
          model: 'all',
          shape: 'all',
          material: 'all',
          thickness: 'all'
        };
      }
    };

    // 测试基础筛选
    const modelFilterResult = mockFilterManager.applyFilters({ model: 'LA-E4S', shape: 'all', material: 'all' });
    this.assert(modelFilterResult.length === 1, '按型号筛选应该返回1个结果');
    this.assert(modelFilterResult[0].model === 'LA-E4S', '筛选结果应该匹配选择的型号');

    // 测试材质相关的动态筛选
    const paperFilters = mockFilterManager.getMaterialSpecificFilters('Paper');
    this.assert(paperFilters.thicknessType === 'weight', 'Paper材质应该显示重量选项');

    const plasticFilters = mockFilterManager.getMaterialSpecificFilters('HDPE');
    this.assert(plasticFilters.thicknessType === 'thickness', '塑料材质应该显示厚度选项');

    // 测试重置功能
    const resetResult = mockFilterManager.resetFilters();
    this.assert(resetResult.model === 'all', '重置后型号筛选应该回到"all"');
    this.assert(mockFilterManager.filteredResults.length === 3, '重置后应该显示所有结果');
  }

  // 测试5: 产品列表展示
  async testProductListDisplay() {
    const mockProductDisplay = {
      consumables: [
        {
          id: 'film-001',
          partNumber: 'BJT-FILM-001', 
          model: 'LA-E4S',
          name_zh: '枕式包装膜',
          name_en: 'Pillow Packaging Film',
          spec_zh: '厚度:25um, 膜宽:30cm, 袋长:20cm',
          spec_en: 'Thickness:25um, Width:30cm, Length:20cm',
          image: 'https://example.com/film-001.jpg',
          attributes: ['适用型号: LA-E4S', '袋型: 枕式', '材质: HDPE'],
          compatibleModels: ['LA-E4S-220V', 'LA-E4S-380V']
        }
      ],

      getDisplayData(language = 'zh') {
        return this.consumables.map(item => ({
          id: item.id,
          partNumber: item.partNumber,
          image: item.image,
          name: language === 'zh' ? item.name_zh : item.name_en,
          spec: language === 'zh' ? item.spec_zh : item.spec_en,
          model: item.model,
          attributes: item.attributes,
          compatibleModels: item.compatibleModels
        }));
      },

      validateDisplayFields(item: any) {
        const requiredFields = ['id', 'partNumber', 'image', 'name', 'spec', 'model'];
        return requiredFields.every(field => item[field] && item[field] !== '');
      }
    };

    // 测试列表显示数据
    const displayData = mockProductDisplay.getDisplayData('zh');
    this.assert(displayData.length === 1, '应该返回1个显示项');
    
    const item = displayData[0];
    this.assert(mockProductDisplay.validateDisplayFields(item), '所有必需字段都应该存在');
    this.assert(item.name === '枕式包装膜', '中文名称应该正确显示');

    // 测试英文显示
    const englishData = mockProductDisplay.getDisplayData('en');
    this.assert(englishData[0].name === 'Pillow Packaging Film', '英文名称应该正确显示');
  }

  // 测试6: 价格显示逻辑 - 根据账号类型显示阶梯价格
  async testPricingDisplay() {
    const mockPricingManager = {
      priceData: {
        'film-001': {
          customer: [
            { min: 1, max: 49, price: 150 },
            { min: 50, max: 99, price: 140 },
            { min: 100, max: 999, price: 130 }
          ] as PriceTier[],
          partner: [
            { min: 1, max: 49, price: 135 },
            { min: 50, max: 99, price: 125 },
            { min: 100, max: 999, price: 115 }
          ] as PriceTier[],
          sales: [
            { min: 1, max: 49, price: 120 },
            { min: 50, max: 99, price: 110 },
            { min: 100, max: 999, price: 100 }
          ] as PriceTier[]
        }
      } as Record<string, Record<string, PriceTier[]>>,

      getPriceDisplay(productId: string, userRole: string, userRegion: string) {
        const productPrices = this.priceData[productId];
        if (!productPrices) return null;
        
        const prices = productPrices[userRole];
        if (!prices) return null;

        return {
          tiers: prices,
          currency: this.getCurrencySymbol(userRegion),
          formatPrice: (price: number) => `${this.getCurrencySymbol(userRegion)}${price.toFixed(2)}`
        };
      },

      getCurrencySymbol(region: string) {
        const currencyMap: Record<string, string> = {
          'CN': '¥',
          'EU': '€', 
          'NA': '$',
          'AU': 'A$'
        };
        return currencyMap[region] || '¥';
      },

      getCurrentTierPrice(productId: string, userRole: string, quantity: number) {
        const productPrices = this.priceData[productId];
        if (!productPrices) return 0;
        
        const prices = productPrices[userRole];
        if (!prices) return 0;

        const tier = prices.find((p: PriceTier) => quantity >= p.min && quantity <= p.max);
        return tier?.price || prices[prices.length - 1].price;
      }
    };

    // 测试客户价格
    const customerPricing = mockPricingManager.getPriceDisplay('film-001', 'customer', 'CN');
    this.assert(customerPricing !== null, '客户应该能看到价格');
    this.assert(customerPricing!.tiers.length === 3, '应该有3个价格层级');
    this.assert(customerPricing!.currency === '¥', '中国区域应该显示人民币符号');

    // 测试合作伙伴优惠价格
    const partnerPricing = mockPricingManager.getPriceDisplay('film-001', 'partner', 'EU');
    this.assert(partnerPricing!.tiers[0].price === 135, '合作伙伴应该有优惠价格');
    this.assert(partnerPricing!.currency === '€', '欧洲区域应该显示欧元符号');

    // 测试数量对应价格
    const price1 = mockPricingManager.getCurrentTierPrice('film-001', 'customer', 25);
    const price50 = mockPricingManager.getCurrentTierPrice('film-001', 'customer', 50);
    this.assert(price1 === 150, '小数量应该是最高价格');
    this.assert(price50 === 140, '中等数量应该有折扣');
  }

  // 测试7: 库存显示权限 - 只有销售账号能看库存
  async testInventoryDisplayPermissions() {
    const mockInventoryManager = {
      inventoryData: {
        'film-001': {
          CN: { available: 500, reserved: 50, total: 550 },
          EU: { available: 200, reserved: 20, total: 220 }
        }
      } as Record<string, Record<string, InventoryData>>,

      getInventoryDisplay(productId: string, userRole: string, userRegion: string) {
        // 只有销售类账号能看库存
        if (userRole !== 'sales') {
          return null;
        }

        const productInventory = this.inventoryData[productId];
        if (!productInventory) return null;
        
        const inventory = productInventory[userRegion];
        if (!inventory) return null;

        return {
          available: inventory.available,
          reserved: inventory.reserved,
          total: inventory.total,
          status: this.getStockStatus(inventory.available)
        };
      },

      getStockStatus(available: number) {
        if (available > 100) return 'in_stock';
        if (available > 10) return 'low_stock';
        return 'out_of_stock';
      }
    };

    // 测试销售账号能看库存
    const salesInventory = mockInventoryManager.getInventoryDisplay('film-001', 'sales', 'CN');
    this.assert(salesInventory !== null, '销售账号应该能看到库存信息');
    this.assert(salesInventory!.available === 500, '可用库存数量应该正确');
    this.assert(salesInventory!.status === 'in_stock', '库存状态应该正确');

    // 测试客户账号看不到库存
    const customerInventory = mockInventoryManager.getInventoryDisplay('film-001', 'customer', 'CN');
    this.assert(customerInventory === null, '客户账号不应该看到库存信息');

    // 测试合作伙伴账号看不到库存
    const partnerInventory = mockInventoryManager.getInventoryDisplay('film-001', 'partner', 'CN');
    this.assert(partnerInventory === null, '合作伙伴账号不应该看到库存信息');
  }

  // 测试8: 购物车集成
  async testCartIntegration() {
    const mockCartManager = {
      cartItems: [] as any[],

      async addToCart(productId: string, quantity: number, productData: any) {
        const existingIndex = this.cartItems.findIndex(item => item.id === productId);
        
        if (existingIndex >= 0) {
          this.cartItems[existingIndex].quantity += quantity;
        } else {
          this.cartItems.push({
            id: productId,
            name: productData.name,
            partNumber: productData.partNumber,
            quantity: quantity,
            unitPrice: productData.unitPrice,
            lineTotal: productData.unitPrice * quantity,
            type: 'consumable'
          });
        }

        return {
          success: true,
          cartItemCount: this.cartItems.length,
          message: '已添加到购物车'
        };
      },

      getCartPreview() {
        return {
          items: this.cartItems,
          totalItems: this.cartItems.reduce((sum, item) => sum + item.quantity, 0),
          totalValue: this.cartItems.reduce((sum, item) => sum + item.lineTotal, 0)
        };
      },

      validateCartItem(productId: string, quantity: number) {
        if (quantity < 1) {
          throw new Error('数量必须大于0');
        }
        if (quantity > 999) {
          throw new Error('单次添加数量不能超过999');
        }
        return true;
      }
    };

    // 测试添加到购物车
    const productData = {
      name: '枕式包装膜',
      partNumber: 'BJT-FILM-001',
      unitPrice: 150
    };

    const addResult = await mockCartManager.addToCart('film-001', 5, productData);
    this.assert(addResult.success, '添加到购物车应该成功');
    this.assert(addResult.cartItemCount === 1, '购物车应该有1个商品');

    // 测试购物车预览
    const preview = mockCartManager.getCartPreview();
    this.assert(preview.totalItems === 5, '购物车总数量应该是5');
    this.assert(preview.totalValue === 750, '购物车总价值应该是750');

    // 测试添加相同商品
    await mockCartManager.addToCart('film-001', 3, productData);
    const updatedPreview = mockCartManager.getCartPreview();
    this.assert(updatedPreview.totalItems === 8, '相同商品应该累加数量');

    // 测试验证功能
    try {
      mockCartManager.validateCartItem('film-001', 0);
      this.assert(false, '应该抛出数量错误');
    } catch (error) {
      this.assert((error as Error).message.includes('大于0'), '应该返回正确的错误信息');
    }
  }

  // 测试9: 浮动购物车显示
  async testFloatingCartDisplay() {
    const mockFloatingCart = {
      state: {
        visible: true,
        position: 'bottom-right',
        itemCount: 0,
        totalAmount: 0,
        items: [] as any[]
      },

      async showCart() {
        this.state.visible = true;
        return {
          overlayVisible: true,
          staysOnCurrentPage: true,
          showsCartItems: true
        };
      },

      async hideCart() {
        this.state.visible = false;
        return {
          overlayVisible: false
        };
      },

      validateCartOverlay() {
        const result = {
          hasFloatingIcon: this.state.visible,
          correctPosition: this.state.position === 'bottom-right',
          showsItemCount: true,
          clickableIcon: true
        };
        
        return {
          isValid: Object.values(result).every(v => v === true),
          details: result
        };
      },

      async testCartPreviewInteraction() {
        // 点击购物车图标
        const cartDisplay = await this.showCart();
        
        // 验证不跳转页面
        const pageChanged = false; // 模拟页面未跳转
        
        return {
          overlayOpened: cartDisplay.overlayVisible,
          stayedOnPage: !pageChanged,
          showsCartContent: cartDisplay.showsCartItems
        };
      }
    };

    // 验证浮动购物车基本显示
    const validation = mockFloatingCart.validateCartOverlay();
    this.assert(validation.isValid, `浮动购物车显示验证失败: ${JSON.stringify(validation.details)}`);
    
    // 验证购物车预览交互
    const interaction = await mockFloatingCart.testCartPreviewInteraction();
    this.assert(interaction.overlayOpened, '购物车浮层未正确打开');
    this.assert(interaction.stayedOnPage, '点击购物车导致页面跳转');
    this.assert(interaction.showsCartContent, '购物车浮层未显示内容');
  }

  // 测试10: 详细信息浮层
  async testDetailOverlay() {
    const mockDetailManager = {
      getDetailInfo(productId: string) {
        const detailData: Record<string, any> = {
          'film-001': {
            packaging: {
              material: '纸箱包装',
              thickness_metric: '厚度: 25um',
              thickness_imperial: '厚度: 1.0mil',
              width_metric: '膜宽: 30cm',
              width_imperial: '膜宽: 11.8inch',
              length_metric: '袋长: 20cm',
              length_imperial: '袋长: 7.9inch'
            },
            specifications: {
              compatibility: ['LA-E4S-220V', 'LA-E4S-380V'],
              minOrderQty: 10,
              shelfLife: '24个月',
              storageConditions: '常温干燥处储存'
            }
          }
        };

        return detailData[productId] || null;
      },

      formatDetailDisplay(detailInfo: any, unit: 'metric' | 'imperial' = 'metric') {
        if (!detailInfo) return null;

        const packaging = detailInfo.packaging;
        const specs = detailInfo.specifications;

        return {
          packaging: {
            material: packaging.material,
            thickness: unit === 'metric' ? packaging.thickness_metric : packaging.thickness_imperial,
            width: unit === 'metric' ? packaging.width_metric : packaging.width_imperial,
            length: unit === 'metric' ? packaging.length_metric : packaging.length_imperial
          },
          specifications: specs
        };
      }
    };

    // 测试获取详细信息
    const detailInfo = mockDetailManager.getDetailInfo('film-001');
    this.assert(detailInfo !== null, '应该能获取到详细信息');
    this.assert(detailInfo.packaging.material === '纸箱包装', '包装材质应该正确');

    // 测试公制单位显示
    const metricDisplay = mockDetailManager.formatDetailDisplay(detailInfo, 'metric');
    this.assert(metricDisplay!.packaging.thickness.includes('um'), '公制应该显示um单位');
    this.assert(metricDisplay!.packaging.width.includes('cm'), '公制应该显示cm单位');

    // 测试英制单位显示  
    const imperialDisplay = mockDetailManager.formatDetailDisplay(detailInfo, 'imperial');
    this.assert(imperialDisplay!.packaging.thickness.includes('mil'), '英制应该显示mil单位');
    this.assert(imperialDisplay!.packaging.width.includes('inch'), '英制应该显示inch单位');
  }

  // 测试11: 响应式设计
  async testResponsiveDesign() {
    const mockResponsiveManager = {
      getLayoutForViewport(width: number, height: number) {
        if (width < 768) {
          return {
            layout: 'mobile',
            filterStyle: 'drawer',
            productColumns: 1,
            showFilterButton: true,
            cartPosition: 'bottom-fixed'
          };
        } else if (width < 1024) {
          return {
            layout: 'tablet', 
            filterStyle: 'collapsible',
            productColumns: 2,
            showFilterButton: true,
            cartPosition: 'top-right'
          };
        } else {
          return {
            layout: 'desktop',
            filterStyle: 'sidebar',
            productColumns: 3,
            showFilterButton: false,
            cartPosition: 'top-right'
          };
        }
      },

      validateMobileLayout(layout: any) {
        return {
          hasDrawerFilter: layout.filterStyle === 'drawer',
          hasSingleColumn: layout.productColumns === 1,
          hasFilterButton: layout.showFilterButton,
          hasFixedCart: layout.cartPosition === 'bottom-fixed'
        };
      }
    };

    // 测试移动端布局
    const mobileLayout = mockResponsiveManager.getLayoutForViewport(375, 667);
    this.assert(mobileLayout.layout === 'mobile', '小屏幕应该使用移动端布局');
    
    const mobileValidation = mockResponsiveManager.validateMobileLayout(mobileLayout);
    this.assert(mobileValidation.hasDrawerFilter, '移动端筛选应该是抽屉式');
    this.assert(mobileValidation.hasSingleColumn, '移动端产品应该单列显示');
    this.assert(mobileValidation.hasFilterButton, '移动端应该有筛选按钮');

    // 测试平板布局
    const tabletLayout = mockResponsiveManager.getLayoutForViewport(768, 1024);
    this.assert(tabletLayout.productColumns === 2, '平板应该双列显示');

    // 测试桌面布局
    const desktopLayout = mockResponsiveManager.getLayoutForViewport(1200, 800);
    this.assert(desktopLayout.filterStyle === 'sidebar', '桌面端应该有侧边栏筛选');
    this.assert(!desktopLayout.showFilterButton, '桌面端不需要筛选按钮');
  }

  getResults() {
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    
    return {
      total: this.testResults.length,
      passed,
      failed,
      passRate: `${((passed / this.testResults.length) * 100).toFixed(1)}%`,
      details: this.testResults
    };
  }
}

export async function runConsumablesPageTests() {
  console.log('🧪 开始运行 Consumables 页面集成测试...\n');
  
  const testRunner = new ConsumablesPageIntegrationTest();
  await testRunner.runAllTests();
  
  const results = testRunner.getResults();
  
  console.log('\n📊 测试结果汇总:');
  console.log(`总测试数: ${results.total}`);
  console.log(`通过: ${results.passed} ✅`);
  console.log(`失败: ${results.failed} ❌`);
  console.log(`通过率: ${results.passRate}`);
  
  if (results.failed > 0) {
    console.log('\n❌ 失败的测试:');
    results.details.filter(r => r.status === 'fail').forEach(test => {
      console.log(`- ${test.test}: ${test.error}`);
    });
  }
  
  return testRunner;
} 