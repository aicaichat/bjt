import { defineConfig, devices } from '@playwright/test';

/**
 * BJT产品管理系统 E2E测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* 并行运行测试 */
  fullyParallel: true,
  /* 在CI上禁用重试 */
  forbidOnly: !!process.env.CI,
  /* 在CI上重试失败的测试 */
  retries: process.env.CI ? 2 : 0,
  /* 并行worker数量 */
  workers: process.env.CI ? 1 : undefined,
  /* 报告配置 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'e2e-results.json' }],
    ['junit', { outputFile: 'e2e-results.xml' }]
  ],
  /* 全局测试配置 */
  use: {
    /* 基础URL */
    baseURL: 'http://localhost:5173',

    /* 测试追踪配置 */
    trace: 'on-first-retry',
    
    /* 截图配置 */
    screenshot: 'only-on-failure',
    
    /* 视频录制 */
    video: 'retain-on-failure',

    /* 额外的HTTP头 */
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    },

    /* 忽略HTTPS错误 */
    ignoreHTTPSErrors: true,

    /* 设置超时 */
    actionTimeout: 30000,
    navigationTimeout: 30000
  },

  /* 测试项目配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 移动设备测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 开发服务器配置 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2分钟启动超时
  },

  /* 全局设置和清理 */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts'
}); 