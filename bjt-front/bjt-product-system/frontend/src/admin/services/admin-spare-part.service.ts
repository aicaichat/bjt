import { BaseService } from './base.service';

// 备件型号接口定义
export interface SparePartModel {
  id: number;
  model: string;
  product_line_id: number;
  product_line_name?: string;
  description: {
    zh: string;
    en: string;
  };
  status: string;
  created_at?: string;
  updated_at?: string;
}

// 备件型号表单数据接口
export interface SparePartModelFormData {
  model: string;
  product_line_id: number;
  description: {
    zh: string;
    en: string;
  };
  status: string;
}

// 备件料号接口定义
export interface SparePart {
  id: number;
  pn: string;
  name: {
    zh: string;
    en: string;
  };
  model_id: number;
  model_name?: string;
  product_line_id: number;
  product_line_name?: string;
  description: {
    zh: string;
    en: string;
  };
  compatibility: {
    machine_models: string[]; // 兼容的主机型号列表
    part_models: string[];    // 兼容的料号型号列表
  };
  is_critical: boolean;       // 是否为关键备件
  lead_time?: number;         // 采购周期(天)
  status: string;
  logistics: {
    weight: number;
    length: number;
    width: number;
    height: number;
    package_quantity: number;
  };
  specs?: Record<string, any>[];
  created_at?: string;
  updated_at?: string;
}

// 备件料号表单数据接口
export interface SparePartFormData {
  pn: string;
  name: {
    zh: string;
    en: string;
  };
  model_id: number;
  product_line_id: number;
  description: {
    zh: string;
    en: string;
  };
  compatibility: {
    machine_models: string[];
    part_models: string[];
  };
  is_critical: boolean;
  lead_time?: number;
  status: string;
  logistics: {
    weight: number;
    length: number;
    width: number;
    height: number;
    package_quantity: number;
  };
  specs?: Record<string, any>[];
}

// 备件型号查询参数接口
interface SparePartModelQueryParams {
  page: number;
  page_size: number;
  search?: string;
  product_line_id?: number;
  status?: string;
}

// 备件料号查询参数接口
interface SparePartQueryParams {
  page: number;
  page_size: number;
  search?: string;
  model_id?: number;
  product_line_id?: number;
  is_critical?: boolean;
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
    return this.put<SparePart>(`/${id}`, data);
  }

  async deleteSparePart(id: number) {
    return this.delete(`/${id}`);
  }
}

export const sparePartModelService = new AdminSparePartModelService();
export const sparePartService = new AdminSparePartService(); 