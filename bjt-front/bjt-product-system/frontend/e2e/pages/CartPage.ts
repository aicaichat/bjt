import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * 购物车页面页面对象模型
 */
export class CartPage {
  private helpers: TestHelpers;

  // 页面元素定位器
  readonly pageTitle: Locator;
  readonly progressIndicator: Locator;
  readonly cartTable: Locator;
  readonly cartItems: Locator;
  readonly summaryCard: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingLink: Locator;
  readonly emptyCartMessage: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // 定义页面元素
    this.pageTitle = page.locator('[data-testid="cart-title"]');
    this.progressIndicator = page.locator('[data-testid="progress-indicator"]');
    this.cartTable = page.locator('[data-testid="cart-table"]');
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.summaryCard = page.locator('[data-testid="cart-summary"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.continueShoppingLink = page.locator('[data-testid="continue-shopping"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart"]');
  }

  /**
   * 导航到购物车页面
   */
  async goto() {
    await this.page.goto('/cart');
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查页面是否正确加载
   */
  async isLoaded(): Promise<boolean> {
    return await this.helpers.isVisible('[data-testid="cart-page"]');
  }

  /**
   * 检查购物车标题是否显示
   */
  async hasTitle(): Promise<boolean> {
    return await this.pageTitle.isVisible();
  }

  /**
   * 获取购物车标题文本
   */
  async getTitleText(): Promise<string> {
    return await this.pageTitle.textContent() || '';
  }

  /**
   * 检查进度指示器是否显示
   */
  async hasProgressIndicator(): Promise<boolean> {
    return await this.progressIndicator.isVisible();
  }

  /**
   * 检查购物车表格是否显示
   */
  async hasCartTable(): Promise<boolean> {
    return await this.cartTable.isVisible();
  }

  /**
   * 获取购物车商品数量
   */
  async getItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * 检查购物车是否为空
   */
  async isEmpty(): Promise<boolean> {
    const itemCount = await this.getItemCount();
    return itemCount === 0;
  }

  /**
   * 检查空购物车消息是否显示
   */
  async hasEmptyMessage(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  /**
   * 获取指定商品的信息
   */
  async getItemInfo(index: number) {
    const item = this.cartItems.nth(index);
    
    const image = await item.locator('[data-testid="item-image"]').getAttribute('src');
    const name = await item.locator('[data-testid="item-name"]').textContent();
    const model = await item.locator('[data-testid="item-model"]').textContent();
    const sku = await item.locator('[data-testid="item-sku"]').textContent();
    const price = await item.locator('[data-testid="item-price"]').textContent();
    const quantity = await item.locator('[data-testid="item-quantity"]').inputValue();
    const subtotal = await item.locator('[data-testid="item-subtotal"]').textContent();
    
    return {
      image: image || '',
      name: name || '',
      model: model || '',
      sku: sku || '',
      price: price || '',
      quantity: parseInt(quantity) || 0,
      subtotal: subtotal || ''
    };
  }

  /**
   * 调整商品数量
   */
  async adjustQuantity(index: number, quantity: number) {
    const item = this.cartItems.nth(index);
    const quantityInput = item.locator('[data-testid="quantity-input"]');
    
    await quantityInput.clear();
    await quantityInput.fill(quantity.toString());
    await quantityInput.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  /**
   * 增加商品数量
   */
  async increaseQuantity(index: number) {
    const item = this.cartItems.nth(index);
    const increaseButton = item.locator('[data-testid="increase-quantity"]');
    
    await increaseButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 减少商品数量
   */
  async decreaseQuantity(index: number) {
    const item = this.cartItems.nth(index);
    const decreaseButton = item.locator('[data-testid="decrease-quantity"]');
    
    await decreaseButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 删除商品
   */
  async removeItem(index: number) {
    const item = this.cartItems.nth(index);
    const removeButton = item.locator('[data-testid="remove-item"]');
    
    await removeButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 点击"More Info"按钮
   */
  async clickMoreInfo(index: number) {
    const item = this.cartItems.nth(index);
    const moreInfoButton = item.locator('[data-testid="more-info"]');
    
    await moreInfoButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 点击"Specification"按钮
   */
  async clickSpecification(index: number) {
    const item = this.cartItems.nth(index);
    const specButton = item.locator('[data-testid="specification"]');
    
    await specButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查商品是否库存不足
   */
  async isItemOutOfStock(index: number): Promise<boolean> {
    const item = this.cartItems.nth(index);
    const outOfStockElement = item.locator('[data-testid="out-of-stock"]');
    
    return await outOfStockElement.isVisible();
  }

  /**
   * 检查商品行是否高亮显示（库存不足）
   */
  async isItemHighlighted(index: number): Promise<boolean> {
    const item = this.cartItems.nth(index);
    const backgroundColor = await item.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // 检查是否有浅红色背景
    return backgroundColor.includes('rgb(255') || backgroundColor.includes('rgba(255');
  }

  /**
   * 获取费用摘要信息
   */
  async getSummaryInfo() {
    const subtotal = await this.summaryCard.locator('[data-testid="subtotal"]').textContent();
    const shipping = await this.summaryCard.locator('[data-testid="shipping"]').textContent();
    const total = await this.summaryCard.locator('[data-testid="total"]').textContent();
    
    return {
      subtotal: subtotal || '',
      shipping: shipping || '',
      total: total || ''
    };
  }

  /**
   * 检查结算按钮是否可用
   */
  async isCheckoutEnabled(): Promise<boolean> {
    return await this.checkoutButton.isEnabled();
  }

  /**
   * 点击结算按钮
   */
  async clickCheckout() {
    await this.checkoutButton.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * 点击继续购物链接
   */
  async clickContinueShopping() {
    await this.continueShoppingLink.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * 计算预期小计
   */
  async calculateExpectedSubtotal(): Promise<number> {
    const itemCount = await this.getItemCount();
    let total = 0;
    
    for (let i = 0; i < itemCount; i++) {
      const itemInfo = await this.getItemInfo(i);
      const priceNum = parseFloat(itemInfo.price.replace(/[^0-9.]/g, ''));
      total += priceNum * itemInfo.quantity;
    }
    
    return total;
  }

  /**
   * 验证价格计算是否正确
   */
  async validatePriceCalculation(): Promise<boolean> {
    const summaryInfo = await this.getSummaryInfo();
    const expectedSubtotal = await this.calculateExpectedSubtotal();
    const actualSubtotal = parseFloat(summaryInfo.subtotal.replace(/[^0-9.]/g, ''));
    
    // 允许小数点精度误差
    return Math.abs(expectedSubtotal - actualSubtotal) < 0.01;
  }

  /**
   * 检查响应式布局
   */
  async checkMobileLayout() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    
    // 检查表格是否转为卡片式布局
    const hasCardLayout = await this.helpers.isVisible('[data-testid="cart-card-layout"]');
    
    // 检查垂直排列
    const cardItems = this.page.locator('[data-testid="cart-card-item"]');
    const cardCount = await cardItems.count();
    
    return {
      hasCardLayout,
      cardCount,
      isMobileOptimized: hasCardLayout && cardCount > 0
    };
  }

  /**
   * 清空购物车
   */
  async clearCart() {
    const itemCount = await this.getItemCount();
    
    // 从后往前删除商品，避免索引变化问题
    for (let i = itemCount - 1; i >= 0; i--) {
      await this.removeItem(i);
    }
  }

  /**
   * 批量更新商品数量
   */
  async updateAllQuantities(quantities: number[]) {
    const itemCount = await this.getItemCount();
    const updateCount = Math.min(itemCount, quantities.length);
    
    for (let i = 0; i < updateCount; i++) {
      await this.adjustQuantity(i, quantities[i]);
    }
  }

  /**
   * 检查货币符号显示
   */
  async getCurrencySymbol(): Promise<string> {
    const summaryInfo = await this.getSummaryInfo();
    const match = summaryInfo.total.match(/^[^0-9]*/);
    return match ? match[0] : '';
  }

  /**
   * 等待价格更新完成
   */
  async waitForPriceUpdate() {
    await this.page.waitForTimeout(1000);
    
    // 等待可能的加载指示器消失
    try {
      await this.page.waitForSelector('[data-testid="price-updating"]', { 
        state: 'hidden', 
        timeout: 5000 
      });
    } catch {
      // 如果没有加载指示器，继续执行
    }
  }
} 