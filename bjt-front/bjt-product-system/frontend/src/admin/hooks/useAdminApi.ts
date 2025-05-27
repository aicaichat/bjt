import { useState, useEffect, useCallback, useRef } from 'react';

export function useAdminApi<T, P extends object = {}>(
  apiCall: (params: P) => Promise<T>,
  initialParams: P,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<P>(initialParams);
  
  // 使用ref来避免params对象引用变化导致的无限循环
  const prevParamsRef = useRef<string>('');

  const fetchData = useCallback(async (currentParams: P) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(currentParams);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Fetch data when dependencies change - 使用params的JSON字符串进行比较
  useEffect(() => {
    const paramsString = JSON.stringify(params);
    
    // 只有当参数真正改变时才发起请求
    if (paramsString !== prevParamsRef.current) {
      prevParamsRef.current = paramsString;
      fetchData(params);
    }
  }, [fetchData, params, ...deps]);

  // Update params and refetch
  const updateParams = useCallback((newParams: Partial<P>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  // Refetch with current params
  const refetch = useCallback(() => {
    fetchData(params);
  }, [fetchData, params]);

  return { data, loading, error, updateParams, refetch, params };
} 