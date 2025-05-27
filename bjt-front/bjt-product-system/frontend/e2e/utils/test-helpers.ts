import { Page, Locator } from '@playwright/test';

/**
 * E2E测试辅助工具
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad(timeout = 30000) {
    await this.page.waitForLoadState('networkidle', { timeout });
    await this.page.waitForSelector('[data-testid="page-content"]', { timeout });
  }

  /**
   * 等待Mock服务状态组件加载
   */
  async waitForMockService(timeout = 10000) {
    await this.page.waitForSelector('[data-testid="mock-service-status"]', { timeout });
  }

  /**
   * 检查Mock服务状态
   */
  async getMockServiceStatus() {
    const statusElement = await this.page.locator('[data-testid="mock-service-status"]');
    return await statusElement.textContent();
  }

  /**
   * 切换数据源
   */
  async switchDataSource(dataSource: 'real-api' | 'sql-mock' | 'mock') {
    // 点击Mock服务状态组件展开
    await this.page.click('[data-testid="mock-service-status"]');
    
    // 等待切换按钮出现
    await this.page.waitForSelector(`[data-testid="switch-to-${dataSource}"]`);
    
    // 点击对应的切换按钮
    await this.page.click(`[data-testid="switch-to-${dataSource}"]`);
    
    // 等待切换完成
    await this.page.waitForTimeout(1000);
  }

  /**
   * 填写表单字段
   */
  async fillForm(fields: Record<string, string>) {
    for (const [field, value] of Object.entries(fields)) {
      await this.page.fill(`[data-testid="${field}"]`, value);
    }
  }

  /**
   * 等待网络请求完成
   */
  async waitForApiResponse(urlPattern: string, timeout = 10000) {
    return await this.page.waitForResponse(
      response => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
  }

  /**
   * 截图
   */
  async screenshot(name: string) {
    await this.page.screenshot({ 
      path: `e2e/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * 检查元素是否可见
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.isVisible(selector);
    } catch {
      return false;
    }
  }

  /**
   * 等待元素出现
   */
  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    await this.page.waitForSelector(selector, { timeout });
    return this.page.locator(selector);
  }

  /**
   * 滚动到元素
   */
  async scrollToElement(selector: string) {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * 等待并点击
   */
  async waitAndClick(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout });
    await this.page.click(selector);
  }

  /**
   * 获取元素文本
   */
  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  /**
   * 检查URL是否包含指定路径
   */
  async checkUrl(path: string): Promise<boolean> {
    return this.page.url().includes(path);
  }

  /**
   * 导航到页面
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * 检查页面标题
   */
  async checkPageTitle(expectedTitle: string): Promise<boolean> {
    const title = await this.page.title();
    return title.includes(expectedTitle);
  }

  /**
   * 等待加载指示器消失
   */
  async waitForLoadingComplete() {
    try {
      await this.page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 5000 });
    } catch {
      // 如果没有加载指示器，继续执行
    }
  }

  /**
   * 模拟网络延迟
   */
  async simulateSlowNetwork() {
    await this.page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
  }

  /**
   * 模拟网络错误
   */
  async simulateNetworkError(urlPattern: string) {
    await this.page.route(urlPattern, route => route.abort());
  }
} 