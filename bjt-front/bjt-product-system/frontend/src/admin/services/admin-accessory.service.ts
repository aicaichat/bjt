import { BaseService } from './base.service';

// 配件型号接口定义
export interface AccessoryModel {
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

// 配件型号表单数据接口
export interface AccessoryModelFormData {
  model: string;
  product_line_id: number;
  description: {
    zh: string;
    en: string;
  };
  status: string;
}

// 配件料号接口定义
export interface Accessory {
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

// 配件料号表单数据接口
export interface AccessoryFormData {
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

// 配件型号查询参数接口
interface AccessoryModelQueryParams {
  page: number;
  page_size: number;
  search?: string;
  product_line_id?: number;
  status?: string;
}

// 配件料号查询参数接口
interface AccessoryQueryParams {
  page: number;
  page_size: number;
  search?: string;
  model_id?: number;
  product_line_id?: number;
  status?: string;
}

// 配件型号服务类
class AdminAccessoryModelService extends BaseService {
  constructor() {
    super('/accessory-models');
  }

  async getAccessoryModels(params: AccessoryModelQueryParams) {
    return this.get<{
      items: AccessoryModel[];
      total: number;
      page: number;
      page_size: number;
    }>('', params);
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

  async deleteAccessoryModel(id: number) {
    return this.delete(`/${id}`);
  }
}

// 配件料号服务类
class AdminAccessoryService extends BaseService {
  constructor() {
    super('/accessories');
  }

  async getAccessories(params: AccessoryQueryParams) {
    return this.get<{
      items: Accessory[];
      total: number;
      page: number;
      page_size: number;
    }>('', params);
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

  async deleteAccessory(id: number) {
    return this.delete(`/${id}`);
  }
}

export const accessoryModelService = new AdminAccessoryModelService();
export const accessoryService = new AdminAccessoryService(); 