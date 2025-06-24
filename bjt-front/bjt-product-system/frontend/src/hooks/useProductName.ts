import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getSimpleProductName } from '../utils/simpleProductName';
import { UnifiedProduct } from '../types/product.types';

type ProductLike = UnifiedProduct | { [key: string]: any };

/**
 * React hook: return product display name under current language.
 * Always use this instead of directly reading `product.name`.
 */
export function useProductName(product: ProductLike | null | undefined): string {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'zh';

  return useMemo(() => {
    if (!product) return '';
    try {
      return getSimpleProductName(product, lang as 'zh' | 'en');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[useProductName] failed to get name', err, product);
      return product?.name ?? '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, lang]);
} 