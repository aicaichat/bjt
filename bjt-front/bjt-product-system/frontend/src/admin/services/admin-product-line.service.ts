import { BaseAdminService } from './base-admin.service';
import { ADMIN_API_ENDPOINTS } from '../api/adminConfig';

export interface ProductLine {
  id: number;
  code: string;                    // 产品线代码
  title_zh: string;               // 中文标题
  title_en: string;               // 英文标题
  description_zh: string;         // 中文描述
  description_en: string;         // 英文描述
  subitem1_zh: string;           // 子项1中文 (耗材)
  subitem1_en: string;           // 子项1英文
  subitem2_zh: string;           // 子项2中文 (备件)
  subitem2_en: string;           // 子项2英文
  subitem3_zh?: string;          // 子项3中文 (可选)
  subitem3_en?: string;          // 子项3英文 (可选)
  image_url: string;             // 图片URL
  status: 'publish' | 'draft' | 'trash'; // 状态
  sort_order: number;            // 排序
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
}

export interface ProductLineFormData {
  code?: string;                   // 产品线代码 (更新时可选)
  title_zh: string;               // 中文标题
  title_en: string;               // 英文标题
  description_zh: string;         // 中文描述
  description_en: string;         // 英文描述
  subitem1_zh: string;           // 子项1中文 (耗材)
  subitem1_en: string;           // 子项1英文
  subitem2_zh: string;           // 子项2中文 (备件)
  subitem2_en: string;           // 子项2英文
  subitem3_zh?: string;          // 子项3中文 (可选)
  subitem3_en?: string;          // 子项3英文 (可选)
  image_url?: string;            // 图片URL
  status?: 'publish' | 'draft' | 'trash'; // 状态
  sort_order?: number;           // 排序
}

export class AdminProductLineService extends BaseAdminService<ProductLine> {
  constructor() {
    super(ADMIN_API_ENDPOINTS.PRODUCT_LINES);
  }

  async getProductLines(params: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
  } = {}) {
    return this.getPaginatedData('', params);
  }

  async getProductLine(id: number) {
    return this.getSingleItem(id);
  }

  async createProductLine(data: ProductLineFormData) {
    return this.createItem(data);
  }

  async updateProductLine(id: number, data: ProductLineFormData) {
    return this.updateItem(id, data);
  }

  async deleteProductLine(id: number) {
    return this.deleteItem(id);
  }
}

export default new AdminProductLineService(); 