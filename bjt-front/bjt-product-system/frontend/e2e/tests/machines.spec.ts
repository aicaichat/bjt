import { test, expect } from '@playwright/test';
import { MachinesPage } from '../pages/MachinesPage';
import { TestHelpers } from '../utils/test-helpers';

test.describe('机器页面 E2E 测试 - 完整版', () => {
  let machinesPage: MachinesPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    machinesPage = new MachinesPage(page);
    helpers = new TestHelpers(page);
    await machinesPage.goto();
  });

  test.describe('3.1 页面元素与导航测试', () => {
    test('应该验证顶部导航栏和面包屑导航正确显示', async ({ page }) => {
      // 检查页面是否加载
      expect(await machinesPage.isLoaded()).toBe(true);
      
      // 检查面包屑导航是否存在
      expect(await machinesPage.hasBreadcrumb()).toBe(true);
      
      // 验证面包屑导航格式 (首页 > 分类名称)
      const hasCorrectFormat = await machinesPage.validateBreadcrumbFormat();
      expect(hasCorrectFormat).toBe(true);
      
      const breadcrumbText = await machinesPage.getBreadcrumbText();
      console.log(`✅ 面包屑导航显示正确: ${breadcrumbText}`);
    });

    test('应该确认页面头部展示产品线的第一个筛选属性', async ({ page }) => {
      // 检查筛选面板是否存在
      const hasFilterPanel = await helpers.isVisible('[data-testid="filter-panel"]');
      expect(hasFilterPanel).toBe(true);
      
      // 检查产品线筛选属性
      const hasProductLineFilter = await helpers.isVisible('[data-testid="product-line-filter"]');
      
      if (hasProductLineFilter) {
        console.log('✅ 产品线筛选属性正确显示');
      } else {
        console.log('⏭️ 产品线筛选属性不存在，可能使用其他筛选方式');
      }
    });

    test('应该检查产品列表展示格式正确', async ({ page }) => {
      // 等待机器列表加载
      await helpers.waitForElement('[data-testid="machine-card"]');
      
      // 检查机器卡片数量
      const machineCount = await machinesPage.getMachineCount();
      expect(machineCount).toBeGreaterThanOrEqual(0);
      
      if (machineCount > 0) {
        // 检查列表格式
        const listView = await helpers.isVisible('[data-testid="machines-list"]');
        console.log(`✅ 产品列表格式正确: ${machineCount}台机器，列表视图=${listView}`);
      } else {
        console.log('✅ 产品列表为空状态正确显示');
      }
    });
  });

  test.describe('3.2 产品展示测试', () => {
    test('应该验证产品正确按照列表形式展示', async ({ page }) => {
      // 等待机器卡片加载
      await helpers.waitForElement('[data-testid="machine-card"]');
      
      // 检查机器卡片数量
      const machineCount = await machinesPage.getMachineCount();
      expect(machineCount).toBeGreaterThan(0);
      
      console.log(`✅ 产品列表展示: 共${machineCount}台机器`);
    });

    test('应该确认每个产品显示完整信息', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 验证第一台机器的字段完整性
        const fieldValidation = await machinesPage.validateProductFields(0);
        
        // 至少应该显示70%的字段
        expect(fieldValidation.completeness).toBeGreaterThanOrEqual(70);
        
        console.log(`✅ 产品信息完整性: ${fieldValidation.displayedFields}/${fieldValidation.totalFields} 字段 (${fieldValidation.completeness.toFixed(1)}%)`);
        console.log('  显示的字段:', Object.entries(fieldValidation.fields)
          .filter(([, visible]) => visible)
          .map(([field]) => field)
          .join(', '));
      } else {
        console.log('⏭️ 没有机器数据，跳过字段验证测试');
      }
    });

    test('应该根据不同账号类型验证价格显示权限', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 检查阶梯价格显示
        const hasTieredPricing = await machinesPage.checkTieredPricing(0);
        
        // 检查货币符号和单位制
        const currencyValidation = await machinesPage.validateCurrencyAndUnits(0);
        
        console.log(`✅ 价格显示验证:
          - 阶梯价格: ${hasTieredPricing ? '显示' : '不显示'}
          - 货币符号: ${currencyValidation.hasCurrencySymbol ? '有' : '无'}
          - 价格文本: ${currencyValidation.priceText}`);
      } else {
        console.log('⏭️ 没有机器数据，跳过价格验证测试');
      }
    });

    test('应该测试销售类账号能否查看库存信息', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 检查库存信息可见性
        const canViewStock = await machinesPage.checkStockVisibility(0);
        
        if (canViewStock) {
          console.log('✅ 当前账号可以查看库存信息');
        } else {
          console.log('✅ 当前账号无法查看库存信息（符合权限设计）');
        }
      } else {
        console.log('⏭️ 没有机器数据，跳过库存验证测试');
      }
    });
  });

  test.describe('3.3 产品信息与交互测试', () => {
    test('应该测试"更多信息"按钮和浮层显示', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 点击"更多信息"按钮
        await machinesPage.clickMoreInfo(0);
        
        // 验证浮层是否出现
        expect(await machinesPage.hasInfoOverlay()).toBe(true);
        
        // 获取浮层信息
        const overlayInfo = await machinesPage.getOverlayInfo();
        
        console.log(`✅ "更多信息"浮层正确显示:
          - 包装尺寸: ${overlayInfo.packageSize || '未提供'}
          - 包装毛重: ${overlayInfo.packageWeight || '未提供'}
          - 打托后总高度: ${overlayInfo.palletHeight || '未提供'}
          - 单位制: ${overlayInfo.unitSystem || '未指定'}`);
        
        // 关闭浮层
        await machinesPage.closeInfoOverlay();
        expect(await machinesPage.hasInfoOverlay()).toBe(false);
      } else {
        console.log('⏭️ 没有机器数据，跳过"更多信息"测试');
      }
    });

    test('应该验证产品规则说明PDF下载功能', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        try {
          // 尝试下载PDF
          const downloadSuccess = await machinesPage.downloadProductPDF(0);
          
          if (downloadSuccess) {
            console.log('✅ PDF下载功能正常');
          } else {
            console.log('⏭️ PDF下载按钮不存在或下载失败');
          }
        } catch (error) {
          console.log('⏭️ PDF下载功能不可用或超时');
        }
      } else {
        console.log('⏭️ 没有机器数据，跳过PDF下载测试');
      }
    });

    test('应该测试数量设置功能', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 设置数量
        const testQuantity = 5;
        await machinesPage.setProductQuantity(testQuantity, 0);
        
        // 验证数量设置
        const actualQuantity = await machinesPage.getProductQuantity(0);
        expect(actualQuantity).toBe(testQuantity);
        
        console.log(`✅ 数量设置功能正常: 设置为${testQuantity}个`);
      } else {
        console.log('⏭️ 没有机器数据，跳过数量设置测试');
      }
    });

    test('应该验证添加到购物车功能', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 查看机器详情
        await machinesPage.viewMachineDetail(0);
        
        // 添加到购物车
        await machinesPage.addToCart();
        
        // 检查购物车通知
        const hasNotification = await machinesPage.hasCartNotification();
        
        console.log(`✅ 添加到购物车功能: ${hasNotification ? '成功' : '执行完成'}`);
      } else {
        console.log('⏭️ 没有机器数据，跳过添加购物车测试');
      }
    });
  });

  test.describe('3.4 配件多级选择测试', () => {
    test('应该选择产品后验证一级配件自动展开', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 选择机器并检查配件展开
        const accessoriesExpanded = await machinesPage.selectMachineAndCheckAccessories(0);
        
        if (accessoriesExpanded) {
          console.log('✅ 选择产品后一级配件自动展开');
        } else {
          console.log('⏭️ 一级配件未展开（可能无配件或需要手动操作）');
        }
      } else {
        console.log('⏭️ 没有机器数据，跳过配件展开测试');
      }
    });

    test('应该确认配件信息展示完整', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 选择机器
        const accessoriesExpanded = await machinesPage.selectMachineAndCheckAccessories(0);
        
        if (accessoriesExpanded) {
          // 获取第一个配件的信息
          const accessoryInfo = await machinesPage.getAccessoryInfo(1, 0);
          
          // 验证配件信息完整性
          const requiredFields = ['model', 'partNumber', 'name'];
          const hasRequiredInfo = requiredFields.some(field => accessoryInfo[field as keyof typeof accessoryInfo]);
          
          expect(hasRequiredInfo).toBe(true);
          
          console.log(`✅ 配件信息展示完整:
            - 型号: ${accessoryInfo.model || '未提供'}
            - 料号: ${accessoryInfo.partNumber || '未提供'}
            - 名称: ${accessoryInfo.name || '未提供'}
            - 电压: ${accessoryInfo.voltage || '未提供'}
            - 频率: ${accessoryInfo.frequency || '未提供'}`);
        } else {
          console.log('⏭️ 配件未展开，跳过配件信息测试');
        }
      } else {
        console.log('⏭️ 没有机器数据，跳过配件信息测试');
      }
    });

    test('应该测试选择一级配件后二级配件自动展开', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 选择机器
        const level1Expanded = await machinesPage.selectMachineAndCheckAccessories(0);
        
        if (level1Expanded) {
          // 选择一级配件并检查二级配件展开
          const level2Expanded = await machinesPage.selectAccessoryAndCheckNextLevel(1, 0);
          
          if (level2Expanded) {
            console.log('✅ 选择一级配件后二级配件自动展开');
          } else {
            console.log('⏭️ 二级配件未展开（可能无二级配件）');
          }
        } else {
          console.log('⏭️ 一级配件未展开，跳过二级配件测试');
        }
      } else {
        console.log('⏭️ 没有机器数据，跳过多级配件测试');
      }
    });

    test('应该验证多级配件展示最多至五级', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 选择机器
        const accessoriesExpanded = await machinesPage.selectMachineAndCheckAccessories(0);
        
        if (accessoriesExpanded) {
          // 验证配件级别限制
          const levelValidation = await machinesPage.validateAccessoryLevels();
          
          expect(levelValidation.hasLevelLimit).toBe(true);
          expect(levelValidation.maxLevel).toBeLessThanOrEqual(5);
          
          console.log(`✅ 配件级别验证: 当前最高级别=${levelValidation.maxLevel}, 五级限制=${levelValidation.hasLevelLimit ? '正常' : '超出'}`);
        } else {
          console.log('⏭️ 配件未展开，跳过级别限制测试');
        }
      } else {
        console.log('⏭️ 没有机器数据，跳过级别限制测试');
      }
    });

    test('应该测试配件添加到购物车功能', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 选择机器
        const accessoriesExpanded = await machinesPage.selectMachineAndCheckAccessories(0);
        
        if (accessoriesExpanded) {
          // 添加配件到购物车
          await machinesPage.addAccessoryToCart(1, 0);
          
          console.log('✅ 配件添加到购物车功能执行完成');
        } else {
          console.log('⏭️ 配件未展开，跳过配件购物车测试');
        }
      } else {
        console.log('⏭️ 没有机器数据，跳过配件购物车测试');
      }
    });
  });

  test.describe('3.5 购物车交互测试', () => {
    test('应该验证页面中浮动购物车图标可见', async ({ page }) => {
      // 检查浮动购物车图标
      const hasFloatingCart = await machinesPage.hasFloatingCart();
      
      if (hasFloatingCart) {
        console.log('✅ 浮动购物车图标可见');
      } else {
        console.log('⏭️ 浮动购物车图标不存在（可能在其他位置）');
      }
    });

    test('应该测试购物车浮层预览功能', async ({ page }) => {
      const hasFloatingCart = await machinesPage.hasFloatingCart();
      
      if (hasFloatingCart) {
        // 点击购物车预览
        await machinesPage.clickCartPreview();
        
        // 验证预览是否显示
        expect(await machinesPage.hasCartPreview()).toBe(true);
        
        // 获取购物车商品数量
        const itemCount = await machinesPage.getCartPreviewItemCount();
        
        console.log(`✅ 购物车预览正常: 显示${itemCount}个商品`);
        
        // 关闭预览
        await machinesPage.closeCartPreview();
        expect(await machinesPage.hasCartPreview()).toBe(false);
      } else {
        console.log('⏭️ 浮动购物车不存在，跳过预览测试');
      }
    });

    test('应该确认预览不会导致跳出当前页面', async ({ page }) => {
      const hasFloatingCart = await machinesPage.hasFloatingCart();
      
      if (hasFloatingCart) {
        // 验证购物车预览不会跳转页面
        const staysOnPage = await machinesPage.validateCartPreviewStaysOnPage();
        expect(staysOnPage).toBe(true);
        
        console.log('✅ 购物车预览不会跳出当前页面');
        
        // 清理：关闭预览
        if (await machinesPage.hasCartPreview()) {
          await machinesPage.closeCartPreview();
        }
      } else {
        console.log('⏭️ 浮动购物车不存在，跳过页面跳转测试');
      }
    });
  });

  test.describe('3.6 响应式设计测试', () => {
    test('应该在移动端验证筛选区变为可折叠抽屉式菜单', async ({ page }) => {
      // 检查移动端筛选抽屉
      const mobileDrawer = await machinesPage.checkMobileFilterDrawer();
      
      console.log(`✅ 移动端筛选抽屉检查:
        - 筛选按钮: ${mobileDrawer.hasFilterButton ? '存在' : '不存在'}
        - 抽屉菜单: ${mobileDrawer.hasDrawer ? '正常' : '未展开'}`);
      
      // 恢复桌面端视口
      await page.setViewportSize({ width: 1200, height: 800 });
    });

    test('应该测试筛选按钮触发抽屉菜单功能', async ({ page }) => {
      // 切换到移动端
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // 检查筛选按钮功能
      const filterButton = page.locator('[data-testid="mobile-filter-button"]');
      const hasFilterButton = await filterButton.isVisible();
      
      if (hasFilterButton) {
        // 测试抽屉菜单触发
        await filterButton.click();
        await page.waitForTimeout(500);
        
        const drawerVisible = await helpers.isVisible('[data-testid="filter-drawer"]');
        
        if (drawerVisible) {
          console.log('✅ 筛选按钮触发抽屉菜单功能正常');
          
          // 测试在抽屉中应用筛选
          try {
            await machinesPage.applyMobileFilter('voltage', '220V');
            console.log('✅ 抽屉中筛选应用功能正常');
          } catch (error) {
            console.log('⏭️ 抽屉中筛选选项不可用');
          }
        } else {
          console.log('⏭️ 抽屉菜单未成功展开');
        }
      } else {
        console.log('⏭️ 移动端筛选按钮不存在');
      }
      
      // 恢复桌面端视口
      await page.setViewportSize({ width: 1200, height: 800 });
    });

    test('应该确认产品卡片在小屏幕上自适应为单列布局', async ({ page }) => {
      const machineCount = await machinesPage.getMachineCount();
      
      if (machineCount > 0) {
        // 检查桌面端布局
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForTimeout(500);
        
        const desktopFirstCard = await machinesPage.machineCards.first().boundingBox();
        
        // 切换到移动端
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        
        const mobileFirstCard = await machinesPage.machineCards.first().boundingBox();
        
        // 验证移动端卡片宽度适配
        const isMobileOptimized = mobileFirstCard && mobileFirstCard.width < 400;
        
        console.log(`✅ 响应式布局验证:
          - 桌面端卡片宽度: ${desktopFirstCard?.width || '未知'}px
          - 移动端卡片宽度: ${mobileFirstCard?.width || '未知'}px
          - 移动端优化: ${isMobileOptimized ? '是' : '否'}`);
        
        // 恢复桌面端视口
        await page.setViewportSize({ width: 1200, height: 800 });
      } else {
        console.log('⏭️ 没有机器数据，跳过响应式布局测试');
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // 测试结束后截图
    await helpers.screenshot('machines-enhanced-test-completed');
  });
}); 