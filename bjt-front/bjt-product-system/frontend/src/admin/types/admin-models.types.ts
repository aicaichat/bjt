// 移除嵌套的多语言文本接口，不再需要
// export interface AdminMultilingualText {
//   zh: string;
//   en: string;
// }

// 修改为直接使用数据库字段名称的接口
export interface AdminSubItem {
  id?: string; // 可选，当创建新项时
  key?: string; // React列表渲染用，不是后端模型的一部分
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
}

export interface AdminProductLine {
  id?: string; // 可选，当创建新产品线时
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  // 子项改为直接嵌套在产品线中的结构
  subitem1_zh?: string;
  subitem1_en?: string;
  subitem2_zh?: string;
  subitem2_en?: string;
  subitem3_zh?: string;
  subitem3_en?: string;
  image_url?: string; // 产品线主图URL
  code?: string;
  status?: 'publish' | 'draft' | 'trash';
  created_at?: string;
  updated_at?: string;
  sort_order?: number;
  // 为兼容现有UI，保留subItems字段，但标记为只读，不会发送到API
  readonly subItems?: AdminSubItem[];
}

// Add other admin-specific models here as needed, e.g.:
// export interface AdminHostModel { ... }
// export interface AdminPart { ... }
// export interface AdminUser { ... }

export type AdminModelStatus = 'active' | 'inactive'; // Or specific strings like '已上架' | '已下架'

export interface AdminHostModel {
  id: string;
  product_line_id: string;
  model: string; // 主机型号编码
  code: string; // 主机型号编码 (API返回字段)
  title_zh: string; // 中文名称
  title_en: string; // 英文名称
  description_zh?: string; // 中文描述
  description_en?: string; // 英文描述
  type?: string; // 主机类型
  image1_url?: string; // 主图URL
  image2_url?: string; // 副图URL
  explosion_diagram_pdf?: string; // 爆炸图PDF文件URL
  status: string; // 'publish' | 'draft' | 'trash'
  sort_order?: number; // 排序值
  created_at?: string;
  updated_at?: string;
}

export interface AdminPart {
  id: string;
  product_line_id?: number;
  host_model_id?: string; // 主机型号ID，API字段名
  model?: string; // 主机型号，API字段名
  voltage?: string;
  image_url?: string;
  part_number: string; // 料号，API字段名
  name_zh?: string; // 中文名称
  name_en?: string; // 英文名称
  brand?: string;
  spec?: string; // 规格参数(公制)
  spec_imperial?: string; // 规格参数(英制)
  package_size_cm?: string;
  package_size_inch?: string;
  net_weight_kg?: number;
  net_weight_lbs?: number;
  gross_weight_kg?: number;
  gross_weight_lbs?: number;
  pcs_per_box?: number;
  pallet_size_cm?: string;
  pallet_size_inch?: string;
  pcs_per_pallet?: number;
  pallet_height_cm?: number;
  pallet_height_inch?: number;
  pallet_gross_weight_kg?: number;
  pallet_gross_weight_lbs?: number;
  status: string; // 'publish' | 'draft' | 'trash'
  unit?: string; // 'pcs' | 'roll' | 'box'
  pricing?: any[];
  inventory?: any;
  created_at?: string;
  updated_at?: string;
  
  // 向后兼容字段（已弃用，用于向后兼容）
  hostModelId?: string;
  hostModelName?: string;
  partNumber?: string;
} 