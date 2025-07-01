import { BaseService } from './base.service';

// 配件型号接口定义 - 完全匹配 wp_bjt_accessory_models 表
export interface AccessoryModel {
  id: number;
  product_line_id: number;
  model: string;
  title_zh: string;
  title_en: string;
  description_zh?: string;
  description_en?: string;
  type?: string;
  image1_url?: string;
  image2_url?: string;
  explosion_diagram_pdf?: string;
  spec_pdf?: string;
  status: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// 配件料号接口定义 - 完全匹配 wp_bjt_accessories 表
export interface Accessory {
  id: number;
  product_line_id: number;
  model?: string;
  brand?: string;
  part_number: string;
  name_zh: string;
  name_en: string;
  spec?: string;
  spec_imperial?: string;
  voltage?: string;
  frequency?: string;
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
  image_url?: string;
  status: string;
  unit: string;
  created_at?: string;
  updated_at?: string;
}

// 配件型号表单数据类型
export interface AccessoryModelFormData {
  product_line_id: number;
  model: string;
  title_zh: string;
  title_en: string;
  description_zh?: string;
  description_en?: string;
  type?: string;
  image1_url?: string;
  image2_url?: string;
  explosion_diagram_pdf?: string;
  spec_pdf?: string;
  status: string;
  sort_order?: number;
}

// 配件料号表单数据类型
export interface AccessoryFormData {
  product_line_id: number;
  model?: string;
  brand?: string;
  part_number: string;
  name_zh: string;
  name_en: string;
  spec?: string;
  spec_imperial?: string;
  voltage?: string;
  frequency?: string;
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
  image_url?: string;
  status: string;
  unit: string;
}

// 配件型号服务
export class AccessoryModelService extends BaseService {
  constructor() {
    super('/accessory-models');
  }

  async getAccessoryModels(params: {
    page?: number;
    per_page?: number;
    lang?: string;
    region?: string;
    product_line_id?: number;
    status?: string;
    search?: string;
  } = {}) {
    return this.get<{ items: AccessoryModel[]; total: number; page: number; page_size: number }>('', params);
  }

  async getAccessoryModel(id: number) {
    return this.get<AccessoryModel>(`/${id}`);
  }

  async createAccessoryModel(data: AccessoryModelFormData) {
    return this.post<AccessoryModel>('', data);
  }

  async updateAccessoryModel(id: number, data: AccessoryModelFormData) {
    return this.put<AccessoryModel>(`/${id}`, data);
  }

  async deleteAccessoryModel(id: number, options: { force?: boolean } = {}) {
    const { force } = options;
    const forceParam = force ? '?force=true' : '';
    return this.delete(`/${id}${forceParam}`);
  }
}

// 配件料号服务
export class AccessoryService extends BaseService {
  constructor() {
    super('/accessories');
  }

  async getAccessories(params: {
    page?: number;
    per_page?: number;
    lang?: string;
    region?: string;
    product_line_id?: number;
    model?: string;
    status?: string;
    search?: string;
  } = {}) {
    return this.get<{ items: Accessory[]; total: number; page: number; page_size: number }>('', params);
  }

  async getAccessory(id: number) {
    return this.get<Accessory>(`/${id}`);
  }

  async createAccessory(data: AccessoryFormData) {
    return this.post<Accessory>('', data);
  }

  async updateAccessory(id: number, data: AccessoryFormData) {
    return this.put<Accessory>(`/${id}`, data);
  }

  async deleteAccessory(id: number, options: { force?: boolean } = {}) {
    const { force } = options;
    const forceParam = force ? '?force=true' : '';
    return this.delete(`/${id}${forceParam}`);
  }
}

// 导出服务实例
export const accessoryModelService = new AccessoryModelService();
export const accessoryService = new AccessoryService(); 