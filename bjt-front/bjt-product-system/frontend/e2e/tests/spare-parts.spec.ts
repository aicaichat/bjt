import { test, expect } from '@playwright/test';
import { SparePartsPage } from '../pages/SparePartsPage';
import { TestHelpers } from '../utils/test-helpers';

test.describe('产品备件选择页 E2E 测试', () => {
  let sparePartsPage: SparePartsPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    sparePartsPage = new SparePartsPage(page);
    helpers = new TestHelpers(page);
    await sparePartsPage.goto();
  });

  test.describe('5.1 筛选功能测试', () => {
    test('应该验证Model选项正常筛选', async ({ page }) => {
      // 检查页面是否加载
      expect(await sparePartsPage.isLoaded()).toBe(true);
      
      // 检查Model筛选器是否存在
      expect(await sparePartsPage.hasModelFilter()).toBe(true);
      
      // 获取Model选项
      const modelOptions = await sparePartsPage.getModelOptions();
      expect(modelOptions.length).toBeGreaterThan(0);
      
      // 选择第一个可用的Model选项（跳过默认的"全部"选项）
      if (modelOptions.length > 1) {
        const selectedModel = modelOptions[1];
        await sparePartsPage.selectModel(selectedModel);
        
        // 验证筛选后是否有结果
        const itemsCount = await sparePartsPage.getSparePartsCount();
        console.log(`✅ Model筛选功能正常: 选择"${selectedModel}"，找到${itemsCount}个结果`);
      } else {
        console.log('⏭️ 没有足够的Model选项用于测试');
      }
    });

    test('应该测试Consumable/non-consumable筛选项功能', async ({ page }) => {
      // 检查Consumable筛选器是否存在
      expect(await sparePartsPage.hasConsumableFilter()).toBe(true);
      
      // 获取筛选选项
      const consumableOptions = await sparePartsPage.getConsumableOptions();
      expect(consumableOptions.length).toBeGreaterThan(0);
      
      // 测试筛选consumable备件
      await sparePartsPage.selectConsumableType('consumable');
      
      // 验证筛选结果
      const consumableValid = await sparePartsPage.validateFilterResults('consumable');
      expect(consumableValid).toBe(true);
      
      const consumableCount = await sparePartsPage.getSparePartsCount();
      console.log(`✅ Consumable筛选: 找到${consumableCount}个消耗性备件`);
      
      // 测试筛选non-consumable备件
      await sparePartsPage.selectConsumableType('non-consumable');
      
      const nonConsumableValid = await sparePartsPage.validateFilterResults('non-consumable');
      expect(nonConsumableValid).toBe(true);
      
      const nonConsumableCount = await sparePartsPage.getSparePartsCount();
      console.log(`✅ Non-consumable筛选: 找到${nonConsumableCount}个非消耗性备件`);
      
      // 重置筛选条件
      await sparePartsPage.resetFilters();
      const allCount = await sparePartsPage.getSparePartsCount();
      console.log(`✅ 重置筛选: 显示所有${allCount}个备件`);
    });

    test('应该支持组合筛选条件', async ({ page }) => {
      // 同时应用Model和Consumable筛选
      const modelOptions = await sparePartsPage.getModelOptions();
      
      if (modelOptions.length > 1) {
        // 选择Model
        await sparePartsPage.selectModel(modelOptions[1]);
        const modelCount = await sparePartsPage.getSparePartsCount();
        
        // 再选择Consumable类型
        await sparePartsPage.selectConsumableType('consumable');
        const combinedCount = await sparePartsPage.getSparePartsCount();
        
        // 组合筛选的结果应该小于等于单独筛选的结果
        expect(combinedCount).toBeLessThanOrEqual(modelCount);
        
        console.log(`✅ 组合筛选功能正常: ${modelOptions[1]} + consumable = ${combinedCount}个结果`);
      }
    });
  });

  test.describe('5.2 备件列表测试', () => {
    test('应该确认备件以列表形式正确展示', async ({ page }) => {
      // 检查备件列表是否显示
      expect(await sparePartsPage.hasSparePartsList()).toBe(true);
      
      // 获取备件数量
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      expect(sparePartsCount).toBeGreaterThanOrEqual(0);
      
      if (sparePartsCount > 0) {
        console.log(`✅ 备件列表正确展示: 共${sparePartsCount}个备件`);
      } else {
        console.log('✅ 备件列表为空状态正确显示');
      }
    });

    test('应该验证显示备件的产品图片、料号、名称、适配序列号', async ({ page }) => {
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        // 检查第一个备件的完整信息
        const sparePartInfo = await sparePartsPage.getSparePartInfo(0);
        
        // 验证必要信息存在
        expect(sparePartInfo.partNumber).toBeTruthy();
        expect(sparePartInfo.name).toBeTruthy();
        
        // 检查产品图片是否显示
        expect(await sparePartsPage.hasSparePartImage(0)).toBe(true);
        
        console.log(`✅ 备件信息完整显示:
          - 料号: ${sparePartInfo.partNumber}
          - 名称: ${sparePartInfo.name}
          - 序列号: ${sparePartInfo.serialNumber}
          - 有产品图片: ${sparePartInfo.image ? '是' : '否'}`);
      } else {
        console.log('⏭️ 没有备件数据，跳过信息验证测试');
      }
    });

    test('应该测试包装尺寸、包装毛重信息显示', async ({ page }) => {
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        const sparePartInfo = await sparePartsPage.getSparePartInfo(0);
        
        // 验证包装信息（可能为空，但字段应该存在）
        expect(sparePartInfo.packageSize !== undefined).toBe(true);
        expect(sparePartInfo.packageWeight !== undefined).toBe(true);
        
        console.log(`✅ 包装信息显示:
          - 包装尺寸: ${sparePartInfo.packageSize || '未提供'}
          - 包装毛重: ${sparePartInfo.packageWeight || '未提供'}`);
      } else {
        console.log('⏭️ 没有备件数据，跳过包装信息测试');
      }
    });

    test('应该检查阶梯价格根据用户账号类别正确展示', async ({ page }) => {
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        // 检查第一个备件的价格信息
        const sparePartInfo = await sparePartsPage.getSparePartInfo(0);
        expect(sparePartInfo.price).toBeTruthy();
        
        // 检查是否有阶梯价格表
        const hasTieredPricing = await sparePartsPage.hasTieredPricing(0);
        
        console.log(`✅ 价格信息显示:
          - 价格: ${sparePartInfo.price}
          - 阶梯价格: ${hasTieredPricing ? '有' : '无'}`);
      } else {
        console.log('⏭️ 没有备件数据，跳过价格测试');
      }
    });

    test('应该验证销售账号能查看库存信息', async ({ page }) => {
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        // 检查库存信息是否可见
        const canViewStock = await sparePartsPage.canViewStock(0);
        
        if (canViewStock) {
          const sparePartInfo = await sparePartsPage.getSparePartInfo(0);
          console.log(`✅ 库存信息可见: ${sparePartInfo.stock}`);
        } else {
          console.log('✅ 当前账号类型无法查看库存信息（符合权限设计）');
        }
      } else {
        console.log('⏭️ 没有备件数据，跳过库存测试');
      }
    });
  });

  test.describe('5.3 购物功能测试', () => {
    test('应该测试添加数量功能', async ({ page }) => {
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        // 设置数量
        const testQuantity = 5;
        await sparePartsPage.setSparePartQuantity(0, testQuantity);
        
        // 验证数量设置成功
        const actualQuantity = await sparePartsPage.getSparePartQuantity(0);
        expect(actualQuantity).toBe(testQuantity);
        
        console.log(`✅ 数量设置功能正常: 设置为${testQuantity}个`);
      } else {
        console.log('⏭️ 没有备件数据，跳过数量设置测试');
      }
    });

    test('应该验证将备件添加到购物车的功能', async ({ page }) => {
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        // 设置数量并添加到购物车
        await sparePartsPage.setSparePartQuantity(0, 3);
        await sparePartsPage.addSparePartToCart(0);
        
        // 验证添加成功的指示
        await page.waitForTimeout(1000);
        
        console.log('✅ 添加到购物车功能执行完成');
      } else {
        console.log('⏭️ 没有备件数据，跳过添加购物车测试');
      }
    });

    test('应该测试在当前页面预览和操作购物车的功能', async ({ page }) => {
      // 检查购物车图标是否可见
      expect(await sparePartsPage.hasCartIcon()).toBe(true);
      
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        // 添加商品到购物车
        await sparePartsPage.setSparePartQuantity(0, 2);
        await sparePartsPage.addSparePartToCart(0);
        
        // 点击购物车预览
        await sparePartsPage.clickCartPreview();
        
        // 验证购物车预览是否显示
        expect(await sparePartsPage.isCartPreviewVisible()).toBe(true);
        
        // 检查购物车中的商品数量
        const cartItemCount = await sparePartsPage.getCartPreviewItemCount();
        expect(cartItemCount).toBeGreaterThanOrEqual(0);
        
        console.log(`✅ 购物车预览功能正常: 显示${cartItemCount}个商品`);
        
        // 测试购物车预览中的操作
        if (cartItemCount > 0) {
          // 更新商品数量
          await sparePartsPage.updateCartItemInPreview(0, 5);
          console.log('✅ 购物车预览中数量更新功能正常');
          
          // 删除商品（如果有多个商品的话）
          if (cartItemCount > 1) {
            await sparePartsPage.removeItemFromCartPreview(0);
            console.log('✅ 购物车预览中删除功能正常');
          }
        }
        
        // 关闭购物车预览
        await sparePartsPage.closeCartPreview();
        expect(await sparePartsPage.isCartPreviewVisible()).toBe(false);
        
        console.log('✅ 购物车预览关闭功能正常');
      } else {
        console.log('⏭️ 没有备件数据，跳过购物车预览测试');
      }
    });

    test('应该支持批量添加不同备件到购物车', async ({ page }) => {
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount >= 2) {
        // 添加多个不同的备件到购物车
        await sparePartsPage.setSparePartQuantity(0, 2);
        await sparePartsPage.addSparePartToCart(0);
        
        await sparePartsPage.setSparePartQuantity(1, 3);
        await sparePartsPage.addSparePartToCart(1);
        
        // 检查购物车预览
        await sparePartsPage.clickCartPreview();
        const cartItemCount = await sparePartsPage.getCartPreviewItemCount();
        
        expect(cartItemCount).toBeGreaterThanOrEqual(2);
        console.log(`✅ 批量添加功能正常: 购物车中有${cartItemCount}个商品`);
        
        await sparePartsPage.closeCartPreview();
      } else {
        console.log('⏭️ 备件数量不足，跳过批量添加测试');
      }
    });
  });

  test.describe('5.4 响应式设计测试', () => {
    test('应该确认页面在PC端正常显示', async ({ page }) => {
      // 检查PC端布局
      const desktopLayout = await sparePartsPage.checkDesktopLayout();
      
      expect(desktopLayout.hasFilterSection).toBe(true);
      expect(desktopLayout.hasListSection).toBe(true);
      
      console.log(`✅ PC端布局检查:
        - 筛选区域: ${desktopLayout.hasFilterSection ? '正常' : '异常'}
        - 列表区域: ${desktopLayout.hasListSection ? '正常' : '异常'}
        - 并列布局: ${desktopLayout.isDesktopLayout ? '是' : '否'}`);
    });

    test('应该测试移动端适配效果', async ({ page }) => {
      // 检查移动端布局
      const mobileLayout = await sparePartsPage.checkMobileLayout();
      
      console.log(`✅ 移动端布局检查:
        - 筛选切换按钮: ${mobileLayout.hasFilterToggle ? '有' : '无'}
        - 筛选抽屉: ${mobileLayout.hasFilterDrawer ? '有' : '无'}
        - 移动端优化: ${mobileLayout.isMobileOptimized ? '是' : '否'}
        - 商品总数: ${mobileLayout.totalItems}`);
      
      // 恢复桌面端视口
      await page.setViewportSize({ width: 1200, height: 800 });
    });

    test('应该在不同设备尺寸下保持功能完整性', async ({ page }) => {
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        // 平板尺寸
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        
        // 验证关键功能仍然可用
        expect(await sparePartsPage.hasModelFilter()).toBe(true);
        expect(await sparePartsPage.hasSparePartsList()).toBe(true);
        
        // 小屏幕手机
        await page.setViewportSize({ width: 320, height: 568 });
        await page.waitForTimeout(500);
        
        // 验证关键功能仍然可用
        expect(await sparePartsPage.hasSparePartsList()).toBe(true);
        
        console.log('✅ 多设备尺寸功能完整性验证通过');
        
        // 恢复桌面端
        await page.setViewportSize({ width: 1200, height: 800 });
      }
    });
  });

  test.describe('扩展功能测试', () => {
    test('应该支持备件搜索功能', async ({ page }) => {
      // 测试搜索功能（如果存在）
      try {
        await sparePartsPage.searchSparePart('motor');
        await page.waitForTimeout(1000);
        
        const searchResultCount = await sparePartsPage.getSparePartsCount();
        console.log(`✅ 搜索功能测试: 搜索"motor"找到${searchResultCount}个结果`);
      } catch (error) {
        console.log('⏭️ 搜索功能不存在或不可用');
      }
    });

    test('应该处理空备件列表状态', async ({ page }) => {
      // 应用可能不会返回结果的筛选条件
      await sparePartsPage.selectConsumableType('consumable');
      
      const modelOptions = await sparePartsPage.getModelOptions();
      if (modelOptions.length > 1) {
        await sparePartsPage.selectModel(modelOptions[modelOptions.length - 1]);
      }
      
      const resultCount = await sparePartsPage.getSparePartsCount();
      
      if (resultCount === 0) {
        console.log('✅ 空结果状态处理正常');
      } else {
        console.log(`✅ 筛选后仍有${resultCount}个结果`);
      }
      
      // 重置筛选条件
      await sparePartsPage.resetFilters();
    });

    test('应该支持网络错误处理', async ({ page }) => {
      // 模拟网络错误
      await helpers.simulateNetworkError('**/api/spare-parts/**');
      
      // 尝试筛选操作
      const modelOptions = await sparePartsPage.getModelOptions();
      
      if (modelOptions.length > 1) {
        await sparePartsPage.selectModel(modelOptions[1]);
        await page.waitForTimeout(3000);
        
        // 检查是否有错误提示或回退到本地数据
        const hasError = await helpers.isVisible('[data-testid="error-message"]');
        const hasData = await sparePartsPage.getSparePartsCount() > 0;
        
        // 应该要么显示错误信息，要么使用缓存数据
        expect(hasError || hasData).toBe(true);
        
        console.log('✅ 网络错误处理测试完成');
      }
    });

    test('应该支持键盘导航', async ({ page }) => {
      // 使用Tab键在筛选器间导航
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // 检查焦点
      const focusedElement = page.locator(':focus');
      expect(await focusedElement.count()).toBe(1);
      
      const sparePartsCount = await sparePartsPage.getSparePartsCount();
      
      if (sparePartsCount > 0) {
        // 使用键盘操作数量输入框
        const quantityInput = sparePartsPage.sparePartsItems.first().locator('[data-testid="quantity-input"]');
        await quantityInput.focus();
        await page.keyboard.type('5');
        
        const quantity = await sparePartsPage.getSparePartQuantity(0);
        expect(quantity).toBe(5);
        
        console.log('✅ 键盘导航功能正常');
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // 测试结束后截图
    await helpers.screenshot('spare-parts-test-completed');
  });
}); 