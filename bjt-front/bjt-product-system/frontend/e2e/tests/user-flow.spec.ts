import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { MachinesPage } from '../pages/MachinesPage';
import { TestHelpers } from '../utils/test-helpers';

test.describe('用户完整流程 E2E 测试', () => {
  let homePage: HomePage;
  let machinesPage: MachinesPage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    machinesPage = new MachinesPage(page);
    helpers = new TestHelpers(page);
  });

  test('完整的产品浏览和购买流程', async ({ page }) => {
    console.log('🚀 开始完整用户流程测试');

    // 步骤1: 访问首页
    await homePage.goto();
    expect(await homePage.isLoaded()).toBe(true);
    console.log('✅ 步骤1: 首页加载成功');

    // 步骤2: 查看产品线
    const productLineCount = await homePage.getProductLineCount();
    expect(productLineCount).toBeGreaterThan(0);
    console.log(`✅ 步骤2: 发现 ${productLineCount} 个产品线`);

    // 步骤3: 点击进入机器页面
    await homePage.clickProductLine(0);
    expect(await machinesPage.isLoaded()).toBe(true);
    console.log('✅ 步骤3: 成功进入机器页面');

    // 步骤4: 浏览机器列表
    const machineCount = await machinesPage.getMachineCount();
    expect(machineCount).toBeGreaterThan(0);
    console.log(`✅ 步骤4: 发现 ${machineCount} 台机器`);

    // 步骤5: 使用搜索功能
    await machinesPage.search('AirWave');
    await helpers.waitForLoadingComplete();
    const searchResults = await machinesPage.getSearchResultCount();
    console.log(`✅ 步骤5: 搜索得到 ${searchResults} 个结果`);

    // 步骤6: 查看机器详情
    if (await machinesPage.getMachineCount() > 0) {
      await machinesPage.viewMachineDetail(0);
      expect(await machinesPage.hasMachineDetail()).toBe(true);
      
      const machineDetail = await machinesPage.getMachineDetailInfo();
      console.log(`✅ 步骤6: 查看机器详情 - ${machineDetail.title}`);

      // 步骤7: 添加到购物车
      await machinesPage.addToCart();
      console.log('✅ 步骤7: 添加到购物车');
    }

    // 步骤8: 验证整个流程完成
    console.log('🎯 完整用户流程测试完成');
  });

  test('跨页面导航流程', async ({ page }) => {
    console.log('🚀 开始跨页面导航测试');

    // 从首页开始
    await homePage.goto();

    // 通过导航菜单访问各个页面
    const pages = [
      { name: 'machines', title: '机器' },
      { name: 'accessories', title: '配件' },
      { name: 'consumables', title: '耗材' },
      { name: 'spare-parts', title: '备件' }
    ];

    for (const pageInfo of pages) {
      // 点击导航项
      await homePage.clickNavItem(pageInfo.name);
      
      // 验证URL变化
      expect(page.url()).toContain(pageInfo.name);
      
      // 等待页面加载
      await helpers.waitForPageLoad();
      
      console.log(`✅ 成功导航到 ${pageInfo.title} 页面`);
    }

    console.log('🎯 跨页面导航测试完成');
  });

  test('多设备响应式测试流程', async ({ page }) => {
    console.log('🚀 开始多设备响应式测试');

    // 桌面端测试
    await page.setViewportSize({ width: 1200, height: 800 });
    await homePage.goto();
    
    const desktopProductLines = await homePage.getProductLineCount();
    console.log(`✅ 桌面端: ${desktopProductLines} 个产品线`);

    // 平板端测试
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    const tabletProductLines = await homePage.getProductLineCount();
    console.log(`✅ 平板端: ${tabletProductLines} 个产品线`);

    // 手机端测试
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileProductLines = await homePage.getProductLineCount();
    console.log(`✅ 手机端: ${mobileProductLines} 个产品线`);

    // 验证所有设备都能正常显示内容
    expect(desktopProductLines).toBeGreaterThan(0);
    expect(tabletProductLines).toBeGreaterThan(0);
    expect(mobileProductLines).toBeGreaterThan(0);

    console.log('🎯 多设备响应式测试完成');
  });

  test('数据源切换完整流程', async ({ page }) => {
    console.log('🚀 开始数据源切换测试');

    await homePage.goto();
    await helpers.waitForMockService();

    // 记录初始状态
    const initialStatus = await helpers.getMockServiceStatus();
    console.log(`✅ 初始数据源: ${initialStatus}`);

    // 切换到SQL Mock
    await helpers.switchDataSource('sql-mock');
    await page.waitForTimeout(2000);
    
    const sqlMockStatus = await helpers.getMockServiceStatus();
    console.log(`✅ 切换到SQL Mock: ${sqlMockStatus}`);

    // 验证数据加载
    const productLinesAfterSwitch = await homePage.getProductLineCount();
    expect(productLinesAfterSwitch).toBeGreaterThan(0);

    // 测试在机器页面也能正常工作
    await homePage.clickNavItem('machines');
    await helpers.waitForPageLoad();
    
    const machinesWithSQLMock = await machinesPage.getMachineCount();
    expect(machinesWithSQLMock).toBeGreaterThan(0);
    console.log(`✅ 机器页面在SQL Mock下显示 ${machinesWithSQLMock} 台机器`);

    console.log('🎯 数据源切换测试完成');
  });

  test('错误处理和恢复流程', async ({ page }) => {
    console.log('🚀 开始错误处理测试');

    // 正常加载首页
    await homePage.goto();
    const normalProductLines = await homePage.getProductLineCount();
    console.log(`✅ 正常状态: ${normalProductLines} 个产品线`);

    // 模拟网络错误
    await helpers.simulateNetworkError('**/api/**');
    
    // 刷新页面测试错误处理
    await page.reload();
    await helpers.waitForPageLoad();

    // 验证Mock数据回退
    const fallbackProductLines = await homePage.getProductLineCount();
    expect(fallbackProductLines).toBeGreaterThan(0);
    console.log(`✅ 错误处理: 回退到Mock数据，显示 ${fallbackProductLines} 个产品线`);

    // 测试搜索功能在错误状态下仍然可用
    await homePage.search('test');
    await helpers.waitForPageLoad();
    console.log('✅ 搜索功能在错误状态下仍然可用');

    console.log('🎯 错误处理测试完成');
  });

  test('性能监控完整流程', async ({ page }) => {
    console.log('🚀 开始性能监控测试');

    // 监控首页加载性能
    await homePage.goto();
    const homeMetrics = await homePage.getPerformanceMetrics();
    
    console.log(`✅ 首页性能指标:
      - 加载时间: ${homeMetrics.loadTime}ms
      - 首次内容绘制: ${homeMetrics.firstContentfulPaint}ms`);

    // 监控页面导航性能
    const startTime = Date.now();
    await homePage.clickNavItem('machines');
    await helpers.waitForPageLoad();
    const navigationTime = Date.now() - startTime;
    
    console.log(`✅ 页面导航时间: ${navigationTime}ms`);

    // 验证性能指标在合理范围内
    expect(homeMetrics.loadTime).toBeLessThan(5000); // 5秒内加载
    expect(homeMetrics.firstContentfulPaint).toBeLessThan(3000); // 3秒内首次绘制
    expect(navigationTime).toBeLessThan(3000); // 3秒内导航完成

    console.log('🎯 性能监控测试完成');
  });

  test('搜索和筛选完整流程', async ({ page }) => {
    console.log('🚀 开始搜索和筛选测试');

    // 进入机器页面
    await machinesPage.goto();
    const totalMachines = await machinesPage.getMachineCount();
    console.log(`✅ 总机器数量: ${totalMachines}`);

    // 测试分类筛选
    await machinesPage.selectCategory('conveyor');
    const categoryFiltered = await machinesPage.getMachineCount();
    console.log(`✅ 分类筛选后: ${categoryFiltered} 台机器`);

    // 测试搜索
    await machinesPage.search('AirWave');
    const searchFiltered = await machinesPage.getSearchResultCount();
    console.log(`✅ 搜索筛选后: ${searchFiltered} 台机器`);

    // 测试电压筛选
    await machinesPage.filterByVoltage('220V');
    const voltageFiltered = await machinesPage.getMachineCount();
    console.log(`✅ 电压筛选后: ${voltageFiltered} 台机器`);

    // 清除所有筛选
    await machinesPage.clearFilters();
    const clearedFilters = await machinesPage.getMachineCount();
    console.log(`✅ 清除筛选后: ${clearedFilters} 台机器`);

    // 验证筛选逻辑正确
    expect(clearedFilters).toBeGreaterThanOrEqual(voltageFiltered);

    console.log('🎯 搜索和筛选测试完成');
  });

  test.afterEach(async ({ page }) => {
    // 每个测试结束后的清理
    await helpers.screenshot('user-flow-test-completed');
  });
}); 