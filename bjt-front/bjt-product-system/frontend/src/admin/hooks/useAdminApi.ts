import { useState, useEffect, useCallback } from 'react';

export function useAdminApi<T, P extends object = {}>(
  apiCall: (params: P) => Promise<T>,
  initialParams: P,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<P>(initialParams);

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

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData(params);
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