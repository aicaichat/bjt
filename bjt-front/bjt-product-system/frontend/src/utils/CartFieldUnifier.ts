/**
 * 购物车字段统一系统 - 基于name统一.csv标准
 * 解决所有购物车显示问题：字段缺失、名称错误、中英文混乱等
 */

export interface FieldMapping {
  type: string;
  attribute: string;
  zhName: string;
  enName: string;
  unit?: string;
  example?: string;
}

// 基于name统一.csv的完整字段映射表
export const FIELD_MAPPINGS: FieldMapping[] = [
  // 物品属性 Item Info
  { type: "物品属性", attribute: "产品图片", zhName: "产品图片", enName: "Product Image", unit: "", example: "" },
  { type: "物品属性", attribute: "产品ID", zhName: "产品ID", enName: "Product ID", unit: "", example: "1001" },
  { type: "物品属性", attribute: "单位", zhName: "单位", enName: "Unit", unit: "", example: "pcs" },
  { type: "物品属性", attribute: "强关联物料", zhName: "强关联物料", enName: "Related Parts", unit: "", example: "08A01,14A01" },
  { type: "物品属性", attribute: "是否易损", zhName: "易损", enName: "Consumable Status", unit: "", example: "1" },
  { type: "物品属性", attribute: "型号(公制)", zhName: "型号", enName: "Model", unit: "", example: "MEX-RH30-13-20-13-L" },
  { type: "物品属性", attribute: "型号(英制)", zhName: "型号", enName: "Model", unit: "", example: "MEX-RH30-05-08-5-L" },
  { type: "物品属性", attribute: "品牌", zhName: "品牌", enName: "Brand", unit: "", example: "LockedAir/LockedPaper" },
  { type: "物品属性", attribute: "料号", zhName: "料号", enName: "Part No.", unit: "", example: "90R01258" },
  { type: "物品属性", attribute: "名称(英文)", zhName: "名称", enName: "Item", unit: "", example: "MEX:Air pillow film" },
  { type: "物品属性", attribute: "电压", zhName: "电压", enName: "Voltage", unit: "V", example: "110；220；100~240" },
  { type: "物品属性", attribute: "频率", zhName: "频率", enName: "Frequency", unit: "Hz", example: "50;60;50/60" },
  { type: "物品属性", attribute: "Spec.(公制)", zhName: "规格描述", enName: "Spec.", unit: "", example: "13um 30%HDPE Pillow, 20cmx13cm,1000m,150R/PL" },
  { type: "物品属性", attribute: "Spec.(英制)", zhName: "规格描述", enName: "Spec.", unit: "", example: ".5mil  30%HDPE Pillow, 8\"x5.0\", 3281', 150R/PL" },
  { type: "物品属性", attribute: "适用机型", zhName: "适用机型", enName: "Applicable Machine", unit: "", example: "LA-E4C/LA-E4S" },
  { type: "物品属性", attribute: "适配序列号", zhName: "适配序列号", enName: "Applicable SN.", unit: "", example: "" },
  { type: "物品属性", attribute: "商品单位", zhName: "单位", enName: "Unit", unit: "", example: "" },

  // 额外属性 Other Info
  { type: "额外属性", attribute: "袋型", zhName: "袋型", enName: "Film Type", unit: "", example: "Pillow；Bubble；Tube;Precut Air Pillow;" },
  { type: "额外属性", attribute: "系列", zhName: "袋型编码", enName: "Film Type Code", unit: "", example: "MEX" },
  { type: "额外属性", attribute: "材质", zhName: "材质", enName: "Material", unit: "", example: "HDPE;LDPE;PAPE;PAPER-PE" },
  { type: "额外属性", attribute: "泡径", zhName: "泡径", enName: "Bubble Dia.", unit: "mm", example: "13" },
  { type: "额外属性", attribute: "泡径(英制)", zhName: "泡径", enName: "Bubble Dia.", unit: "inch", example: "5" },
  { type: "额外属性", attribute: "厚度/克重(公制)", zhName: "厚度/克重", enName: "Thickness/Basis Weight", unit: "μm / gsm", example: "13" },
  { type: "额外属性", attribute: "厚度/克重(英制)", zhName: "厚度/克重", enName: "Thickness/Basis Weight", unit: "mil / lb", example: "05" },
  { type: "额外属性", attribute: "宽度(公制)", zhName: "宽度", enName: "Width", unit: "cm", example: "20" },
  { type: "额外属性", attribute: "宽度(英制)", zhName: "宽度", enName: "Width", unit: "inch", example: "08" },
  { type: "额外属性", attribute: "虚线间距(公制)", zhName: "虚线间距", enName: "Perforation", unit: "cm", example: "13" },
  { type: "额外属性", attribute: "虚线间距(英制)", zhName: "虚线间距", enName: "Perforation", unit: "inch", example: "5" },
  { type: "额外属性", attribute: "总长(公制)", zhName: "总长", enName: "Length", unit: "m", example: "1000" },
  { type: "额外属性", attribute: "总长(英制)", zhName: "总长", enName: "Length", unit: "ft", example: "3281" },
  { type: "额外属性", attribute: "筋数", zhName: "筋数", enName: "Reinforcement", unit: "", example: "5" },
  { type: "额外属性", attribute: "层数", zhName: "层数", enName: "Ply", unit: "", example: "1" },
  { type: "额外属性", attribute: "颜色", zhName: "颜色", enName: "Color", unit: "", example: "Black" },
  { type: "额外属性", attribute: "印刷", zhName: "印刷", enName: "Printing", unit: "", example: "YES;NO;Customized" },
  { type: "额外属性", attribute: "纸筒内径(公制)", zhName: "纸筒内径", enName: "Inner Dia.", unit: "cm", example: "5.08" },
  { type: "额外属性", attribute: "纸筒内径(英制)", zhName: "纸筒内径", enName: "Inner Dia.", unit: "inch", example: "2" },
  { type: "额外属性", attribute: "必选品", zhName: "必选品", enName: "Necessaries", unit: "", example: "" },
  { type: "额外属性", attribute: "必选品数量", zhName: "必选品数量", enName: "Qty. of necessaries", unit: "", example: "" },

  // 包装属性 Package Info
  { type: "包装属性", attribute: "包装方式", zhName: "包装方式", enName: "Packaging Method", unit: "", example: "Box;" },
  { type: "包装属性", attribute: "包装图片", zhName: "包装图片", enName: "Packaging Image", unit: "", example: "" },
  { type: "包装属性", attribute: "包装尺寸", zhName: "包装尺寸", enName: "Packaging Dim.", unit: "cm", example: "21*21*42" },
  { type: "包装属性", attribute: "包装尺寸(英制)", zhName: "包装尺寸", enName: "Packaging Dim.", unit: "inch", example: "8.3*8.3*16.5" },
  { type: "包装属性", attribute: "单件净重", zhName: "单件净重", enName: "Net Weight", unit: "kg", example: "4.65" },
  { type: "包装属性", attribute: "单件净重(英制)", zhName: "单件净重", enName: "Net Weight", unit: "lb", example: "10.25" },
  { type: "包装属性", attribute: "包装毛重", zhName: "包装毛重", enName: "Gross Weight", unit: "kg", example: "10.13" },
  { type: "包装属性", attribute: "包装毛重(英制)", zhName: "包装毛重", enName: "Gross Weight", unit: "lb", example: "22.34" },
  { type: "包装属性", attribute: "单箱数量", zhName: "单箱数量", enName: "Qty per Carton", unit: "", example: "2" },

  // 打托属性 Pallet Info
  { type: "打托属性", attribute: "托盘尺寸", zhName: "托盘尺寸", enName: "Pallet Size", unit: "cm", example: "110*110" },
  { type: "打托属性", attribute: "托盘尺寸(英制)", zhName: "托盘尺寸", enName: "Pallet Size", unit: "inch", example: "43.3*43.3" },
  { type: "打托属性", attribute: "一托数量1", zhName: "一托数量", enName: "Packs per Pallet", unit: "", example: "150" },
  { type: "打托属性", attribute: "打托高度1", zhName: "打托高度", enName: "Pallet Height", unit: "cm", example: "141" },
  { type: "打托属性", attribute: "打托高度1(英制)", zhName: "打托高度", enName: "Pallet Height", unit: "inch", example: "55.51" },
  { type: "打托属性", attribute: "整托毛重1", zhName: "整托毛重1", enName: "GW per Pallet", unit: "kg", example: "775.05" },
  { type: "打托属性", attribute: "整托毛重1(英制)", zhName: "整托毛重1", enName: "GW per Pallet", unit: "lb", example: "1708.69" },
  { type: "打托属性", attribute: "一托数量2", zhName: "一托数量", enName: "Packs per Pallet", unit: "", example: "200" },
  { type: "打托属性", attribute: "打托高度2", zhName: "打托高度", enName: "Pallet Height", unit: "cm", example: "185" },
  { type: "打托属性", attribute: "打托高度2(英制)", zhName: "打托高度", enName: "Pallet Height", unit: "inch", example: "72.83" },
  { type: "打托属性", attribute: "整托毛重2", zhName: "整托毛重2", enName: "GW per Pallet", unit: "kg", example: "1028.4" },
  { type: "打托属性", attribute: "整托毛重2(英制)", zhName: "整托毛重2", enName: "GW per Pallet", unit: "lb", example: "2267.23" },
  { type: "打托属性", attribute: "一托数量3", zhName: "一托数量", enName: "Packs per Pallet", unit: "", example: "100" },
  { type: "打托属性", attribute: "打托高度3", zhName: "打托高度", enName: "Pallet Height", unit: "cm", example: "100" },
  { type: "打托属性", attribute: "打托高度3(英制)", zhName: "打托高度", enName: "Pallet Height", unit: "inch", example: "39.37" },
  { type: "打托属性", attribute: "整托毛重3", zhName: "整托毛重3", enName: "GW per Pallet", unit: "kg", example: "521.7" },
  { type: "打托属性", attribute: "整托毛重3(英制)", zhName: "整托毛重3", enName: "GW per Pallet", unit: "lb", example: "1150.15" }
];

// 字段映射索引，用于快速查找
export const FIELD_MAP = new Map<string, FieldMapping>();

// 初始化字段映射索引
FIELD_MAPPINGS.forEach(mapping => {
  // 根据属性名创建多个查找键
  const keys = [
    mapping.attribute.toLowerCase(),
    mapping.zhName.toLowerCase(),
    mapping.enName.toLowerCase(),
    // 常见的字段名变体
    mapping.attribute.replace(/[()]/g, '').toLowerCase(),
    mapping.attribute.replace(/\s+/g, '_').toLowerCase(),
    mapping.zhName.replace(/[()]/g, '').toLowerCase(),
    mapping.enName.replace(/[()]/g, '').toLowerCase(),
  ];
  
  keys.forEach(key => {
    if (key && key.trim()) {
      FIELD_MAP.set(key.trim(), mapping);
    }
  });
});

// 常见字段名映射（处理数据库字段名到标准字段的映射）
export const DB_FIELD_MAPPINGS = new Map([
  // 产品基本信息
  ['product_id', 'Product ID'],
  ['part_number', 'Part No.'],
  ['part_no', 'Part No.'],
  ['code', 'Part No.'],
  ['sku', 'Product ID'],
  ['model', 'Model'],
  ['brand', 'Brand'],
  ['name', 'Item'],
  ['name_zh', 'Item'],
  ['name_en', 'Item'],
  
  // 规格信息
  ['spec', 'Spec.'],
  ['spec_imperial', 'Spec.'],
  ['specification', 'Spec.'],
  ['specs', 'Spec.'],
  
  // 尺寸重量
  ['width', 'Width'],
  ['length', 'Length'],
  ['thickness', 'Thickness/Basis Weight'],
  ['net_weight_kg', 'Net Weight'],
  ['net_weight_lbs', 'Net Weight'],
  ['gross_weight_kg', 'Gross Weight'],
  ['gross_weight_lbs', 'Gross Weight'],
  
  // 包装信息
  ['package_size_cm', 'Packaging Dim.'],
  ['package_size_inch', 'Packaging Dim.'],
  ['pallet_size_cm', 'Pallet Size'],
  ['pallet_size_inch', 'Pallet Size'],
  ['pcs_per_box', 'Qty per Carton'],
  ['pcs_per_pallet', 'Packs per Pallet'],
  
  // 电器参数
  ['voltage', 'Voltage'],
  ['frequency', 'Frequency'],
  
  // 材质信息
  ['material', 'Material'],
  ['color', 'Color'],
  
  // 🔧 修复：添加泡径字段映射（API使用_met/_imp，配置期望_mm/_inch）
  ['bubble_diameter_mm', 'Bubble Dia.'],
  ['bubble_diameter_inch', 'Bubble Dia.'],
  ['bubble_diameter_met', 'Bubble Dia.'],
  ['bubble_diameter_imp', 'Bubble Dia.'],
  
  // 机型适配
  ['app_model', 'Applicable Machine'],
  ['applicable_machine', 'Applicable Machine'],
  ['app_sn', 'Applicable SN.'],
  
  // 单位
  ['unit', 'Unit'],
  
  // 易损标识
  ['is_consumable', 'Consumable Status'],
  ['consumable', 'Consumable Status']
]);

/**
 * 购物车字段统一显示器
 */
export class CartFieldUnifier {
  
  /**
   * 获取字段的标准显示名称（包含单位）
   * @param fieldKey 字段键名
   * @param language 语言 'zh' | 'en'
   * @param unitSystem 单位制 'metric' | 'imperial'
   * @returns 标准化的字段显示名称（包含单位）
   */
  static getFieldLabel(fieldKey: string, language: 'zh' | 'en' = 'zh', unitSystem: 'metric' | 'imperial' = 'metric'): string {
    if (!fieldKey) return '';
    
    // 🔧 智能单位制字段标签处理
    if (fieldKey === 'package_size_cm') {
      const baseName = language === 'zh' ? '包装尺寸' : 'Package Size';
      const unit = unitSystem === 'metric' ? 'cm' : 'inch';
      return `${baseName}(${unit})`;
    }
    
    if (fieldKey === 'net_weight_kg') {
      const baseName = language === 'zh' ? '单件净重' : 'Net Weight';
      const unit = unitSystem === 'metric' ? 'kg' : 'lb';
      return `${baseName}(${unit})`;
    }
    
    if (fieldKey === 'bubble_diameter_mm' || fieldKey === 'bubble_diameter_inch') {
      const baseName = language === 'zh' ? '泡径' : 'Bubble Dia.';
      const unit = unitSystem === 'metric' ? 'mm' : 'inch';
      return `${baseName}(${unit})`;
    }
    
    // 1. 先尝试直接从字段映射查找
    const mapping = FIELD_MAP.get(fieldKey.toLowerCase());
    if (mapping) {
      const baseName = language === 'zh' ? mapping.zhName : mapping.enName;
      // 🔧 修复：如果字段有单位，添加到标签中
      if (mapping.unit && mapping.unit.trim()) {
        return `${baseName}(${mapping.unit})`;
      }
      return baseName;
    }
    
    // 2. 尝试从数据库字段映射查找
    const dbMapping = DB_FIELD_MAPPINGS.get(fieldKey.toLowerCase());
    if (dbMapping) {
      const standardMapping = FIELD_MAP.get(dbMapping.toLowerCase());
      if (standardMapping) {
        const baseName = language === 'zh' ? standardMapping.zhName : standardMapping.enName;
        // 🔧 修复：如果字段有单位，添加到标签中
        if (standardMapping.unit && standardMapping.unit.trim()) {
          return `${baseName}(${standardMapping.unit})`;
        }
        return baseName;
      }
    }
    
    // 3. 处理特殊的单位制相关字段
    const unitBasedKey = this.getUnitBasedFieldKey(fieldKey, unitSystem);
    if (unitBasedKey !== fieldKey) {
      return this.getFieldLabel(unitBasedKey, language, unitSystem);
    }
    
    // 4. 处理一些常见的字段名变体
    const variants = this.generateFieldVariants(fieldKey);
    for (const variant of variants) {
      const variantMapping = FIELD_MAP.get(variant.toLowerCase());
      if (variantMapping) {
        const baseName = language === 'zh' ? variantMapping.zhName : variantMapping.enName;
        // 🔧 修复：如果字段有单位，添加到标签中
        if (variantMapping.unit && variantMapping.unit.trim()) {
          return `${baseName}(${variantMapping.unit})`;
        }
        return baseName;
      }
      
      // 尝试通过数据库映射查找
      const dbMapping = DB_FIELD_MAPPINGS.get(variant.toLowerCase());
      if (dbMapping) {
        const standardMapping = FIELD_MAP.get(dbMapping.toLowerCase());
        if (standardMapping) {
          const baseName = language === 'zh' ? standardMapping.zhName : standardMapping.enName;
          // 🔧 修复：如果字段有单位，添加到标签中
          if (standardMapping.unit && standardMapping.unit.trim()) {
            return `${baseName}(${standardMapping.unit})`;
          }
          return baseName;
        }
      }
    }
    
    // 5. 最后的回退方案：美化字段名
    return this.beautifyFieldName(fieldKey, language);
  }
  
  /**
   * 获取字段值并统一格式
   * @param item 数据项
   * @param fieldKey 字段键名
   * @param language 语言
   * @param unitSystem 单位制
   * @returns 统一格式化后的字段值
   */
  static getFieldValue(item: any, fieldKey: string, language: 'zh' | 'en' = 'zh', unitSystem: 'metric' | 'imperial' = 'metric'): string {
    if (!item || !fieldKey) {
      return language === 'zh' ? '暂无数据' : 'Not Available';
    }
    
    // 🎯 特殊字段智能处理
    // 1. name 字段 - 使用智能中英文切换
    if (fieldKey === 'name' || fieldKey === 'name_en' || fieldKey === 'name_zh') {
      return this.getProductName(item, language);
    }
    
    // 🔧 修复：直接处理 name_zh 和 name_en 字段
    if (fieldKey === 'name_zh') {
      const value = this.extractFieldValue(item, 'name_zh', unitSystem);
      if (this.isValidValue(value)) {
        return String(value);
      }
      // 如果没有中文名，回退到通用名称逻辑
      return this.getProductName(item, 'zh');
    }
    
    if (fieldKey === 'name_en') {
      const value = this.extractFieldValue(item, 'name_en', unitSystem);
      if (this.isValidValue(value)) {
        return String(value);
      }
      // 如果没有英文名，回退到通用名称逻辑
      return this.getProductName(item, 'en');
    }
    
    // 2. spec 字段 - 使用智能公制英制切换
    if (fieldKey === 'spec' || fieldKey === 'specification') {
      return this.getSpecsDisplay(item, language, unitSystem);
    }
    
    // 🔧 新增：model 字段 - 使用智能公制英制切换 (model/model_metric)
    if (fieldKey === 'model') {
      return this.getModelDisplay(item, language, unitSystem);
    }
    
    // 3. 常规字段处理
    const value = this.extractFieldValue(item, fieldKey, unitSystem);
    
    // 4. 如果没有值，返回默认提示
    if (!this.isValidValue(value)) {
      return language === 'zh' ? '暂无数据' : 'Not Available';
    }
    
    // 5. 格式化值
    return this.formatFieldValue(value, fieldKey, language, unitSystem);
  }
  
  /**
   * 获取产品ID（解决BUG-001：ProductID字段缺失）
   */
  static getProductId(item: any): string {
    if (!item) return '';
    
    // 按优先级尝试获取产品ID
    const sources = [
      item.product_id,
      item.id,
      item.code,
      item.sku,
      item.part_number,
      item.properties?.product_id,
      item.properties?.id,
      item.properties?.code,
      item.properties?.sku,
      item.properties?.part_number
    ];
    
    for (const source of sources) {
      if (this.isValidValue(source)) {
        return String(source);
      }
    }
    
    return '';
  }
  
  /**
   * 获取产品名称（只修复耗材名称缺失问题，不影响其他产品类型）
   */
  static getProductName(item: any, language: 'zh' | 'en' = 'zh'): string {
    if (!item) return '';
    
    const props = item.properties || {};
    const productType = item.product_type || item.category || item.type;
    
    // 🔧 只对耗材类型进行特殊处理
    if (productType === 'consumable') {
      // 耗材名称获取逻辑：如果name为空或"Not Found"，使用model字段
      const name = item.name || props.name;
      
      // 检查name是否为空或无效值
      if (!this.isValidValue(name) || name === 'Not Found' || name === 'N/A') {
        // 对于耗材，使用model字段作为名称回退
        const modelSources = [
          item.model,
          props.model,
          item.model_metric,
          props.model_metric,
          item.spec,
          props.spec,
          item.code,
          props.code,
          item.part_number,
          props.part_number
        ];
        
        for (const source of modelSources) {
          if (this.isValidValue(source)) {
            return String(source).trim();
          }
        }
        
        return language === 'zh' ? '耗材' : 'Consumable';
      }
      
      // 如果name有效，直接返回
      return String(name).trim();
    }
    
    // 🔧 对于非耗材产品，保持原有的名称获取逻辑
    if (language === 'zh') {
      const sources = [
        item.name_zh,
        props.name_zh,
        item.name,
        props.name,
        item.product_name,
        props.product_name,
        item.code,
        props.code,
        item.part_number,
        props.part_number,
        item.id
      ];
      
      for (const source of sources) {
        if (this.isValidValue(source)) {
          return String(source).trim();
        }
      }
      
      return '商品';
    } else {
      const sources = [
        item.name_en,
        props.name_en,
        item.name,
        props.name,
        item.product_name,
        props.product_name,
        item.code,
        props.code,
        item.part_number,
        props.part_number,
        item.id
      ];
      
      for (const source of sources) {
        if (this.isValidValue(source)) {
          return String(source).trim();
        }
      }
      
      return 'Product';
    }
  }
  
  /**
   * 获取规格信息（解决BUG-004：规格信息缺失）
   */
  static getSpecsDisplay(item: any, language: 'zh' | 'en' = 'zh', unitSystem: 'metric' | 'imperial' = 'metric'): string {
    if (!item) return '';
    
    const props = item.properties || {};
    const specs = item.specs || {};
    
    // 根据单位制选择规格
    let specValue = '';
    if (unitSystem === 'metric') {
      specValue = props.spec || specs.spec || item.spec || 
                 props.specification || specs.specification || item.specification;
    } else {
      specValue = props.spec_imperial || specs.spec_imperial || item.spec_imperial ||
                 props.spec || specs.spec || item.spec ||
                 props.specification || specs.specification || item.specification;
    }
    
    if (this.isValidValue(specValue)) {
      return String(specValue);
    }
    
    return language === 'zh' ? '暂无规格信息' : 'No specification available';
  }
  
  /**
   * 获取型号信息（支持公英制智能切换）
   * 🔧 新增：解决耗材model/model_metric字段切换问题
   */
  static getModelDisplay(item: any, language: 'zh' | 'en' = 'zh', unitSystem: 'metric' | 'imperial' = 'metric'): string {
    if (!item) return '';
    
    const props = item.properties || {};
    const specs = item.specs || {};
    
    // 根据单位制选择型号字段
    let modelValue = '';
    if (unitSystem === 'metric') {
      // 公制优先：model_metric > model
      modelValue = props.model_metric || specs.model_metric || item.model_metric ||
                  props.model || specs.model || item.model;
    } else {
      // 英制优先：model_imperial > model_metric > model
      modelValue = props.model_imperial || specs.model_imperial || item.model_imperial ||
                  props.model_metric || specs.model_metric || item.model_metric ||
                  props.model || specs.model || item.model;
    }
    
    // 🔧 特殊处理：如果是耗材且没有名称字段，model字段也可以作为名称显示
    if (this.isValidValue(modelValue)) {
      return String(modelValue);
    }
    
    // 🔧 回退：尝试从其他可能的字段获取型号信息
    const fallbackSources = [
      props.part_number || item.part_number,
      props.code || item.code,
      props.sku || item.sku
    ];
    
    for (const source of fallbackSources) {
      if (this.isValidValue(source)) {
        return String(source);
      }
    }
    
    return language === 'zh' ? '暂无型号' : 'No Model';
  }
  
  // ==================== 私有辅助方法 ====================
  
  /**
   * 提取字段值
   */
  private static extractFieldValue(item: any, fieldKey: string, unitSystem: 'metric' | 'imperial'): any {
    const props = item.properties || {};
    const specs = item.specs || {};
    
    // 🔧 智能单位制切换：根据用户偏好自动选择字段
    
    // 1. 包装尺寸字段
    if (fieldKey === 'package_size_cm') {
      if (unitSystem === 'imperial') {
        // 英制用户：优先使用英制字段
        const imperialSources = [
          props.package_size_inch,
          item.package_size_inch
        ];
        for (const source of imperialSources) {
          if (this.isValidValue(source)) return source;
        }
      }
      // 公制用户或没有英制数据时：使用公制字段
      const metricSources = [
        props.package_size_cm,
        item.package_size_cm
      ];
      for (const source of metricSources) {
        if (this.isValidValue(source)) return source;
      }
    }
    
    // 2. 净重字段
    if (fieldKey === 'net_weight_kg') {
      if (unitSystem === 'imperial') {
        // 英制用户：优先使用英制字段
        const imperialSources = [
          props.net_weight_lbs,
          item.net_weight_lbs,
          props.net_weight_lb,
          item.net_weight_lb
        ];
        for (const source of imperialSources) {
          if (this.isValidValue(source)) return source;
        }
      }
      // 公制用户或没有英制数据时：使用公制字段
      const metricSources = [
        props.net_weight_kg,
        item.net_weight_kg
      ];
      for (const source of metricSources) {
        if (this.isValidValue(source)) return source;
      }
    }
    
    // 3. 泡径字段
    if (fieldKey === 'bubble_diameter_mm' || fieldKey === 'bubble_diameter_inch') {
      if (unitSystem === 'metric') {
        // 公制：优先使用 bubble_diameter_mm，回退到 bubble_diameter_met
        const sources = [
          props.bubble_diameter_mm,
          item.bubble_diameter_mm,
          props.bubble_diameter_met,
          item.bubble_diameter_met
        ];
        for (const source of sources) {
          if (this.isValidValue(source)) return source;
        }
      } else {
        // 英制：优先使用 bubble_diameter_inch，回退到 bubble_diameter_imp
        const sources = [
          props.bubble_diameter_inch,
          item.bubble_diameter_inch,
          props.bubble_diameter_imp,
          item.bubble_diameter_imp
        ];
        for (const source of sources) {
          if (this.isValidValue(source)) return source;
        }
      }
    }
    
    // 尝试多个数据源
    const sources = [
      item[fieldKey],
      props[fieldKey],
      specs[fieldKey],
      // 尝试单位制相关的字段
      ...(unitSystem === 'imperial' ? [
        item[fieldKey + '_imperial'],
        props[fieldKey + '_imperial'],
        specs[fieldKey + '_imperial']
      ] : []),
      // 尝试常见的字段名变体
      ...this.generateFieldVariants(fieldKey).map(variant => item[variant] || props[variant] || specs[variant])
    ];
    
    for (const source of sources) {
      if (this.isValidValue(source)) {
        return source;
      }
    }
    
    return null;
  }
  
  /**
   * 检查值是否有效
   */
  private static isValidValue(value: any): boolean {
    return value !== null && 
           value !== undefined && 
           value !== '' && 
           value !== 'N/A' && 
           value !== 'Not Specified' && 
           value !== 'null' && 
           value !== 'undefined';
  }
  
  /**
   * 格式化字段值
   */
  private static formatFieldValue(value: any, fieldKey: string, language: 'zh' | 'en', unitSystem: 'metric' | 'imperial'): string {
    let strValue = String(value);
    
    // 🔧 修复：去除值中的重复单位，因为标签已经包含单位
    
    // 1. 电压字段：去除V单位
    if (fieldKey === 'voltage' || fieldKey.includes('voltage')) {
      strValue = strValue.replace(/V$/i, '').trim();
    }
    
    // 2. 频率字段：去除Hz单位
    if (fieldKey === 'frequency' || fieldKey.includes('frequency')) {
      strValue = strValue.replace(/Hz$/i, '').trim();
    }
    
    // 3. 处理重量单位（解决BUG-007：单位格式错误）
    if (fieldKey.includes('weight') && fieldKey.includes('lbs')) {
      strValue = strValue.replace(/lbs/g, 'lb');
    }
    
    // 4. 处理其他可能的重复单位
    if (fieldKey.includes('package_size') || fieldKey.includes('pallet_size')) {
      // 去除尺寸字段中的单位
      strValue = strValue.replace(/cm$/i, '').replace(/inch$/i, '').trim();
    }
    
    if (fieldKey.includes('net_weight') || fieldKey.includes('gross_weight')) {
      // 去除重量字段中的单位
      strValue = strValue.replace(/kg$/i, '').replace(/lb$/i, '').replace(/lbs$/i, '').trim();
    }
    
    if (fieldKey.includes('bubble_diameter')) {
      // 去除泡径字段中的单位
      strValue = strValue.replace(/mm$/i, '').replace(/inch$/i, '').trim();
    }
    
    return strValue;
  }
  
  /**
   * 生成字段名变体
   */
  private static generateFieldVariants(fieldKey: string): string[] {
    const variants = [fieldKey];
    
    // 下划线和驼峰转换
    variants.push(fieldKey.replace(/_/g, ''));
    variants.push(fieldKey.replace(/([A-Z])/g, '_$1').toLowerCase());
    variants.push(fieldKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()));
    
    // 复数/单数变体
    if (fieldKey.endsWith('s')) {
      variants.push(fieldKey.slice(0, -1));
    } else {
      variants.push(fieldKey + 's');
    }
    
    return variants;
  }
  
  /**
   * 获取基于单位制的字段键
   */
  private static getUnitBasedFieldKey(fieldKey: string, unitSystem: 'metric' | 'imperial'): string {
    if (unitSystem === 'imperial') {
      // 如果是英制，尝试添加 _imperial 后缀
      const imperialKey = fieldKey + '_imperial';
      return imperialKey;
    }
    
    // 如果是公制，移除 _imperial 后缀
    if (fieldKey.endsWith('_imperial')) {
      return fieldKey.replace('_imperial', '');
    }
    
    return fieldKey;
  }
  
  /**
   * 美化字段名（最后的回退方案）
   */
  private static beautifyFieldName(fieldKey: string, language: 'zh' | 'en'): string {
    // 移除下划线，首字母大写
    const beautified = fieldKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return beautified;
  }
}

/**
 * 购物车Excel数据标准化器（解决BUG-005：Excel数据错乱）
 * 🔧 重新设计：基于官方PO模板标准和bug修复要求
 */
export class CartExcelNormalizer {
  
  /**
   * 标准化Excel导出数据 - 基于PO单模版 V1.0.csv标准
   * 🔧 修复：ProductID字段缺失、中英文混乱、字段描述错误等问题
   */
  static normalizeExcelData(cartItems: any[], language: 'zh' | 'en' = 'zh', unitSystem: 'metric' | 'imperial' = 'metric'): any[] {
    console.log('🔧 [Excel Normalizer] 开始标准化Excel数据，语言:', language, '单位制:', unitSystem);
    
    return cartItems.map((item, index) => {
      console.log('🔧 [Excel Normalizer] 处理商品:', item);
      
      const normalized: any = {};
      
      // 🔧 修复：基于PO模板的8个标准列
      
      // 1. Part No. # (商城中的料号属性) - 修复：确保ProductID不缺失
      normalized.PartNumber = this.cleanPartNumber(item);
      
      // 2. Item (商城中的名称属性) - 修复：中英文混乱问题
      normalized.ItemName = this.cleanItemName(item, language);
      
      // 3. Model (商城中的型号属性，耗材是分公英制) - 修复：支持智能单位制切换
      normalized.Model = this.cleanModel(item);
      
      // 4. Item description (商城中的Spec.属性，分公英制) - 修复：支持智能单位制切换
      normalized.ItemDescription = this.cleanDescription(item);
      
      // 5. Brand Name (商城中的品牌属性)
      normalized.BrandName = this.cleanBrandName(item);
      
      // 6. Quantity (pcs)
      normalized.Quantity = item.quantity || 1;
      
      // 7. Unit Price
      normalized.UnitPrice = item.price || item.unit_price || 0;
      
      // 8. Amount
      normalized.Amount = (normalized.UnitPrice * normalized.Quantity) || 0;
      
      // 🔧 新增：根据产品类型添加关键字段（修复字段缺失问题）
      const productType = item.product_type || item.type || 'unknown';
      
      // 耗材特有字段
      if (productType === 'consumable') {
        // 适用机型 - 修复：缺少适用机型字段
        normalized.ApplicableMachine = CartFieldUnifier.getFieldValue(item, 'app_model', language, unitSystem);
        
        // 泡径 - 修复：缺少泡径字段
        const bubbleDiameter = CartFieldUnifier.getFieldValue(item, 'bubble_diameter_mm', language, unitSystem);
        if (bubbleDiameter && bubbleDiameter !== '暂无数据' && bubbleDiameter !== 'Not Available') {
          normalized.BubbleDiameter = bubbleDiameter + (unitSystem === 'metric' ? 'mm' : 'inch');
        }
        
        // 材质
        normalized.Material = CartFieldUnifier.getFieldValue(item, 'material', language, unitSystem);
        
        // 厚度/克重
        normalized.Thickness = CartFieldUnifier.getFieldValue(item, 'thickness_um', language, unitSystem);
      }
      
      // 备件特有字段
      if (productType === 'spare_part' || productType === 'spare') {
        // 适用机型 - 修复：缺少适用机型字段
        normalized.ApplicableMachine = CartFieldUnifier.getFieldValue(item, 'app_model', language, unitSystem);
        
        // 适配序列号
        normalized.ApplicableSN = CartFieldUnifier.getFieldValue(item, 'app_sn', language, unitSystem);
        
        // 单位
        normalized.Unit = CartFieldUnifier.getFieldValue(item, 'unit', language, unitSystem);
      }
      
      // 配件特有字段
      if (productType === 'accessory') {
        // 电压
        const voltage = CartFieldUnifier.getFieldValue(item, 'voltage', language, unitSystem);
        if (voltage && voltage !== '暂无数据' && voltage !== 'Not Available') {
          normalized.Voltage = voltage + 'V';
        }
        
        // 频率
        const frequency = CartFieldUnifier.getFieldValue(item, 'frequency', language, unitSystem);
        if (frequency && frequency !== '暂无数据' && frequency !== 'Not Available') {
          normalized.Frequency = frequency + 'Hz';
        }
      }
      
      // 通用包装信息
      normalized.PackageSize = CartFieldUnifier.getFieldValue(item, 'package_size_cm', language, unitSystem);
      normalized.NetWeight = CartFieldUnifier.getFieldValue(item, 'net_weight_kg', language, unitSystem);
      
      // 🔧 调试日志
      console.log(`🔧 [Excel Normalizer] 产品 ${index + 1}:`, {
        type: productType,
        partNumber: normalized.PartNumber,
        name: normalized.ItemName,
        model: normalized.Model,
        spec: normalized.ItemDescription,
        brand: normalized.BrandName
      });
      
      return normalized;
    });
  }
  
  /**
   * 清理产品编号
   */
  private static cleanPartNumber(item: any): string {
    const partNumber = item.part_number || item.sku || item.code || item.id;
    if (!partNumber) return '-';
    
    // 如果是"unknown-"开头的格式，返回实际的part_number
    if (typeof partNumber === 'string' && partNumber.startsWith('unknown-')) {
      return item.part_number || item.sku || item.code || partNumber;
    }
    
    return String(partNumber);
  }

  /**
   * 清理产品名称
   */
  private static cleanItemName(item: any, language: 'zh' | 'en' = 'en'): string {
    let name = item.name || item.title || item.product_name;
    
    // 处理对象类型的name
    if (typeof name === 'object' && name !== null) {
      if (language === 'zh') {
        name = name['zh-CN'] || name['zh'] || name['chinese'] || JSON.stringify(name);
      } else {
        name = name['en-US'] || name['en'] || name['english'] || JSON.stringify(name);
      }
    }
    
    // 🔧 修复：如果name是unknown格式，尝试使用其他字段
    if (typeof name === 'string' && name.startsWith('unknown-')) {
      // 尝试使用model、code等其他字段
      name = item.model || item.code || item.sku || name;
    }
    
    // 转换为字符串并清理
    const cleanName = String(name || '')
      .replace(/^Not Available\s*/i, '')  // 移除"Not Available"
      .trim();
    
    // 🔧 修复：如果清理后仍是unknown格式，使用备用名称
    if (!cleanName || cleanName.startsWith('unknown-')) {
      return item.model || item.code || item.sku || 'Unknown Product';
    }
    
    return cleanName;
  }

  /**
   * 清理模型
   */
  private static cleanModel(item: any): string {
    const model = item.model || item.part_number || item.sku || '';
    
    // 如果模型是"unknown-"格式，尝试从properties中获取
    if (String(model).startsWith('unknown-')) {
      const propsModel = item.properties?.model;
      if (propsModel && !String(propsModel).startsWith('unknown-')) {
        return String(propsModel);
      }
    }
    
    const cleanModel = String(model)
      .replace(/^unknown-\d+$/, 'N/A')
      .trim();
    
    return cleanModel || 'N/A';
  }

  /**
   * 清理描述 - 修复规格信息显示问题
   */
  private static cleanDescription(item: any): string {
    // 优先使用spec字段（单数），然后是specs字段（复数）
    let description = item.spec || item.specs || item.spec_imperial || item.description || item.properties?.description || '';
    
    console.log('🔧 [CartExcelNormalizer] 清理描述信息:', {
      itemCode: item.code || item.sku,
      spec: item.spec,
      specs: item.specs,
      spec_imperial: item.spec_imperial,
      finalDescription: description
    });
    
    // 确保是字符串
    if (typeof description === 'object') {
      description = JSON.stringify(description);
    }
    
    description = String(description);
    
    // 清理格式化的描述文本
    if (description.includes('partNumber:') && description.includes('productName:')) {
      // 提取productName部分
      const productNameMatch = description.match(/productName:\s*([^|,]+)/);
      if (productNameMatch) {
        let cleanName = productNameMatch[1].trim();
        // 移除电压、频率等技术规格
        cleanName = cleanName.replace(/\s*\|\s*\d+V.*$/, '').trim();
        return cleanName || '-';
      }
    }
    
    // 通用清理
    const cleaned = description
      .replace(/partNumber:\s*\d+,?\s*/gi, '')
      .replace(/productName:\s*/gi, '')
      .replace(/\|\s*\d+V[^,|]*,?\s*/g, '')
      .replace(/,?\s*\d+Hz[^,|]*,?\s*/g, '')
      .replace(/,?\s*50Hz[^,|]*,?\s*/g, '')
      .replace(/,?\s*110V[^,|]*,?\s*/g, '')
      .replace(/,?\s*220V[^,|]*,?\s*/g, '')
      .trim();
    
    return cleaned || '-';
  }

  /**
   * 清理品牌名称
   */
  private static cleanBrandName(item: any): string {
    const brand = item.brand || item.brand_name || item.properties?.brand || '';
    
    const cleanBrand = String(brand)
      .replace(/^Not Available\s*/i, '')
      .replace(/^N\/A\s*/i, '')
      .trim();
    
    return cleanBrand || 'Lockedair';
  }

  /**
   * 🔧 新增：获取Excel列标题（支持中英文）
   * 修复：字段描述与前台不符、中英文混乱问题
   */
  static getExcelHeaders(language: 'zh' | 'en' = 'zh'): Record<string, string> {
    if (language === 'en') {
      return {
        PartNumber: 'Part No. #',
        ItemName: 'Item',
        Model: 'Model',
        ItemDescription: 'Item Description',
        BrandName: 'Brand Name',
        Quantity: 'Quantity (pcs)',
        UnitPrice: 'Unit Price',
        Amount: 'Amount',
        // 扩展字段
        ApplicableMachine: 'Applicable Machine',
        BubbleDiameter: 'Bubble Dia.',
        Material: 'Material',
        Thickness: 'Thickness/Basis Weight',
        ApplicableSN: 'Applicable SN.',
        Unit: 'Unit',
        Voltage: 'Voltage',
        Frequency: 'Frequency',
        PackageSize: 'Package Size',
        NetWeight: 'Net Weight'
      };
    } else {
      return {
        PartNumber: '料号',
        ItemName: '名称',
        Model: '型号',
        ItemDescription: '规格描述',
        BrandName: '品牌',
        Quantity: '数量(pcs)',
        UnitPrice: '单价',
        Amount: '金额',
        // 扩展字段
        ApplicableMachine: '适用机型',
        BubbleDiameter: '泡径',
        Material: '材质',
        Thickness: '厚度/克重',
        ApplicableSN: '适配序列号',
        Unit: '单位',
        Voltage: '电压',
        Frequency: '频率',
        PackageSize: '包装尺寸',
        NetWeight: '单件净重'
      };
    }
  }
}

// 导出默认实例
export default CartFieldUnifier; 