/**
 * 格式化工具函数
 * 用于处理各种数据格式化需求
 */

/**
 * 复合尺寸格式处理 - 只返回纯尺寸，单位显示在标题中  
 * 支持识别和格式化"10*29*49"、"10x29x49"、"10×29×49"等格式
 * @param dimensionStr 原始尺寸字符串
 * @param preserveFormat 是否保持原始分隔符格式
 * @returns 纯尺寸字符串（无单位）
 */
export const formatCompositeDimension = (
  dimensionStr: string | null | undefined, 
  preserveFormat: boolean = true
): string => {
  if (!dimensionStr || typeof dimensionStr !== 'string') {
    return '';
  }

  const trimmed = dimensionStr.trim();
  if (trimmed === '' || trimmed === 'null') {
    return '';
  }

  // 支持的分隔符：*, x, ×, X
  const separatorRegex = /[*x×X]/;
  
  // 检查是否包含分隔符
  if (!separatorRegex.test(trimmed)) {
    // 单一数值，直接返回纯数值
    return trimmed;
  }

  // 识别并保持原始分隔符
  let originalSeparator = '*';
  if (trimmed.includes('×')) {
    originalSeparator = '×';
  } else if (trimmed.includes('x')) {
    originalSeparator = 'x';
  } else if (trimmed.includes('X')) {
    originalSeparator = 'X';
  }

  // 分割并验证数值
  const parts = trimmed.split(separatorRegex).map(part => part.trim());
  
  // 验证所有部分都是有效数字
  const validParts = parts.filter(part => {
    const num = parseFloat(part);
    return !isNaN(num) && isFinite(num);
  });

  if (validParts.length === 0) {
    return '';
  }

  // 重新组合尺寸字符串，只返回纯尺寸，不添加单位
  return preserveFormat 
    ? validParts.join(originalSeparator)
    : validParts.join('×'); // 默认使用×符号
};

/**
 * 获取尺寸维度数量
 * @param dimensionStr 尺寸字符串
 * @returns 维度数量（1D, 2D, 3D等）
 */
export const getDimensionCount = (dimensionStr: string | null | undefined): number => {
  if (!dimensionStr || typeof dimensionStr !== 'string') {
    return 0;
  }

  const separatorRegex = /[*x×X]/;
  const parts = dimensionStr.split(separatorRegex);
  
  return parts.filter(part => {
    const num = parseFloat(part.trim());
    return !isNaN(num) && isFinite(num);
  }).length;
};

/**
 * 处理is_consumable字段的显示
 * @param value is_consumable的数值
 * @param language 语言代码
 * @returns 格式化的显示文本
 */
export const formatConsumableStatus = (
  value: number | undefined | null, 
  language: 'zh' | 'en' = 'zh'
): string => {
  if (value === undefined || value === null) {
    return language === 'zh' ? '未知' : 'Unknown';
  }

  // 🔧 正确映射：0=不展示，1=易损，2=非易损
  switch (value) {
    case 0:
      return language === 'zh' ? '不展示' : 'Hidden';
    case 1:
      return language === 'zh' ? '易损' : 'Consumable';
    case 2:
      return language === 'zh' ? '非易损' : 'Non-consumable';
    // 兼容可能存在的旧数据 (3=隐藏)
    case 3:
      return language === 'zh' ? '隐藏' : 'Hidden';
    default:
      // 对于其他值，显示数值以便调试
      return language === 'zh' ? `未知(${value})` : `Unknown(${value})`;
  }
};

/**
 * 格式化重量显示 - 只返回纯数值，单位显示在标题中
 * @param weight 重量数值
 * @param precision 精度（小数位数）
 * @returns 纯数值字符串（无单位）
 */
export const formatWeight = (
  weight: number | null | undefined,
  precision: number = 2
): string => {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return '';
  }

  return weight.toFixed(precision);  // 只返回纯数值，不添加单位
};

/**
 * 格式化数量显示（支持多语言单位）
 * @param quantity 数量
 * @param language 语言代码
 * @param unit 单位（可选）
 * @returns 格式化的数量字符串
 */
export const formatQuantity = (
  quantity: number | null | undefined,
  language: 'zh' | 'en' = 'zh',
  unit?: string
): string => {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return '';
  }

  const defaultUnit = unit || (language === 'zh' ? '件' : 'pcs');
  return `${quantity} ${defaultUnit}`;
};

/**
 * 安全的字符串渲染
 * 确保渲染的总是字符串，而不是对象
 * @param content 任意内容
 * @returns 安全的字符串
 */
export const safeStringRender = (content: any): string => {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'number' || typeof content === 'boolean') return String(content);
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content);
    } catch {
      return '[Object]';
    }
  }
  return String(content);
};

/**
 * 解析app_model字段（支持字符串和数组）
 * @param appModel app_model字段值
 * @returns 格式化的适配机型字符串
 */
export const formatAppModel = (appModel: string | string[] | null | undefined): string => {
  if (!appModel) {
    return '';
  }

  if (Array.isArray(appModel)) {
    return appModel.join(', ');
  }

  if (typeof appModel === 'string') {
    // 处理可能包含引号的字符串
    return appModel.replace(/"/g, '').split(',').map(m => m.trim()).join(', ');
  }

  return '';
}; 