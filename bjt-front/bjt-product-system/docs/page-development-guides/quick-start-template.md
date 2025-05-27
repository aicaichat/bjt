# 🚀 快速启动模板

## 新页面测试模板

```typescript
/**
 * [PageName]页面集成测试
 * 基于 front-requirement.md 中的真实需求
 */

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  duration?: number;
  error?: string;
}

export class [PageName]IntegrationTest {
  private testResults: Array<TestResult> = [];

  private assert(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`断言失败: ${message}`);
    }
  }

  private addTestResult(test: string, status: 'pass' | 'fail', duration?: number, error?: string) {
    this.testResults.push({
      test,
      status,
      duration,
      error
    });
  }

  async runAllTests() {
    const tests = [
      { name: '页面初始化', fn: () => this.testPageInitialization() },
      { name: '导航栏和面包屑', fn: () => this.testNavigationAndBreadcrumb() },
      // 根据 front-requirement.md 添加实际测试
      { name: '核心功能1', fn: () => this.testCoreFunction1() },
      { name: '核心功能2', fn: () => this.testCoreFunction2() },
      { name: '响应式设计', fn: () => this.testResponsiveDesign() }
    ];

    for (const test of tests) {
      const startTime = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - startTime;
        this.addTestResult(test.name, 'pass', duration);
        console.log(`✅ ${test.name} - 通过 (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addTestResult(test.name, 'fail', duration, (error as Error).message);
        console.log(`❌ ${test.name} - 失败: ${(error as Error).message}`);
      }
    }

    return this.testResults;
  }

  // 测试1: 页面初始化
  async testPageInitialization() {
    const mockPageInitializer = {
      state: {
        loading: true,
        error: null as string | null,
        data: null as any
      },

      async initialize() {
        try {
          this.state.loading = true;
          this.state.error = null;
          
          // 加载页面数据
          await this.loadData();
          
          this.state.loading = false;
        } catch (error) {
          this.state.loading = false;
          this.state.error = (error as Error).message;
          throw error;
        }
      },

      async loadData() {
        // 模拟数据加载
        await new Promise(resolve => setTimeout(resolve, 100));
        this.state.data = { loaded: true };
      }
    };

    await mockPageInitializer.initialize();
    
    this.assert(!mockPageInitializer.state.loading, '页面应该加载完成');
    this.assert(mockPageInitializer.state.error === null, '不应该有错误');
    this.assert(mockPageInitializer.state.data !== null, '应该加载数据');
  }

  // 测试2: 导航栏和面包屑导航
  async testNavigationAndBreadcrumb() {
    const mockNavigation = {
      navbar: {
        visible: true,
        logo: 'BJT Logo',
        menuItems: ['产品分类', '文档下载', '售后服务'],
        languageSwitch: true
      },
      breadcrumb: {
        visible: true,
        path: ['首页', '[页面名称]'],
        currentPage: '[页面名称]'
      },

      validateNavigation() {
        const errors = [];
        
        if (!this.navbar.visible) errors.push('导航栏不可见');
        if (!this.navbar.logo) errors.push('Logo缺失');
        if (!this.breadcrumb.visible) errors.push('面包屑导航不可见');
        
        return {
          isValid: errors.length === 0,
          errors
        };
      }
    };

    const validation = mockNavigation.validateNavigation();
    this.assert(validation.isValid, `导航验证失败: ${validation.errors.join(', ')}`);
  }

  // TODO: 根据front-requirement.md添加实际测试方法
  async testCoreFunction1() {
    // 实现核心功能1的测试
    throw new Error('待实现：testCoreFunction1');
  }

  async testCoreFunction2() {
    // 实现核心功能2的测试
    throw new Error('待实现：testCoreFunction2');
  }

  // 测试N: 响应式设计
  async testResponsiveDesign() {
    const mockResponsiveManager = {
      getLayoutForViewport(width: number, height: number) {
        if (width < 768) {
          return {
            type: 'mobile',
            navigation: 'hamburger',
            layout: 'single-column',
            fontSize: 'large'
          };
        } else {
          return {
            type: 'desktop',
            navigation: 'full',
            layout: 'multi-column',
            fontSize: 'normal'
          };
        }
      },

      validateMobileLayout(layout: any) {
        const errors = [];
        
        if (layout.navigation !== 'hamburger') {
          errors.push('移动端应使用汉堡菜单');
        }
        if (layout.layout !== 'single-column') {
          errors.push('移动端应使用单列布局');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      }
    };

    // 测试移动端布局
    const mobileLayout = mockResponsiveManager.getLayoutForViewport(375, 667);
    const mobileValidation = mockResponsiveManager.validateMobileLayout(mobileLayout);
    this.assert(mobileValidation.isValid, `移动端布局验证失败: ${mobileValidation.errors.join(', ')}`);

    // 测试桌面端布局
    const desktopLayout = mockResponsiveManager.getLayoutForViewport(1920, 1080);
    this.assert(desktopLayout.type === 'desktop', '桌面端布局类型错误');
  }

  getResults() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;

    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? (passed / total) * 100 : 0,
      results: this.testResults
    };
  }
}

// 导出运行函数
export async function run[PageName]Tests() {
  console.log('🧪 开始 [PageName] 页面集成测试...\n');
  
  const test = new [PageName]IntegrationTest();
  await test.runAllTests();
  
  const summary = test.getResults();
  
  console.log('\n📊 [PageName] 测试总结:');
  console.log(`总测试数: ${summary.total}`);
  console.log(`通过: ${summary.passed} ✅`);
  console.log(`失败: ${summary.failed} ❌`);
  console.log(`成功率: ${summary.successRate.toFixed(1)}%`);
  
  return summary;
}

// 如果直接运行此文件
if (require.main === module) {
  run[PageName]Tests().catch(console.error);
}
```

## 使用说明

### 1. 复制模板
```bash
cp docs/page-development-guides/quick-start-template.md frontend/src/tests/pages/[your-page-name].integration.test.ts
```

### 2. 替换占位符
- 将 `[PageName]` 替换为实际页面名称（如 `LoginPage`）
- 将 `[页面名称]` 替换为中文页面名称（如 `登录页面`）
- 将 `[your-page-name]` 替换为文件名（如 `login-page`）

### 3. 查看需求
```bash
# 查看页面需求
grep -A 20 "你的页面名称" docs/front-requirement.md

# 查看测试用例
grep -A 30 "你的页面测试" docs/page-development-guides/test-front.md
```

### 4. 实现测试方法
基于 front-requirement.md 中的真实功能实现：
- `testCoreFunction1()` 
- `testCoreFunction2()`
- 其他核心功能测试

### 5. 运行测试
```bash
cd frontend
node -e "
const { run[PageName]Tests } = require('./src/tests/pages/[your-page-name].integration.test.ts');
run[PageName]Tests().then(console.log);
"
```

## 检查清单

### 开发前
- [ ] 阅读 front-requirement.md 中的页面需求
- [ ] 查看 test-front.md 中的测试用例
- [ ] 确认页面的核心功能列表
- [ ] 确保不添加虚构功能

### 开发中
- [ ] 使用真实的Mock数据
- [ ] 编写清晰的断言
- [ ] 添加适当的错误处理
- [ ] 保持测试独立性

### 开发后
- [ ] 运行TypeScript类型检查
- [ ] 确保所有测试通过
- [ ] 检查测试覆盖率
- [ ] 更新文档和注释 