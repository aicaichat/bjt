import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * 产品备件选择页页面对象模型
 */
export class SparePartsPage {
  private helpers: TestHelpers;

  // 页面元素定位器
  readonly pageTitle: Locator;
  readonly breadcrumb: Locator;
  readonly filterSection: Locator;
  readonly modelFilter: Locator;
  readonly consumableFilter: Locator;
  readonly sparePartsList: Locator;
  readonly sparePartsItems: Locator;
  readonly cartPreview: Locator;
  readonly cartIcon: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // 定义页面元素
    this.pageTitle = page.locator('[data-testid="spare-parts-title"]');
    this.breadcrumb = page.locator('[data-testid="breadcrumb"]');
    this.filterSection = page.locator('[data-testid="filter-section"]');
    this.modelFilter = page.locator('[data-testid="model-filter"]');
    this.consumableFilter = page.locator('[data-testid="consumable-filter"]');
    this.sparePartsList = page.locator('[data-testid="spare-parts-list"]');
    this.sparePartsItems = page.locator('[data-testid="spare-part-item"]');
    this.cartPreview = page.locator('[data-testid="cart-preview"]');
    this.cartIcon = page.locator('[data-testid="cart-icon"]');
  }

  /**
   * 导航到备件页面
   */
  async goto() {
    await this.page.goto('/spare-parts');
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查页面是否正确加载
   */
  async isLoaded(): Promise<boolean> {
    return await this.helpers.isVisible('[data-testid="spare-parts-page"]');
  }

  /**
   * 检查页面标题是否显示
   */
  async hasPageTitle(): Promise<boolean> {
    return await this.pageTitle.isVisible();
  }

  /**
   * 获取页面标题文本
   */
  async getPageTitleText(): Promise<string> {
    return await this.pageTitle.textContent() || '';
  }

  /**
   * 检查面包屑导航是否显示
   */
  async hasBreadcrumb(): Promise<boolean> {
    return await this.breadcrumb.isVisible();
  }

  /**
   * 检查筛选区域是否显示
   */
  async hasFilterSection(): Promise<boolean> {
    return await this.filterSection.isVisible();
  }

  /**
   * 检查Model筛选器是否存在
   */
  async hasModelFilter(): Promise<boolean> {
    return await this.modelFilter.isVisible();
  }

  /**
   * 获取Model筛选选项
   */
  async getModelOptions(): Promise<string[]> {
    const options = await this.modelFilter.locator('option').allTextContents();
    return options.filter(option => option.trim() !== '');
  }

  /**
   * 选择Model筛选选项
   */
  async selectModel(model: string) {
    await this.modelFilter.selectOption({ label: model });
    await this.page.waitForTimeout(1000);
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查Consumable/non-consumable筛选器是否存在
   */
  async hasConsumableFilter(): Promise<boolean> {
    return await this.consumableFilter.isVisible();
  }

  /**
   * 获取Consumable筛选选项
   */
  async getConsumableOptions(): Promise<string[]> {
    const options = await this.consumableFilter.locator('option').allTextContents();
    return options.filter(option => option.trim() !== '');
  }

  /**
   * 选择Consumable筛选选项
   */
  async selectConsumableType(type: 'consumable' | 'non-consumable' | 'all') {
    await this.consumableFilter.selectOption({ value: type });
    await this.page.waitForTimeout(1000);
    await this.helpers.waitForPageLoad();
  }

  /**
   * 重置所有筛选条件
   */
  async resetFilters() {
    await this.modelFilter.selectOption({ index: 0 });
    await this.consumableFilter.selectOption({ index: 0 });
    await this.page.waitForTimeout(1000);
  }

  /**
   * 检查备件列表是否显示
   */
  async hasSparePartsList(): Promise<boolean> {
    return await this.sparePartsList.isVisible();
  }

  /**
   * 获取备件列表项数量
   */
  async getSparePartsCount(): Promise<number> {
    return await this.sparePartsItems.count();
  }

  /**
   * 获取指定备件的详细信息
   */
  async getSparePartInfo(index: number) {
    const item = this.sparePartsItems.nth(index);
    
    const image = await item.locator('[data-testid="spare-part-image"]').getAttribute('src');
    const partNumber = await item.locator('[data-testid="part-number"]').textContent();
    const name = await item.locator('[data-testid="spare-part-name"]').textContent();
    const serialNumber = await item.locator('[data-testid="serial-number"]').textContent();
    const packageSize = await item.locator('[data-testid="package-size"]').textContent();
    const packageWeight = await item.locator('[data-testid="package-weight"]').textContent();
    const price = await item.locator('[data-testid="spare-part-price"]').textContent();
    const stock = await item.locator('[data-testid="spare-part-stock"]').textContent();
    
    return {
      image: image || '',
      partNumber: partNumber || '',
      name: name || '',
      serialNumber: serialNumber || '',
      packageSize: packageSize || '',
      packageWeight: packageWeight || '',
      price: price || '',
      stock: stock || ''
    };
  }

  /**
   * 检查备件是否显示产品图片
   */
  async hasSparePartImage(index: number): Promise<boolean> {
    const item = this.sparePartsItems.nth(index);
    const image = item.locator('[data-testid="spare-part-image"]');
    return await image.isVisible();
  }

  /**
   * 检查备件价格是否按用户账号类别显示阶梯价格
   */
  async hasTieredPricing(index: number): Promise<boolean> {
    const item = this.sparePartsItems.nth(index);
    const priceTable = item.locator('[data-testid="tiered-pricing"]');
    return await priceTable.isVisible();
  }

  /**
   * 检查销售账号是否能查看库存信息
   */
  async canViewStock(index: number): Promise<boolean> {
    const item = this.sparePartsItems.nth(index);
    const stockInfo = item.locator('[data-testid="spare-part-stock"]');
    return await stockInfo.isVisible();
  }

  /**
   * 设置备件数量
   */
  async setSparePartQuantity(index: number, quantity: number) {
    const item = this.sparePartsItems.nth(index);
    const quantityInput = item.locator('[data-testid="quantity-input"]');
    
    await quantityInput.clear();
    await quantityInput.fill(quantity.toString());
  }

  /**
   * 获取备件数量
   */
  async getSparePartQuantity(index: number): Promise<number> {
    const item = this.sparePartsItems.nth(index);
    const quantityInput = item.locator('[data-testid="quantity-input"]');
    const value = await quantityInput.inputValue();
    return parseInt(value) || 0;
  }

  /**
   * 添加备件到购物车
   */
  async addSparePartToCart(index: number) {
    const item = this.sparePartsItems.nth(index);
    const addButton = item.locator('[data-testid="add-to-cart"]');
    
    await addButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 检查购物车图标是否可见
   */
  async hasCartIcon(): Promise<boolean> {
    return await this.cartIcon.isVisible();
  }

  /**
   * 点击购物车图标预览
   */
  async clickCartPreview() {
    await this.cartIcon.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查购物车预览是否显示
   */
  async isCartPreviewVisible(): Promise<boolean> {
    return await this.cartPreview.isVisible();
  }

  /**
   * 获取购物车预览中的商品数量
   */
  async getCartPreviewItemCount(): Promise<number> {
    const cartItems = this.cartPreview.locator('[data-testid="cart-preview-item"]');
    return await cartItems.count();
  }

  /**
   * 在购物车预览中操作商品
   */
  async updateCartItemInPreview(index: number, quantity: number) {
    const cartItem = this.cartPreview.locator('[data-testid="cart-preview-item"]').nth(index);
    const quantityInput = cartItem.locator('[data-testid="preview-quantity"]');
    
    await quantityInput.clear();
    await quantityInput.fill(quantity.toString());
    await quantityInput.press('Enter');
    await this.page.waitForTimeout(500);
  }

  /**
   * 从购物车预览中删除商品
   */
  async removeItemFromCartPreview(index: number) {
    const cartItem = this.cartPreview.locator('[data-testid="cart-preview-item"]').nth(index);
    const removeButton = cartItem.locator('[data-testid="preview-remove"]');
    
    await removeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 关闭购物车预览
   */
  async closeCartPreview() {
    await this.page.click('[data-testid="cart-preview-close"]');
    await this.page.waitForTimeout(300);
  }

  /**
   * 检查页面在PC端的显示
   */
  async checkDesktopLayout() {
    await this.page.setViewportSize({ width: 1200, height: 800 });
    await this.page.waitForTimeout(500);
    
    // 检查筛选区域和列表区域是否并列显示
    const filterWidth = await this.filterSection.boundingBox();
    const listWidth = await this.sparePartsList.boundingBox();
    
    return {
      hasFilterSection: filterWidth !== null,
      hasListSection: listWidth !== null,
      isDesktopLayout: filterWidth && listWidth && filterWidth.x < listWidth.x
    };
  }

  /**
   * 检查移动端适配效果
   */
  async checkMobileLayout() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    
    // 检查是否有移动端特有的元素
    const hasFilterToggle = await this.helpers.isVisible('[data-testid="filter-toggle"]');
    const hasFilterDrawer = await this.helpers.isVisible('[data-testid="filter-drawer"]');
    
    // 检查列表项是否适配移动端
    const itemsCount = await this.getSparePartsCount();
    let isMobileOptimized = true;
    
    if (itemsCount > 0) {
      const firstItem = this.sparePartsItems.first();
      const itemBox = await firstItem.boundingBox();
      isMobileOptimized = itemBox ? itemBox.width < 400 : false;
    }
    
    return {
      hasFilterToggle,
      hasFilterDrawer,
      isMobileOptimized,
      totalItems: itemsCount
    };
  }

  /**
   * 搜索特定备件
   */
  async searchSparePart(keyword: string) {
    const searchInput = this.page.locator('[data-testid="spare-parts-search"]');
    await searchInput.fill(keyword);
    await searchInput.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  /**
   * 验证筛选结果
   */
  async validateFilterResults(expectedType: 'consumable' | 'non-consumable' | 'all'): Promise<boolean> {
    const itemsCount = await this.getSparePartsCount();
    
    if (itemsCount === 0) return true; // 没有结果也是有效的
    
    // 检查前几个项目是否符合筛选条件
    for (let i = 0; i < Math.min(3, itemsCount); i++) {
      const item = this.sparePartsItems.nth(i);
      const isConsumable = await item.locator('[data-testid="consumable-badge"]').isVisible();
      
      if (expectedType === 'consumable' && !isConsumable) return false;
      if (expectedType === 'non-consumable' && isConsumable) return false;
    }
    
    return true;
  }

  /**
   * 获取页面URL，用于验证跳转
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * 验证是否成功跳转到购物车
   */
  async isOnCartPage(): Promise<boolean> {
    return this.getCurrentUrl().includes('/cart');
  }
} 