# 🎯 BJT前端环境配置功能总结

## ✅ 已实现功能

### 1. 环境变量支持
我们已经为BJT产品管理系统前端添加了完整的环境变量配置支持，现在您可以通过 `.env` 文件来配置：

**真实API地址设置**：
```bash
# 在 .env.local 文件中设置
VITE_REAL_API_BASE_URL=http://localhost:8080
# 或者生产环境
VITE_REAL_API_BASE_URL=https://api.bjt.com
```

**数据源切换**：
```bash
# 选择数据源类型
VITE_DATA_SOURCE=real-api     # 使用真实API
VITE_DATA_SOURCE=sql-mock     # 使用SQL Mock数据
VITE_DATA_SOURCE=mock         # 使用传统Mock文件
```

### 2. 配置优先级
系统按以下优先级自动选择数据源：

1. **环境变量 `VITE_DATA_SOURCE`** - 最高优先级
2. **强制Mock模式 `VITE_FORCE_MOCK=true`** - 强制使用Mock
3. **NODE_ENV 自动选择** - 根据环境自动配置
   - `development`: SQL Mock数据
   - `test`: SQL Mock数据（关闭缓存）
   - `production`: 真实API

### 3. 实时切换
除了环境变量配置，还支持运行时切换：

**通过MockServiceStatus组件**：
- 点击右上角的Mock服务状态组件
- 使用切换按钮在三种数据源间切换

**通过代码**：
```typescript
import { switchDataSource } from '../config/mock-config';

// 切换到真实API
switchDataSource('real-api');
```

## 📁 相关文件

### 核心配置文件
- `frontend/src/config/mock-config.ts` - 主配置文件，支持环境变量
- `frontend/src/services/integrated-mock-service.ts` - 集成Mock服务
- `frontend/src/services/real-api-service.ts` - 真实API服务

### 环境文件
- `frontend/.env.example` - 环境变量示例文件
- 可创建 `.env.local`、`.env.development`、`.env.production` 等文件

### 文档
- `frontend/docs/environment-config-guide.md` - 详细使用指南

## 🚀 快速开始

### 1. 创建环境文件
```bash
cd frontend
cp .env.example .env.local
```

### 2. 配置真实API
编辑 `.env.local` 文件：
```bash
# 连接到真实API服务器
VITE_DATA_SOURCE=real-api
VITE_REAL_API_BASE_URL=http://localhost:8080
```

### 3. 启动应用
```bash
npm run dev
```

### 4. 验证配置
- 查看右上角Mock服务状态组件
- 控制台会显示当前数据源信息
- 可以实时切换不同数据源

## 🌍 环境配置示例

### 开发环境（默认）
```bash
# .env.development
VITE_DATA_SOURCE=sql-mock
VITE_DEBUG_LOGS=true
VITE_SHOW_MOCK_STATUS=true
```

### 生产环境
```bash
# .env.production
VITE_DATA_SOURCE=real-api
VITE_REAL_API_BASE_URL=https://api.bjt.com
VITE_DEBUG_LOGS=false
VITE_SHOW_MOCK_STATUS=false
```

### 本地测试真实API
```bash
# .env.local
VITE_DATA_SOURCE=real-api
VITE_REAL_API_BASE_URL=http://localhost:8080
VITE_DEBUG_LOGS=true
```

## 💡 主要优势

1. **无需修改代码** - 通过环境变量即可切换数据源
2. **灵活配置** - 支持开发、测试、生产不同环境
3. **实时切换** - 运行时可以在不同数据源间切换
4. **向下兼容** - 保持原有Mock系统不变
5. **类型安全** - 完整的TypeScript支持

## 🔧 故障排除

### API连接失败
1. 检查 `VITE_REAL_API_BASE_URL` 是否正确
2. 确认后端服务器是否运行在指定端口
3. 查看浏览器控制台的网络请求日志
4. 系统会自动回退到Mock数据

### 环境变量不生效
1. 确保变量名以 `VITE_` 开头
2. 重启开发服务器
3. 检查 `.env` 文件是否在正确位置

## ✨ 总结

通过这个环境配置系统，BJT前端现在可以：
- 轻松在Mock数据和真实API之间切换
- 支持不同环境的自动配置
- 提供开发调试的灵活性
- 确保生产环境的稳定性

所有配置都通过环境变量控制，无需修改代码，使得开发、测试和部署更加高效。 