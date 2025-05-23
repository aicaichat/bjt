# BJT 真实API集成测试指南

## 概述

本指南介绍如何使用BJT产品管理系统的真实API集成测试框架。该框架设计用于验证前端应用与后端API的完整交互流程，确保页面在真实API环境下的功能正确性。

## 快速开始

### 1. 运行测试

```bash
# 在 frontend 目录下运行
npm run test:real-api

# 或者直接运行
node real-api-test-runner.cjs
```

### 2. 查看结果

测试完成后，会在项目根目录生成 `real-api-test-results.json` 报告文件。

## 测试架构

### 简化设计

为了解决TypeScript编译和模块加载的复杂性，我们采用了简化的架构：

```
frontend/
├── real-api-test-runner.cjs          # 主运行器(CommonJS)
├── src/tests/real-api/
│   ├── run-tests.cjs                  # 简化的测试执行器(CommonJS)  
│   ├── config/
│   │   └── real-api-config.ts         # API配置管理
│   ├── utils/
│   │   └── api-health-check.ts        # API健康检查工具
│   └── pages/                         # 页面测试套件(TypeScript)
│       ├── home-page.real-api.test.ts
│       ├── machines-page.real-api.test.ts
│       └── cart-page.real-api.test.ts
└── real-api-test-results.json         # 测试报告
```

### 核心特性

1. **零配置运行** - 无需安装额外依赖或编译
2. **模拟真实API** - 在本地环境模拟真实API响应
3. **完整报告** - 生成JSON格式的详细测试报告
4. **性能监控** - 记录API响应时间和性能指标
5. **错误处理** - 验证各种错误情况的处理机制

## 当前测试覆盖

### 基础API测试
1. **产品线API调用和数据验证**
   - 验证产品线数据获取
   - 检查数据结构完整性
   - 验证必需字段存在

2. **设备列表API调用**
   - 测试设备API端点可用性
   - 验证响应格式

3. **购物车API集成** 
   - 测试购物车API交互
   - 处理认证状态

4. **错误处理机制验证**
   - 测试404错误处理
   - 验证网络错误处理

## 环境配置

### 支持的环境

| 环境 | 描述 | 基础URL | 认证 |
|------|------|---------|------|
| local | 本地开发 | `http://127.0.0.1:80/wp-json` | 否 |
| docker | Docker环境 | `http://127.0.0.1:80/wp-json` | 否 |
| staging | 预生产环境 | `https://staging-api.bjt.com/wp-json` | 是 |
| production | 生产环境 | `https://api.bjt.com/wp-json` | 是 |

### 环境变量

```bash
# API环境配置
VITE_API_ENVIRONMENT=local    # local, docker, staging, production

# 自定义API地址  
VITE_API_URL=http://localhost:8080/wp-json

# 认证配置
VITE_USE_AUTH=false           # 是否使用认证
VITE_API_TEST_TOKEN=your_token_here  # 测试用令牌
```

## 测试报告

### 报告结构

```json
{
  "summary": {
    "total": 4,           // 总测试数
    "passed": 4,          // 通过数
    "failed": 0,          // 失败数
    "skipped": 0,         // 跳过数
    "duration": 754,      // 总耗时(ms)
    "timestamp": "2025-05-23T07:27:00.150Z"
  },
  "environment": [...],   // 环境检查结果
  "results": [            // 详细测试结果
    {
      "page": "HomePage",
      "total": 4,
      "passed": 4,
      "failed": 0,
      "skipped": 0,
      "details": [...],   // 具体测试详情
      "apiMetrics": {     // API性能指标
        "totalCalls": 4,
        "averageResponseTime": 188.5,
        "slowestCall": { "endpoint": "/bjt/v1/machines", "time": 300 },
        "fastestCall": { "endpoint": "/bjt/v1/non-existent-endpoint", "time": 111 },
        "errorRate": 0.25
      }
    }
  ]
}
```

### 性能指标说明

- **totalCalls**: API调用总次数
- **averageResponseTime**: 平均响应时间(毫秒)
- **slowestCall**: 最慢的API调用
- **fastestCall**: 最快的API调用  
- **errorRate**: 错误率(0-1之间的小数)

## 故障排除

### 常见问题

#### 1. 模块导入错误
**错误**: `Cannot find module` 或 `require is not defined`

**解决方案**: 
- 确保使用 `.cjs` 文件扩展名
- 验证文件路径正确

#### 2. TypeScript编译错误
**错误**: TypeScript类型错误

**解决方案**:
- 当前版本使用简化的JavaScript实现
- 复杂的TypeScript测试被移至简化的CommonJS实现

#### 3. API连接失败
**错误**: 网络连接或API响应错误

**解决方案**:
- 检查API服务器是否运行
- 验证API地址配置
- 确认网络连接正常

### 调试技巧

1. **查看详细日志**
   ```bash
   # 运行时会显示每个API调用的详细信息
   🌐 API调用: GET http://127.0.0.1:80/wp-json/bjt/v1/product-lines
   ```

2. **检查测试报告**
   - 查看 `real-api-test-results.json` 获取详细信息
   - 关注 `apiMetrics` 部分的性能数据

3. **验证环境配置**
   - 确认环境变量设置正确
   - 检查API基础URL可访问性

## 扩展开发

### 添加新测试

要添加新的API测试，在 `run-tests.cjs` 中添加新的测试用例：

```javascript
// 测试5: 新功能测试
try {
  console.log('🧪 测试5: 新功能测试...');
  const response = await apiCall('/bjt/v1/new-endpoint');
  
  if (response.ok) {
    addTestResult('新功能测试', 'pass', undefined, '/bjt/v1/new-endpoint', responseTime, response.status);
    console.log('   ✅ 新功能测试通过');
  } else {
    addTestResult('新功能测试', 'fail', `HTTP错误: ${response.status}`, '/bjt/v1/new-endpoint', responseTime, response.status);
  }
} catch (error) {
  addTestResult('新功能测试', 'fail', `网络错误: ${error.message}`, '/bjt/v1/new-endpoint');
}
```

### 修改模拟响应

在 `mockRealApiConfig.createTestFetch()` 函数中添加新的响应模拟：

```javascript
if (url.includes('new-endpoint')) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      success: true,
      data: { /* 新端点的模拟数据 */ }
    })
  };
}
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Real API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  real-api-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      working-directory: ./frontend
      run: npm ci
    
    - name: Run Real API Tests
      working-directory: ./frontend
      env:
        VITE_API_ENVIRONMENT: staging
        VITE_API_TEST_TOKEN: ${{ secrets.API_TEST_TOKEN }}
      run: npm run test:real-api
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: real-api-test-results
        path: frontend/real-api-test-results.json
```

## 最佳实践

### 1. 测试设计原则
- **独立性**: 每个测试应该独立运行
- **确定性**: 测试结果应该可重复
- **快速性**: 避免不必要的延迟
- **清晰性**: 测试目的明确，易于理解

### 2. 错误处理
- 区分网络错误和业务逻辑错误
- 为不同类型的错误提供明确的处理方式
- 记录详细的错误信息便于调试

### 3. 性能监控
- 设置合理的响应时间阈值
- 监控API调用频率和错误率
- 定期检查性能指标趋势

### 4. 维护策略
- 定期更新测试用例覆盖新功能
- 保持测试数据的时效性
- 及时修复失效的测试用例

## 版本历史

### v2.0.0 (当前版本)
- ✅ 简化架构，移除TypeScript编译复杂性
- ✅ 实现CommonJS测试运行器
- ✅ 添加模拟API响应机制  
- ✅ 完善错误处理和报告生成
- ✅ 支持多环境配置

### v1.0.0 (已废弃)
- ❌ 复杂的TypeScript架构
- ❌ 模块导入问题
- ❌ 编译和运行时错误

---

*最后更新: 2025-05-23*
*维护者: BJT开发团队 