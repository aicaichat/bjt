/**
 * 产品名称映射工具
 * 用于将英文产品名称映射为中文名称
 */

// 产品名称映射表
export const PRODUCT_NAME_MAPPINGS: { [key: string]: string } = {
  // 配件类产品
  'Panel Flexible Flat Cable': '柔性扁平电缆',
  'Flexible Flat Cable': '柔性扁平电缆',
  'FFC Cable': 'FFC电缆',
  'Connector Cable': '连接线缆',
  'Power Cable': '电源线',
  'Data Cable': '数据线',
  'USB Cable': 'USB线缆',
  'Ethernet Cable': '网线',
  'HDMI Cable': 'HDMI线缆',
  
  // 机器类产品
  'LA E5S test': 'LA E5S 测试机',
  'LA-E4S(paper) Host-US Version': 'LA-E4S(纸质版) 美版主机',
  'LA-E4S Host': 'LA-E4S 主机',
  'LA-E5S Host': 'LA-E5S 主机',
  'Air Cushion Machine': '气垫机',
  'Packaging Machine': '包装机',
  'Sealing Machine': '封口机',
  'Cutting Machine': '切割机',
  
  // 备件类产品
  'Heating Element': '加热元件',
  'Temperature Sensor': '温度传感器',
  'Motor': '电机',
  'Belt': '皮带',
  'Bearing': '轴承',
  'Gear': '齿轮',
  'Spring': '弹簧',
  'Screw': '螺丝',
  'Bolt': '螺栓',
  'Nut': '螺母',
  
  // 耗材类产品
  'Air Cushion Film': '气垫膜',
  'Bubble Film': '气泡膜',
  'PE Film': 'PE薄膜',
  'PP Film': 'PP薄膜',
  'Stretch Film': '拉伸膜',
  'Shrink Film': '收缩膜',
  'Protective Film': '保护膜',
  'Packaging Film': '包装膜',
  
  // 通用术语
  'Test': '测试',
  'Version': '版本',
  'Model': '型号',
  'Type': '类型',
  'Series': '系列',
  'Standard': '标准',
  'Premium': '高级',
  'Professional': '专业',
  'Industrial': '工业',
  'Commercial': '商用',
  'Domestic': '家用'
};

// 部分匹配映射表（用于处理复杂产品名称）
export const PARTIAL_NAME_MAPPINGS: { [key: string]: string } = {
  'cable': '线缆',
  'host': '主机',
  'machine': '机器',
  'device': '设备',
  'equipment': '设备',
  'system': '系统',
  'unit': '单元',
  'module': '模块',
  'component': '组件',
  'part': '部件',
  'element': '元件',
  'sensor': '传感器',
  'motor': '电机',
  'film': '薄膜',
  'paper': '纸质',
  'plastic': '塑料',
  'metal': '金属',
  'steel': '钢',
  'aluminum': '铝',
  'copper': '铜',
  'test': '测试',
  'version': '版本'
};

/**
 * 产品名称映射器
 */
export class ProductNameMapper {
  
  /**
   * 将英文产品名称映射为中文名称
   * @param englishName 英文名称
   * @returns 中文名称
   */
  static mapToChineseName(englishName: string): string {
    if (!englishName || typeof englishName !== 'string') {
      return englishName;
    }
    
    const cleanName = englishName.trim();
    
    // 1. 直接匹配
    if (PRODUCT_NAME_MAPPINGS[cleanName]) {
      return PRODUCT_NAME_MAPPINGS[cleanName];
    }
    
    // 2. 忽略大小写匹配
    const lowerName = cleanName.toLowerCase();
    for (const [key, value] of Object.entries(PRODUCT_NAME_MAPPINGS)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }
    
    // 3. 部分匹配（处理复杂名称）
    let chineseName = cleanName;
    let hasPartialMatch = false;
    
    for (const [englishPart, chinesePart] of Object.entries(PARTIAL_NAME_MAPPINGS)) {
      const regex = new RegExp(`\\b${englishPart}\\b`, 'gi');
      if (regex.test(chineseName)) {
        chineseName = chineseName.replace(regex, chinesePart);
        hasPartialMatch = true;
      }
    }
    
    // 4. 如果有部分匹配，返回处理后的名称
    if (hasPartialMatch) {
      return chineseName;
    }
    
    // 5. 特殊处理：型号类名称（包含LA-、MEX-等前缀）
    if (/^[A-Z]{2,}-[A-Z0-9]+/i.test(cleanName)) {
      // 对于型号类名称，添加适当的中文后缀
      if (cleanName.toLowerCase().includes('host')) {
        return cleanName.replace(/host/gi, '主机');
      }
      if (cleanName.toLowerCase().includes('test')) {
        return cleanName.replace(/test/gi, '测试机');
      }
      if (cleanName.toLowerCase().includes('cable')) {
        return cleanName.replace(/cable/gi, '线缆');
      }
      // 默认添加"设备"后缀
      return `${cleanName} 设备`;
    }
    
    // 6. 无法映射时返回原名称
    return cleanName;
  }
  
  /**
   * 批量映射产品名称
   * @param products 产品列表
   * @param nameField 名称字段名
   * @returns 映射后的产品列表
   */
  static mapProductNames(products: any[], nameField: string = 'name'): any[] {
    return products.map(product => ({
      ...product,
      [`${nameField}_zh`]: this.mapToChineseName(product[nameField])
    }));
  }
  
  /**
   * 添加新的映射关系
   * @param englishName 英文名称
   * @param chineseName 中文名称
   */
  static addMapping(englishName: string, chineseName: string): void {
    PRODUCT_NAME_MAPPINGS[englishName] = chineseName;
  }
  
  /**
   * 批量添加映射关系
   * @param mappings 映射关系对象
   */
  static addMappings(mappings: { [key: string]: string }): void {
    Object.assign(PRODUCT_NAME_MAPPINGS, mappings);
  }
  
  /**
   * 获取所有映射关系
   * @returns 映射关系对象
   */
  static getAllMappings(): { [key: string]: string } {
    return { ...PRODUCT_NAME_MAPPINGS };
  }
  
  /**
   * 检查是否存在映射关系
   * @param englishName 英文名称
   * @returns 是否存在映射
   */
  static hasMapping(englishName: string): boolean {
    return englishName in PRODUCT_NAME_MAPPINGS;
  }
}

export default ProductNameMapper; 