import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * 机器页面页面对象模型 - 增强版
 */
export class MachinesPage {
  private helpers: TestHelpers;

  // 页面元素定位器
  readonly categoryFilter: Locator;
  readonly searchInput: Locator;
  readonly machineCards: Locator;
  readonly paginationNav: Locator;
  readonly sortingDropdown: Locator;
  readonly viewModeToggle: Locator;
  readonly filterPanel: Locator;
  readonly machineDetail: Locator;
  readonly addToCartButton: Locator;
  readonly accessorySelector: Locator;
  
  // 新增缺失功能的定位器
  readonly breadcrumb: Locator;
  readonly moreInfoButton: Locator;
  readonly infoOverlay: Locator;
  readonly pdfDownloadButton: Locator;
  readonly accessoryLevels: Locator;
  readonly cartIcon: Locator;
  readonly cartPreview: Locator;
  readonly quantityInput: Locator;
  readonly filterDrawer: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // 定义页面元素
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.machineCards = page.locator('[data-testid="machine-card"]');
    this.paginationNav = page.locator('[data-testid="pagination"]');
    this.sortingDropdown = page.locator('[data-testid="sorting-dropdown"]');
    this.viewModeToggle = page.locator('[data-testid="view-mode-toggle"]');
    this.filterPanel = page.locator('[data-testid="filter-panel"]');
    this.machineDetail = page.locator('[data-testid="machine-detail"]');
    this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
    this.accessorySelector = page.locator('[data-testid="accessory-selector"]');
    
    // 新增功能元素
    this.breadcrumb = page.locator('[data-testid="breadcrumb"]');
    this.moreInfoButton = page.locator('[data-testid="more-info-button"]');
    this.infoOverlay = page.locator('[data-testid="product-info-overlay"]');
    this.pdfDownloadButton = page.locator('[data-testid="pdf-download"]');
    this.accessoryLevels = page.locator('[data-testid="accessory-level"]');
    this.cartIcon = page.locator('[data-testid="floating-cart"]');
    this.cartPreview = page.locator('[data-testid="cart-preview"]');
    this.quantityInput = page.locator('[data-testid="quantity-input"]');
    this.filterDrawer = page.locator('[data-testid="filter-drawer"]');
  }

  /**
   * 导航到机器页面
   */
  async goto() {
    await this.page.goto('/machines');
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查页面是否正确加载
   */
  async isLoaded(): Promise<boolean> {
    return await this.helpers.isVisible('[data-testid="machines-page"]');
  }

  /**
   * 选择产品线分类
   */
  async selectCategory(categoryName: string) {
    await this.categoryFilter.click();
    await this.page.click(`[data-testid="category-${categoryName}"]`);
    await this.helpers.waitForLoadingComplete();
  }

  /**
   * 搜索机器
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.helpers.waitForLoadingComplete();
  }

  /**
   * 获取机器卡片数量
   */
  async getMachineCount(): Promise<number> {
    return await this.machineCards.count();
  }

  /**
   * 点击指定的机器卡片
   */
  async clickMachine(index: number) {
    await this.machineCards.nth(index).click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * 点击指定名称的机器
   */
  async clickMachineByName(machineName: string) {
    const card = this.page.locator(`[data-testid="machine-card"]:has-text("${machineName}")`);
    await card.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * 切换排序方式
   */
  async setSorting(sortBy: string) {
    await this.sortingDropdown.click();
    await this.page.click(`[data-testid="sort-${sortBy}"]`);
    await this.helpers.waitForLoadingComplete();
  }

  /**
   * 切换视图模式
   */
  async toggleViewMode(mode: 'grid' | 'list') {
    await this.page.click(`[data-testid="view-${mode}"]`);
    await this.page.waitForTimeout(500);
  }

  /**
   * 打开筛选面板
   */
  async openFilterPanel() {
    await this.page.click('[data-testid="filter-toggle"]');
    await this.filterPanel.waitFor({ state: 'visible' });
  }

  /**
   * 应用电压筛选
   */
  async filterByVoltage(voltage: string) {
    await this.openFilterPanel();
    await this.page.click(`[data-testid="voltage-${voltage}"]`);
    await this.page.click('[data-testid="apply-filters"]');
    await this.helpers.waitForLoadingComplete();
  }

  /**
   * 清除所有筛选
   */
  async clearFilters() {
    await this.openFilterPanel();
    await this.page.click('[data-testid="clear-filters"]');
    await this.helpers.waitForLoadingComplete();
  }

  /**
   * 导航到下一页
   */
  async goToNextPage() {
    await this.page.click('[data-testid="next-page"]');
    await this.helpers.waitForLoadingComplete();
  }

  /**
   * 导航到指定页面
   */
  async goToPage(pageNumber: number) {
    await this.page.click(`[data-testid="page-${pageNumber}"]`);
    await this.helpers.waitForLoadingComplete();
  }

  /**
   * 查看机器详情
   */
  async viewMachineDetail(machineIndex: number) {
    await this.machineCards.nth(machineIndex).click();
    await this.machineDetail.waitFor({ state: 'visible' });
  }

  /**
   * 检查机器详情是否显示
   */
  async hasMachineDetail(): Promise<boolean> {
    return await this.machineDetail.isVisible();
  }

  /**
   * 获取机器详情信息
   */
  async getMachineDetailInfo() {
    const title = await this.page.textContent('[data-testid="machine-title"]');
    const description = await this.page.textContent('[data-testid="machine-description"]');
    const price = await this.page.textContent('[data-testid="machine-price"]');
    
    return {
      title: title || '',
      description: description || '',
      price: price || ''
    };
  }

  /**
   * 添加机器到购物车
   */
  async addToCart() {
    await this.addToCartButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 选择配件
   */
  async selectAccessory(accessoryName: string) {
    await this.accessorySelector.click();
    await this.page.click(`[data-testid="accessory-${accessoryName}"]`);
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查购物车通知
   */
  async hasCartNotification(): Promise<boolean> {
    return await this.helpers.isVisible('[data-testid="cart-notification"]');
  }

  /**
   * 获取搜索结果数量
   */
  async getSearchResultCount(): Promise<number> {
    const resultText = await this.page.textContent('[data-testid="search-result-count"]');
    return parseInt(resultText?.match(/\d+/)?.[0] || '0');
  }

  /**
   * 检查无结果状态
   */
  async hasNoResults(): Promise<boolean> {
    return await this.helpers.isVisible('[data-testid="no-results"]');
  }

  /**
   * 检查加载状态
   */
  async isLoading(): Promise<boolean> {
    return await this.helpers.isVisible('[data-testid="loading"]');
  }

  /**
   * 获取当前页面信息
   */
  async getCurrentPageInfo() {
    const currentPage = await this.page.textContent('[data-testid="current-page"]');
    const totalPages = await this.page.textContent('[data-testid="total-pages"]');
    const totalItems = await this.page.textContent('[data-testid="total-items"]');
    
    return {
      currentPage: parseInt(currentPage || '1'),
      totalPages: parseInt(totalPages || '1'),
      totalItems: parseInt(totalItems || '0')
    };
  }

  /**
   * 检查机器卡片信息
   */
  async getMachineCardInfo(index: number) {
    const card = this.machineCards.nth(index);
    const title = await card.locator('[data-testid="machine-title"]').textContent();
    const price = await card.locator('[data-testid="machine-price"]').textContent();
    const image = await card.locator('[data-testid="machine-image"]').getAttribute('src');
    
    return {
      title: title || '',
      price: price || '',
      image: image || ''
    };
  }

  /**
   * 检查响应式布局
   */
  async checkMobileLayout() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    
    // 检查移动端特有元素
    const mobileFilter = await this.helpers.isVisible('[data-testid="mobile-filter-button"]');
    const mobileSort = await this.helpers.isVisible('[data-testid="mobile-sort-button"]');
    
    return { mobileFilter, mobileSort };
  }

  /**
   * 检查面包屑导航是否显示
   */
  async hasBreadcrumb(): Promise<boolean> {
    return await this.breadcrumb.isVisible();
  }

  /**
   * 获取面包屑导航文本
   */
  async getBreadcrumbText(): Promise<string> {
    return await this.breadcrumb.textContent() || '';
  }

  /**
   * 验证面包屑导航格式 (首页 > 分类名称)
   */
  async validateBreadcrumbFormat(): Promise<boolean> {
    const breadcrumbText = await this.getBreadcrumbText();
    return breadcrumbText.includes('首页') && breadcrumbText.includes('>');
  }

  /**
   * 点击"更多信息"按钮
   */
  async clickMoreInfo(machineIndex: number = 0) {
    const card = this.machineCards.nth(machineIndex);
    const moreInfoBtn = card.locator('[data-testid="more-info-button"]');
    await moreInfoBtn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查产品信息浮层是否显示
   */
  async hasInfoOverlay(): Promise<boolean> {
    return await this.infoOverlay.isVisible();
  }

  /**
   * 获取浮层中的产品详细信息
   */
  async getOverlayInfo() {
    const packageSize = await this.infoOverlay.locator('[data-testid="package-size"]').textContent();
    const packageWeight = await this.infoOverlay.locator('[data-testid="package-weight"]').textContent();
    const palletHeight = await this.infoOverlay.locator('[data-testid="pallet-height"]').textContent();
    const unitSystem = await this.infoOverlay.locator('[data-testid="unit-system"]').textContent();
    
    return {
      packageSize: packageSize || '',
      packageWeight: packageWeight || '',
      palletHeight: palletHeight || '',
      unitSystem: unitSystem || ''
    };
  }

  /**
   * 关闭信息浮层
   */
  async closeInfoOverlay() {
    await this.infoOverlay.locator('[data-testid="close-overlay"]').click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 测试PDF下载功能
   */
  async downloadProductPDF(machineIndex: number = 0): Promise<boolean> {
    const card = this.machineCards.nth(machineIndex);
    const pdfButton = card.locator('[data-testid="pdf-download"]');
    
    if (!(await pdfButton.isVisible())) {
      return false;
    }

    // 监听下载事件
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 5000 }),
      pdfButton.click()
    ]);

    // 验证下载文件
    const fileName = download.suggestedFilename();
    return fileName.toLowerCase().includes('.pdf');
  }

  /**
   * 选择机器并验证一级配件自动展开
   */
  async selectMachineAndCheckAccessories(machineIndex: number = 0): Promise<boolean> {
    // 选择机器
    await this.machineCards.nth(machineIndex).click();
    await this.page.waitForTimeout(1000);
    
    // 检查一级配件是否自动展开
    const level1Accessories = this.page.locator('[data-testid="accessory-level-1"]');
    return await level1Accessories.isVisible();
  }

  /**
   * 获取配件信息
   */
  async getAccessoryInfo(level: number, accessoryIndex: number = 0) {
    const accessoryLevel = this.page.locator(`[data-testid="accessory-level-${level}"]`);
    const accessory = accessoryLevel.locator('[data-testid="accessory-item"]').nth(accessoryIndex);
    
    const image = await accessory.locator('[data-testid="accessory-image"]').getAttribute('src');
    const model = await accessory.locator('[data-testid="accessory-model"]').textContent();
    const partNumber = await accessory.locator('[data-testid="accessory-part-number"]').textContent();
    const name = await accessory.locator('[data-testid="accessory-name"]').textContent();
    const voltage = await accessory.locator('[data-testid="accessory-voltage"]').textContent();
    const frequency = await accessory.locator('[data-testid="accessory-frequency"]').textContent();
    
    return {
      image: image || '',
      model: model || '',
      partNumber: partNumber || '',
      name: name || '',
      voltage: voltage || '',
      frequency: frequency || ''
    };
  }

  /**
   * 选择配件并验证下级配件展开
   */
  async selectAccessoryAndCheckNextLevel(level: number, accessoryIndex: number = 0): Promise<boolean> {
    const accessoryLevel = this.page.locator(`[data-testid="accessory-level-${level}"]`);
    const accessory = accessoryLevel.locator('[data-testid="accessory-item"]').nth(accessoryIndex);
    
    await accessory.click();
    await this.page.waitForTimeout(1000);
    
    // 检查下一级配件是否展开
    const nextLevel = level + 1;
    const nextLevelAccessories = this.page.locator(`[data-testid="accessory-level-${nextLevel}"]`);
    return await nextLevelAccessories.isVisible();
  }

  /**
   * 验证多级配件展示（最多五级）
   */
  async validateAccessoryLevels(): Promise<{ maxLevel: number; hasLevelLimit: boolean }> {
    let maxLevel = 0;
    
    // 检测当前展开的最高级别
    for (let level = 1; level <= 6; level++) {
      const levelAccessories = this.page.locator(`[data-testid="accessory-level-${level}"]`);
      if (await levelAccessories.isVisible()) {
        maxLevel = level;
      } else {
        break;
      }
    }
    
    // 验证是否有五级限制
    const hasLevelLimit = maxLevel <= 5;
    
    return { maxLevel, hasLevelLimit };
  }

  /**
   * 添加配件到购物车
   */
  async addAccessoryToCart(level: number, accessoryIndex: number = 0) {
    const accessoryLevel = this.page.locator(`[data-testid="accessory-level-${level}"]`);
    const accessory = accessoryLevel.locator('[data-testid="accessory-item"]').nth(accessoryIndex);
    const addButton = accessory.locator('[data-testid="add-accessory-to-cart"]');
    
    await addButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 检查浮动购物车图标是否可见
   */
  async hasFloatingCart(): Promise<boolean> {
    return await this.cartIcon.isVisible();
  }

  /**
   * 点击浮动购物车预览
   */
  async clickCartPreview() {
    await this.cartIcon.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查购物车预览是否显示
   */
  async hasCartPreview(): Promise<boolean> {
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
  async updateCartItemQuantity(itemIndex: number, quantity: number) {
    const cartItem = this.cartPreview.locator('[data-testid="cart-preview-item"]').nth(itemIndex);
    const quantityInput = cartItem.locator('[data-testid="preview-quantity"]');
    
    await quantityInput.clear();
    await quantityInput.fill(quantity.toString());
    await quantityInput.press('Enter');
    await this.page.waitForTimeout(500);
  }

  /**
   * 关闭购物车预览
   */
  async closeCartPreview() {
    await this.cartPreview.locator('[data-testid="close-cart-preview"]').click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 验证购物车预览不会跳出当前页面
   */
  async validateCartPreviewStaysOnPage(): Promise<boolean> {
    const currentUrl = this.page.url();
    await this.clickCartPreview();
    await this.page.waitForTimeout(1000);
    
    // 确认URL没有变化
    return this.page.url() === currentUrl;
  }

  /**
   * 设置产品数量
   */
  async setProductQuantity(quantity: number, machineIndex: number = 0) {
    const card = this.machineCards.nth(machineIndex);
    const quantityInput = card.locator('[data-testid="quantity-input"]');
    
    await quantityInput.clear();
    await quantityInput.fill(quantity.toString());
  }

  /**
   * 获取产品数量
   */
  async getProductQuantity(machineIndex: number = 0): Promise<number> {
    const card = this.machineCards.nth(machineIndex);
    const quantityInput = card.locator('[data-testid="quantity-input"]');
    const value = await quantityInput.inputValue();
    return parseInt(value) || 1;
  }

  /**
   * 检查移动端筛选抽屉
   */
  async checkMobileFilterDrawer() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    
    // 检查筛选按钮是否存在
    const filterButton = this.page.locator('[data-testid="mobile-filter-button"]');
    const hasFilterButton = await filterButton.isVisible();
    
    if (hasFilterButton) {
      // 点击筛选按钮
      await filterButton.click();
      await this.page.waitForTimeout(500);
      
      // 检查抽屉是否出现
      const hasDrawer = await this.filterDrawer.isVisible();
      
      return { hasFilterButton, hasDrawer };
    }
    
    return { hasFilterButton, hasDrawer: false };
  }

  /**
   * 在抽屉中应用筛选
   */
  async applyMobileFilter(filterType: string, filterValue: string) {
    // 确保抽屉是打开的
    const filterButton = this.page.locator('[data-testid="mobile-filter-button"]');
    await filterButton.click();
    await this.page.waitForTimeout(500);
    
    // 在抽屉中选择筛选选项
    await this.filterDrawer.locator(`[data-testid="filter-${filterType}"]`).click();
    await this.filterDrawer.locator(`[data-testid="filter-option-${filterValue}"]`).click();
    
    // 应用筛选
    await this.filterDrawer.locator('[data-testid="apply-mobile-filters"]').click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 验证产品字段显示完整性
   */
  async validateProductFields(machineIndex: number = 0) {
    const card = this.machineCards.nth(machineIndex);
    
    // 检查必要字段
    const fields = {
      image: await card.locator('[data-testid="machine-image"]').isVisible(),
      partNumber: await card.locator('[data-testid="part-number"]').isVisible(),
      productName: await card.locator('[data-testid="product-name"]').isVisible(),
      palletSize: await card.locator('[data-testid="pallet-size"]').isVisible(),
      unitsPerPallet: await card.locator('[data-testid="units-per-pallet"]').isVisible(),
      voltage: await card.locator('[data-testid="voltage"]').isVisible(),
      frequency: await card.locator('[data-testid="frequency"]').isVisible()
    };
    
    // 计算显示的字段数量
    const displayedFields = Object.values(fields).filter(Boolean).length;
    const totalFields = Object.keys(fields).length;
    const completeness = (displayedFields / totalFields) * 100;
    
    return { fields, completeness, displayedFields, totalFields };
  }

  /**
   * 检查阶梯价格显示
   */
  async checkTieredPricing(machineIndex: number = 0): Promise<boolean> {
    const card = this.machineCards.nth(machineIndex);
    const pricingTable = card.locator('[data-testid="tiered-pricing"]');
    return await pricingTable.isVisible();
  }

  /**
   * 检查库存信息可见性（销售账号权限）
   */
  async checkStockVisibility(machineIndex: number = 0): Promise<boolean> {
    const card = this.machineCards.nth(machineIndex);
    const stockInfo = card.locator('[data-testid="stock-info"]');
    return await stockInfo.isVisible();
  }

  /**
   * 验证货币符号和单位制显示
   */
  async validateCurrencyAndUnits(machineIndex: number = 0) {
    const card = this.machineCards.nth(machineIndex);
    
    const priceText = await card.locator('[data-testid="machine-price"]').textContent() || '';
    const sizeText = await card.locator('[data-testid="pallet-size"]').textContent() || '';
    
    // 检查货币符号
    const hasCurrencySymbol = /[¥$€£]/.test(priceText);
    
    // 检查单位制（公制/英制）
    const hasMetricUnits = /cm|mm|kg|m/.test(sizeText);
    const hasImperialUnits = /in|ft|lb|oz/.test(sizeText);
    
    return {
      hasCurrencySymbol,
      hasMetricUnits,
      hasImperialUnits,
      priceText,
      sizeText
    };
  }

  /**
   * 获取当前页面URL，用于验证跳转
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
} 