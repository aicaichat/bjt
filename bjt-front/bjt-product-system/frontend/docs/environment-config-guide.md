# BJT前端环境配置指南

## 📋 概述

BJT产品管理系统前端现在支持通过环境变量文件（`.env`）来配置API地址和数据源行为，无需修改代码即可在不同环境间切换。

## 🔧 环境文件配置

### 1. 创建环境文件

复制示例文件并根据需要修改：
```bash
# 复制示例文件
cp .env.example .env.local

# 或者针对特定环境
cp .env.example .env.development
cp .env.example .env.production
```

### 2. 可用环境变量

#### API服务器配置
```bash
# 真实API服务器地址
VITE_REAL_API_BASE_URL=http://localhost:8080

# Mock API内部地址
VITE_MOCK_API_BASE_URL=mock://internal
```

#### 数据源配置
```bash
# 数据源类型: 'real-api' | 'sql-mock' | 'mock'
VITE_DATA_SOURCE=sql-mock

# 强制使用Mock数据
VITE_FORCE_MOCK=false
```

#### Mock服务配置
```bash
# 是否启用数据缓存
VITE_ENABLE_CACHING=true

# 是否模拟网络延迟
VITE_NETWORK_DELAY=false

# Mock环境类型
VITE_MOCK_ENVIRONMENT=development
```

#### 调试配置
```bash
# 是否显示Mock服务状态组件
VITE_SHOW_MOCK_STATUS=true

# Mock状态组件位置
VITE_MOCK_STATUS_POSITION=top-right

# 是否显示控制台调试日志
VITE_DEBUG_LOGS=true
```

## 🌍 不同环境配置示例

### 开发环境 (`.env.development`)
```bash
# 使用SQL Mock数据，便于开发调试
VITE_DATA_SOURCE=sql-mock
VITE_REAL_API_BASE_URL=http://localhost:8080
VITE_DEBUG_LOGS=true
VITE_SHOW_MOCK_STATUS=true
VITE_ENABLE_CACHING=true
VITE_NETWORK_DELAY=false
```

### 测试环境 (`.env.test`)
```bash
# 使用SQL Mock数据，关闭缓存确保测试准确性
VITE_DATA_SOURCE=sql-mock
VITE_ENABLE_CACHING=false
VITE_DEBUG_LOGS=false
VITE_SHOW_MOCK_STATUS=false
VITE_NETWORK_DELAY=false
```

### 生产环境 (`.env.production`)
```bash
# 使用真实API
VITE_DATA_SOURCE=real-api
VITE_REAL_API_BASE_URL=https://api.bjt.com
VITE_DEBUG_LOGS=false
VITE_SHOW_MOCK_STATUS=false
VITE_ENABLE_CACHING=true
VITE_NETWORK_DELAY=false
```

### 本地开发连接真实API (`.env.local`)
```bash
# 本地开发但连接真实后端API
VITE_DATA_SOURCE=real-api
VITE_REAL_API_BASE_URL=http://localhost:8080
VITE_DEBUG_LOGS=true
VITE_SHOW_MOCK_STATUS=true
```

## 🔄 配置优先级

系统按以下优先级选择数据源：

1. **环境变量 `VITE_DATA_SOURCE`** (最高优先级)
   - 如果设置了此变量，直接使用指定的数据源

2. **强制Mock模式 `VITE_FORCE_MOCK=true`**
   - 强制使用SQL Mock数据，忽略其他设置

3. **NODE_ENV 自动选择** (默认行为)
   - `development`: SQL Mock数据
   - `test`: SQL Mock数据 (关闭缓存)
   - `production`: 真实API

## 📝 使用方法

### 1. 设置环境变量
```bash
# 方法一：创建 .env.local 文件
echo "VITE_DATA_SOURCE=real-api" > .env.local
echo "VITE_REAL_API_BASE_URL=http://localhost:3000" >> .env.local

# 方法二：在命令行中设置
export VITE_DATA_SOURCE=real-api
npm run dev
```

### 2. 代码中获取配置
```typescript
import { API_CONFIG, getCurrentDataSourceType } from '../config/mock-config';

// 获取当前API地址
console.log('API地址:', API_CONFIG.REAL_API_BASE_URL);

// 获取当前数据源类型
const dataSource = getCurrentDataSourceType(); // 'real-api' | 'sql-mock' | 'mock'
```

### 3. 运行时切换
```typescript
import { switchDataSource } from '../config/mock-config';

// 切换到真实API
switchDataSource('real-api');

// 切换到SQL Mock数据
switchDataSource('sql-mock');

// 切换到传统Mock文件
switchDataSource('mock');
```

## 🐛 故障排除

### 1. 环境变量不生效
- 确保文件名正确（`.env.local` 或 `.env.development`）
- 重启开发服务器
- 检查变量名前缀是否为 `VITE_`

### 2. API连接失败
- 检查 `VITE_REAL_API_BASE_URL` 地址是否正确
- 确认后端服务器是否运行
- 查看浏览器控制台的网络请求

### 3. Mock数据问题
- 检查Mock服务状态组件显示的信息
- 确认SQL数据是否正确加载
- 查看控制台调试日志

## 💡 最佳实践

1. **不同环境使用不同文件**
   - 开发：`.env.development`
   - 测试：`.env.test`
   - 生产：`.env.production`

2. **安全考虑**
   - 不要在 `.env` 文件中包含敏感信息
   - 将 `.env.local` 添加到 `.gitignore`

3. **团队协作**
   - 保持 `.env.example` 文件更新
   - 在文档中说明必需的环境变量

4. **调试模式**
   - 开发时开启 `VITE_DEBUG_LOGS=true`
   - 生产环境关闭调试日志和状态组件

## 📊 监控和调试

### Mock服务状态组件
- 右上角显示当前数据源状态
- 可以实时切换数据源
- 显示数据统计信息

### 控制台日志
```bash
🔧 环境变量配置: 使用真实API
📊 Mock服务状态: {
  active: true,
  source: "Real API (localhost:8080)",
  tables: 8,
  records: 156,
  environment: "development"
}
```

## 🚀 部署配置

### Docker环境
```dockerfile
# Dockerfile
ENV VITE_DATA_SOURCE=real-api
ENV VITE_REAL_API_BASE_URL=https://api.bjt.com
ENV VITE_DEBUG_LOGS=false
```

### CI/CD环境变量
```yaml
# GitHub Actions示例
env:
  VITE_DATA_SOURCE: real-api
  VITE_REAL_API_BASE_URL: ${{ secrets.API_URL }}
  VITE_DEBUG_LOGS: false
```

---

通过环境配置，您可以轻松地在不同数据源之间切换，而无需修改代码。这使得开发、测试和部署更加灵活和高效。 