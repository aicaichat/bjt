# BJT前端API集成指南

## 1. 概述

本文档提供了从Mock数据切换到真实API的详细指南，包括架构设计、实现方法和最佳实践。

## 2. 架构设计

### 2.1 整体架构

新的API服务架构采用了分层设计，包括以下几个层次：

1. **基础服务层**：提供通用的HTTP请求方法和错误处理
2. **适配器层**：处理API响应格式转换
3. **业务服务层**：实现具体业务逻辑
4. **组件层**：使用业务服务获取数据并渲染UI

### 2.2 目录结构

```
src/
  api/
    adapters/           # 适配器
      api-adapter.ts    # API适配器基类
    services/           # API服务
      base.service.ts   # 基础服务类
      product-line.service.ts # 产品线服务
      ...
      index.ts          # 服务统一导出
    types/              # API类型定义
      common.ts         # 通用类型
      product-line.ts   # 产品线类型
      ...
```

## 3. 实现方法

### 3.1 环境变量控制

使用环境变量`VITE_USE_MOCK_DATA`控制是否使用Mock数据：

```
# .env.development
VITE_USE_MOCK_DATA=false  # 使用真实API
```

```
# .env.development.mock
VITE_USE_MOCK_DATA=true   # 使用Mock数据
```

### 3.2 基础服务类

基础服务类`BaseService`提供了通用的HTTP请求方法和错误处理，同时处理Mock数据和真实API之间的切换：

```typescript
export abstract class BaseService<T, R = any> {
  protected readonly useMockData: boolean;
  protected readonly baseUrl: string;
  protected readonly adapter: ApiAdapter<T, R>;

  constructor(baseUrl: string, adapter?: ApiAdapter<T, R>) {
    this.useMockData = API_CONFIG.USE_MOCK_DATA;
    this.baseUrl = baseUrl;
    this.adapter = adapter || new DefaultAdapter<T, R>();
  }

  // 获取数据方法，根据环境变量决定使用Mock数据还是真实API
  protected async getData(path: string, params?: Record<string, any>): Promise<T> {
    if (this.useMockData) {
      return await this.getMockData(params);
    }
    
    const response = await ApiService.get(this.getApiPath(path), params);
    return this.handleResponse(response);
  }

  // 子类需要实现的获取Mock数据方法
  protected abstract getMockData(params?: Record<string, any>): Promise<T>;
}
```

### 3.3 API适配器

API适配器用于处理API响应格式转换，确保前端组件获得统一的数据格式：

```typescript
export interface ApiAdapter<T, R> {
  fromApiResponse(response: any): T;
  toApiRequest(data: T): R;
}
```

### 3.4 业务服务实现

业务服务继承自基础服务类，实现具体的业务逻辑：

```typescript
export class ProductLineService extends BaseService<ProductLineListResponse> {
  constructor() {
    super('/product-lines');
  }

  async getProductLines(params: { /* ... */ } = {}): Promise<ProductLineListResponse> {
    return this.getData('', params);
  }

  protected async getMockData(params: Record<string, any> = {}): Promise<ProductLineListResponse> {
    // 实现获取Mock数据的逻辑
  }
}
```

## 4. 使用示例

### 4.1 在组件中使用API服务

```tsx
import React, { useEffect, useState } from 'react';
import { productLineService, ProductLine } from '../api/services';

const ProductLineList: React.FC = () => {
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProductLines = async () => {
      try {
        const response = await productLineService.getProductLines();
        setProductLines(response.items || []);
      } catch (err) {
        console.error('Error fetching product lines:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductLines();
  }, []);

  // 渲染UI
};
```

### 4.2 使用组合式API

对于复杂组件，可以使用组合式API封装数据获取逻辑：

```typescript
// useProductLines.ts
import { ref, onMounted } from 'vue';
import { productLineService, ProductLine } from '../api/services';

export function useProductLines() {
  const productLines = ref<ProductLine[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const fetchProductLines = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await productLineService.getProductLines();
      productLines.value = response.items || [];
    } catch (err: any) {
      error.value = err.message || '获取产品线失败';
    } finally {
      loading.value = false;
    }
  };
  
  onMounted(fetchProductLines);
  
  return {
    productLines,
    loading,
    error,
    fetchProductLines
  };
}
```

## 5. 最佳实践

### 5.1 错误处理

- 在API服务层统一处理错误，包括网络错误、服务器错误和业务错误
- 在组件层捕获并显示用户友好的错误信息
- 对于关键操作，提供重试机制

### 5.2 缓存策略

- 对于不常变化的数据，实现缓存机制
- 提供强制刷新选项，以便在需要时获取最新数据
- 在用户执行修改操作后，自动刷新相关数据

### 5.3 性能优化

- 使用分页加载大量数据
- 实现数据预加载，提前加载用户可能需要的数据
- 避免重复请求相同的数据

### 5.4 测试策略

- 为每个API服务编写单元测试
- 使用Mock数据进行集成测试
- 在开发环境中使用Mock数据，在测试和生产环境中使用真实API

## 6. 常见问题

### 6.1 API返回格式与前端期望不一致

使用适配器转换API响应格式：

```typescript
class ProductLineAdapter extends BaseApiAdapter<ProductLine, any> {
  fromApiResponse(response: ApiResponse<any>): ProductLine {
    const data = response.data;
    return {
      id: data.id,
      code: data.code || `PL-${data.id}`,
      title_zh: data.title_zh || data.name_cn || '',
      title_en: data.title_en || data.name_en || '',
      // ... 其他字段转换
    };
  }
}
```

### 6.2 处理API错误

在基础服务类中统一处理错误：

```typescript
try {
  const response = await ApiService.get(this.getApiPath(path), params);
  return this.handleResponse(response);
} catch (error) {
  // 处理错误
  console.error(`Error getting data for ${path}:`, error);
  
  // 如果在使用真实API时出错，且开启了Mock数据，则尝试使用Mock数据作为备选
  if (!this.useMockData && API_CONFIG.USE_MOCK_DATA) {
    console.warn(`Falling back to mock data for ${path}`);
    return await this.getMockData(params);
  }
  
  throw error;
}
```

## 7. 迁移计划

### 7.1 阶段一：基础设施准备

- [x] 创建API适配器
- [x] 创建基础服务类
- [x] 创建服务索引文件
- [x] 更新环境配置

### 7.2 阶段二：核心服务迁移

- [x] 产品线服务
- [ ] 设备服务
- [ ] 配件服务
- [ ] 耗材服务
- [ ] 备件服务

### 7.3 阶段三：交互服务迁移

- [ ] 购物车服务
- [ ] 订单服务
- [ ] 认证服务

### 7.4 阶段四：测试与优化

- [ ] 编写单元测试
- [ ] 进行集成测试
- [ ] 性能优化
- [ ] 错误处理完善

## 8. 参考资料

- [BJT API文档](docs/api/API接口文档.md)
- [前端API集成编码规范](.cursor/BJT前端API集成编码规范.md)
- [API状态记录](frontend/src/services/apiStatus.md) 