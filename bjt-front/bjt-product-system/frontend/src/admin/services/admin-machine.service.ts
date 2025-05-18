import { BaseAdminService } from './base-admin.service';
import { ADMIN_API_ENDPOINTS } from '../api/adminConfig';
import HttpAdminService from '../api/httpAdminService';

export interface Machine {
  id: number;
  model: string;
  description: {
    zh: string;
    en: string;
  };
  product_line_id: number;
  product_line_name?: string;
  image_url?: string;
  exploded_view_pdf_url?: string;
  status: 'publish' | 'draft' | 'trash';
  created_at: string;
  updated_at: string;
}

export interface MachineFormData {
  model: string;
  description: {
    zh: string;
    en: string;
  };
  product_line_id: number;
  image_url?: string;
  exploded_view_pdf_url?: string;
  status?: 'publish' | 'draft' | 'trash';
}

export class AdminMachineService extends BaseAdminService<Machine> {
  constructor() {
    super(ADMIN_API_ENDPOINTS.HOST_MODELS);
  }

  async getMachines(params: {
    page?: number;
    page_size?: number;
    search?: string;
    product_line_id?: number;
    status?: string;
  } = {}) {
    return this.getPaginatedData('', params);
  }

  async getMachine(id: number) {
    return this.getSingleItem(id);
  }

  async createMachine(data: MachineFormData) {
    return this.createItem(data);
  }

  async updateMachine(id: number, data: MachineFormData) {
    return this.updateItem(id, data);
  }

  async deleteMachine(id: number) {
    return this.deleteItem(id);
  }
}

export default new AdminMachineService(); 