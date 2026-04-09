import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { TestHelpers } from '../utils/test-helpers';

test.describe('首页 E2E 测试', () => {
  let homePage: HomePage;
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    helpers = new TestHelpers(page);
    await homePage.goto();
  });

  test('应该正确加载首页', async ({ page }) => {
    // 检查页面是否加载
    await expect(await homePage.isLoaded()).toBe(true);
    
    // 检查页面标题
    await expect(page).toHaveTitle(/BJT/);
    
    // 检查欢迎标题
    expect(await homePage.hasWelcomeTitle()).toBe(true);
    
    // 截图记录
    await helpers.screenshot('home-page-loaded');
  });

  test('应该显示产品线卡片', async ({ page }) => {
    // 等待页面加载完成
    await helpers.waitForPageLoad();
    
    // 检查产品线卡片数量
    const productLineCount = await homePage.getProductLineCount();
    expect(productLineCount).toBeGreaterThan(0);
    
    // 检查至少有3个产品线
    expect(productLineCount).toBeGreaterThanOrEqual(3);
    
    console.log(`✅ 检测到 ${productLineCount} 个产品线`);
  });

  test('应该能够点击产品线卡片进行导航', async ({ page }) => {
    // 等待产品线卡片加载
    await helpers.waitForElement('[data-testid="product-line-card"]');
    
    // 获取第一个产品线卡片的信息
    const firstCard = homePage.productLineCards.first();
    const cardText = await firstCard.textContent();
    
    // 点击第一个产品线卡片
    await homePage.clickProductLine(0);
    
    // 验证导航是否成功（URL应该改变）
    expect(await helpers.checkUrl('/machines')).toBe(true);
    
    console.log(`✅ 成功导航到产品线: ${cardText}`);
  });

  test('应该显示导航菜单', async ({ page }) => {
    // 检查导航菜单是否可见
    expect(await homePage.hasNavigation()).toBe(true);
    
    // 检查主要导航项
    const navItems = ['machines', 'accessories', 'consumables', 'spare-parts'];
    
    for (const item of navItems) {
      const navElement = await helpers.isVisible(`[data-testid="nav-${item}"]`);
      expect(navElement).toBe(true);
    }
    
    console.log('✅ 导航菜单显示正常');
  });

  test('应该支持语言切换', async ({ page }) => {
    // 获取当前页面标题
    const initialTitle = await homePage.getWelcomeTitle();
    
    // 切换到英文
    await homePage.switchLanguage('en');
    await helpers.waitForPageLoad();
    
    // 检查语言是否切换成功
    const englishTitle = await homePage.getWelcomeTitle();
    expect(englishTitle).not.toBe(initialTitle);
    
    // 切换回中文
    await homePage.switchLanguage('zh');
    await helpers.waitForPageLoad();
    
    // 验证切换回中文
    const chineseTitle = await homePage.getWelcomeTitle();
    expect(chineseTitle).toBe(initialTitle);
    
    console.log('✅ 语言切换功能正常');
  });

  test('应该支持全局搜索', async ({ page }) => {
    // 执行搜索
    await homePage.search('机器');
    
    // 验证搜索结果页面加载
    await helpers.waitForPageLoad();
    
    // 检查URL是否包含搜索参数
    expect(page.url()).toContain('search');
    
    console.log('✅ 全局搜索功能正常');
  });

  test('应该显示Mock服务状态', async ({ page }) => {
    // 等待Mock服务状态组件加载
    await helpers.waitForMockService();
    
    // 检查Mock服务状态
    const mockStatus = await helpers.getMockServiceStatus();
    expect(mockStatus).toContain('Mock服务');
    
    console.log(`✅ Mock服务状态: ${mockStatus}`);
  });

  test('应该支持数据源切换', async ({ page }) => {
    // 等待Mock服务组件加载
    await helpers.waitForMockService();
    
    // 切换到SQL Mock数据源
    await helpers.switchDataSource('sql-mock');
    
    // 验证数据源切换成功
    await page.waitForTimeout(2000);
    const statusAfterSwitch = await helpers.getMockServiceStatus();
    expect(statusAfterSwitch).toContain('SQL');
    
    console.log('✅ 数据源切换功能正常');
  });

  test('应该具有响应式布局', async ({ page }) => {
    // 测试响应式布局
    await homePage.checkResponsiveLayout();
    
    // 在移动端检查产品线卡片是否正确显示
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileProductLines = await homePage.getProductLineCount();
    expect(mobileProductLines).toBeGreaterThan(0);
    
    console.log('✅ 响应式布局测试通过');
  });

  test('页面性能应该良好', async ({ page }) => {
    // 获取页面性能指标
    const metrics = await homePage.getPerformanceMetrics();
    
    // 检查页面加载时间（应该小于3秒）
    expect(metrics.loadTime).toBeLessThan(3000);
    
    // 检查首次内容绘制时间（应该小于2秒）
    expect(metrics.firstContentfulPaint).toBeLessThan(2000);
    
    console.log(`✅ 页面性能指标: 
      - 加载时间: ${metrics.loadTime}ms
      - 首次内容绘制: ${metrics.firstContentfulPaint}ms
      - DOM加载完成: ${metrics.domContentLoaded}ms`);
  });

  test('全站页脚已移除（MainLayout 不再渲染 Footer）', async ({ page }) => {
    await homePage.scrollToBottom();
    await expect(page.locator('main.figma-front-main footer')).toHaveCount(0);
    await expect(page.getByText('杭州丙甲科技有限公司')).toHaveCount(0);
    console.log('✅ 全站页脚未挂载');
  });

  test('应该处理网络错误', async ({ page }) => {
    // 模拟网络错误
    await helpers.simulateNetworkError('**/api/**');
    
    // 刷新页面
    await page.reload();
    await helpers.waitForPageLoad();
    
    // 检查错误处理（应该显示Mock数据）
    const productLineCount = await homePage.getProductLineCount();
    expect(productLineCount).toBeGreaterThan(0);
    
    console.log('✅ 网络错误处理正常，回退到Mock数据');
  });

  test('应该支持键盘导航', async ({ page }) => {
    // 使用Tab键导航
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 检查焦点是否正确设置
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.count()).toBe(1);
    
    // 使用Enter键激活链接
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    console.log('✅ 键盘导航功能正常');
  });

  test.afterEach(async ({ page }) => {
    // 测试结束后的清理工作
    await helpers.screenshot('test-completed');
  });
}); 