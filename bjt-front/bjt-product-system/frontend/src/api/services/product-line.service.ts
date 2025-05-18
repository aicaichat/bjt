import { BaseService } from './base.service';
import { mockProductLines as apiMockProductLines } from '../../services/mockService';
import { delay } from '../../utils/delay';

/**
 * 产品线实体接口
 */
export interface ProductLine {
  id: number;
  code: string;
  title_zh: string;
  title_en: string;
  description_zh?: string;
  description_en?: string;
  image_url?: string;
  status: 'publish' | 'draft' | 'trash';
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 产品线列表响应接口
 */
export interface ProductLineListResponse {
  items: ProductLine[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 转换旧的Mock数据格式为新格式
const mockProductLines: ProductLine[] = apiMockProductLines.map(item => ({
  ...item,
  code: `PL-${item.id}`,
  // 确保status字段是有效的枚举值
  status: (item.status === 'publish' || item.status === 'draft' || item.status === 'trash') 
    ? item.status as 'publish' | 'draft' | 'trash' 
    : 'publish',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

/**
 * 产品线服务
 * 提供产品线相关的API调用
 */
export class ProductLineService extends BaseService<ProductLineListResponse> {
  constructor() {
    // 设置API基础路径
    super('/product-lines');
  }

  /**
   * 获取产品线列表
   * @param params 查询参数
   * @returns 产品线列表
   */
  async getProductLines(params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
  } = {}): Promise<ProductLineListResponse> {
    return this.getData('', params);
  }

  /**
   * 获取产品线详情
   * @param id 产品线ID
   * @param params 查询参数
   * @returns 产品线详情
   */
  async getProductLine(id: number, params: {
    lang?: string;
  } = {}): Promise<ProductLine> {
    try {
      const response = await this.getData(`/${id}`, params);
      return response.items[0] || response as any;
    } catch (error) {
      console.error(`Error getting product line with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 创建产品线
   * @param data 产品线数据
   * @returns 创建结果
   */
  async createProductLine(data: Partial<ProductLine>): Promise<ProductLine> {
    const response = await this.postData('', data as any);
    return response.data;
  }

  /**
   * 更新产品线
   * @param id 产品线ID
   * @param data 产品线数据
   * @returns 更新结果
   */
  async updateProductLine(id: number, data: Partial<ProductLine>): Promise<ProductLine> {
    const response = await this.putData(`/${id}`, data as any);
    return response.data;
  }

  /**
   * 删除产品线
   * @param id 产品线ID
   * @returns 删除结果
   */
  async deleteProductLine(id: number): Promise<void> {
    await this.deleteData(`/${id}`);
  }

  /**
   * 获取Mock产品线数据
   * @param params 查询参数
   * @returns Mock产品线数据
   */
  protected async getMockData(params: Record<string, any> = {}): Promise<ProductLineListResponse> {
    // 模拟延迟
    await delay(300);

    // 获取查询参数
    const page = Number(params.page) || 1;
    const pageSize = Number(params.per_page) || 10;
    const search = params.search as string;
    const status = params.status as string;

    // 过滤数据
    let filteredData = [...mockProductLines];

    // 根据搜索词过滤
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.title_zh?.toLowerCase().includes(searchLower) ||
        item.title_en?.toLowerCase().includes(searchLower) ||
        item.description_zh?.toLowerCase().includes(searchLower) ||
        item.description_en?.toLowerCase().includes(searchLower)
      );
    }

    // 根据状态过滤
    if (status) {
      filteredData = filteredData.filter(item => item.status === status);
    }

    // 计算分页
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filteredData.slice(start, end);

    // 返回分页后的数据
    return {
      items: paginatedData,
      total: filteredData.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(filteredData.length / pageSize)
    };
  }
}

// 导出单例实例
export default new ProductLineService(); 