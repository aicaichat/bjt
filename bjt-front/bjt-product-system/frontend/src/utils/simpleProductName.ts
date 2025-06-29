/**
 * 简单产品名称获取工具
 * 避免复杂回退机制，确保多语言切换正常工作
 */

export interface ProductLike {
  name_zh?: string;
  name_en?: string;
  name?: string | { [key: string]: string; };
  model?: string;
  code?: string;
  part_number?: string;
  sku?: string;
  id?: string | number;
  properties?: {
    name_zh?: string;
    name_en?: string;
    name?: string;
    [key: string]: any;
  };
}

/**
 * 检测文本是否主要包含中文字符
 */
function isChineseText(text: string): boolean {
  if (!text) return false;
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * 简单直接的产品名称获取函数
 * 包含智能语言检测和回退机制
 */
export function getSimpleProductName(product: ProductLike, language: 'zh' | 'en' = 'zh'): string {
  if (!product) {
    return language === 'zh' ? '商品' : 'Product';
  }

  const props = product.properties || {};
  
  // 收集所有可能的名称字段
  const productName = typeof product.name === 'string' ? product.name : 
                     (product.name && typeof product.name === 'object' ? 
                      Object.values(product.name)[0] : undefined);
  const propsName = typeof props.name === 'string' ? props.name : 
                   (props.name && typeof props.name === 'object' ? 
                    Object.values(props.name)[0] : undefined);
                    
  // 🔍 扩展候选字段搜索，包括更多可能的中文字段
  const allPossibleFields = [
    product.name_zh,
    product.name_en, 
    props.name_zh,
    props.name_en,
    productName,
    propsName,
    (product as any).product_name_zh,
    (product as any).product_name_en,
    (product as any).title_zh,
    (product as any).title_en,
    (product as any).display_name_zh,
    (product as any).display_name_en,
    product.code,
    product.part_number,
    product.sku
  ];
  
  const candidates = allPossibleFields.filter(Boolean).map(String);

  if (candidates.length === 0) {
    return language === 'zh' ? '商品' : 'Product';
  }

  if (language === 'zh') {
    // 中文模式：优先寻找中文名称
    
    // 1. 优先使用明确的中文字段
    if (product.name_zh || props.name_zh) {
      return product.name_zh || props.name_zh;
    }
    
    // 2. 在候选项中寻找中文文本
    const chineseCandidate = candidates.find(name => isChineseText(name));
    if (chineseCandidate) {
      return chineseCandidate;
    }
    
    // 3. 如果没有有效的名称字段，返回空字符串而不是fallback到model
    return candidates[0] || '';
    
  } else {
    // 英文模式：优先寻找英文名称
    
    // 1. 优先使用明确的英文字段，但需确保不含中文
    if (product.name_en && !isChineseText(String(product.name_en))) {
      return product.name_en;
    }
    if (props.name_en && !isChineseText(String(props.name_en))) {
      return props.name_en;
    }
    
    // 2. 在候选项中寻找非中文文本
    const englishCandidate = candidates.find(name => !isChineseText(name));
    if (englishCandidate) {
      return englishCandidate;
    }
    
    // 3. 如果没有有效的名称字段，返回空字符串而不是fallback到model或code
    return candidates[0] || '';
  }
}

/**
 * 检查是否为有效值
 */
function isValidValue(value: any): boolean {
  return value !== null && 
         value !== undefined && 
         value !== '' && 
         value !== 'N/A' && 
         value !== 'Not Specified' && 
         value !== 'null' && 
         value !== 'undefined';
}

/**
 * 简化版本的字段值获取（只用于产品名称）
 */
export function getSimpleFieldValue(item: ProductLike, fieldKey: string, language: 'zh' | 'en' = 'zh'): string {
  if (!item || !fieldKey) {
    return language === 'zh' ? '暂无数据' : 'Not Available';
  }

  // 如果是名称相关字段，使用简单名称获取逻辑
  if (fieldKey === 'name' || fieldKey === 'name_en' || fieldKey === 'name_zh' || fieldKey === 'productName') {
    return getSimpleProductName(item, language);
  }

  // 其他字段直接返回
  const directValue = (item as any)[fieldKey] || (item.properties && (item.properties as any)[fieldKey]);
  
  if (isValidValue(directValue)) {
    return String(directValue);
  }

  return language === 'zh' ? '暂无数据' : 'Not Available';
} 