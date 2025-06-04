import { API_BASE_URL } from '../api/config';

// 必选备件基础信息接口
export interface RequiredPart {
  part_number: string;
  quantity: number;
  name_zh: string;
  name_en: string;
  type: 'host' | 'accessory' | 'spare_part';
}

// 完整的必选备件信息接口 (包含所有备件字段)
export interface RequiredPartWithFullDetails extends RequiredPart {
  // 基础信息
  id: number;
  product_line_id: number;
  model: string | null;
  is_consumable: boolean;
  image_url: string;
  spec: string;
  spec_imperial: string;
  app_model: string;
  app_sn: string;
  unit: string;
  status: string;
  
  // 包装信息
  package_size_cm: string | null;
  package_size_inch: string | null;
  net_weight_kg: number | null;
  net_weight_lbs: number | null;
  gross_weight_kg: number | null;
  gross_weight_lbs: number | null;
  pcs_per_box: number | null;
  
  // 定价和库存信息
  pricing?: PricingTier[];
  inventory?: InventoryInfo[];
  
  // 必选备件信息
  required_parts: string | null;
  required_quantity: string | null;
  
  // 关联信息
  parent_part_number: string;
}

export interface PricingTier {
  range: string;
  price: number;
  regionalPricing?: RegionalPricing[];
}

export interface RegionalPricing {
  region: string;
  price: number;
  currency: string;
}

export interface InventoryInfo {
  region: string;
  quantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

/**
 * 解析必选备件字符串
 */
export function parseRequiredParts(
  required_parts: string | string[] | null | undefined,
  required_quantity: string | string[] | null | undefined
): RequiredPart[] {
  console.log('📋 [parseRequiredParts] Input:', { required_parts, required_quantity });
  
  if (!required_parts || !required_quantity) {
    console.log('❌ [parseRequiredParts] No required parts or quantity found');
    return [];
  }

  let partNumbers: string[] = [];
  let quantities: number[] = [];

  // Handle required_parts
  if (typeof required_parts === 'string') {
    partNumbers = required_parts.split(',').map(p => p.trim()).filter(p => p);
  } else if (Array.isArray(required_parts)) {
    partNumbers = required_parts.map(p => String(p).trim()).filter(p => p);
  } else {
    console.warn('⚠️ [parseRequiredParts] Invalid required_parts type:', typeof required_parts);
    return [];
  }

  // Handle required_quantity
  if (typeof required_quantity === 'string') {
    quantities = required_quantity.split(',').map(q => parseInt(q.trim(), 10)).filter(q => !isNaN(q));
  } else if (Array.isArray(required_quantity)) {
    quantities = required_quantity.map(q => parseInt(String(q).trim(), 10)).filter(q => !isNaN(q));
  } else {
    console.warn('⚠️ [parseRequiredParts] Invalid required_quantity type:', typeof required_quantity);
    return [];
  }

  if (partNumbers.length !== quantities.length) {
    console.warn('⚠️ [parseRequiredParts] Required parts numbers and quantities do not match:', { 
      partNumbers, 
      quantities,
      required_parts,
      required_quantity 
    });
    return [];
  }

  const result = partNumbers.map((part_number, index) => ({
    part_number,
    quantity: quantities[index],
    name_zh: '', // 需要通过API获取
    name_en: '',
    type: determinePartType(part_number)
  }));
  
  console.log('✅ [parseRequiredParts] Result:', result);
  return result;
}

/**
 * 根据料号格式判断产品类型
 */
function determinePartType(partNumber: string): 'host' | 'accessory' | 'spare_part' {
  if (partNumber.startsWith('60A01')) return 'host';
  if (partNumber.startsWith('60A')) return 'accessory';
  return 'spare_part';
}

/**
 * 获取必选备件的完整详细信息
 */
export async function fetchRequiredPartsFullInfo(
  requiredParts: string,
  requiredQuantity: string,
  parentPartNumber: string
): Promise<RequiredPartWithFullDetails[]> {
  if (!requiredParts || !requiredQuantity) return [];
  
  const parsedParts = parseRequiredParts(requiredParts, requiredQuantity);
  
  const promises = parsedParts.map(async (part) => {
    try {
      let response;
      let apiData;
      
      // 根据类型调用不同的API
      switch (part.type) {
        case 'host':
          response = await fetch(`${API_BASE_URL}/parts/${part.part_number}`);
          break;
        case 'accessory':
          response = await fetch(`${API_BASE_URL}/accessories/${part.part_number}`);
          break;
        case 'spare_part':
          response = await fetch(`${API_BASE_URL}/spare-parts/${part.part_number}`);
          break;
      }
      
      if (response && response.ok) {
        const result = await response.json();
        apiData = result.success ? result.data : result;
      }
      
      if (apiData) {
        // 返回完整的备件信息，包含所有字段
        return {
          ...part,
          ...apiData,
          // 确保名称字段正确映射
          name_zh: apiData.name_zh || apiData.title_zh || `备件 ${part.part_number}`,
          name_en: apiData.name_en || apiData.title_en || `Part ${part.part_number}`,
          // 确保必选备件特有字段
          quantity: part.quantity,
          parent_part_number: parentPartNumber,
          // 确保基础字段有默认值
          id: apiData.id || 0,
          product_line_id: apiData.product_line_id || 1,
          model: apiData.model || null,
          is_consumable: apiData.is_consumable || false,
          image_url: apiData.image_url || '',
          spec: apiData.spec || '',
          spec_imperial: apiData.spec_imperial || '',
          app_model: apiData.app_model || '',
          app_sn: apiData.app_sn || '',
          unit: apiData.unit || 'pcs',
          status: apiData.status || 'publish',
          // 包装信息
          package_size_cm: apiData.package_size_cm || null,
          package_size_inch: apiData.package_size_inch || null,
          net_weight_kg: apiData.net_weight_kg || null,
          net_weight_lbs: apiData.net_weight_lbs || null,
          gross_weight_kg: apiData.gross_weight_kg || null,
          gross_weight_lbs: apiData.gross_weight_lbs || null,
          pcs_per_box: apiData.pcs_per_box || null,
          // 定价和库存
          pricing: apiData.pricing || [],
          inventory: apiData.inventory || [],
          // 必选备件信息
          required_parts: apiData.required_parts || null,
          required_quantity: apiData.required_quantity || null
        } as RequiredPartWithFullDetails;
      }
      
      throw new Error(`Part ${part.part_number} not found`);
    } catch (error) {
      console.warn(`Failed to fetch full info for ${part.part_number}:`, error);
      
      // 返回基础信息作为fallback
      return {
        ...part,
        id: 0,
        product_line_id: 1,
        name_zh: `备件 ${part.part_number}`,
        name_en: `Part ${part.part_number}`,
        quantity: part.quantity,
        parent_part_number: parentPartNumber,
        type: part.type,
        is_consumable: false,
        image_url: '',
        spec: '',
        spec_imperial: '',
        app_model: '',
        app_sn: '',
        unit: 'pcs',
        status: 'publish',
        package_size_cm: null,
        package_size_inch: null,
        net_weight_kg: null,
        net_weight_lbs: null,
        gross_weight_kg: null,
        gross_weight_lbs: null,
        pcs_per_box: null,
        pricing: [],
        inventory: [],
        required_parts: null,
        required_quantity: null
      } as RequiredPartWithFullDetails;
    }
  });
  
  return Promise.all(promises);
}

/**
 * 简化版本 - 仅获取基础信息用于显示
 */
export async function getRequiredPartsDetails(
  requiredParts: RequiredPart[]
): Promise<RequiredPart[]> {
  const promises = requiredParts.map(async (part) => {
    try {
      let response;
      switch (part.type) {
        case 'host':
          response = await fetch(`${API_BASE_URL}/parts/${part.part_number}`);
          break;
        case 'accessory':
          response = await fetch(`${API_BASE_URL}/accessories/${part.part_number}`);
          break;
        case 'spare_part':
          response = await fetch(`${API_BASE_URL}/spare-parts/${part.part_number}`);
          break;
      }
      
      if (response && response.ok) {
        const result = await response.json();
        const apiData = result.success ? result.data : result;
        
        return {
          ...part,
          name_zh: apiData.name_zh || apiData.title_zh || part.name_zh,
          name_en: apiData.name_en || apiData.title_en || part.name_en
        };
      }
      
      return part;
    } catch (error) {
      console.warn(`Failed to fetch details for ${part.part_number}:`, error);
      return part;
    }
  });
  
  return Promise.all(promises);
}

/**
 * 创建必选备件购物车项目
 */
export function createRequiredPartCartItem(
  requiredPart: RequiredPartWithFullDetails,
  totalQuantity: number
): any {
  return {
    // 基础购物车字段
    item_id: `required_${requiredPart.part_number}_${Date.now()}`,
    product_id: requiredPart.id,
    product_type: 'spare_part',
    part_number: requiredPart.part_number,
    name: requiredPart.name_zh,
    quantity: totalQuantity,
    unit_price: 0, // 需要从定价信息中获取
    currency: 'CNY',
    
    // 扩展字段
    name_zh: requiredPart.name_zh,
    name_en: requiredPart.name_en,
    image_url: requiredPart.image_url,
    
    // 必选备件特有标识
    is_required: true,
    parent_part_number: requiredPart.parent_part_number,
    
    // 完整的备件字段信息
    spec: requiredPart.spec,
    spec_imperial: requiredPart.spec_imperial,
    app_model: requiredPart.app_model,
    app_sn: requiredPart.app_sn,
    is_consumable: requiredPart.is_consumable,
    unit: requiredPart.unit,
    status: requiredPart.status,
    
    // 包装信息
    package_size_cm: requiredPart.package_size_cm,
    package_size_inch: requiredPart.package_size_inch,
    net_weight_kg: requiredPart.net_weight_kg,
    net_weight_lbs: requiredPart.net_weight_lbs,
    gross_weight_kg: requiredPart.gross_weight_kg,
    gross_weight_lbs: requiredPart.gross_weight_lbs,
    pcs_per_box: requiredPart.pcs_per_box,
    
    // 定价和库存
    pricing: requiredPart.pricing || [],
    inventory: requiredPart.inventory || [],
    
    // 其他属性
    properties: {
      productName: requiredPart.name_zh,
      name: requiredPart.name_zh,
      name_zh: requiredPart.name_zh,
      name_en: requiredPart.name_en,
      part_number: requiredPart.part_number,
      image_url: requiredPart.image_url,
      is_required: true,
      parent_part_number: requiredPart.parent_part_number,
      // 包含所有备件字段
      spec: requiredPart.spec,
      spec_imperial: requiredPart.spec_imperial,
      app_model: requiredPart.app_model,
      app_sn: requiredPart.app_sn,
      is_consumable: requiredPart.is_consumable,
      unit: requiredPart.unit,
      package_size_cm: requiredPart.package_size_cm,
      package_size_inch: requiredPart.package_size_inch,
      net_weight_kg: requiredPart.net_weight_kg,
      net_weight_lbs: requiredPart.net_weight_lbs,
      gross_weight_kg: requiredPart.gross_weight_kg,
      gross_weight_lbs: requiredPart.gross_weight_lbs,
      pcs_per_box: requiredPart.pcs_per_box
    }
  };
}