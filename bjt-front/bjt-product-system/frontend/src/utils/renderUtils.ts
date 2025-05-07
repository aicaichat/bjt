import React, { ReactNode } from 'react';

/**
 * 安全渲染工具
 * 用于处理可能的对象渲染问题
 */

/**
 * 安全渲染函数 - 将任何值转换为字符串，防止React渲染对象错误
 * @param value 任何需要渲染的值
 * @param defaultValue 如果值无法安全渲染时的默认值
 * @returns 安全的字符串表示
 */
export const safeRender = (value: any, defaultValue: string = ''): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // 如果是对象，尝试将其转换为JSON字符串
  try {
    if (typeof value === 'object') {
      // 对于React元素，不进行处理
      if (value.$$typeof) {
        return defaultValue; // React元素不应被转换为字符串
      }
      return JSON.stringify(value);
    }
  } catch (error) {
    console.error('Failed to stringify object:', error);
    return defaultValue;
  }

  // 对于函数等其他类型，返回默认值
  return defaultValue;
};

/**
 * 安全渲染产品对象
 * @param product 产品对象
 * @returns 产品名称或默认字符串
 */
export const safeRenderProduct = (product: any): string => {
  if (!product) return '';
  
  if (typeof product === 'string') {
    return product;
  }
  
  // 尝试获取产品名称
  if (product.model) {
    return product.model;
  }
  
  if (product.name) {
    return product.name;
  }
  
  // 如果没有明确的名称，返回SKU或其他标识符
  if (product.sku) {
    return `Product #${product.sku}`;
  }
  
  // 最后尝试将整个对象转换为字符串
  return safeRender(product, 'Unknown Product');
};

interface SafeContentProps {
  children: ReactNode;
}

/**
 * 安全内容组件 - 确保内容安全渲染
 * 包装可能包含对象的React子元素，防止渲染错误
 */
export const SafeContent: React.FC<SafeContentProps> = ({ children }) => {
  try {
    // 遍历并处理每个子元素
    const safeChildren = React.Children.map(children, (child) => {
      // 如果子元素是对象但不是React元素，转换为字符串
      if (child !== null && typeof child === 'object' && !(child as any).$$typeof) {
        try {
          return JSON.stringify(child);
        } catch (e) {
          console.error('Failed to stringify child:', e);
          return 'Invalid Content';
        }
      }
      return child;
    });

    return React.createElement(React.Fragment, null, safeChildren);
  } catch (error) {
    console.error('Error in SafeContent:', error);
    return React.createElement(React.Fragment, null, "Render Error");
  }
};

/**
 * 检查一个对象是否为产品对象
 * @param obj 要检查的对象
 * @returns 布尔值，表示是否为产品对象
 */
export const isProductObject = (obj: any): boolean => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  
  // 检查常见的产品对象属性组合
  return (
    ('model' in obj && 'sku' in obj) || 
    ('types' in obj && 'specs' in obj) ||
    ('name' in obj && 'sku' in obj) ||
    ('quantity' in obj && 'detailInfo' in obj) ||
    ('sections' in obj && 'properties' in obj)
  );
};

/**
 * 安全渲染ID - 确保ID总是字符串
 * @param id 需要渲染的ID值
 * @returns 字符串形式的ID
 */
export const safeRenderID = (id: string | number): string => {
  return String(id);
};

/**
 * 安全渲染规格信息 - 专门处理规格对象
 * @param specs 规格对象
 * @returns 适合显示的规格信息
 */
export const safeRenderSpecs = (specs: any): string => {
  if (!specs) return '';
  
  // 如果是字符串，直接返回
  if (typeof specs === 'string') return specs;
  
  // 如果是对象，尝试格式化为可读的文本
  if (typeof specs === 'object') {
    try {
      const pairs = [];
      for (const key in specs) {
        if (specs[key] !== undefined && specs[key] !== null) {
          pairs.push(`${key}: ${safeRender(specs[key])}`);
        }
      }
      if (pairs.length > 0) {
        return pairs.join(', ');
      }
    } catch (e) {
      console.error('Error formatting specs:', e);
    }
  }
  
  // 默认情况
  return safeRender(specs, 'No specifications');
};

export const safeToLocaleString = (num: number, options?: Intl.NumberFormatOptions): string => {
  try {
    return num.toLocaleString(undefined, options);
  } catch (error) {
    console.error('Error in safeToLocaleString:', error);
    return num.toString();
  }
};

export const safePriceFormat = (price: number, currency: string = '¥'): string => {
  try {
    const options = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
    return `${currency}${safeToLocaleString(price, options)}`;
  } catch (error) {
    console.error('Error in safePriceFormat:', error);
    return `${currency}${price}`;
  }
};

export const safeIdToString = (id: string | number): string => {
  if (id === null || id === undefined) {
    return '';
  }
  return String(id);
}; 