# BJT产品管理系统 - 前端组件

## 项目概述

BJT产品管理系统是一个面向B2B工业设备和配件销售的电子商务平台。系统支持多语言、多区域、多角色的用户体验，包括产品展示、备件管理、购物车和订单处理等功能。

## 最近改进

### 1. 配置模块化

创建了全局配置模块，集中管理API URL、区域设置和用户角色等全局参数：

- `src/config/appConfig.ts` - 集中管理应用配置
- 统一了区域、货币和角色的定义
- 提供了工具函数如`getUserRegionFromEmail`和`getCurrencySymbol`

### 2. 统一Mock数据管理

将原先分散在API实现中的Mock数据移至独立模块：

- `src/services/mockData/sparePartsMockData.ts` - 备件模拟数据
- 分类存储不同类型的备件数据
- 与API层实现解耦

### 3. API服务抽象

创建了统一的API服务层，支持根据环境切换真实API和Mock API：

- `src/services/apiService.ts` - API服务工厂
- 统一的请求和响应拦截处理
- 根据环境配置自动选择数据源

### 4. 工具函数库

添加了通用工具函数库，提供常用辅助函数：

- `src/utils/helpers.ts` - 工具函数集合
- 包含格式化、延迟、防抖等常用功能
- 可在整个应用中重用

## SpareParts页面优化

### 优化项目：

1. **消除硬编码配置**
   - 区域判断逻辑移至配置模块
   - 货币符号从配置中获取
   - API基础URL集中管理

2. **统一Mock数据管理**
   - 将备件Mock数据移至专门的数据文件
   - 支持通过配置切换真实/模拟API
   - 更好的代码组织和维护性

3. **API调用优化**
   - 使用统一的API调用接口
   - 添加类型定义和参数验证
   - 更好的错误处理

4. **响应式设计**
   - 完善的移动端卡片视图
   - 适配不同屏幕尺寸
   - 优化移动端用户体验

## 配置说明

### API配置

```typescript
// 在环境变量中设置
VITE_API_URL=https://api.example.com
VITE_USE_MOCK=true // 控制是否使用模拟数据
```

### 区域配置

系统支持以下区域：
- 中国 (CN) - 默认货币 ¥
- 欧洲 (EU) - 默认货币 €
- 北美 (NA) - 默认货币 $
- 澳洲 (AU) - 默认货币 A$

### 用户角色

系统支持以下角色：
- 管理员 (admin)
- 销售 (sales)
- 客户 (customer)
- 合作伙伴 (partner)
- 访客 (guest)

## 开发指南

### 使用配置模块

```typescript
import { API_CONFIG, getCurrencySymbol } from '../config/appConfig';

// 检查是否使用Mock数据
if (API_CONFIG.USE_MOCK_DATA) {
  // 处理模拟数据逻辑
}

// 获取货币符号
const currencySymbol = getCurrencySymbol('eu'); // 返回 €
```

### 使用API服务

```typescript
import apiService from '../services/apiService';

// GET请求
const data = await apiService.get('/endpoint', { param: value });

// POST请求
const result = await apiService.post('/endpoint', { data: value });
```

### 使用工具函数

```typescript
import { delay, formatCurrency } from '../utils/helpers';

// 延迟执行
await delay(500);

// 格式化货币
const price = formatCurrency(100, '$', 2); // 返回 $100.00
```

## 下一步改进

1. 增加服务端分页支持
2. 改进国际化实现
3. 添加单元测试覆盖
4. 性能优化和代码拆分
