import { useState, useEffect, useCallback } from 'react';
import productLineService, { ProductLine, ProductLineListResponse } from '../api/services/product-line.service';

interface UseProductLinesOptions {
  onSuccess?: (data: ProductLine[]) => void;
  onError?: (error: string) => void;
  page?: number;
  per_page?: number;
  status?: string;
}

interface UseProductLinesReturn {
  data: ProductLine[] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * 使用真实API获取产品线数据的Hook
 * 替换原有的mock数据Hook
 */
export const useRealProductLines = (options: UseProductLinesOptions = {}): UseProductLinesReturn => {
  const { onSuccess, onError, page = 1, per_page = 10, status = 'publish' } = options;
  
  const [data, setData] = useState<ProductLine[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductLines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 开始获取产品线数据 (真实API)...');
      
      const response: ProductLineListResponse = await productLineService.getProductLines({
        page,
        per_page,
        status
      });
      
      const productLines = response.items || [];
      
      console.log('✅ 产品线数据获取成功:', {
        count: productLines.length,
        total: response.total,
        page: response.page
      });
      
      setData(productLines);
      
      if (onSuccess) {
        onSuccess(productLines);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取产品线数据失败';
      console.error('❌ 产品线数据获取失败:', err);
      
      setError(errorMessage);
      setData([]);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [page, per_page, status, onSuccess, onError]);

  const retry = useCallback(() => {
    fetchProductLines();
  }, [fetchProductLines]);

  useEffect(() => {
    fetchProductLines();
  }, [fetchProductLines]);

  return {
    data,
    loading,
    error,
    retry
  };
};

// 导出默认实例，保持向后兼容
export const useProductLines = useRealProductLines;

export default useRealProductLines; 