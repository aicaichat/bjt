import { BaseService } from './base.service';

// 严格对应wp_bjt_spare_part_models表的13个字段
export interface SparePartModel {
  id: number;
  product_line_id: number;        // 产品线ID - 必填
  model: string;                  // 备件型号编码 - 必填，同产品线下唯一
  title_zh: string;              // 中文名称 - 必填
  title_en: string;              // 英文名称 - 必填
  description_zh: string;        // 中文描述
  description_en: string;        // 英文描述
  type: string;                  // 备件类型
  image1_url: string;            // 主图URL
  image2_url: string;            // 副图URL
  explosion_diagram_pdf: string; // 爆炸图PDF文件URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
  
  // 关联字段
  product_line_name?: string;    // 产品线名称（查询时填充）
}

// 备件型号表单数据接口
export interface SparePartModelFormData {
  product_line_id: number;
  model: string;
  title_zh: string;
  title_en: string;
  description_zh?: string;
  description_en?: string;
  type: string;
  image1_url?: string;
  image2_url?: string;
  explosion_diagram_pdf?: string;
  status: 'publish' | 'draft' | 'trash';
  sort_order?: number;
}

// 严格对应wp_bjt_spare_parts表的19个字段
export interface SparePart {
  id: number;
  product_line_id: number;        // 产品线ID - 必填
  app_model: string;             // 适配机型
  model: string;                 // 配件型号
  is_consumable: number;         // 是否易损 - 0:不显示备件, 1:易损, 2:非易损
  image_url: string;             // 产品图片
  part_number: string;           // 料号 - 必填，同产品线下唯一
  name_zh: string;               // 中文名称 - 必填
  name_en: string;               // 英文名称 - 必填
  spec: string;                  // 规格参数(公制)
  spec_imperial: string;         // 规格参数(英制)
  app_sn: string;                // 适配序列号
  
  // 包装信息
  package_size_cm: string;       // 包装尺寸(cm)
  package_size_inch: string;     // 包装尺寸(inch)
  net_weight_kg: number;         // 单件净重(kg)
  net_weight_lbs: number;        // 单件净重(lbs)
  gross_weight_kg: number;       // 包装毛重(kg)
  gross_weight_lbs: number;      // 包装毛重(lbs)
  pcs_per_box: number;          // 单箱数量
  
  required_parts: string;        // 必选备件料号，多个用逗号分隔
  required_quantity: string;     // 必选备件数量，多个用逗号分隔，与必选备件料号一一对应
  status: 'publish' | 'draft' | 'trash'; // 状态
  unit: 'pcs' | 'roll' | 'box'; // 单位
  created_at?: string;           // 只读
  updated_at?: string;           // 只读
  
  // 关联字段
  product_line_name?: string;    // 产品线名称（查询时填充）
  model_name?: string;           // 型号名称（查询时填充）
}

// 备件料号表单数据接口
export interface SparePartFormData {
  product_line_id: number;
  app_model?: string;
  model?: string;
  is_consumable: number;         // 是否易损 - 0:不显示备件, 1:易损, 2:非易损
  image_url?: string;
  part_number: string;
  name_zh: string;
  name_en: string;
  spec?: string;
  spec_imperial?: string;
  app_sn?: string;
  package_size_cm?: string;
  package_size_inch?: string;
  net_weight_kg?: number;
  net_weight_lbs?: number;
  gross_weight_kg?: number;
  gross_weight_lbs?: number;
  pcs_per_box?: number;
  required_parts?: string;
  required_quantity?: string;
  status: 'publish' | 'draft' | 'trash';
  unit: 'pcs' | 'roll' | 'box';
}

// 备件型号查询参数接口
interface SparePartModelQueryParams {
  page: number;
  page_size: number;
  search?: string;
  product_line_id?: number;
  type?: string;
  status?: string;
}

// 备件料号查询参数接口
interface SparePartQueryParams {
  page: number;
  page_size: number;
  search?: string;
  model_id?: number;
  product_line_id?: number;
  is_consumable?: number; // 0:不显示备件, 1:易损, 2:非易损
  status?: string;
}

// 备件型号服务类
class AdminSparePartModelService extends BaseService {
  constructor() {
    super('/spare-part-models');
  }

  async getSparePartModels(params: SparePartModelQueryParams) {
    return this.get<{
      items: SparePartModel[];
      total: number;
      page: number;
      page_size: number;
    }>('', params);
  }

  async getSparePartModel(id: number) {
    return this.get<SparePartModel>(`/${id}`);
  }

  async createSparePartModel(data: SparePartModelFormData) {
    return this.post<SparePartModel>('', data);
  }

  async updateSparePartModel(id: number, data: SparePartModelFormData) {
    return this.put<SparePartModel>(`/${id}`, data);
  }

  async deleteSparePartModel(id: number) {
    return this.delete(`/${id}`);
  }
}

// 备件料号服务类
class AdminSparePartService extends BaseService {
  constructor() {
    super('/spare-parts');
  }

  async getSpareParts(params: SparePartQueryParams) {
    return this.get<{
      items: SparePart[];
      total: number;
      page: number;
      page_size: number;
    }>('', params);
  }

  async getSparePart(id: number) {
    return this.get<SparePart>(`/${id}`);
  }

  async createSparePart(data: SparePartFormData) {
    return this.post<SparePart>('', data);
  }

  async updateSparePart(id: number, data: SparePartFormData) {
    console.log('🔍 [AdminSparePartService] updateSparePart调用:', {
      id,
      'data.is_consumable': data.is_consumable,
      'is_consumable类型': typeof data.is_consumable,
      '完整data': data,
      'URL': `${this.baseUrl}/${id}`
    });
    
    const result = this.put<SparePart>(`/${id}`, data);
    
    console.log('🔍 [AdminSparePartService] updateSparePart API调用完成');
    
    return result;
  }

  async deleteSparePart(id: number) {
    return this.delete(`/${id}`);
  }
}

export const sparePartModelService = new AdminSparePartModelService();
export const sparePartService = new AdminSparePartService(); 