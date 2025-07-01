export type UnitSystem = 'metric' | 'imperial';

/**
 * 获取产品 Model，兼容不同字段位置与单位制。
 * @param product 产品对象（接口/Mock 可能结构不统一）
 * @param unit   单位制，metric / imperial。默认 metric
 */
export function getProductModel(product: any, unit: UnitSystem = 'metric'): string {
  if (!product) return '';
  const directImp  = product.model_imperial;
  const nestedImp  = product.properties?.model_imperial;
  const direct     = product.model;
  const nested     = product.properties?.model;

  return unit === 'imperial'
    ? (directImp  || nestedImp || direct || nested || '')
    : (direct     || nested    || directImp || nestedImp || '');
}

/**
 * 获取产品规格 Spec，同上。
 */
export function getProductSpec(product: any, unit: UnitSystem = 'metric'): string {
  if (!product) return '';
  const directImp  = product.spec_imperial;
  const nestedImp  = product.properties?.spec_imperial;
  const direct     = product.spec;
  const nested     = product.properties?.spec;

  return unit === 'imperial'
    ? (directImp  || nestedImp || direct || nested || '')
    : (direct     || nested    || directImp || nestedImp || '');
} 