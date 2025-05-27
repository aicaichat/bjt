# API配置说明

本项目支持多种API配置方式，以适应不同的开发和部署环境。

## 配置方式

### 1. 环境变量配置（推荐）

通过设置环境变量来控制API地址：

```bash
# 直接指定API地址
VITE_API_URL=http://localhost:8080/wp-json/bjt/v1 npm run dev

# 或者使用代理模式
VITE_USE_PROXY=true npm run dev
```

### 2. 使用预定义脚本

项目提供了三种启动模式：

```bash
# 默认模式 - 自动检测环境
npm run dev

# 代理模式 - 通过Vite代理转发API请求
npm run dev:proxy

# 直接连接模式 - 直接连接到后端API
npm run dev:direct
```

## 配置优先级

API地址的确定遵循以下优先级：

1. **环境变量 VITE_API_URL** - 最高优先级
2. **代理模式** - 当 `VITE_USE_PROXY=true` 时使用 `/wp-json/bjt/v1`
3. **默认地址** - `http://localhost:8080/wp-json/bjt/v1`

## 使用场景

### 开发环境

**推荐使用直接连接模式：**
```bash
npm run dev:direct
```

优点：
- 配置简单，无需代理
- 错误信息清晰
- 支持CORS
- 前端和后端可以独立启动

### 生产环境

生产环境会自动使用环境变量中的API地址，或默认地址。

### Docker环境

在Docker环境中，可以通过环境变量设置API地址：

```yaml
# docker-compose.yml
environment:
  - VITE_API_URL=http://backend:8080/wp-json/bjt/v1
```

## 故障排除

### 1. API请求失败

检查控制台中的API配置信息：
```
🔧 API配置信息: {
  isDevelopment: true,
  useProxy: false,
  VITE_API_URL: "http://localhost:8080/wp-json/bjt/v1",
  finalApiBaseUrl: "http://localhost:8080/wp-json/bjt/v1"
}
```

### 2. CORS错误

确保后端已配置CORS允许前端域名：
- 开发环境：`http://localhost:5173`
- 生产环境：实际部署域名

### 3. 代理不工作

如果使用代理模式遇到问题：
1. 检查Vite配置中的代理设置
2. 确保后端服务在 `localhost:8080` 运行
3. 尝试使用直接连接模式

## 配置文件

相关配置文件：
- `frontend/src/api/config.ts` - API配置逻辑
- `frontend/vite.config.ts` - Vite代理配置
- `frontend/package.json` - 启动脚本定义

## 示例

### 本地开发（推荐）
```bash
cd frontend
npm run dev:direct
```

### 使用代理
```bash
cd frontend
npm run dev:proxy
```

### 自定义API地址
```bash
cd frontend
VITE_API_URL=http://192.168.1.100:8080/wp-json/bjt/v1 npm run dev
``` 