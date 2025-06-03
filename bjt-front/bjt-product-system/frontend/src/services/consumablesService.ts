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
  name: string;
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
    { id: 'pillow', name: 'Pillow', image_url: ASSETS.getUrl('/images/icons/shape-pillow.svg') },
    { id: 'bubble', name: 'Bubble', image_url: ASSETS.getUrl('/images/icons/shape-bubble.svg') },
    { id: 'tube', name: 'Tube', image_url: ASSETS.getUrl('/images/icons/shape-tube.svg') }
  ],
  materials: [
    { id: 'hdpe', name: 'HDPE' },
    { id: 'ldpe', name: 'LDPE' },
    { id: 'nylon', name: 'Nylon' },
    { id: 'paper_pe', name: 'PAPER+PE' }
  ],
  models: [
    { id: 'all', name: 'ALL' },
    { id: 'la-e4s', name: 'LA-E4S' },
    { id: 'mex-10-20', name: 'MEX-10-20' },
    { id: 'lp-v1', name: 'LP-V1' }
  ],
  thicknesses: [
    { id: 'all', name: 'ALL' },
    { id: '0.05mm', name: '0.05mm' },
    { id: '0.08mm', name: '0.08mm' },
    { id: '0.10mm', name: '0.10mm' }
  ],
  weights: [
    { id: 'all', name: 'ALL' },
    { id: '50g', name: '50g/m²' },
    { id: '75g', name: '75g/m²' },
    { id: '100g', name: '100g/m²' }
  ],
  widths: [
    { id: 'all', name: 'ALL' },
    { id: '200mm', name: '200mm' },
    { id: '250mm', name: '250mm' },
    { id: '300mm', name: '300mm' }
  ],
  lengths: [
    { id: 'all', name: 'ALL' },
    { id: '300mm', name: '300mm' },
    { id: '350mm', name: '350mm' },
    { id: '400mm', name: '400mm' }
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
  // Add other local filters (thickness, weight, width, length) if not handled by base mock

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
        weight: undefined, // Placeholder, CentralConsumable doesn't have direct weight field for specs
        width: product.specs?.width || '',
        length: product.specs?.length || '',
        rollLength: product.specs?.rollLength || '',
        compatibility: product.specs?.compatibility || '',
      },
      pricing: product.pricing || [],
      inventory: product.inventory.reduce((acc: {[key: string]: number}, inv: any) => {
        acc[inv.region] = +inv.quantity;
        return acc;
      }, {})
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
    filterOptions: baseMockData.filterOptions as FilterOptionsType // Pass through filterOptions
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
    thickness: filters.thickness === 'all' ? undefined : filters.thickness,
    weight: filters.weight === 'all' ? undefined : filters.weight,
    width: filters.width === 'all' ? undefined : filters.width,
    length: filters.length === 'all' ? undefined : filters.length,
    ...(filters.filters || {})
  };
  
  // Remove undefined params
  Object.keys(apiParams).forEach(key => apiParams[key] === undefined && delete apiParams[key]);

  console.log('🔍 [apiGetConsumables_local] Sending API request with params:', apiParams);
  console.log('🔍 [apiGetConsumables_local] Original filters object:', filters);
  
  const response = await HttpServiceInstance.get<ConsumableListData>('/consumables', { params: apiParams });
  
  console.log('🔍 [apiGetConsumables_local] Received API response:', {
    dataItemsLength: response.data?.items?.length || 0,
    dataTotal: response.data?.total || 0,
    dataTotalPages: response.data?.total_pages || 0,
    firstItem: response.data?.items?.[0] || null
  });
  
  // Here, ConsumableListData is the local one. API must return data matching ConsumableProduct.
  // If API returns CentralConsumable[], transformation will be needed here too.
  // For now, assume API returns data matching local ConsumableProduct for simplicity.
  return response.data;
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
        weight: undefined,
        width: product.specs?.width || '',
        length: product.specs?.length || '',
        rollLength: product.specs?.rollLength || '',
        compatibility: product.specs?.compatibility || '',
      },
      pricing: product.pricing || [],
      inventory: product.inventory.reduce((acc: {[key: string]: number}, inv: any) => {
        acc[inv.region] = +inv.quantity;
        return acc;
      }, {})
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