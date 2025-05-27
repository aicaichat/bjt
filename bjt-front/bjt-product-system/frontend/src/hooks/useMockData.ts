import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { IntegratedMockService } from '../services/integrated-mock-service';
import type { 
  MachineListData, 
  AccessoryListData, 
  ConsumableListData, 
  SparePartListData 
} from '../types/api.types';

type DataType = 'machines' | 'accessories' | 'consumables' | 'spareParts' | 'productLines' | 'shapes' | 'materials';

type DataResult<T extends DataType> = 
  T extends 'machines' ? MachineListData :
  T extends 'accessories' ? AccessoryListData :
  T extends 'consumables' ? ConsumableListData :
  T extends 'spareParts' ? SparePartListData :
  T extends 'productLines' ? any[] :
  T extends 'shapes' ? any[] :
  T extends 'materials' ? any[] :
  any;

interface UseMockDataOptions {
  autoLoad?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface PaginatedParams {
  page: number;
  pageSize: number;
  [key: string]: any;
}

/**
 * 通用Mock数据Hook
 * 简化在React组件中使用Mock数据的流程
 */
export const useMockData = <T extends DataType>(
  dataType: T,
  params?: any,
  options: UseMockDataOptions = {}
) => {
  const [data, setData] = useState<DataResult<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockService = IntegratedMockService.getInstance();
  const { autoLoad = true, onSuccess, onError } = options;

  // 使用useRef来保存回调函数，避免依赖变化
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  // 更新ref中的回调函数
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  // 使用useMemo来稳定params的引用，避免无限重新渲染
  const stableParams = useMemo(() => {
    return params ? JSON.stringify(params) : '';
  }, [params]);

  const loadData = useCallback(async (customParams?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const finalParams = customParams || params;
      let result;

      switch (dataType) {
        case 'machines':
          result = await mockService.getMachines(finalParams);
          break;
        case 'accessories':
          result = await mockService.getAccessories(finalParams);
          break;
        case 'consumables':
          result = await mockService.getConsumables(finalParams);
          break;
        case 'spareParts':
          result = await mockService.getSpareParts(finalParams);
          break;
        case 'productLines':
          result = await mockService.getProductLines();
          break;
        case 'shapes':
          result = await mockService.getShapes();
          break;
        case 'materials':
          result = await mockService.getMaterials();
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }
      
      setData(result as DataResult<T>);
      onSuccessRef.current?.(result);
      
      console.log(`✅ ${dataType} 数据加载成功:`, result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
      console.error(`❌ ${dataType} 数据加载失败:`, err);
    } finally {
      setLoading(false);
    }
  }, [dataType, stableParams, mockService]);

  const refresh = useCallback((newParams?: any) => {
    return loadData(newParams);
  }, [loadData]);

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [loadData, autoLoad]);

  return { 
    data, 
    loading, 
    error, 
    refresh, 
    clearData,
    loadData 
  };
};

/**
 * 产品线数据Hook
 */
export const useProductLines = (options?: UseMockDataOptions) => {
  return useMockData('productLines', undefined, options);
};

/**
 * 机器数据Hook
 */
export const useMachines = (
  params?: { category?: number; page?: number; pageSize?: number; search?: string },
  options?: UseMockDataOptions
) => {
  return useMockData('machines', params, options);
};

/**
 * 配件数据Hook
 */
export const useAccessories = (
  params?: { machineId?: string; category?: number; page?: number; pageSize?: number; search?: string },
  options?: UseMockDataOptions
) => {
  return useMockData('accessories', params, options);
};

/**
 * 耗材数据Hook
 */
export const useConsumables = (
  params?: { category?: number; shape?: string; material?: string; page?: number; pageSize?: number; search?: string },
  options?: UseMockDataOptions
) => {
  return useMockData('consumables', params, options);
};

/**
 * 备件数据Hook
 */
export const useSpareParts = (
  params?: { machineModel?: string; isConsumable?: boolean; page?: number; pageSize?: number; search?: string },
  options?: UseMockDataOptions
) => {
  return useMockData('spareParts', params, options);
};

/**
 * 形状数据Hook
 */
export const useShapes = (options?: UseMockDataOptions) => {
  return useMockData('shapes', undefined, options);
};

/**
 * 材料数据Hook
 */
export const useMaterials = (options?: UseMockDataOptions) => {
  return useMockData('materials', undefined, options);
};

/**
 * 带分页的数据Hook
 */
export const usePaginatedData = <T extends 'machines' | 'accessories' | 'consumables' | 'spareParts'>(
  dataType: T,
  initialParams: any = {}
) => {
  const [params, setParams] = useState<PaginatedParams>({
    page: 1,
    pageSize: 10,
    ...initialParams
  });

  const { data, loading, error, refresh } = useMockData(dataType, params);

  const changePage = useCallback((page: number) => {
    setParams((prev: PaginatedParams) => ({ ...prev, page }));
  }, []);

  const changePageSize = useCallback((pageSize: number) => {
    setParams((prev: PaginatedParams) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const updateFilter = useCallback((newFilters: Partial<PaginatedParams>) => {
    setParams((prev: PaginatedParams) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setParams({ page: 1, pageSize: 10, ...initialParams });
  }, [initialParams]);

  return {
    data,
    loading,
    error,
    params,
    changePage,
    changePageSize,
    updateFilter,
    resetFilters,
    refresh
  };
}; 