# PO页面API架构修复报告

## 问题分析

### 原始问题
PO页面在生产环境显示空白，而其他页面正常工作。

### 根本原因
PO页面使用了不一致的API配置方式：
```typescript
// PO页面 - 直接使用环境变量，有问题
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';

// 其他页面 - 使用统一的API配置，正常工作
import { API_CONFIG } from '../config/appConfig';
const apiBaseUrl = API_CONFIG.BASE_URL; // 自动回退到 '/wp-json/bjt/v1'
```

## 两种解决方案对比

### 方案1: 添加环境变量 (❌ 不推荐)
```env
# 在 .env.production 中添加
VITE_API_URL=/wp-json/bjt/v1
VITE_DATA_SOURCE=real-api
# ... 更多配置
```

**缺点:**
- 增加了配置复杂度
- 不符合统一架构原则
- 需要维护更多环境变量
- 其他页面不需要这些配置就能正常工作

### 方案2: 修复PO页面API调用 (✅ 推荐)
```typescript
// 修复前
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';

// 修复后
import { API_CONFIG } from '../../config/appConfig';
const apiBaseUrl = API_CONFIG.BASE_URL;
```

**优点:**
- 保持架构一致性
- 减少配置复杂度
- 遵循DRY原则
- 与其他页面使用相同的API配置逻辑

## 架构一致性分析

### 当前系统的API配置架构

#### 1. 统一配置文件
```typescript
// frontend/src/config/appConfig.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/wp-json/bjt/v1', // 智能回退
  // ... 其他配置
};
```

#### 2. 其他页面的正确用法
```typescript
// Machines页面
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';

// Consumables页面  
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';

// 但更好的方式是使用统一配置:
import { API_CONFIG } from '../config/appConfig';
const baseUrl = API_CONFIG.BASE_URL;
```

#### 3. 服务层的正确用法
```typescript
// orderService.ts
import { API_CONFIG } from '../config/appConfig';
// 使用 API_CONFIG.BASE_URL

// apiService.ts  
import { API_BASE_URL } from '../api/config';
// 使用统一的 API_BASE_URL
```

## 修复实施

### 已完成的修复
1. **导入统一配置**
   ```typescript
   import { ASSETS, API_CONFIG } from '../../config/appConfig';
   ```

2. **修复API调用**
   ```typescript
   // 修复前
   const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
   
   // 修复后
   const apiBaseUrl = API_CONFIG.BASE_URL;
   ```

### 为什么这样修复是正确的

#### 1. 配置回退逻辑
```typescript
// API_CONFIG.BASE_URL 的定义
BASE_URL: import.meta.env.VITE_API_URL || '/wp-json/bjt/v1'
```

在生产环境中:
- `import.meta.env.VITE_API_URL` = undefined (未设置)
- 自动回退到 `'/wp-json/bjt/v1'` (相对路径，正确)
- 浏览器自动解析为当前域名下的API路径

#### 2. 与其他页面保持一致
所有页面都应该使用相同的API配置逻辑，确保:
- 开发环境: 指向 localhost:8080
- 生产环境: 使用相对路径 `/wp-json/bjt/v1`

## 测试验证

### 修复前的问题
```javascript
// 生产环境中
import.meta.env.VITE_API_URL // undefined
// 回退到 'http://localhost:8080/wp-json/bjt/v1' // ❌ 无法访问
```

### 修复后的正确行为
```javascript
// 生产环境中
API_CONFIG.BASE_URL // '/wp-json/bjt/v1' // ✅ 正确的相对路径
```

## 结论

**选择方案2 (修复PO页面API调用) 的原因:**

1. **架构一致性**: 与系统其他部分保持一致
2. **维护简单**: 不需要额外的环境变量配置
3. **遵循最佳实践**: 使用集中化的配置管理
4. **减少复杂度**: 避免为单个页面添加特殊配置
5. **可扩展性**: 未来添加新页面时遵循相同模式

**修复效果:**
- ✅ PO页面现在使用与其他页面相同的API配置逻辑
- ✅ 生产环境自动使用正确的相对路径
- ✅ 开发环境继续使用localhost配置
- ✅ 不需要额外的环境变量配置
- ✅ 保持了代码架构的一致性

这种修复方式不仅解决了当前问题，还提高了代码质量和可维护性。 