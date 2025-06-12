/**
 * 区域工具配置
 * 提供区域相关的工具函数
 */

// 区域匹配规则配置
interface RegionRule {
  pattern: RegExp;
  region: string;
}

// 不同区域的匹配规则
export const REGION_RULES: RegionRule[] = [
  { pattern: /eu\.|\.eu$|europe\.|\.europe$/i, region: 'eu' },
  { pattern: /na\.|\.na$|us\.|\.us$|usa\.|\.usa$/i, region: 'na' },
  { pattern: /au\.|\.au$|australia\.|\.australia$/i, region: 'au' },
  { pattern: /cn\.|\.cn$|china\.|\.china$/i, region: 'cn' }
];

// 默认区域
export const DEFAULT_REGION = 'cn';

/**
 * 从邮箱地址判断用户区域
 * @param email 用户邮箱
 * @returns 区域代码
 */
export const getUserRegionFromEmail = (email: string): string => {
  if (!email) return DEFAULT_REGION;
  
  // 转换为小写以便不区分大小写比较
  const lowerEmail = email.toLowerCase();
  
  // 按规则匹配区域
  for (const rule of REGION_RULES) {
    if (rule.pattern.test(lowerEmail)) {
      return rule.region;
    }
  }
  
  // 若没有匹配项，返回默认区域
  return DEFAULT_REGION;
};

export default {
  getUserRegionFromEmail,
  REGION_RULES,
  DEFAULT_REGION
}; 