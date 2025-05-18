import { BaseService } from './base.service';

// 消耗品型号接口定义
export interface ConsumableModel {
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

// 消耗品型号表单数据接口
export interface ConsumableModelFormData {
  model: string;
  product_line_id: number;
  description: {
    zh: string;
    en: string;
  };
  status: string;
}

// 消耗品料号接口定义
export interface Consumable {
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
  usage: {
    zh: string;
    en: string;
  };
  replacement_cycle?: number; // 更换周期(天)
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

// 消耗品料号表单数据接口
export interface ConsumableFormData {
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
  usage: {
    zh: string;
    en: string;
  };
  replacement_cycle?: number;
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

// 消耗品型号查询参数接口
interface ConsumableModelQueryParams {
  page: number;
  page_size: number;
  search?: string;
  product_line_id?: number;
  status?: string;
}

// 消耗品料号查询参数接口
interface ConsumableQueryParams {
  page: number;
  page_size: number;
  search?: string;
  model_id?: number;
  product_line_id?: number;
  status?: string;
}

// 消耗品型号服务类
class AdminConsumableModelService extends BaseService {
  constructor() {
    super('/consumable-models');
  }

  async getConsumableModels(params: ConsumableModelQueryParams) {
    return this.get<{
      items: ConsumableModel[];
      total: number;
      page: number;
      page_size: number;
    }>('', params);
  }

  async getConsumableModel(id: number) {
    return this.get<ConsumableModel>(`/${id}`);
  }

  async createConsumableModel(data: ConsumableModelFormData) {
    return this.post<ConsumableModel>('', data);
  }

  async updateConsumableModel(id: number, data: ConsumableModelFormData) {
    return this.put<ConsumableModel>(`/${id}`, data);
  }

  async deleteConsumableModel(id: number) {
    return this.delete(`/${id}`);
  }
}

// 消耗品料号服务类
class AdminConsumableService extends BaseService {
  constructor() {
    super('/consumables');
  }

  async getConsumables(params: ConsumableQueryParams) {
    return this.get<{
      items: Consumable[];
      total: number;
      page: number;
      page_size: number;
    }>('', params);
  }

  async getConsumable(id: number) {
    return this.get<Consumable>(`/${id}`);
  }

  async createConsumable(data: ConsumableFormData) {
    return this.post<Consumable>('', data);
  }

  async updateConsumable(id: number, data: ConsumableFormData) {
    return this.put<Consumable>(`/${id}`, data);
  }

  async deleteConsumable(id: number) {
    return this.delete(`/${id}`);
  }
}

export const consumableModelService = new AdminConsumableModelService();
export const consumableService = new AdminConsumableService(); 