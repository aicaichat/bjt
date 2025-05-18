import { BaseAdminService } from './base-admin.service';
import { ADMIN_API_ENDPOINTS } from '../api/adminConfig';
import HttpAdminService from '../api/httpAdminService';

export interface Part {
  id: number;
  pn: string;
  model_id: number;
  model_name: string;
  voltage?: string;
  name: {
    zh: string;
    en: string;
  };
  specs: {
    zh: string;
    en: string;
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  weight?: {
    net: number;
    gross: number;
  };
  image_url?: string;
  status: 'publish' | 'draft' | 'trash';
  created_at: string;
  updated_at: string;
}

export interface PartFormData {
  pn: string;
  model_id: number;
  voltage?: string;
  name: {
    zh: string;
    en: string;
  };
  specs: {
    zh: string;
    en: string;
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  weight?: {
    net: number;
    gross: number;
  };
  image_url?: string;
  status?: 'publish' | 'draft' | 'trash';
}

export class AdminPartService extends BaseAdminService<Part> {
  constructor() {
    super(ADMIN_API_ENDPOINTS.PARTS);
  }

  async getParts(params: {
    page?: number;
    page_size?: number;
    search?: string;
    model_id?: number;
    status?: string;
  } = {}) {
    return this.getPaginatedData('', params);
  }

  async getPart(id: number) {
    return this.getSingleItem(id);
  }

  async getPartByPN(pn: string) {
    return this.getPaginatedData('', { pn });
  }

  async fetchCRMPartData(pn: string) {
    const response = await HttpAdminService.get(`/crm/part-data?pn=${pn}`);
    return response;
  }

  async createPart(data: PartFormData) {
    return this.createItem(data);
  }

  async updatePart(id: number, data: PartFormData) {
    return this.updateItem(id, data);
  }

  async deletePart(id: number) {
    return this.deleteItem(id);
  }
}

export default new AdminPartService(); 