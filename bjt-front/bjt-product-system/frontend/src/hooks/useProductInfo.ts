import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import productInfoService, { ProductInfo, ProductBatchResponse } from '../services/productInfoService';

export interface UseProductInfoResult {
  productInfo: ProductInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseBatchProductInfoResult {
  products: ProductInfo[];
  notFoundPartNumbers: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook: 获取单个产品信息
 */
export const useProductInfo = (partNumber: string | null): UseProductInfoResult => {
  const { i18n } = useTranslation();
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductInfo = async () => {
    if (!partNumber) {
      setProductInfo(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
      const info = await productInfoService.getProductInfo(partNumber, lang);
      
      setProductInfo(info);
      
      if (!info) {
        setError(`未找到料号 ${partNumber} 的产品信息`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取产品信息失败');
      setProductInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductInfo();
  }, [partNumber, i18n.language]);

  return {
    productInfo,
    loading,
    error,
    refetch: fetchProductInfo
  };
};

/**
 * Hook: 批量获取产品信息
 */
export const useBatchProductInfo = (partNumbers: string[]): UseBatchProductInfoResult => {
  const { i18n } = useTranslation();
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [notFoundPartNumbers, setNotFoundPartNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchProductInfo = async () => {
    if (!partNumbers || partNumbers.length === 0) {
      setProducts([]);
      setNotFoundPartNumbers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
      const result = await productInfoService.getBatchProductInfo(partNumbers, lang);
      
      setProducts(result.found);
      setNotFoundPartNumbers(result.notFound);
      
      if (result.notFound.length > 0) {
        console.warn('未找到以下料号的产品信息:', result.notFound);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量获取产品信息失败');
      setProducts([]);
      setNotFoundPartNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchProductInfo();
  }, [JSON.stringify(partNumbers), i18n.language]);

  return {
    products,
    notFoundPartNumbers,
    loading,
    error,
    refetch: fetchBatchProductInfo
  };
};

/**
 * Hook: 获取产品显示名称（支持多语言）
 */
export const useProductDisplayName = (partNumber: string | null): string => {
  const { productInfo } = useProductInfo(partNumber);
  const { i18n } = useTranslation();

  if (!productInfo) {
    return partNumber || '未知产品';
  }

  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  return lang === 'zh' ? productInfo.name_zh : productInfo.name_en;
};

/**
 * Hook: 获取产品图片URL（带默认图片）
 */
export const useProductImage = (partNumber: string | null): string => {
  const { productInfo } = useProductInfo(partNumber);

  if (!productInfo) {
    return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22120%22%20height%3D%22120%22%20viewBox%3D%220%200%20120%20120%22%3E%3Cg%20fill%3D%22%23eee%22%3E%3Crect%20width%3D%22120%22%20height%3D%22120%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-size%3D%2216%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20font-family%3D%22monospace%2C%20sans-serif%22%20fill%3D%22%23999%22%3ELoading%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fsvg%3E';
  }

  return productInfo.image_url;
};

export default {
  useProductInfo,
  useBatchProductInfo,
  useProductDisplayName,
  useProductImage
}; 