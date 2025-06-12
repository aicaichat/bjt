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

// 通用字典项类型
export interface DictionaryItem {
  code: string;
  name: string;  // 基于语言的名称
  name_zh?: string;
  name_en?: string;
  id?: number;
  sort_order?: number;
  type?: string;  // 添加type字段用于区分主机和配件
  category?: string;  // 添加category字段用于显示分组
  [key: string]: any; // 允许额外属性
}

// 通用字典服务
class AdminGeneralDictionaryService extends BaseService {
  constructor() {
    super('/dictionaries');
  }

  // 获取字典类型列表
  async getDictionaryTypes(): Promise<{ success: boolean; data: { types: Record<string, string> } }> {
    try {
      const response = await this.get<{ types: Record<string, string> }>('/types');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('获取字典类型失败:', error);
      throw error;
    }
  }

  // 获取特定类型的字典项
  async getDictionaryItems(type: string, params: { lang?: string } = {}): Promise<{
    success: boolean;
    data: {
      type: string;
      items: DictionaryItem[];
    }
  }> {
    try {
      const response = await this.get<{
        type: string;
        items: DictionaryItem[];
      }>(`/${type}`, params);
      
      console.log(`获取${type}字典数据:`, response);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error(`获取${type}字典失败:`, error);
      throw error;
    }
  }

  // 便捷方法：获取单位选项
  async getUnits(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('units', { lang });
    return response.data.items;
  }

  // 便捷方法：获取状态选项
  async getStatuses(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('statuses', { lang });
    return response.data.items;
  }

  // 便捷方法：获取电压选项
  async getVoltages(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('voltages', { lang });
    return response.data.items;
  }

  // 便捷方法：获取频率选项
  async getFrequencies(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('frequencies', { lang });
    return response.data.items;
  }

  // 便捷方法：获取袋型选项
  async getBagTypes(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('bag_types', { lang });
    return response.data.items;
  }

  // 便捷方法：获取材料选项
  async getMaterials(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('materials', { lang });
    return response.data.items;
  }

  // 便捷方法：获取品牌选项
  async getBrands(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('brands', { lang });
    return response.data.items;
  }

  // 便捷方法：获取国家选项
  async getCountries(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('countries', { lang });
    return response.data.items;
  }

  // 便捷方法：获取用户角色选项
  async getUserRoles(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('user_roles', { lang });
    return response.data.items;
  }

  // 便捷方法：获取产品类型选项
  async getProductTypes(lang: string = 'zh'): Promise<DictionaryItem[]> {
    const response = await this.getDictionaryItems('product_types', { lang });
    return response.data.items;
  }

  // 获取适配机型 - 主机型号
  async getHostModels(productLineId: number, lang: string = 'zh'): Promise<DictionaryItem[]> {
    try {
      console.log('[getHostModels] 获取主机型号, 产品线ID:', productLineId, '语言:', lang);
      
      const response = await this.get<any>(`/host-models?product_line_id=${productLineId}&lang=${lang}&status=publish`);
      console.log('[getHostModels] API响应:', response);
      
      let items = [];
      if (response.success && response.data && Array.isArray(response.data)) {
        items = response.data;
      } else if (response.success && response.data && Array.isArray(response.data.items)) {
        items = response.data.items;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      } else if (Array.isArray(response.items)) {
        items = response.items;
      } else if (Array.isArray(response)) {
        items = response;
      }
      
      const hostModels = items.map((item: any) => ({
        code: item.model || item.code,
        name: lang === 'en' ? 
          `${item.title_en || item.name_en || item.model || item.code}` : 
          `${item.title_zh || item.name_zh || item.model || item.code}`,
        name_zh: item.title_zh || item.name_zh,
        name_en: item.title_en || item.name_en,
        id: item.id,
        type: 'host',
        sort_order: item.sort_order || 0
      }));
      
      console.log('[getHostModels] 处理后的主机型号:', hostModels);
      return hostModels;
    } catch (error) {
      console.error('[getHostModels] 获取主机型号失败:', error);
      return [];
    }
  }

  // 获取适配机型 - 配件型号
  async getAccessoryModels(productLineId: number, lang: string = 'zh'): Promise<DictionaryItem[]> {
    try {
      console.log('[getAccessoryModels] 获取配件型号, 产品线ID:', productLineId, '语言:', lang);
      
      const response = await this.get<any>(`/accessory-models?product_line_id=${productLineId}&lang=${lang}&status=publish`);
      console.log('[getAccessoryModels] API响应:', response);
      
      let items = [];
      if (response.success && response.data && Array.isArray(response.data)) {
        items = response.data;
      } else if (response.success && response.data && Array.isArray(response.data.items)) {
        items = response.data.items;
      } else if (Array.isArray(response.data)) {
        items = response.data;
      } else if (Array.isArray(response.items)) {
        items = response.items;
      } else if (Array.isArray(response)) {
        items = response;
      }
      
      const accessoryModels = items.map((item: any) => ({
        code: item.model || item.code,
        name: lang === 'en' ? 
          `${item.title_en || item.name_en || item.model || item.code}` : 
          `${item.title_zh || item.name_zh || item.model || item.code}`,
        name_zh: item.title_zh || item.name_zh,
        name_en: item.title_en || item.name_en,
        id: item.id,
        type: 'accessory',
        sort_order: item.sort_order || 0
      }));
      
      console.log('[getAccessoryModels] 处理后的配件型号:', accessoryModels);
      return accessoryModels;
    } catch (error) {
      console.error('[getAccessoryModels] 获取配件型号失败:', error);
      return [];
    }
  }

  // 获取完整的适配机型列表（主机+配件）
  async getCompatibleModels(productLineId: number, lang: string = 'zh'): Promise<DictionaryItem[]> {
    try {
      console.log('[getCompatibleModels] 获取适配机型, 产品线ID:', productLineId, '语言:', lang);
      
      const [hostModels, accessoryModels] = await Promise.all([
        this.getHostModels(productLineId, lang),
        this.getAccessoryModels(productLineId, lang)
      ]);
      
      let allModels = [
        ...hostModels.map(model => ({ ...model, category: '主机 (Host)' })),
        ...accessoryModels.map(model => ({ ...model, category: '配件 (Accessory)' }))
      ];
      
      // 如果API没有返回数据，提供一些基于产品线的模拟数据
      if (allModels.length === 0) {
        console.log('[getCompatibleModels] API无数据，提供模拟数据');
        
        // 基于产品线ID提供相应的模拟数据
        if (productLineId === 1) {
          allModels = [
            // 主机型号
            { code: 'LA-E4C', name: '气垫机 LA-E4C', category: '主机 (Host)', type: 'host', sort_order: 1 },
            { code: 'LA-E4S', name: '气垫机 LA-E4S', category: '主机 (Host)', type: 'host', sort_order: 2 },
            { code: 'LA-E4S V2.0', name: '气垫机 LA-E4S V2.0', category: '主机 (Host)', type: 'host', sort_order: 3 },
            { code: 'LA-E5P', name: '气垫机 LA-E5P', category: '主机 (Host)', type: 'host', sort_order: 4 },
            { code: 'LA-F2', name: '气垫机 LA-F2', category: '主机 (Host)', type: 'host', sort_order: 5 },
            // 配件型号
            { code: 'LA-E4S(paper)', name: '纸塑配件 LA-E4S(paper)', category: '配件 (Accessory)', type: 'accessory', sort_order: 6 },
          ];
        } else {
          // 其他产品线的通用模拟数据
          allModels = [
            { code: 'HOST-001', name: '主机型号 001', category: '主机 (Host)', type: 'host', sort_order: 1 },
            { code: 'HOST-002', name: '主机型号 002', category: '主机 (Host)', type: 'host', sort_order: 2 },
            { code: 'ACC-001', name: '配件型号 001', category: '配件 (Accessory)', type: 'accessory', sort_order: 3 },
          ];
        }
      }
      
      // 按类型和排序排序
      allModels.sort((a, b) => {
        // 先按类型排序（主机在前），再按sort_order排序
        if (a.type !== b.type) {
          return a.type === 'host' ? -1 : 1;
        }
        return (a.sort_order || 0) - (b.sort_order || 0);
      });
      
      console.log('[getCompatibleModels] 最终适配机型列表:', allModels);
      return allModels;
    } catch (error) {
      console.error('[getCompatibleModels] 获取适配机型失败:', error);
      
      // 发生错误时也提供模拟数据
      return [
        { code: 'LA-E4C', name: '气垫机 LA-E4C', category: '主机 (Host)', type: 'host', sort_order: 1 },
        { code: 'LA-E4S', name: '气垫机 LA-E4S', category: '主机 (Host)', type: 'host', sort_order: 2 },
      ];
    }
  }
}

// 导出通用字典服务实例
export const adminGeneralDictionaryService = new AdminGeneralDictionaryService();

export default {
  shapes: adminShapeService,
  materials: adminMaterialService,
  specifications: adminSpecificationService,
  general: adminGeneralDictionaryService,
}; 