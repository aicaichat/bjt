# BJT前端API集成编码规范

## 1. API服务层结构规范

### 1.1 目录结构
```
src/
  api/
    services/           # API服务实现
      auth.service.ts   # 认证相关API
      product.service.ts # 产品相关API
      ...
    types/              # API类型定义
      auth.types.ts
      product.types.ts
      ...
    utils/              # API工具函数
      error-handler.ts
      response-parser.ts
      ...
    http.service.ts     # HTTP基础服务
    api.config.ts       # API配置
```

### 1.2 服务类命名
- 使用`PascalCase`命名服务类，如`AuthService`、`ProductLineService`
- 文件名使用`kebab-case`，如`auth.service.ts`、`product-line.service.ts`
- 服务类必须以`Service`后缀结尾

### 1.3 基础服务类模板
```typescript
import { HttpService } from '../http.service';
import { ApiResponse } from '../types/common.types';
import { SomeEntityType } from '../types/entity.types';

export class EntityService {
  private baseUrl = '/entity-endpoint';
  
  constructor(private http: HttpService) {}
  
  async getList(params?: Record<string, any>): Promise<ApiResponse<SomeEntityType[]>> {
    return this.http.get<SomeEntityType[]>(this.baseUrl, { params });
  }
  
  async getById(id: number | string): Promise<ApiResponse<SomeEntityType>> {
    return this.http.get<SomeEntityType>(`${this.baseUrl}/${id}`);
  }
  
  // 其他方法...
}
```

## 2. 类型定义规范

### 2.1 API响应类型
```typescript
// common.types.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
```

### 2.2 实体类型定义
- 所有实体类型必须使用`interface`定义
- 使用`PascalCase`命名接口，如`ProductLine`、`Machine`
- 属性名与API返回的字段名保持一致
- 为所有属性添加类型注解和可选性标记
- 添加JSDoc注释说明字段用途

```typescript
/**
 * 产品线实体类型
 */
export interface ProductLine {
  /** 产品线ID */
  id: number;
  /** 产品线代码 */
  code: string;
  /** 中文标题 */
  title_zh: string;
  /** 英文标题 */
  title_en: string;
  /** 中文描述 */
  description_zh?: string;
  /** 英文描述 */
  description_en?: string;
  /** 图片URL */
  image_url?: string;
  /** 状态 */
  status: 'publish' | 'draft' | 'trash';
  /** 排序顺序 */
  sort_order?: number;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}
```

## 3. HTTP请求规范

### 3.1 请求配置
- 所有请求必须设置超时时间
- 请求头必须包含`Content-Type`和`Accept`
- 认证请求必须在拦截器中添加`Authorization`头

```typescript
// http.service.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getToken } from '../utils/auth';

export class HttpService {
  private instance: AxiosInstance;
  
  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // 响应拦截器...
  }
  
  // 请求方法...
}
```

### 3.2 错误处理
- 使用响应拦截器统一处理错误
- 区分网络错误、API错误和认证错误
- 认证错误自动跳转到登录页面

```typescript
// 响应拦截器示例
this.instance.interceptors.response.use(
  (response) => {
    // 提取API响应数据
    const apiResponse = response.data;
    
    // 检查API成功标志
    if (!apiResponse.success) {
      return Promise.reject({
        type: 'api_error',
        code: apiResponse.code,
        message: apiResponse.message || '操作失败'
      });
    }
    
    return apiResponse;
  },
  (error) => {
    if (error.response) {
      // 服务器返回错误状态码
      const status = error.response.status;
      
      if (status === 401) {
        // 认证错误，跳转到登录页
        router.push('/login');
        return Promise.reject({
          type: 'auth_error',
          message: '登录已过期，请重新登录'
        });
      }
      
      return Promise.reject({
        type: 'http_error',
        status,
        message: error.response.data?.message || '请求失败'
      });
    }
    
    // 网络错误或请求被取消
    return Promise.reject({
      type: 'network_error',
      message: '网络连接失败，请检查网络设置'
    });
  }
);
```

## 4. API服务使用规范

### 4.1 组件中使用API服务
- 使用组合式API (Composition API) 封装API调用
- 实现加载状态、错误处理和数据转换
- 避免在模板中直接调用API方法

```typescript
// useProductLines.ts
import { ref, onMounted } from 'vue';
import { ProductLineService } from '@/api/services/product-line.service';
import type { ProductLine } from '@/api/types/product.types';

export function useProductLines() {
  const productLines = ref<ProductLine[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const productLineService = new ProductLineService();
  
  const fetchProductLines = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await productLineService.getList();
      productLines.value = response.data || [];
    } catch (err: any) {
      error.value = err.message || '获取产品线失败';
      console.error('Failed to fetch product lines:', err);
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

### 4.2 状态管理集成
- API服务应与状态管理库解耦
- 在store actions中调用API服务
- 使用mutations更新状态

```typescript
// productStore.ts
import { defineStore } from 'pinia';
import { ProductLineService } from '@/api/services/product-line.service';
import type { ProductLine } from '@/api/types/product.types';

const productLineService = new ProductLineService();

export const useProductStore = defineStore('product', {
  state: () => ({
    productLines: [] as ProductLine[],
    loading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchProductLines() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await productLineService.getList();
        this.productLines = response.data || [];
      } catch (err: any) {
        this.error = err.message || '获取产品线失败';
        console.error('Failed to fetch product lines:', err);
      } finally {
        this.loading = false;
      }
    }
  }
});
```

## 5. 缓存与性能优化

### 5.1 API响应缓存
- 使用内存缓存存储不常变化的数据
- 实现缓存过期机制
- 提供强制刷新选项

```typescript
// cache.service.ts
export class CacheService {
  private cache = new Map<string, {data: any, timestamp: number}>();
  private DEFAULT_TTL = 5 * 60 * 1000; // 5分钟
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  remove(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### 5.2 API服务中使用缓存
```typescript
export class ProductLineService {
  private baseUrl = '/product-lines';
  private cacheService = new CacheService();
  
  constructor(private http: HttpService) {}
  
  async getList(params?: Record<string, any>, forceRefresh = false): Promise<ApiResponse<ProductLine[]>> {
    const cacheKey = `product-lines-${JSON.stringify(params || {})}`;
    
    if (!forceRefresh) {
      const cached = this.cacheService.get<ApiResponse<ProductLine[]>>(cacheKey);
      if (cached) return cached;
    }
    
    const response = await this.http.get<ProductLine[]>(this.baseUrl, { params });
    this.cacheService.set(cacheKey, response);
    
    return response;
  }
  
  // 其他方法...
}
```

## 6. 测试规范

### 6.1 单元测试
- 为每个API服务编写单元测试
- 使用Mock拦截HTTP请求
- 测试成功和失败场景

```typescript
// product-line.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductLineService } from '@/api/services/product-line.service';
import { HttpService } from '@/api/http.service';

// Mock HttpService
vi.mock('@/api/http.service', () => {
  return {
    HttpService: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }))
  };
});

describe('ProductLineService', () => {
  let productLineService: ProductLineService;
  let httpService: HttpService;
  
  beforeEach(() => {
    httpService = new HttpService('');
    productLineService = new ProductLineService(httpService);
  });
  
  it('should fetch product lines successfully', async () => {
    const mockResponse = {
      success: true,
      data: [{ id: 1, code: 'LP', title_zh: '测试产品线' }]
    };
    
    vi.mocked(httpService.get).mockResolvedValue(mockResponse);
    
    const result = await productLineService.getList();
    
    expect(httpService.get).toHaveBeenCalledWith('/product-lines', { params: undefined });
    expect(result).toEqual(mockResponse);
  });
  
  it('should handle error when fetching product lines', async () => {
    const mockError = {
      type: 'api_error',
      code: 1001,
      message: '获取产品线失败'
    };
    
    vi.mocked(httpService.get).mockRejectedValue(mockError);
    
    await expect(productLineService.getList()).rejects.toEqual(mockError);
  });
});
```

### 6.2 集成测试
- 测试API服务与组件的集成
- 验证数据正确渲染到UI
- 测试加载状态和错误处理

## 7. 文档规范

### 7.1 API服务文档
- 为每个服务类添加JSDoc注释
- 描述服务的用途和依赖关系
- 为每个方法添加参数和返回值注释

```typescript
/**
 * 产品线API服务
 * 提供产品线相关的CRUD操作
 */
export class ProductLineService {
  private baseUrl = '/product-lines';
  
  constructor(private http: HttpService) {}
  
  /**
   * 获取产品线列表
   * @param params - 查询参数，支持page、per_page、search、status等
   * @param forceRefresh - 是否强制刷新缓存
   * @returns 产品线列表响应
   */
  async getList(params?: Record<string, any>, forceRefresh = false): Promise<ApiResponse<ProductLine[]>> {
    // 实现...
  }
  
  /**
   * 根据ID获取产品线详情
   * @param id - 产品线ID
   * @returns 产品线详情响应
   */
  async getById(id: number): Promise<ApiResponse<ProductLine>> {
    // 实现...
  }
}
```

### 7.2 错误码文档
- 记录所有API错误码及其含义
- 提供错误处理建议
- 保持与后端文档同步

## 8. 安全规范

### 8.1 认证与授权
- 所有API请求必须验证用户身份
- 实现令牌自动刷新机制
- 敏感操作需二次确认

### 8.2 数据安全
- 避免在客户端存储敏感数据
- 使用HTTPS进行数据传输
- 实现输入验证和输出过滤

## 9. 国际化规范

### 9.1 API响应国际化
- 使用`lang`参数请求特定语言的内容
- 根据用户设置自动选择语言
- 处理多语言切换时的数据刷新

```typescript
// 在API请求中添加语言参数
async getList(params: Record<string, any> = {}): Promise<ApiResponse<ProductLine[]>> {
  const currentLang = i18n.global.locale.value;
  return this.http.get<ProductLine[]>(this.baseUrl, {
    params: {
      ...params,
      lang: currentLang
    }
  });
}
```

### 9.2 错误消息国际化
- 使用i18n翻译API错误消息
- 为每个错误码提供多语言翻译
- 保持错误消息一致性

## 10. 版本控制与兼容性

### 10.1 API版本管理
- 在请求URL中包含API版本号
- 实现向后兼容的数据转换
- 记录API变更历史

### 10.2 浏览器兼容性
- 支持目标浏览器列表中的所有浏览器
- 使用polyfills处理不兼容特性
- 测试在不同浏览器中的行为一致性 