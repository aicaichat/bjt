# 前端服务层示例代码

## 一、API 服务基础设置

```typescript
// src/services/api/config.ts
export const API_BASE_URL = '/wp-json/bjt/v1';

export interface ApiResponse<T> {
    data: T;
    total?: number;
    page?: number;
    per_page?: number;
}

export interface ApiError {
    code: string;
    message: string;
    status: number;
}

// 统一的请求客户端
export const apiClient = {
    async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_BASE_URL}${url}?${new URLSearchParams(params)}`);
            if (!response.ok) {
                throw await response.json();
            }
            return response.json();
        } catch (error) {
            throw this.handleError(error);
        }
    },

    async post<T>(url: string, data: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw await response.json();
            }
            return response.json();
        } catch (error) {
            throw this.handleError(error);
        }
    },

    handleError(error: any): ApiError {
        return {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || '未知错误',
            status: error.status || 500,
        };
    },
};
```

## 二、产品线管理服务

```typescript
// src/services/api/productLines.ts
import { apiClient, ApiResponse } from './config';

export interface ProductLine {
    id: number;
    code: string;
    name_zh: string;
    name_en: string;
    description_zh?: string;
    description_en?: string;
    image_url?: string;
    status: number;
    sort_order: number;
}

export interface ProductLineParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: number;
    orderby?: string;
    order?: 'ASC' | 'DESC';
}

export const productLineService = {
    async getProductLines(params?: ProductLineParams): Promise<ApiResponse<ProductLine[]>> {
        return apiClient.get<ProductLine[]>('/product-lines', params);
    },

    async getProductLine(id: number): Promise<ApiResponse<ProductLine>> {
        return apiClient.get<ProductLine>(`/product-lines/${id}`);
    },

    async createProductLine(data: Omit<ProductLine, 'id'>): Promise<ApiResponse<ProductLine>> {
        return apiClient.post<ProductLine>('/product-lines', data);
    },

    async updateProductLine(id: number, data: Partial<ProductLine>): Promise<ApiResponse<ProductLine>> {
        return apiClient.post<ProductLine>(`/product-lines/${id}`, data);
    },

    async deleteProductLine(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
        return apiClient.post<{ deleted: boolean }>(`/product-lines/${id}`, { 
            method: 'DELETE' 
        });
    },
};
```

## 三、React Hook 封装

```typescript
// src/hooks/useProductLines.ts
import { useState, useEffect } from 'react';
import { ProductLine, ProductLineParams, productLineService } from '../services/api/productLines';

export function useProductLines(params?: ProductLineParams) {
    const [data, setData] = useState<ProductLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await productLineService.getProductLines(params);
                setData(response.data);
                setTotal(response.total || 0);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params]);

    return { data, loading, error, total };
}
```

## 四、组件中的使用示例

```typescript
// src/pages/ProductLines/ProductLineList.tsx
import React from 'react';
import { Table, Button, message } from 'antd';
import { useProductLines } from '../../hooks/useProductLines';
import { productLineService } from '../../services/api/productLines';

export const ProductLineList: React.FC = () => {
    const [params, setParams] = useState({
        page: 1,
        per_page: 10,
    });

    const { data, loading, error, total } = useProductLines(params);

    const handleDelete = async (id: number) => {
        try {
            await productLineService.deleteProductLine(id);
            message.success('删除成功');
            // 刷新列表
            setParams({ ...params });
        } catch (err) {
            message.error(err.message);
        }
    };

    const columns = [
        {
            title: '编号',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: '中文名称',
            dataIndex: 'name_zh',
            key: 'name_zh',
        },
        {
            title: '英文名称',
            dataIndex: 'name_en',
            key: 'name_en',
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record: ProductLine) => (
                <Button onClick={() => handleDelete(record.id)}>
                    删除
                </Button>
            ),
        },
    ];

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={{
                total,
                current: params.page,
                pageSize: params.per_page,
                onChange: (page) => setParams({ ...params, page }),
            }}
        />
    );
};
```

## 五、类型定义示例

```typescript
// src/types/api.ts
export interface PaginationParams {
    page?: number;
    per_page?: number;
    orderby?: string;
    order?: 'ASC' | 'DESC';
}

export interface BaseModel {
    id: number;
    created_at?: string;
    updated_at?: string;
}

export interface MultiLanguageModel {
    name_zh: string;
    name_en: string;
    description_zh?: string;
    description_en?: string;
}

// src/types/productLine.ts
export interface ProductLine extends BaseModel, MultiLanguageModel {
    code: string;
    image_url?: string;
    status: number;
    sort_order: number;
}

// src/types/host.ts
export interface Host extends BaseModel, MultiLanguageModel {
    product_line_id: number;
    model_code: string;
    image_url?: string;
    status: number;
    sort_order: number;
}
```

## 六、状态管理示例

```typescript
// src/contexts/ProductLineContext.tsx
import React, { createContext, useContext, useReducer } from 'react';
import { ProductLine } from '../types/productLine';

interface State {
    items: ProductLine[];
    loading: boolean;
    error: string | null;
}

interface Action {
    type: 'FETCH_START' | 'FETCH_SUCCESS' | 'FETCH_ERROR';
    payload?: any;
}

const initialState: State = {
    items: [],
    loading: false,
    error: null,
};

const ProductLineContext = createContext<{
    state: State;
    dispatch: React.Dispatch<Action>;
}>({
    state: initialState,
    dispatch: () => null,
});

export const ProductLineProvider: React.FC = ({ children }) => {
    const [state, dispatch] = useReducer((state: State, action: Action) => {
        switch (action.type) {
            case 'FETCH_START':
                return { ...state, loading: true };
            case 'FETCH_SUCCESS':
                return {
                    ...state,
                    loading: false,
                    items: action.payload,
                    error: null,
                };
            case 'FETCH_ERROR':
                return {
                    ...state,
                    loading: false,
                    error: action.payload,
                };
            default:
                return state;
        }
    }, initialState);

    return (
        <ProductLineContext.Provider value={{ state, dispatch }}>
            {children}
        </ProductLineContext.Provider>
    );
};

export const useProductLineContext = () => useContext(ProductLineContext);
```

## 七、工具函数示例

```typescript
// src/utils/api.ts
export function formatApiError(error: any): string {
    if (typeof error === 'string') {
        return error;
    }
    if (error.message) {
        return error.message;
    }
    return '未知错误';
}

export function buildQueryString(params: Record<string, any>): string {
    return Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

// src/utils/validation.ts
export function validateProductLine(data: Partial<ProductLine>): string[] {
    const errors: string[] = [];
    
    if (!data.code) {
        errors.push('编号不能为空');
    } else if (!/^[A-Za-z0-9-]+$/.test(data.code)) {
        errors.push('编号只能包含字母、数字和连字符');
    }

    if (!data.name_zh) {
        errors.push('中文名称不能为空');
    }

    if (!data.name_en) {
        errors.push('英文名称不能为空');
    }

    return errors;
}
```

## 八、测试示例

```typescript
// src/services/api/__tests__/productLines.test.ts
import { productLineService } from '../productLines';
import { apiClient } from '../config';

jest.mock('../config');

describe('productLineService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch product lines', async () => {
        const mockData = {
            data: [
                {
                    id: 1,
                    code: 'PL-001',
                    name_zh: '测试产品线',
                    name_en: 'Test Product Line',
                },
            ],
            total: 1,
        };

        (apiClient.get as jest.Mock).mockResolvedValue(mockData);

        const result = await productLineService.getProductLines();
        expect(result).toEqual(mockData);
        expect(apiClient.get).toHaveBeenCalledWith('/product-lines', undefined);
    });

    it('should handle errors', async () => {
        const mockError = {
            code: 'ERROR',
            message: '测试错误',
            status: 400,
        };

        (apiClient.get as jest.Mock).mockRejectedValue(mockError);

        await expect(productLineService.getProductLines()).rejects.toEqual(mockError);
    });
});
```

## 更新记录
| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2024-03-22 | 创建文档 | - |
``` 