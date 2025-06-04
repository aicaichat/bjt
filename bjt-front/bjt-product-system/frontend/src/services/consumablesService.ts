import HttpServiceInstance, { ApiResponse } from './apiService';
import { ASSETS } from '../config/appConfig';
import { getMockConsumables as getBaseMockConsumables, getMockConsumableById as getBaseMockConsumableById } from './mocks/consumables.mocks';
import { Consumable as CentralConsumable, ConsumablePriceTier as CentralConsumablePriceTier, ConsumableInventoryDetail as CentralConsumableInventory, ConsumableFilterOptions as CentralConsumableFilterOptions } from '../types/consumables';
import { delay } from '../utils/delay';

// 耗材接口定义 (LOCAL TO THIS SERVICE)
export interface ConsumableProduct {
  id: string;
  name: string;
  code: string;
  model: string;
  model_imperial?: string | null;
  spec?: string | null;
  spec_imperial?: string | null;
  
  // 基础信息字段
  part_number?: string | null;
  brand?: string | null;
  app_model?: string | null;
  bag_type?: string | null;
  material?: string | null;
  
  // 尺寸规格字段
  thickness_met?: number | null;
  thickness_imp?: number | null;
  width_met?: number | null;
  width_imp?: number | null;
  length_met?: number | null;
  length_imp?: number | null;
  bubble_diameter_met?: number | null;
  bubble_diameter_imp?: number | null;
  total_length_met?: number | null;
  total_length_imp?: number | null;
  
  // 包装属性字段
  package_type?: string | null;
  package_size_cm?: string | null;
  package_size_inch?: string | null;
  net_weight_kg?: number | null;
  net_weight_lbs?: number | null;
  gross_weight_kg?: number | null;
  gross_weight_lbs?: number | null;
  pcs_per_box?: number | null;
  package_image_url?: string | null;
  
  // 打托属性字段
  pallet_size_cm?: string | null;
  pallet_size_inch?: string | null;
  pcs_per_pallet_a?: number | null;
  pallet_gross_weight_a_kg?: number | null;
  pallet_gross_weight_a_lbs?: number | null;
  pallet_height_a_cm?: number | null;
  pallet_height_a_inch?: number | null;
  pcs_per_pallet_b?: number | null;
  pallet_gross_weight_b_kg?: number | null;
  pallet_gross_weight_b_lbs?: number | null;
  pallet_height_b_cm?: number | null;
  pallet_height_b_inch?: number | null;
  pcs_per_pallet_c?: number | null;
  pallet_gross_weight_c_kg?: number | null;
  pallet_gross_weight_c_lbs?: number | null;
  pallet_height_c_cm?: number | null;
  pallet_height_c_inch?: number | null;
  tube_inner_diameter_cm?: number | null;
  tube_inner_diameter_inch?: number | null;
  
  image_url: string;
  specs: {
    material: string;
    shape: string;
    thickness?: string;
    weight?: string;
    width: string;
    length: string;
    rollLength?: string;
    compatibility: string;
  };
  pricing: Array<{
    range: string;
    price: number;
    regionalPrices: {
      eu: number;
      na: number;
      au: number;
      cn: number;
    };
  }>;
  inventory: Record<string, number>;
}

// 筛选参数接口 (LOCAL TO THIS SERVICE)
export interface ConsumableFilters {
  productLineId?: number | string; // Added from previous attempt, keep if API/mock needs it
  model?: string;
  shape?: string;
  material?: string;
  thickness?: string;
  weight?: string;
  width?: string;
  length?: string;
  page?: number;
  page_size?: number;
  region?: string;
  lang?: string;
  category_id?: number; // Keep if used
  filters?: Record<string, any>; // Added from previous attempt, for more generic filters
}

// 定义耗材列表数据结构 (LOCAL TO THIS SERVICE)
export interface ConsumableListData {
  items: ConsumableProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  filterOptions: FilterOptionsType;
}

// 新增: FilterOptionItem and FilterOptionsType
export interface FilterOptionItem {
  id: string;
  name_zh: string;
  name_en?: string;
  image_url?: string;
  image_url2?: string;
}

export interface FilterOptionsType {
  shapes: FilterOptionItem[];
  materials: FilterOptionItem[];
  models: FilterOptionItem[];
  thicknesses: FilterOptionItem[];
  weights: FilterOptionItem[];
  widths: FilterOptionItem[];
  lengths: FilterOptionItem[];
  modelExplodedViews?: Record<string, string>;
}

// 选项数据 (LOCAL TO THIS SERVICE)
export const consumableOptions = {
  shapes: [
    { id: 'pillow', name_zh: '气泡枕', name_en: 'Pillow', image_url: ASSETS.getUrl('/images/icons/shape-pillow.svg') },
    { id: 'bubble', name_zh: '葫芦膜', name_en: 'Bubble', image_url: ASSETS.getUrl('/images/icons/shape-bubble.svg') },
    { id: 'tube', name_zh: '管状膜', name_en: 'Tube', image_url: ASSETS.getUrl('/images/icons/shape-tube.svg') }
  ],
  materials: [
    { id: 'hdpe', name_zh: 'HDPE', name_en: 'HDPE' },
    { id: 'ldpe', name_zh: 'LDPE', name_en: 'LDPE' },
    { id: 'nylon', name_zh: '尼龙', name_en: 'Nylon' },
    { id: 'paper_pe', name_zh: '纸塑复合', name_en: 'PAPER+PE' }
  ],
  models: [
    { id: 'all', name_zh: '全部', name_en: 'ALL' },
    { id: 'la-e4s', name_zh: 'LA-E4S', name_en: 'LA-E4S' },
    { id: 'mex-10-20', name_zh: 'MEX-10-20', name_en: 'MEX-10-20' },
    { id: 'lp-v1', name_zh: 'LP-V1', name_en: 'LP-V1' }
  ],
  thicknesses: [
    { id: 'all', name_zh: '全部', name_en: 'ALL' },
    { id: '0.05mm', name_zh: '0.05mm', name_en: '0.05mm' },
    { id: '0.08mm', name_zh: '0.08mm', name_en: '0.08mm' },
    { id: '0.10mm', name_zh: '0.10mm', name_en: '0.10mm' }
  ],
  weights: [
    { id: 'all', name_zh: '全部', name_en: 'ALL' },
    { id: '50g', name_zh: '50g/m²', name_en: '50g/m²' },
    { id: '75g', name_zh: '75g/m²', name_en: '75g/m²' },
    { id: '100g', name_zh: '100g/m²', name_en: '100g/m²' }
  ],
  widths: [
    { id: 'all', name_zh: '全部', name_en: 'ALL' },
    { id: '200mm', name_zh: '200mm', name_en: '200mm' },
    { id: '250mm', name_zh: '250mm', name_en: '250mm' },
    { id: '300mm', name_zh: '300mm', name_en: '300mm' }
  ],
  lengths: [
    { id: 'all', name_zh: '全部', name_en: 'ALL' },
    { id: '300mm', name_zh: '300mm', name_en: '300mm' },
    { id: '350mm', name_zh: '350mm', name_en: '350mm' },
    { id: '400mm', name_zh: '400mm', name_en: '400mm' }
  ],
  modelExplodedViews: {
    'all': ASSETS.getUrl('/images/models/exploded-view-default.svg'),
    'la-e4s': ASSETS.getUrl('/images/models/LA-E4S-exploded-view.svg'),
    'mex-10-20': ASSETS.getUrl('/images/models/MEX-10-20-exploded-view.svg'),
    'lp-v1': ASSETS.getUrl('/images/models/LP-V1-exploded-view.svg')
  }
};

// 模拟API调用 (LOCAL - This function now fetches base mock data and transforms it)
const mockGetConsumables_local = async (filters: ConsumableFilters): Promise<ConsumableListData> => {
  await delay(500); 
  
  // Call the imported base mock function
  const baseMockData = getBaseMockConsumables({
      productLineId: filters.productLineId,
      region: filters.region,
      lang: filters.lang,
      page: filters.page, // Pass page and pageSize for base mock to handle if it can
      pageSize: filters.page_size,
      filters: filters.filters || { // Pass sub-filters if they exist
        app_model: filters.model === 'all' ? undefined : filters.model, 
        bag_type: filters.shape === 'all' ? undefined : filters.shape, 
        material: filters.material === 'all' ? undefined : filters.material,
        // TODO: map thickness, weight, width, length filters if needed by base mock
      }
  }); 
  let sourceConsumables: CentralConsumable[] = baseMockData.items;

  // LOCAL FILTERING (if base mock doesn't do it all or for properties not in CentralConsumable)
  // This local filtering can be reduced if getBaseMockConsumables handles more filters
  if (filters.material && filters.material !== 'all') {
    sourceConsumables = sourceConsumables.filter(product => 
      (product.specs?.material || '').trim().toLowerCase() === filters.material!.trim().toLowerCase()
    );
  }
  if (filters.shape && filters.shape !== 'all') {
    sourceConsumables = sourceConsumables.filter(product => 
      (product.specs?.shape || '').trim().toLowerCase() === filters.shape!.trim().toLowerCase() 
    );
  }
  if (filters.model && filters.model !== 'all') {
    sourceConsumables = sourceConsumables.filter(product =>
      (product.specs?.compatibility || '').toLowerCase().split(',').map((m: string) => m.trim()).includes(filters.model!.toLowerCase())
    );
  }
  // Add numeric filters with tolerance
  if (filters.thickness && filters.thickness !== 'all') {
    const targetThickness = parseFloat(filters.thickness);
    if (!isNaN(targetThickness)) {
      sourceConsumables = sourceConsumables.filter(product => {
        const productThickness = parseFloat(product.specs?.thickness || '0');
        return !isNaN(productThickness) && Math.abs(productThickness - targetThickness) < 0.001;
      });
    }
  }
  if (filters.weight && filters.weight !== 'all') {
    const targetWeight = parseFloat(filters.weight);
    if (!isNaN(targetWeight)) {
      sourceConsumables = sourceConsumables.filter(product => {
        // 从 specs 中获取 weight，如果不存在则从其他字段获取
        const productWeight = parseFloat(product.specs?.weight || product.net_weight_kg?.toString() || '0');
        return !isNaN(productWeight) && Math.abs(productWeight - targetWeight) < 0.001;
      });
    }
  }
  if (filters.width && filters.width !== 'all') {
    const targetWidth = parseFloat(filters.width);
    if (!isNaN(targetWidth)) {
      sourceConsumables = sourceConsumables.filter(product => {
        const productWidth = parseFloat(product.specs?.width || '0');
        return !isNaN(productWidth) && Math.abs(productWidth - targetWidth) < 0.001;
      });
    }
  }
  if (filters.length && filters.length !== 'all') {
    const targetLength = parseFloat(filters.length);
    if (!isNaN(targetLength)) {
      sourceConsumables = sourceConsumables.filter(product => {
        const productLength = parseFloat(product.specs?.length || '0');
        return !isNaN(productLength) && Math.abs(productLength - targetLength) < 0.001;
      });
    }
  }

  // Data Transformation to ConsumableProduct interface
  const transformedProducts: ConsumableProduct[] = sourceConsumables.map((product: CentralConsumable) => {
    const name = product.model || product.part_number; 
    const productModelString = product.model;

    return {
      id: String(product.id),
      name: name,
      code: product.part_number,
      model: productModelString,
      model_imperial: product.model_imperial || '',
      spec: product.spec || '',
      spec_imperial: product.spec_imperial || '',
      bubble_diameter_met: (product as any).bubble_diameter_met || null,
      bubble_diameter_imp: (product as any).bubble_diameter_imp || null,
      pcs_per_box: product.pcs_per_box || null,
      brand: product.brand || '',
      part_number: product.part_number || '',
      image_url: ASSETS.getUrl(product.image_url || '/images/placeholder.jpg'), 
      specs: {
        material: product.specs?.material || '',
        shape: product.specs?.shape || '',
        thickness: product.specs?.thickness || '',
        weight: product.specs?.weight || '',
        width: product.specs?.width || '',
        length: product.specs?.length || '',
        rollLength: product.specs?.rollLength || '',
        compatibility: product.specs?.compatibility || '',
      },
      pricing: product.pricing || [],
      inventory: Array.isArray(product.inventory)
        ? (product.inventory as any[]).reduce((acc: {[key: string]: number}, inv: any) => {
            acc[inv.region] = typeof inv.quantity === 'number' ? inv.quantity : parseFloat(inv.quantity) || 0;
            return acc;
          }, {})
        : (typeof product.inventory === 'object' && product.inventory !== null
          ? Object.keys(product.inventory).reduce((acc: {[key: string]: number}, region: string) => {
              const qty = (product.inventory as any)[region];
              acc[region] = typeof qty === 'number' ? qty : parseFloat(qty) || 0;
              return acc;
            }, {})
          : {})
    };
  });

  // Paginate the transformed results locally - this might be redundant if getBaseMockConsumables handles pagination
  const page = filters.page || 1;
  const pageSize = filters.page_size || 10;
  // If getBaseMockConsumables provides total, use that. Otherwise, use transformedProducts.length before local pagination.
  const totalItems = baseMockData.total; 
  const totalPages = Math.ceil(totalItems / pageSize);
  // If base mock already paginated, transformedProducts are already the items for the page.
  // If not, then slice transformedProducts. For now, assume base mock paginates.
  const paginatedItems = transformedProducts; 

  return {
    items: paginatedItems, // These are already ConsumableProduct[]
    total: totalItems,
    page: baseMockData.page, // Use page info from base mock
    page_size: baseMockData.page_size, // Use page_size info from base mock
    total_pages: baseMockData.total_pages, // Use total_pages info from base mock
    filterOptions: baseMockData.filterOptions ? {
      // 确保模拟数据的筛选选项也使用正确的字段映射
      shapes: ((baseMockData.filterOptions as any).shapes || []).map((item: any) => ({
        id: item.id || item.code,
        name_zh: item.name_zh || item.name || item.id,
        name_en: item.name_en || item.name || item.id,
        image_url: item.image_url,
        image_url2: item.image_url2
      })),
      materials: ((baseMockData.filterOptions as any).materials || []).map((item: any) => ({
        id: item.id || item.code,
        name_zh: item.name_zh || item.name || item.id,
        name_en: item.name_en || item.name || item.id,
        image_url: item.image_url,
        image_url2: item.image_url2
      })),
      models: ((baseMockData.filterOptions as any).models || []).map((item: any) => ({
        id: item.id || item.model,
        name_zh: item.title_zh || item.name_zh || item.name || item.id,
        name_en: item.title_en || item.name_en || item.name || item.id,
        image_url: item.image_url,
        image_url2: item.image_url2
      })),
      thicknesses: (baseMockData.filterOptions as any).thicknesses || [],
      weights: (baseMockData.filterOptions as any).weights || [],
      widths: (baseMockData.filterOptions as any).widths || [],
      lengths: (baseMockData.filterOptions as any).lengths || [],
      modelExplodedViews: (baseMockData.filterOptions as any).modelExplodedViews
    } : consumableOptions as FilterOptionsType // 使用静态配置作为后备
  };
};

// 实际API调用
const apiGetConsumables_local = async (filters: ConsumableFilters): Promise<ConsumableListData> => {
  // Map ConsumableFilters to the API's expected query parameters
  const apiParams: Record<string, any> = {
    page: filters.page,
    page_size: filters.page_size,
    region: filters.region,
    lang: filters.lang,
    product_line_id: filters.productLineId,
    category_id: filters.category_id,
    model: filters.model === 'all' ? undefined : filters.model,
    shape: filters.shape === 'all' ? undefined : filters.shape,
    material: filters.material === 'all' ? undefined : filters.material,
    thickness: filters.thickness === 'all' ? undefined : (filters.thickness ? +filters.thickness : undefined),
    weight: filters.weight === 'all' ? undefined : (filters.weight ? +filters.weight : undefined),
    width: filters.width === 'all' ? undefined : (filters.width ? +filters.width : undefined),
    length: filters.length === 'all' ? undefined : (filters.length ? +filters.length : undefined),
    ...(filters.filters || {})
  };
  
  // Remove undefined params
  Object.keys(apiParams).forEach(key => apiParams[key] === undefined && delete apiParams[key]);

  console.log('🔍 [apiGetConsumables_local] Sending API request with params:', apiParams);
  console.log('🔍 [apiGetConsumables_local] Original filters object:', filters);
  
  // API返回的是CentralConsumable格式，需要转换
  const response = await HttpServiceInstance.get<{
    items: CentralConsumable[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    filterOptions?: any;
  }>('/consumables', { params: apiParams });
  
  console.log('🔍 [apiGetConsumables_local] Received API response:', {
    dataItemsLength: response.data?.items?.length || 0,
    dataTotal: response.data?.total || 0,
    dataTotalPages: response.data?.total_pages || 0,
    firstItem: response.data?.items?.[0] || null
  });
  
  // 打印第一个原始API项目，用于调试
  if (response.data.items && response.data.items.length > 0) {
    console.log('🔍 [API原始数据] 第一个项目:', response.data.items[0]);
  }
  
  // 转换API数据到本地ConsumableProduct格式
  const transformedItems: ConsumableProduct[] = response.data.items.map(centralItem => {
    const transformed = {
      id: String(centralItem.id),
      name: centralItem.name || centralItem.model,
      code: centralItem.code || centralItem.part_number,
      model: centralItem.model,
      model_imperial: centralItem.model_imperial || null,
      spec: centralItem.spec || null,
      spec_imperial: centralItem.spec_imperial || null,
      
      // 基础信息字段 - 从specs对象或顶级字段获取
      part_number: centralItem.part_number || centralItem.code,
      brand: centralItem.brand || null,
      app_model: centralItem.specs?.compatibility || (centralItem as any).app_model || null, // 尝试多个位置
      bag_type: centralItem.specs?.shape || (centralItem as any).bag_type || null, // 尝试多个位置
      material: centralItem.specs?.material || (centralItem as any).material || null, // 尝试多个位置
      
      // 尺寸规格字段 - 从数字字段获取
      thickness_met: (centralItem as any).thickness_met || null,
      thickness_imp: (centralItem as any).thickness_imp || null,
      width_met: (centralItem as any).width_met || null,
      width_imp: (centralItem as any).width_imp || null,
      length_met: (centralItem as any).length_met || null,
      length_imp: (centralItem as any).length_imp || null,
      bubble_diameter_met: (centralItem as any).bubble_diameter_met || null,
      bubble_diameter_imp: (centralItem as any).bubble_diameter_imp || null,
      total_length_met: (centralItem as any).total_length_met || null,
      total_length_imp: (centralItem as any).total_length_imp || null,
      
      // 包装属性字段
      package_type: centralItem.package_type || centralItem.sales_unit || null,
      package_size_cm: centralItem.package_size_cm || null,
      package_size_inch: centralItem.package_size_inch || null,
      net_weight_kg: centralItem.net_weight_kg || null,
      net_weight_lbs: centralItem.net_weight_lbs || null,
      gross_weight_kg: centralItem.gross_weight_kg || null,
      gross_weight_lbs: centralItem.gross_weight_lbs || null,
      pcs_per_box: centralItem.pcs_per_box || null,
      package_image_url: centralItem.package_image_url || null,
      
      // 打托属性字段
      pallet_size_cm: centralItem.pallet_size_cm || null,
      pallet_size_inch: centralItem.pallet_size_inch || null,
      pcs_per_pallet_a: centralItem.pcs_per_pallet_a || null,
      pallet_gross_weight_a_kg: centralItem.pallet_gross_weight_a_kg || null,
      pallet_gross_weight_a_lbs: centralItem.pallet_gross_weight_a_lbs || null,
      pallet_height_a_cm: centralItem.pallet_height_a_cm || null,
      pallet_height_a_inch: centralItem.pallet_height_a_inch || null,
      pcs_per_pallet_b: centralItem.pcs_per_pallet_b || null,
      pallet_gross_weight_b_kg: centralItem.pallet_gross_weight_b_kg || null,
      pallet_gross_weight_b_lbs: centralItem.pallet_gross_weight_b_lbs || null,
      pallet_height_b_cm: centralItem.pallet_height_b_cm || null,
      pallet_height_b_inch: centralItem.pallet_height_b_inch || null,
      pcs_per_pallet_c: centralItem.pcs_per_pallet_c || null,
      pallet_gross_weight_c_kg: centralItem.pallet_gross_weight_c_kg || null,
      pallet_gross_weight_c_lbs: centralItem.pallet_gross_weight_c_lbs || null,
      pallet_height_c_cm: centralItem.pallet_height_c_cm || null,
      pallet_height_c_inch: centralItem.pallet_height_c_inch || null,
      tube_inner_diameter_cm: centralItem.tube_inner_diameter_cm || null,
      tube_inner_diameter_inch: centralItem.tube_inner_diameter_inch || null,
      
      image_url: ASSETS.getUrl(centralItem.image_url || '/images/placeholder.jpg'),
      specs: {
        material: centralItem.specs?.material || '',
        shape: centralItem.specs?.shape || '',
        thickness: centralItem.specs?.thickness || '',
        weight: centralItem.specs?.weight || '',
        width: centralItem.specs?.width || '',
        length: centralItem.specs?.length || '',
        rollLength: centralItem.specs?.rollLength || '',
        compatibility: centralItem.specs?.compatibility || '',
      },
      pricing: centralItem.pricing || [],
      inventory: centralItem.inventory || {}
    };
    
    // 打印转换后的第一个项目用于调试
    if (centralItem.id === response.data.items[0]?.id) {
      console.log('🔄 [转换后数据] 第一个项目:', {
        id: transformed.id,
        model: transformed.model,
        app_model: transformed.app_model,
        bag_type: transformed.bag_type,
        material: transformed.material,
        thickness_met: transformed.thickness_met,
        width_met: transformed.width_met,
        length_met: transformed.length_met,
        net_weight_kg: transformed.net_weight_kg,
        specs: transformed.specs
      });
    }
    
    return transformed;
  });
  
  return {
    items: transformedItems,
    total: response.data.total,
    page: response.data.page,
    page_size: response.data.page_size,
    total_pages: response.data.total_pages,
    filterOptions: response.data.filterOptions ? {
      // 确保API返回的筛选选项数据包含正确的字段映射
      shapes: (response.data.filterOptions.shapes || []).map((item: any) => ({
        id: item.id || item.code,
        name_zh: item.name_zh || item.name,
        name_en: item.name_en,
        image_url: item.image_url,
        image_url2: item.image_url2
      })),
      materials: (response.data.filterOptions.materials || []).map((item: any) => ({
        id: item.id || item.code,
        name_zh: item.name_zh || item.name,
        name_en: item.name_en,
        image_url: item.image_url,
        image_url2: item.image_url2
      })),
      models: (response.data.filterOptions.models || []).map((item: any) => ({
        id: item.id || item.model,
        name_zh: item.title_zh || item.name_zh || item.name,
        name_en: item.title_en || item.name_en,
        image_url: item.image_url,
        image_url2: item.image_url2
      })),
      thicknesses: response.data.filterOptions.thicknesses || [],
      weights: response.data.filterOptions.weights || [],
      widths: response.data.filterOptions.widths || [],
      lengths: response.data.filterOptions.lengths || [],
      modelExplodedViews: response.data.filterOptions.modelExplodedViews
    } : {
      shapes: [],
      materials: [],
      models: [],
      thicknesses: [],
      weights: [],
      widths: [],
      lengths: []
    }
  };
};

// Helper function to transform CentralConsumable to local ConsumableProduct
const transformCentralConsumableToLocal = (product?: CentralConsumable): ConsumableProduct | undefined => {
    if (!product) return undefined;
    const name = product.model || product.part_number;
    const productModelString = product.model;
    return {
      id: String(product.id),
      name: name,
      code: product.part_number,
      model: productModelString,
      model_imperial: product.model_imperial || '',
      spec: product.spec || '',
      spec_imperial: product.spec_imperial || '',
      bubble_diameter_met: (product as any).bubble_diameter_met || null,
      bubble_diameter_imp: (product as any).bubble_diameter_imp || null,
      pcs_per_box: product.pcs_per_box || null,
      brand: product.brand || '',
      part_number: product.part_number || '',
      image_url: ASSETS.getUrl(product.image_url || '/images/placeholder.jpg'),
      specs: {
        material: product.specs?.material || '',
        shape: product.specs?.shape || '',
        thickness: product.specs?.thickness || '',
        weight: product.specs?.weight || '',
        width: product.specs?.width || '',
        length: product.specs?.length || '',
        rollLength: product.specs?.rollLength || '',
        compatibility: product.specs?.compatibility || '',
      },
      pricing: product.pricing || [],
      inventory: Array.isArray(product.inventory)
        ? (product.inventory as any[]).reduce((acc: {[key: string]: number}, inv: any) => {
            acc[inv.region] = typeof inv.quantity === 'number' ? inv.quantity : parseFloat(inv.quantity) || 0;
            return acc;
          }, {})
        : (typeof product.inventory === 'object' && product.inventory !== null
          ? Object.keys(product.inventory).reduce((acc: {[key: string]: number}, region: string) => {
              const qty = (product.inventory as any)[region];
              acc[region] = typeof qty === 'number' ? qty : parseFloat(qty) || 0;
              return acc;
            }, {})
          : {})
    };
}

export const consumablesService = {
  /**
   * 获取耗材列表
   */
  getConsumables: async (filters: ConsumableFilters): Promise<ConsumableListData> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      return mockGetConsumables_local(filters);
    }
    return apiGetConsumables_local(filters);
  },

  /**
   * 获取单个耗材详情
   */
  getConsumable: async (consumableId: string, params: { region?: string; lang?: string; productLineId?: number | string; } = {}): Promise<ConsumableProduct | undefined> => {
    if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
      await delay(300);
      const centralConsumable = getBaseMockConsumableById(consumableId); // Gets CentralConsumable
      return transformCentralConsumableToLocal(centralConsumable); // Transform to local ConsumableProduct
    } else {
      try {
        // Assuming API returns a single item that can be transformed or matches ConsumableProduct
        // If API returns CentralConsumable, it needs transformation
        const response: ApiResponse<CentralConsumable> = await HttpServiceInstance.get<CentralConsumable>(`/consumables/${consumableId}`, params);
        return transformCentralConsumableToLocal(response.data);
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          return undefined;
        }
        console.error("Error fetching consumable:", error);
        throw error;
      }
    }
  },

  /**
   * 获取耗材过滤选项 (Optional: Fetch dynamically or use static mock)
   * This example assumes the options are returned with the list data in getConsumables.
   * If you need a separate endpoint, implement it here.
   */
  // getConsumableFilters: async (params: {
  //   region?: string;
  //   lang?: string;
  //   productLineId?: number | string;
  // } = {}): Promise<ConsumableFilterOptions> => {
  //   if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
  //     await delay(100);
  //     // You might need a specific mock function for filters if not included in list data
  //     const mockListData = getMockConsumables({ productLineId: params.productLineId }); 
  //     return mockListData.filterOptions || {}; 
  //   } else {
  //     const response: ApiResponse<ConsumableFilterOptions> = await HttpServiceInstance.get(`/consumables/filters`, params);
  //     return response.data;
  //   }
  // },

  // 获取筛选选项
  getConsumableOptions: () => {
    return consumableOptions;
  }
};

export default consumablesService; 