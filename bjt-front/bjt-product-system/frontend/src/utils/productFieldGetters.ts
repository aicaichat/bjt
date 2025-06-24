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
  return (
    p.model ||
    (p as any).app_model ||
    p.name ||
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
    'Lockedair'
  ).trim();
  const key = raw.toLowerCase();
  return BRAND_ALIASES[key] ?? raw;
}

/**
 * 根据 PO 逻辑获取产品描述（Item description）
 */
export function getDescription(p: UnifiedProduct): string {
  const descriptions: string[] = [];

  // 1. spec
  if (p.spec && typeof p.spec === 'string' && p.spec.trim()) {
    descriptions.push(p.spec.trim());
  }

  // 2. description 字段
  const desc = (p as any).description;
  if (!descriptions.length && typeof desc === 'string' && desc.trim()) {
    descriptions.push(desc.trim());
  }

  // 3. specs 字段
  if (!descriptions.length && p.specs) {
    if (typeof p.specs === 'string' && p.specs.trim()) {
      descriptions.push(p.specs.trim());
    } else if (typeof p.specs === 'object') {
      const specsText = Object.entries(p.specs)
        .filter(([, v]) => v && v !== 'N/A' && v !== 'Not Specified')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (specsText) descriptions.push(specsText);
    }
  }

  // 4. properties 关键规格
  if (p.properties && typeof p.properties === 'object') {
    const { voltage, frequency } = p.properties;
    const parts = [] as string[];
    if (voltage && voltage !== 'N/A') parts.push(`${voltage}${/V$/i.test(voltage) ? '' : 'V'}`);
    if (frequency && frequency !== 'N/A') parts.push(`${frequency}${/Hz$/i.test(frequency) ? '' : 'Hz'}`);
    if (parts.length) descriptions.push(parts.join(', '));
  }

  // 5. 回退到名称或 Model
  if (!descriptions.length) {
    const nameCandidate = p.name && typeof p.name === 'string' ? p.name : '';
    descriptions.push(nameCandidate || getModel(p));
  }

  return descriptions.join(' | ');
} 