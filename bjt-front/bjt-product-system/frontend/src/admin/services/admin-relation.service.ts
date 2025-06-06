import { BaseAdminService } from './base-admin.service';
import { ADMIN_API_ENDPOINTS } from '../api/adminConfig';
import HttpAdminService from '../api/httpAdminService';

// 严格对应wp_bjt_relations表的13个字段
export interface Relation {
  id: number;
  product_line_id: number;        // 产品线ID - 必填
  host_part_number: number;       // 主机料号-0级 - 必填 (新增字段)
  part_number: string;           // 自身料号 - 必填
  parent_part_number?: string;   // 父项料号
  child_part_number?: string;    // 子项料号
  child_type: 'accessory' | 'spare_part'; // 子项类型：配件/备件
  level: number;                 // 层级(1-5)，备件固定为1
  quantity: number;              // 子项在父项中的数量
  required_parts?: string;       // 依赖关联料号 (多个用逗号分隔)
  required_quantity?: string;    // 依赖关联料号对应的数量 (多个用逗号分隔)
  sort_order: number;           // 同级排序
  status: 'publish' | 'draft' | 'trash'; // 状态
  created_at: string;           // 只读
  updated_at: string;           // 只读
  
  // 兼容旧接口字段（可以逐步移除）
  part_name?: string;
  part_pn?: string;
  parent_id?: number | null;
  part_id?: number;
  order?: number;
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

  // 将必选备件数组转换为逗号分隔的字符串
  private formatRequiredParts(parts: string[] | string): string | undefined {
    if (!parts) return undefined;
    if (Array.isArray(parts)) {
      return parts.filter(part => part.trim()).join(',');
    }
    return parts.toString();
  }

  // 将必选备件数量数组转换为逗号分隔的字符串
  private formatRequiredQuantity(quantities: number[] | string): string | undefined {
    if (!quantities) return undefined;
    if (Array.isArray(quantities)) {
      return quantities.filter(qty => qty > 0).join(',');
    }
    return quantities.toString();
  }

  // 解析逗号分隔的字符串为数组
  parseRequiredParts(partsString?: string): string[] {
    if (!partsString) return [];
    return partsString.split(',').map(part => part.trim()).filter(part => part);
  }

  // 解析逗号分隔的数量字符串为数组
  parseRequiredQuantity(quantityString?: string): number[] {
    if (!quantityString) return [];
    return quantityString.split(',').map(qty => parseInt(qty.trim())).filter(qty => !isNaN(qty) && qty > 0);
  }

  // 获取关联关系列表
  async getRelations(params: {
    page?: number;
    per_page?: number;
    parent_part_number?: string;
    child_part_number?: string;
    product_line_id?: number;
    level?: number;
    child_type?: 'accessory' | 'spare_part';
    search?: string;
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

  // 创建关联关系 - 支持完整字段
  async createRelation(data: Partial<Relation> & {
    required_parts_array?: string[];
    required_quantity_array?: number[];
  }) {
    const createData = { ...data };
    
    // 处理必选备件数组
    if (data.required_parts_array) {
      createData.required_parts = this.formatRequiredParts(data.required_parts_array);
      delete createData.required_parts_array;
    }
    
    // 处理必选备件数量数组
    if (data.required_quantity_array) {
      createData.required_quantity = this.formatRequiredQuantity(data.required_quantity_array);
      delete createData.required_quantity_array;
    }
    
    return this.createItem(createData);
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

  // 更新关联关系 - 支持完整字段
  async updateRelation(id: number, data: Partial<Relation> & {
    required_parts_array?: string[];
    required_quantity_array?: number[];
  }) {
    const updateData = { ...data };
    
    // 处理必选备件数组
    if (data.required_parts_array) {
      updateData.required_parts = this.formatRequiredParts(data.required_parts_array);
      delete updateData.required_parts_array;
    }
    
    // 处理必选备件数量数组
    if (data.required_quantity_array) {
      updateData.required_quantity = this.formatRequiredQuantity(data.required_quantity_array);
      delete updateData.required_quantity_array;
    }
    
    return this.updateItem(id, updateData);
  }

  // 删除关联关系
  async deleteRelation(id: number, options?: { cascade?: boolean }) {
    const params = new URLSearchParams();
    if (options?.cascade !== undefined) {
      params.append('cascade', options.cascade.toString());
    }
    
    const url = `${this.baseUrl}/${id}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await HttpAdminService.delete<{
      deleted: boolean;
      cascade: boolean;
      deleted_count: number;
      previous: Relation;
      deleted_relations: Relation[];
    }>(url);
    
    return response.data;
  }

  // 删除某个料号的所有子配件关联
  async deleteChildrenRelations(partId: number) {
    const response = await HttpAdminService.delete<any>(`${this.baseUrl}/children?parent_id=${partId}`);
    return response.data;
  }
}

export default new AdminRelationService(); 