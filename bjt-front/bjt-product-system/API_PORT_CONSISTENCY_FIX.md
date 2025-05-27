# API端口一致性修复总结

## 问题发现
用户发现备件页面的API调用端口与其他页面不一致：

### 问题表现
- **备件页面**: 调用 `http://localhost:5173/wp-json/bjt/v1/spare-parts`（端口5173）
- **机器页面**: 调用 `http://localhost:8080/wp-json/bjt/v1/machineparts`（端口8080）
- **其他页面**: 也使用端口8080

### 根本原因
备件页面使用了硬编码的相对路径，而其他页面使用了统一的API配置。

## 问题分析

### 1. 机器页面的正确做法
```typescript
// frontend/src/pages/Machines/index.tsx
import { API_BASE_URL } from '../../api/config';

// API调用
const response = await fetch(`${API_BASE_URL}/machineparts?...`, {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
});
```

### 2. 备件页面的错误做法（修复前）
```typescript
// frontend/src/api/sparePartsApi.ts
// 硬编码的相对路径
const API_BASE_PATH = '/wp-json/bjt/v1';

// 这导致调用 http://localhost:5173/wp-json/bjt/v1/spare-parts
const response = await axios.get(`${API_BASE_PATH}/spare-parts`, { params });
```

### 3. API配置的正确逻辑
```typescript
// frontend/src/api/config.ts
export const API_BASE_URL = (() => {
  // 如果设置了VITE_API_URL环境变量，直接使用
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 开发环境且启用代理时使用相对路径
  if (isDevelopment && useProxy) {
    return '/wp-json/bjt/v1';
  }
  
  // 默认使用完整URL
  return 'http://localhost:8080/wp-json/bjt/v1';
})();
```

## 修复方案

### 1. 统一API配置
修改备件API文件，使其使用统一的API配置：

```typescript
// frontend/src/api/sparePartsApi.ts
// 修复前
const API_BASE_PATH = '/wp-json/bjt/v1';

// 修复后
import { API_BASE_URL } from './config';
const API_BASE_PATH = API_BASE_URL;
```

### 2. 确保一致性
现在所有页面都使用相同的API基础URL：
- ✅ 机器页面: `http://localhost:8080/wp-json/bjt/v1/machineparts`
- ✅ 备件页面: `http://localhost:8080/wp-json/bjt/v1/spare-parts`
- ✅ 耗材页面: `http://localhost:8080/wp-json/bjt/v1/consumables`
- ✅ 其他API调用: 都使用端口8080

## 技术细节

### API配置优先级
1. **环境变量** (`VITE_API_URL`) - 最高优先级
2. **代理配置** (`VITE_USE_PROXY=true`) - 使用相对路径
3. **默认配置** - `http://localhost:8080/wp-json/bjt/v1`

### 为什么端口8080？
- 后端API服务运行在端口8080
- 前端开发服务器运行在端口5173
- 所有API调用应该指向后端服务（8080），而不是前端服务（5173）

### 代理配置的作用
当启用代理时（`VITE_USE_PROXY=true`），Vite会将相对路径的API请求代理到后端服务器，避免跨域问题。

## 影响和好处

### 1. 解决了500错误
- 备件页面不再访问不存在的前端API端点
- 正确访问后端API服务

### 2. 统一了架构
- 所有页面使用相同的API配置
- 便于维护和调试

### 3. 提高了可靠性
- 减少了硬编码的配置
- 支持环境变量配置

### 4. 改善了开发体验
- API调用更加一致
- 错误排查更容易

## 验证方法

### 1. 检查网络请求
在浏览器开发者工具的Network标签中，确认所有API请求都指向端口8080：
```
✅ http://localhost:8080/wp-json/bjt/v1/machineparts
✅ http://localhost:8080/wp-json/bjt/v1/spare-parts
✅ http://localhost:8080/wp-json/bjt/v1/consumables
```

### 2. 检查控制台日志
API配置信息应该显示正确的基础URL：
```javascript
🔧 API配置信息: {
  isDevelopment: true,
  useProxy: false,
  finalApiBaseUrl: "http://localhost:8080/wp-json/bjt/v1"
}
```

## 后续建议

### 1. 代码审查
- 检查其他API文件是否有类似的硬编码问题
- 确保所有新的API调用都使用统一配置

### 2. 环境配置
- 考虑在不同环境（开发、测试、生产）中使用不同的API配置
- 通过环境变量管理API端点

### 3. 文档更新
- 更新开发文档，说明正确的API调用方式
- 添加API配置的说明

### 4. 自动化检测
- 考虑添加linting规则，检测硬编码的API路径
- 在CI/CD中验证API配置的一致性

## 总结
通过修复API端口不一致问题，我们：
- ✅ 解决了备件页面的500错误
- ✅ 统一了所有页面的API调用方式
- ✅ 提高了系统的可维护性和可靠性
- ✅ 为后续开发建立了良好的架构基础 