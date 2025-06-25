// 新建文件实现产品字段提取工具
import { UnifiedProduct } from '../types/product.types';

/**
 * 统一品牌拼写映射，可按需扩充
 */
const BRAND_ALIASES: Record<string, string> = {
  lockedair: 'Lockedair',
  lockdeair: 'Lockedair'
};

/** 判断字符串是否包含中文 */
function isChineseText(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str);
}

/** 获取产品 Model 字段 */
export function getModel(p: UnifiedProduct): string {
  // 🔧 修复：优先级排序，更准确地获取型号信息
  return (
    p.model ||
    (p as any).app_model ||
    (p as any).item_model ||
    (p as any).product_model ||
    (p as any).model_number ||
    // 如果没有专门的model字段，检查part_number是否包含型号信息
    ((p as any).part_number && !(p as any).part_number.match(/^\d+[A-Z]\d+$/) ? (p as any).part_number : '') ||
         // 最后才使用名称作为备用
     (p.name && typeof p.name === 'string' && p.name.length < 50 ? p.name : '') ||
    (p as any).item_name ||
    'N/A'
  );
}

/** 获取标准化品牌 */
export function getBrand(p: UnifiedProduct): string {
  const raw = (
    p.brand ||
    (p as any).brand_name ||
    (p as any).manufacturer ||
    (p as any).supplier ||
    'Lockedair'  // 默认品牌
  ).trim();
  const key = raw.toLowerCase();
  return BRAND_ALIASES[key] ?? raw;
}

/**
 * 根据 PO 逻辑获取产品描述（Item description）
 */
export function getDescription(p: UnifiedProduct): string {
  const descriptions: string[] = [];

  // 1. 优先使用 spec 字段
  if (p.spec && typeof p.spec === 'string' && p.spec.trim()) {
    descriptions.push(p.spec.trim());
  }

  // 2. description 字段
  const desc = (p as any).description;
  if (!descriptions.length && typeof desc === 'string' && desc.trim()) {
    descriptions.push(desc.trim());
  }

  // 3. specs 字段（可能是对象）
  if (!descriptions.length && p.specs) {
    if (typeof p.specs === 'string' && p.specs.trim()) {
      descriptions.push(p.specs.trim());
    } else if (typeof p.specs === 'object') {
      const specsText = Object.entries(p.specs)
        .filter(([, v]) => v && v !== 'N/A' && v !== 'Not Specified' && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (specsText) descriptions.push(specsText);
    }
  }

  // 4. properties 中的关键规格（电压、频率等）
  if (!descriptions.length && p.properties && typeof p.properties === 'object') {
    const { voltage, frequency, power, capacity } = p.properties;
    const parts = [] as string[];
    if (voltage && voltage !== 'N/A') parts.push(`${voltage}${/V$/i.test(voltage.toString()) ? '' : 'V'}`);
    if (frequency && frequency !== 'N/A') parts.push(`${frequency}${/Hz$/i.test(frequency.toString()) ? '' : 'Hz'}`);
    if (power && power !== 'N/A') parts.push(`${power}${/W$/i.test(power.toString()) ? '' : 'W'}`);
    if (capacity && capacity !== 'N/A') parts.push(`${capacity}`);
    if (parts.length) descriptions.push(parts.join(', '));
  }

  // 5. 从其他字段提取描述信息
  if (!descriptions.length) {
    const candidates = [
      (p as any).item_description,
      (p as any).product_description,
      (p as any).details,
      (p as any).features
    ];
    
    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        descriptions.push(candidate.trim());
        break;
      }
    }
  }

  // 6. 如果仍然没有描述，使用名称信息（但不要重复型号）
  if (!descriptions.length) {
    const modelValue = getModel(p);
    const nameCandidate = p.name && typeof p.name === 'string' ? p.name : '';
    
    // 如果名称不等于型号，则使用名称
    if (nameCandidate && nameCandidate !== modelValue) {
      descriptions.push(nameCandidate);
    } else if (modelValue !== 'N/A') {
      descriptions.push(modelValue);
    } else {
      descriptions.push('Product specification to be confirmed');
    }
  }

  return descriptions.join(' | ');
} 