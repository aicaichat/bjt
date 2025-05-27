import { BaseService } from './base.service';

// 字典数据接口定义 - 基于实际API响应
export interface ShapeData {
  id: number;
  product_line_id: number;
  code: string;
  name_zh: string;
  name_en: string;
  name?: string; // API返回的name字段
  image_url?: string;
  image_url2?: string;
  status?: string;
  sort_order: number;
}

export interface MaterialData {
  id: number;
  product_line_id: number;
  code: string;
  name_zh: string;
  name_en: string;
  name?: string; // API返回的name字段
  base_material?: string;
  status?: string;
  sort_order: number;
}

export interface SpecificationData {
  id: number;
  product_line_id: number;
  code: string; // API返回的是code而不是spec_type
  name?: string; // API返回的name字段
  spec_type?: string; // 为了向后兼容保留
  name_zh?: string; // 为了向后兼容保留
  name_en?: string; // 为了向后兼容保留
  metric_value: number;
  metric_unit: string;
  imperial_value: number;
  imperial_unit: string;
  status?: string;
  sort_order: number;
}

// API响应类型 - 基于实际API响应格式
interface DictionaryResponse<T> {
  success?: boolean;
  message?: string;
  type: string;
  items: T[];
}

// 包装响应类型（用于统一处理）
interface WrappedDictionaryResponse<T> {
  success: boolean;
  message?: string;
  data: {
    type: string;
    items: T[];
  };
}

// 工具函数：解码Unicode转义序列
const decodeUnicodeString = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  try {
    // 处理Unicode转义序列，如 \u6c14\u6ce1\u6795 -> 气泡枕
    return str.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
      return String.fromCharCode(parseInt(match.replace('\\u', ''), 16));
    });
  } catch (error) {
    console.warn('Unicode解码失败:', str, error);
    return str;
  }
};

// 处理数据项的字符串字段
const processDataItem = <T extends Record<string, any>>(item: T): T => {
  const processed = { ...item } as any;
  
  // 处理所有字符串字段
  Object.keys(processed).forEach(key => {
    if (typeof processed[key] === 'string') {
      processed[key] = decodeUnicodeString(processed[key]);
    }
  });
  
  return processed as T;
};

// 形状字典服务
class AdminShapeService extends BaseService {
  constructor() {
    super('/dictionaries/shapes');
  }

  async getShapes(params: { lang?: string } = {}): Promise<WrappedDictionaryResponse<ShapeData>> {
    try {
      const response = await this.get<DictionaryResponse<ShapeData>>('', params);
      console.log('原始形状API响应:', response);
      
      // 确保响应结构正确
      if (!response.items) {
        return {
          success: true,
          data: {
            type: 'shapes',
            items: []
          }
        };
      }

      // 处理数据项中的Unicode转义序列
      const processedItems = response.items.map((item: any) => processDataItem(item));
      console.log('处理后的形状数据:', processedItems);
      
      return {
        success: true,
        data: {
          type: response.type || 'shapes',
          items: processedItems
        }
      };
    } catch (error) {
      console.error('形状API调用失败:', error);
      throw error;
    }
  }

  async createShape(data: Partial<ShapeData>): Promise<{ success: boolean; data: ShapeData }> {
    return this.post<{ success: boolean; data: ShapeData }>('', data);
  }

  async updateShape(id: number, data: Partial<ShapeData>): Promise<{ success: boolean; data: ShapeData }> {
    return this.put<{ success: boolean; data: ShapeData }>(`/${id}`, data);
  }

  async deleteShape(id: number): Promise<{ success: boolean }> {
    return this.delete(`/${id}`);
  }
}

// 材料字典服务
class AdminMaterialService extends BaseService {
  constructor() {
    super('/dictionaries/materials');
  }

  async getMaterials(params: { lang?: string } = {}): Promise<WrappedDictionaryResponse<MaterialData>> {
    try {
      const response = await this.get<DictionaryResponse<MaterialData>>('', params);
      console.log('原始材料API响应:', response);
      
      // 确保响应结构正确
      if (!response.items) {
        return {
          success: true,
          data: {
            type: 'materials',
            items: []
          }
        };
      }

      // 处理数据项中的Unicode转义序列
      const processedItems = response.items.map((item: any) => processDataItem(item));
      console.log('处理后的材料数据:', processedItems);
      
      return {
        success: true,
        data: {
          type: response.type || 'materials',
          items: processedItems
        }
      };
    } catch (error) {
      console.error('材料API调用失败:', error);
      throw error;
    }
  }

  async createMaterial(data: Partial<MaterialData>): Promise<{ success: boolean; data: MaterialData }> {
    return this.post<{ success: boolean; data: MaterialData }>('', data);
  }

  async updateMaterial(id: number, data: Partial<MaterialData>): Promise<{ success: boolean; data: MaterialData }> {
    return this.put<{ success: boolean; data: MaterialData }>(`/${id}`, data);
  }

  async deleteMaterial(id: number): Promise<{ success: boolean }> {
    return this.delete(`/${id}`);
  }
}

// 规格字典服务
class AdminSpecificationService extends BaseService {
  constructor() {
    super('/dictionaries/specifications');
  }

  async getSpecifications(params: { lang?: string } = {}): Promise<WrappedDictionaryResponse<SpecificationData>> {
    try {
      const response = await this.get<DictionaryResponse<SpecificationData>>('', params);
      console.log('原始规格API响应:', response);
      
      // 确保响应结构正确
      if (!response.items) {
        return {
          success: true,
          data: {
            type: 'specifications',
            items: []
          }
        };
      }

      // 处理数据项中的Unicode转义序列
      const processedItems = response.items.map((item: any) => processDataItem(item));
      console.log('处理后的规格数据:', processedItems);
      
      return {
        success: true,
        data: {
          type: response.type || 'specifications',
          items: processedItems
        }
      };
    } catch (error) {
      console.error('规格API调用失败:', error);
      throw error;
    }
  }

  async createSpecification(data: Partial<SpecificationData>): Promise<{ success: boolean; data: SpecificationData }> {
    return this.post<{ success: boolean; data: SpecificationData }>('', data);
  }

  async updateSpecification(id: number, data: Partial<SpecificationData>): Promise<{ success: boolean; data: SpecificationData }> {
    return this.put<{ success: boolean; data: SpecificationData }>(`/${id}`, data);
  }

  async deleteSpecification(id: number): Promise<{ success: boolean }> {
    return this.delete(`/${id}`);
  }
}

// 导出服务实例
export const adminShapeService = new AdminShapeService();
export const adminMaterialService = new AdminMaterialService();
export const adminSpecificationService = new AdminSpecificationService();

export default {
  shapes: adminShapeService,
  materials: adminMaterialService,
  specifications: adminSpecificationService,
}; 