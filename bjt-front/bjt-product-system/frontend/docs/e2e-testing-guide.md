# 🚀 BJT产品管理系统 E2E测试指南

## 📋 概述

本文档介绍BJT前端项目的端到端(E2E)测试框架，基于Playwright构建，提供全面的用户场景测试覆盖。

## 🛠 测试架构

### 核心组件
- **Playwright**: E2E测试框架
- **页面对象模型(POM)**: 可维护的页面元素管理
- **测试辅助工具**: 通用测试操作封装
- **多浏览器支持**: Chrome, Firefox, Safari
- **移动端测试**: 响应式布局验证

### 目录结构
```
frontend/e2e/
├── tests/              # 测试用例
│   ├── home.spec.ts    # 首页测试
│   ├── machines.spec.ts # 机器页面测试
│   └── user-flow.spec.ts # 用户流程测试
├── pages/              # 页面对象模型
│   ├── HomePage.ts     # 首页POM
│   └── MachinesPage.ts # 机器页面POM
├── utils/              # 测试工具
│   └── test-helpers.ts # 通用辅助函数
├── fixtures/           # 测试数据
├── screenshots/        # 测试截图
├── global-setup.ts     # 全局设置
└── global-teardown.ts  # 全局清理
```

## 🚀 快速开始

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 运行E2E测试
```bash
# 运行所有E2E测试
npm run test:e2e

# 以可视化模式运行
npm run test:e2e:ui

# 以调试模式运行
npm run test:e2e:debug

# 查看测试报告
npm run test:e2e:report
```

## 📝 测试用例说明

### 首页测试 (home.spec.ts)
- ✅ 页面加载验证
- ✅ 产品线卡片显示
- ✅ 导航功能测试
- ✅ 语言切换验证
- ✅ 全局搜索功能
- ✅ Mock服务状态检查
- ✅ 数据源切换测试
- ✅ 响应式布局验证
- ✅ 性能指标监控
- ✅ 错误处理测试
- ✅ 键盘导航支持

### 机器页面测试 (machines.spec.ts)
- ✅ 页面加载和内容显示
- ✅ 分类筛选功能
- ✅ 搜索功能验证
- ✅ 排序功能测试
- ✅ 视图模式切换
- ✅ 电压筛选测试
- ✅ 分页导航功能
- ✅ 机器详情查看
- ✅ 购物车添加功能
- ✅ 无结果状态处理
- ✅ 筛选清除功能
- ✅ 移动端响应式
- ✅ 加载状态显示
- ✅ 网络错误处理

### 用户流程测试 (user-flow.spec.ts)
- ✅ 完整购买流程
- ✅ 跨页面导航
- ✅ 多设备响应式
- ✅ 数据源切换流程
- ✅ 错误处理和恢复
- ✅ 性能监控流程
- ✅ 搜索和筛选集成

## 🔧 配置选项

### 环境变量配置
测试运行时会自动设置以下环境变量：
```bash
VITE_DATA_SOURCE=sql-mock     # 使用SQL Mock数据
VITE_DEBUG_LOGS=false         # 关闭调试日志
VITE_SHOW_MOCK_STATUS=true    # 显示Mock状态组件
```

### 浏览器配置
- **Chromium**: 主要测试浏览器
- **Firefox**: 跨浏览器兼容性
- **Webkit**: Safari兼容性
- **Mobile**: 移动端设备模拟

## 📊 测试报告

### HTML报告
运行测试后自动生成HTML报告：
```bash
npm run test:e2e:report
```

### 输出格式
- **HTML**: 详细的可视化报告
- **JSON**: 程序化处理数据
- **JUnit**: CI/CD集成

### 截图和视频
- 失败时自动截图
- 失败时录制视频
- 测试追踪记录

## 🔍 调试指南

### 调试模式
```bash
# 打开调试器
npm run test:e2e:debug

# 指定测试文件
npx playwright test home.spec.ts --debug

# 指定测试用例
npx playwright test --grep "应该正确加载首页" --debug
```

### 常用调试技巧
1. **断点设置**: 在代码中添加 `await page.pause()`
2. **控制台输出**: 使用 `console.log()` 记录状态
3. **截图调试**: 在关键步骤添加截图
4. **网络监控**: 查看API请求响应

## 🚨 常见问题

### 1. 测试超时
```bash
# 增加超时时间
npx playwright test --timeout=60000
```

### 2. 元素定位失败
- 检查data-testid属性是否正确
- 确认元素在DOM中存在
- 验证等待条件是否合适

### 3. Mock服务问题
- 确认Mock服务配置正确
- 检查数据源切换是否生效
- 验证API Mock响应

### 4. 网络问题
- 检查开发服务器是否运行
- 确认端口配置正确
- 验证防火墙设置

## 📈 最佳实践

### 1. 测试编写
- 使用描述性的测试名称
- 保持测试独立性
- 遵循AAA模式(Arrange-Act-Assert)
- 适当使用Page Object模式

### 2. 元素定位
- 优先使用data-testid
- 避免依赖CSS类名
- 使用语义化选择器
- 考虑国际化影响

### 3. 数据管理
- 使用Mock数据确保测试稳定
- 避免依赖外部API
- 准备充足的测试数据
- 考虑边界情况

### 4. 性能优化
- 合理设置等待时间
- 并行运行测试
- 复用浏览器实例
- 优化测试数据加载

## 🔄 CI/CD集成

### GitHub Actions示例
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## 📚 扩展测试

### 添加新页面测试
1. 创建页面对象模型
2. 编写测试用例
3. 更新测试配置
4. 添加到CI流程

### 测试数据管理
1. 创建测试fixtures
2. 使用数据驱动测试
3. 模拟不同用户角色
4. 准备错误场景数据

## 🎯 测试覆盖目标

- **功能覆盖**: 90%+ 核心用户流程
- **页面覆盖**: 100% 主要页面
- **浏览器覆盖**: Chrome, Firefox, Safari
- **设备覆盖**: 桌面端 + 移动端
- **场景覆盖**: 正常流程 + 异常处理

---

通过完整的E2E测试套件，确保BJT产品管理系统在各种场景下都能稳定运行，为用户提供优质的使用体验。 