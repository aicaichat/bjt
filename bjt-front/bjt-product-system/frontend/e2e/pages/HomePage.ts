import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * 首页页面对象模型
 */
export class HomePage {
  private helpers: TestHelpers;

  // 页面元素定位器
  readonly productLineCards: Locator;
  readonly welcomeTitle: Locator;
  readonly navigationMenu: Locator;
  readonly searchBox: Locator;
  readonly languageSwitch: Locator;
  readonly featuredProducts: Locator;
  readonly newsSection: Locator;
  readonly footerLinks: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // 定义页面元素
    this.productLineCards = page.locator('[data-testid="product-line-card"]');
    this.welcomeTitle = page.locator('[data-testid="welcome-title"]');
    this.navigationMenu = page.locator('[data-testid="nav-menu"]');
    this.searchBox = page.locator('[data-testid="global-search"]');
    this.languageSwitch = page.locator('[data-testid="language-switch"]');
    this.featuredProducts = page.locator('[data-testid="featured-products"]');
    this.newsSection = page.locator('[data-testid="news-section"]');
    this.footerLinks = page.locator('[data-testid="footer-links"]');
  }

  /**
   * 导航到首页
   */
  async goto() {
    await this.page.goto('/');
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查页面是否正确加载
   */
  async isLoaded(): Promise<boolean> {
    return await this.helpers.isVisible('[data-testid="home-page"]');
  }

  /**
   * 获取产品线卡片数量
   */
  async getProductLineCount(): Promise<number> {
    return await this.productLineCards.count();
  }

  /**
   * 点击指定的产品线卡片
   */
  async clickProductLine(index: number) {
    await this.productLineCards.nth(index).click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * 点击指定名称的产品线
   */
  async clickProductLineByName(name: string) {
    const card = this.page.locator(`[data-testid="product-line-card"]:has-text("${name}")`);
    await card.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查欢迎标题是否显示
   */
  async hasWelcomeTitle(): Promise<boolean> {
    return await this.welcomeTitle.isVisible();
  }

  /**
   * 获取欢迎标题文本
   */
  async getWelcomeTitle(): Promise<string> {
    return await this.welcomeTitle.textContent() || '';
  }

  /**
   * 切换语言
   */
  async switchLanguage(lang: 'zh' | 'en') {
    await this.languageSwitch.click();
    await this.page.click(`[data-testid="lang-${lang}"]`);
    await this.helpers.waitForPageLoad();
  }

  /**
   * 使用全局搜索
   */
  async search(query: string) {
    await this.searchBox.fill(query);
    await this.searchBox.press('Enter');
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查导航菜单是否可见
   */
  async hasNavigation(): Promise<boolean> {
    return await this.navigationMenu.isVisible();
  }

  /**
   * 点击导航菜单项
   */
  async clickNavItem(itemName: string) {
    await this.page.click(`[data-testid="nav-${itemName}"]`);
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查特色产品区域
   */
  async hasFeaturedProducts(): Promise<boolean> {
    return await this.featuredProducts.isVisible();
  }

  /**
   * 获取特色产品数量
   */
  async getFeaturedProductCount(): Promise<number> {
    const products = this.page.locator('[data-testid="featured-product"]');
    return await products.count();
  }

  /**
   * 检查新闻区域
   */
  async hasNewsSection(): Promise<boolean> {
    return await this.newsSection.isVisible();
  }

  /**
   * 检查页脚链接
   */
  async hasFooterLinks(): Promise<boolean> {
    return await this.footerLinks.isVisible();
  }

  /**
   * 滚动到页面底部
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(1000);
  }

  /**
   * 检查响应式布局
   */
  async checkResponsiveLayout() {
    // 检查桌面布局
    await this.page.setViewportSize({ width: 1200, height: 800 });
    await this.page.waitForTimeout(500);
    
    // 检查平板布局
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.waitForTimeout(500);
    
    // 检查手机布局
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    
    // 恢复桌面布局
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  /**
   * 获取页面性能指标
   */
  async getPerformanceMetrics() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    return metrics;
  }
} 