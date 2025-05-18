import { BaseAdminService } from './base-admin.service';
import { ADMIN_API_ENDPOINTS } from '../api/adminConfig';

export interface ProductLine {
  id: number;
  title: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  consumables: {
    zh: string;
    en: string;
  };
  spareParts: {
    zh: string;
    en: string;
  };
  image_url: string;
  status: 'publish' | 'draft' | 'trash';
  created_at: string;
  updated_at: string;
}

export interface ProductLineFormData {
  title: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  consumables: {
    zh: string;
    en: string;
  };
  spareParts: {
    zh: string;
    en: string;
  };
  image_url?: string;
  status?: 'publish' | 'draft' | 'trash';
}

export class AdminProductLineService extends BaseAdminService<ProductLine> {
  constructor() {
    super(ADMIN_API_ENDPOINTS.PRODUCT_LINES);
  }

  async getProductLines(params: {
    page?: number;
    page_size?: number;
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