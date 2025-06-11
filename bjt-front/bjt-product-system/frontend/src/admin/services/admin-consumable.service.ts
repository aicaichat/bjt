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

// 耗材料号接口定义 (对应wp_bjt_consumables表的46个字段)
export interface Consumable {
  id: number;
  product_line_id: number;
  model: string;
  model_imperial?: string;
  part_number: string;
  spec?: string;
  spec_imperial?: string;
  brand?: string;
  app_model?: string;
  bag_type?: string;
  material?: string;
  thickness_met?: number;
  thickness_imp?: number;
  width_met?: number;
  width_imp?: number;
  length_met?: number;
  length_imp?: number;
  bubble_diameter_met?: number;
  bubble_diameter_imp?: number;
  total_length_met?: number;
  total_length_imp?: number;
  package_type?: string;
  package_size_cm?: string;
  package_size_inch?: string;
  net_weight_kg?: number;
  net_weight_lbs?: number;
  gross_weight_kg?: number;
  gross_weight_lbs?: number;
  pcs_per_box?: number;
  image_url?: string;
  package_image_url?: string;
  pallet_size_cm?: string;
  pallet_size_inch?: string;
  pcs_per_pallet_a?: number;
  pallet_gross_weight_a_kg?: number;
  pallet_gross_weight_a_lbs?: number;
  pallet_height_a_cm?: number;
  pallet_height_a_inch?: number;
  pcs_per_pallet_b?: number;
  pallet_gross_weight_b_kg?: number;
  pallet_gross_weight_b_lbs?: number;
  pallet_height_b_cm?: number;
  pallet_height_b_inch?: number;
  pcs_per_pallet_c?: number;
  pallet_gross_weight_c_kg?: number;
  pallet_gross_weight_c_lbs?: number;
  pallet_height_c_cm?: number;
  pallet_height_c_inch?: number;
  tube_inner_diameter_cm?: number;
  tube_inner_diameter_inch?: number;
  status: string;
  unit: string;
  created_at?: string;
  updated_at?: string;
}

// 耗材料号表单数据接口
export interface ConsumableFormData {
  product_line_id: number;
  model: string;
  model_imperial?: string;
  part_number: string;
  spec?: string;
  spec_imperial?: string;
  brand?: string;
  app_model?: string;
  bag_type?: string;
  material?: string;
  thickness_met?: number;
  thickness_imp?: number;
  width_met?: number;
  width_imp?: number;
  length_met?: number;
  length_imp?: number;
  bubble_diameter_met?: number;
  bubble_diameter_imp?: number;
  total_length_met?: number;
  total_length_imp?: number;
  package_type?: string;
  package_size_cm?: string;
  package_size_inch?: string;
  net_weight_kg?: number;
  net_weight_lbs?: number;
  gross_weight_kg?: number;
  gross_weight_lbs?: number;
  pcs_per_box?: number;
  image_url?: string;
  package_image_url?: string;
  pallet_size_cm?: string;
  pallet_size_inch?: string;
  pcs_per_pallet_a?: number;
  pallet_gross_weight_a_kg?: number;
  pallet_gross_weight_a_lbs?: number;
  pallet_height_a_cm?: number;
  pallet_height_a_inch?: number;
  pcs_per_pallet_b?: number;
  pallet_gross_weight_b_kg?: number;
  pallet_gross_weight_b_lbs?: number;
  pallet_height_b_cm?: number;
  pallet_height_b_inch?: number;
  pcs_per_pallet_c?: number;
  pallet_gross_weight_c_kg?: number;
  pallet_gross_weight_c_lbs?: number;
  pallet_height_c_cm?: number;
  pallet_height_c_inch?: number;
  tube_inner_diameter_cm?: number;
  tube_inner_diameter_inch?: number;
  status: string;
  unit: string;
}

// 消耗品型号查询参数接口
interface ConsumableModelQueryParams {
  page: number;
  per_page: number;
  search?: string;
  product_line_id?: number;
  status?: string;
}

// 消耗品料号查询参数接口
interface ConsumableQueryParams {
  page: number;
  per_page: number;
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
      per_page: number;
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

// 耗材料号服务类
class AdminConsumableService extends BaseService {
  constructor() {
    super('/consumables');
  }

  async getConsumables(params: {
    page?: number;
    per_page?: number;
    lang?: string;
    region?: string;
    product_line_id?: number;
    model?: string;
    bag_type?: string;
    material?: string;
    status?: string;
    search?: string;
    sort_field?: string;
    sort_order?: 'asc' | 'desc';
  } = {}) {
    // 过滤空值参数
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    
    console.log('ConsumableService: Calling API with params:', filteredParams);
    const response = await this.get<any>('', filteredParams);
    console.log('ConsumableService: Raw API response:', response);

    // 检查响应数据格式并进行转换
    let itemsToTransform: any[] = [];
    let responseData: any = {};

    if (response.success && response.data) {
      // 新格式：{success: true, data: {items: [...], total: 48}}
      console.log('ConsumableService: Using wrapped format (success.data)');
      itemsToTransform = response.data.items || [];
      responseData = response.data;
    } else if (response.items && Array.isArray(response.items)) {
      // 直接格式：{items: [...], total: 48, current_page: 1}
      console.log('ConsumableService: Using direct format (response.items)');
      itemsToTransform = response.items;
      responseData = response;
    } else {
      console.error('ConsumableService: Unknown response format:', response);
      return {
        items: [],
        total: 0,
        page: 1,
        per_page: 50,
      };
    }

    console.log('ConsumableService: Converting data, found', itemsToTransform.length, 'items');
    
    if (itemsToTransform.length > 0) {
      console.log('ConsumableService: Sample input item:', itemsToTransform[0]);
    }

    const transformedItems = itemsToTransform.map((item: any) => {
      const transformed: Consumable = {
        id: item.id,
        product_line_id: item.product_line_id,
        model: item.model || item.name,
        model_imperial: item.model_imperial,
        part_number: item.part_number || item.code, // 优先使用part_number，回退到code
        spec: item.spec || undefined, // 直接使用API返回的原始spec值
        spec_imperial: item.spec_imperial || undefined, // 直接使用API返回的原始spec_imperial值
        brand: item.brand,
        app_model: item.specs?.compatibility,
        bag_type: item.bag_type || item.specs?.shape, // 优先使用bag_type，回退到specs.shape
        material: item.specs?.material, // specs.material映射到material
        thickness_met: item.specs?.thickness ? this.parseNumericValue(item.specs.thickness) : undefined,
        thickness_imp: item.specs?.thickness ? this.convertToImperial(item.specs.thickness, 'thickness') : undefined,
        width_met: item.specs?.width ? this.parseNumericValue(item.specs.width) : undefined,
        width_imp: item.specs?.width ? this.convertToImperial(item.specs.width, 'width') : undefined,
        length_met: item.specs?.length ? this.parseNumericValue(item.specs.length) : undefined,
        length_imp: item.specs?.length ? this.convertToImperial(item.specs.length, 'length') : undefined,
        total_length_met: item.specs?.rollLength ? this.parseNumericValue(item.specs.rollLength) : undefined,
        total_length_imp: item.specs?.rollLength ? this.convertToImperial(item.specs.rollLength, 'rollLength') : undefined,
        image_url: item.image_url,
        package_image_url: item.package_image_url,
        status: item.status || 'publish',
        unit: item.sales_unit || 'roll',
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      return transformed;
    });

    if (transformedItems.length > 0) {
      console.log('ConsumableService: Sample transformed item:', transformedItems[0]);
    }

    const result = {
      items: transformedItems,
      total: responseData.total || 0,
      page: responseData.current_page || responseData.page || 1,
      per_page: responseData.per_page || Math.ceil((responseData.total || 0) / (responseData.total_pages || 1)) || 50,
    };
    
    console.log('ConsumableService: Final result:', result);
    return result;
  }

  // 辅助方法：解析数值
  private parseNumericValue(value: string): number | undefined {
    if (!value) return undefined;
    const matches = value.match(/[\d.]+/);
    return matches ? parseFloat(matches[0]) : undefined;
  }

  // 辅助方法：转换为英制单位（简单示例）
  private convertToImperial(value: string, type: string): number | undefined {
    const numValue = this.parseNumericValue(value);
    if (!numValue) return undefined;
    
    switch (type) {
      case 'thickness': // um to mil
        return numValue * 0.0393701; // 1 um = 0.0393701 mil
      case 'width': // mm to inch
        return numValue * 0.0393701; // 1 mm = 0.0393701 inch
      case 'length': // m to ft
        return numValue * 3.28084; // 1 m = 3.28084 ft
      case 'rollLength': // m to ft
        return numValue * 3.28084; // 1 m = 3.28084 ft
      default:
        return numValue;
    }
  }

  // 辅助方法：构建规格字符串（公制）
  private buildSpecString(specs: any): string {
    const parts: string[] = [];
    if (specs.material) parts.push(`材质: ${specs.material}`);
    if (specs.thickness) parts.push(`厚度: ${specs.thickness}`);
    if (specs.width) parts.push(`宽度: ${specs.width}`);
    if (specs.length) parts.push(`长度: ${specs.length}`);
    if (specs.rollLength) parts.push(`总长: ${specs.rollLength}`);
    if (specs.shape) parts.push(`袋型: ${specs.shape}`);
    return parts.join(', ');
  }

  // 辅助方法：构建规格字符串（英制）
  private buildSpecImperialString(specs: any, modelImperial?: string): string {
    const parts: string[] = [];
    if (specs.material) parts.push(`Material: ${specs.material}`);
    if (specs.thickness) {
      const thicknessImp = this.convertToImperial(specs.thickness, 'thickness');
      parts.push(`Thickness: ${thicknessImp?.toFixed(2)} mil`);
    }
    if (specs.width) {
      const widthImp = this.convertToImperial(specs.width, 'width');
      parts.push(`Width: ${widthImp?.toFixed(2)} inch`);
    }
    if (specs.length) {
      const lengthImp = this.convertToImperial(specs.length, 'length');
      parts.push(`Length: ${lengthImp?.toFixed(2)} ft`);
    }
    if (specs.rollLength) {
      const rollLengthImp = this.convertToImperial(specs.rollLength, 'rollLength');
      parts.push(`Roll Length: ${rollLengthImp?.toFixed(2)} ft`);
    }
    if (specs.shape) parts.push(`Type: ${specs.shape}`);
    if (modelImperial) parts.push(`Imperial Model: ${modelImperial}`);
    return parts.join(', ');
  }

  async getConsumable(id: number) {
    console.log('ConsumableService: Getting single consumable with ID:', id);
    const response = await this.get<any>(`/${id}`);
    console.log('ConsumableService: Single consumable raw response:', response);

    // 检查响应数据格式并进行转换
    let itemToTransform: any = null;

    if (response.success && response.data) {
      // 包装格式：{success: true, data: {id: 48, code: "...", ...}}
      console.log('ConsumableService: Using wrapped format for single item');
      itemToTransform = response.data;
    } else if (response.id) {
      // 直接格式：{id: 48, code: "...", ...}
      console.log('ConsumableService: Using direct format for single item');
      itemToTransform = response;
    } else {
      console.error('ConsumableService: Unknown single item response format:', response);
      throw new Error('Invalid response format');
    }

    console.log('ConsumableService: Converting single item:', itemToTransform);

    // 转换单个耗材数据
    const transformed: Consumable = {
      id: itemToTransform.id,
      product_line_id: itemToTransform.product_line_id,
      model: itemToTransform.model || itemToTransform.name,
      model_imperial: itemToTransform.model_imperial,
      part_number: itemToTransform.part_number || itemToTransform.code, // 优先使用part_number，回退到code
      spec: itemToTransform.spec || undefined, // 直接使用API返回的原始spec值
      spec_imperial: itemToTransform.spec_imperial || undefined, // 直接使用API返回的原始spec_imperial值
      brand: itemToTransform.brand,
      app_model: itemToTransform.specs?.compatibility,
      bag_type: itemToTransform.bag_type || itemToTransform.specs?.shape, // 优先使用bag_type，回退到specs.shape
      material: itemToTransform.specs?.material, // specs.material映射到material
      thickness_met: itemToTransform.specs?.thickness ? this.parseNumericValue(itemToTransform.specs.thickness) : undefined,
      thickness_imp: itemToTransform.specs?.thickness ? this.convertToImperial(itemToTransform.specs.thickness, 'thickness') : undefined,
      width_met: itemToTransform.specs?.width ? this.parseNumericValue(itemToTransform.specs.width) : undefined,
      width_imp: itemToTransform.specs?.width ? this.convertToImperial(itemToTransform.specs.width, 'width') : undefined,
      length_met: itemToTransform.specs?.length ? this.parseNumericValue(itemToTransform.specs.length) : undefined,
      length_imp: itemToTransform.specs?.length ? this.convertToImperial(itemToTransform.specs.length, 'length') : undefined,
      total_length_met: itemToTransform.specs?.rollLength ? this.parseNumericValue(itemToTransform.specs.rollLength) : undefined,
      total_length_imp: itemToTransform.specs?.rollLength ? this.convertToImperial(itemToTransform.specs.rollLength, 'rollLength') : undefined,
      image_url: itemToTransform.image_url,
      package_image_url: itemToTransform.package_image_url,
      status: itemToTransform.status || 'publish',
      unit: itemToTransform.sales_unit || 'roll',
      created_at: itemToTransform.created_at,
      updated_at: itemToTransform.updated_at,
    };

    console.log('ConsumableService: Transformed single item:', transformed);
    return transformed;
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