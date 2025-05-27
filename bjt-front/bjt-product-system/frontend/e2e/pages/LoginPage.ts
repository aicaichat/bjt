import { Page, Locator } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

/**
 * 登录页面页面对象模型
 */
export class LoginPage {
  private helpers: TestHelpers;

  // 页面元素定位器
  readonly companyLogo: Locator;
  readonly loginTitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordToggle: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly accountTip: Locator;
  readonly languageSwitch: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.helpers = new TestHelpers(page);
    
    // 定义页面元素
    this.companyLogo = page.locator('[data-testid="company-logo"]');
    this.loginTitle = page.locator('[data-testid="login-title"]');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.passwordToggle = page.locator('[data-testid="password-toggle"]');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"]');
    this.accountTip = page.locator('[data-testid="account-tip"]');
    this.languageSwitch = page.locator('[data-testid="language-switch"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  /**
   * 导航到登录页面
   */
  async goto() {
    await this.page.goto('/login');
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查页面是否正确加载
   */
  async isLoaded(): Promise<boolean> {
    return await this.helpers.isVisible('[data-testid="login-page"]');
  }

  /**
   * 检查公司Logo是否显示
   */
  async hasCompanyLogo(): Promise<boolean> {
    return await this.companyLogo.isVisible();
  }

  /**
   * 获取登录标题文本
   */
  async getLoginTitle(): Promise<string> {
    return await this.loginTitle.textContent() || '';
  }

  /**
   * 检查是否显示账号提示信息
   */
  async hasAccountTip(): Promise<boolean> {
    return await this.accountTip.isVisible();
  }

  /**
   * 获取账号提示文本
   */
  async getAccountTipText(): Promise<string> {
    return await this.accountTip.textContent() || '';
  }

  /**
   * 填写邮箱
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * 填写密码
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * 切换密码可见性
   */
  async togglePasswordVisibility() {
    await this.passwordToggle.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * 检查密码是否可见
   */
  async isPasswordVisible(): Promise<boolean> {
    const inputType = await this.passwordInput.getAttribute('type');
    return inputType === 'text';
  }

  /**
   * 勾选"记住我"
   */
  async checkRememberMe() {
    await this.rememberMeCheckbox.check();
  }

  /**
   * 取消勾选"记住我"
   */
  async uncheckRememberMe() {
    await this.rememberMeCheckbox.uncheck();
  }

  /**
   * 检查"记住我"是否被勾选
   */
  async isRememberMeChecked(): Promise<boolean> {
    return await this.rememberMeCheckbox.isChecked();
  }

  /**
   * 点击登录按钮
   */
  async clickLogin() {
    await this.loginButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * 执行完整登录流程
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    
    if (rememberMe) {
      await this.checkRememberMe();
    }
    
    await this.clickLogin();
    await this.helpers.waitForPageLoad();
  }

  /**
   * 点击忘记密码链接
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.helpers.waitForPageLoad();
  }

  /**
   * 检查是否有错误提示
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * 获取错误提示文本
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
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
   * 检查登录按钮是否可用
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
  }

  /**
   * 检查表单验证状态
   */
  async validateForm(): Promise<{email: boolean, password: boolean}> {
    const emailValue = await this.emailInput.inputValue();
    const passwordValue = await this.passwordInput.inputValue();
    
    return {
      email: emailValue.length > 0 && emailValue.includes('@'),
      password: passwordValue.length > 0
    };
  }

  /**
   * 清空表单
   */
  async clearForm() {
    await this.emailInput.clear();
    await this.passwordInput.clear();
    await this.uncheckRememberMe();
  }

  /**
   * 检查响应式布局
   */
  async checkMobileLayout() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);
    
    // 检查移动端特有元素
    const formWidth = await this.page.locator('[data-testid="login-form"]').boundingBox();
    const buttonWidth = await this.loginButton.boundingBox();
    
    return {
      formResponsive: formWidth && formWidth.width > 300,
      buttonFullWidth: buttonWidth && buttonWidth.width > 300
    };
  }

  /**
   * 等待登录成功跳转
   */
  async waitForLoginSuccess() {
    // 等待URL变化，表示登录成功
    await this.page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 });
  }

  /**
   * 检查是否已登录（检查是否有用户信息）
   */
  async isLoggedIn(): Promise<boolean> {
    // 检查是否存在表示已登录的元素
    return await this.helpers.isVisible('[data-testid="user-menu"]');
  }
} 