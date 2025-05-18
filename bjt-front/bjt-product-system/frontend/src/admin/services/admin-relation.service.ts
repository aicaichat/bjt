import { BaseAdminService } from './base-admin.service';
import { ADMIN_API_ENDPOINTS } from '../api/adminConfig';
import HttpAdminService from '../api/httpAdminService';

export interface Relation {
  id: number;
  parent_id: number | null;
  part_id: number;
  part_name: string;
  part_pn: string;
  level: number;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface RelationHierarchy {
  id: number;
  part_id: number;
  part_name: string;
  part_pn: string;
  level: number;
  children?: RelationHierarchy[];
}

export interface RelationFormData {
  parent_id: number | null;
  part_id: number;
  level: number;
  order?: number;
}

export class AdminRelationService extends BaseAdminService<Relation> {
  constructor() {
    super(ADMIN_API_ENDPOINTS.RELATIONS);
  }

  // 获取关联关系列表
  async getRelations(params: {
    page?: number;
    page_size?: number;
    parent_id?: number | null;
    part_id?: number;
    level?: number;
  } = {}) {
    return this.getPaginatedData('', params);
  }

  // 获取单个关联关系
  async getRelation(id: number) {
    return this.getSingleItem(id);
  }

  // 获取层级关系
  async getHierarchy(rootPartId: number) {
    const response = await HttpAdminService.get<any>(`${this.baseUrl}/hierarchy?root_part_id=${rootPartId}`);
    return response.data;
  }

  // 获取某个料号的子配件
  async getChildren(partId: number, level?: number) {
    const params: any = { parent_id: partId };
    if (level !== undefined) {
      params.level = level;
    }
    return this.getPaginatedData('', params);
  }

  // 创建关联关系
  async createRelation(data: RelationFormData) {
    return this.createItem(data);
  }

  // 批量创建关联关系
  async batchCreateRelations(parentId: number, partIds: number[], level: number) {
    const relations = partIds.map((partId, index) => ({
      parent_id: parentId,
      part_id: partId,
      level,
      order: index
    }));
    
    const response = await HttpAdminService.post<any>(`${this.baseUrl}/batch`, { relations });
    return response.data;
  }

  // 更新关联关系
  async updateRelation(id: number, data: Partial<RelationFormData>) {
    return this.updateItem(id, data);
  }

  // 删除关联关系
  async deleteRelation(id: number) {
    return this.deleteItem(id);
  }

  // 删除某个料号的所有子配件关联
  async deleteChildrenRelations(partId: number) {
    const response = await HttpAdminService.delete<any>(`${this.baseUrl}/children?parent_id=${partId}`);
    return response.data;
  }
}

export default new AdminRelationService(); 