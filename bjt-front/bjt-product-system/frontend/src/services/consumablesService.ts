import HttpServiceInstance, { ApiResponse } from './apiService';
import { ASSETS } from '../config/appConfig';
import { getMockConsumables as getBaseMockConsumables, getMockConsumableById as getBaseMockConsumableById } from './mocks/consumables.mocks';
import { Consumable as CentralConsumable, ConsumablePriceTier as CentralConsumablePriceTier, ConsumableInventory as CentralConsumableInventory, ConsumableFilterOptions as CentralConsumableFilterOptions } from '../types/consumables';
import { delay } from '../utils/delay';

// 耗材接口定义 (LOCAL TO THIS SERVICE)
export interface ConsumableProduct {
  id: string;
  name: string;
  code: string;
  model: string;
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
  image_url?: string;
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
      product.material?.trim().toLowerCase() === filters.material!.trim().toLowerCase()
    );
  }
  if (filters.shape && filters.shape !== 'all') {
    sourceConsumables = sourceConsumables.filter(product => 
      product.bag_type?.trim().toLowerCase() === filters.shape!.trim().toLowerCase() 
    );
  }
  if (filters.model && filters.model !== 'all') {
    sourceConsumables = sourceConsumables.filter(product =>
      product.app_model?.toLowerCase().split(',').map((m: string) => m.trim()).includes(filters.model!.toLowerCase())
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
      image_url: ASSETS.getUrl(product.image_url || '/images/placeholder.jpg'), 
      specs: {
        material: product.material || '',
        shape: product.bag_type || '',
        thickness: product.thickness_met ? `${product.thickness_met}um` : (product.thickness_imp ? `${product.thickness_imp}mil` : undefined),
        weight: undefined, // Placeholder, CentralConsumable doesn't have direct weight field for specs
        width: product.width_met ? `${product.width_met}cm` : (product.width_imp ? `${product.width_imp}inch` : ''),
        length: product.length_met ? `${product.length_met}cm` : (product.length_imp ? `${product.length_imp}inch` : ''),
        rollLength: product.total_length_met ? `${product.total_length_met}m` : (product.total_length_imp ? `${product.total_length_imp}ft` : undefined),
        compatibility: product.app_model || '',
      },
      pricing: product.prices.map((p: CentralConsumablePriceTier) => ({
        range: `${p.tiers[0].min_quantity}${p.tiers[0].max_quantity ? '-'+p.tiers[0].max_quantity : '+'}`,
        price: p.tiers[0].price,
        regionalPrices: { // This mapping is very specific, adjust if CentralConsumablePriceTier changes
          eu: p.region === 'EU' ? p.tiers[0].price : 0,
          na: p.region === 'US' ? p.tiers[0].price : 0,
          au: p.region === 'AU' ? p.tiers[0].price : 0,
          cn: p.region === 'CN' ? p.tiers[0].price : 0,
        }
      })),
      inventory: product.inventory.reduce((acc: Record<string, number>, inv: CentralConsumableInventory) => {
        acc[inv.region] = inv.quantity;
        return acc;
      }, {} as Record<string, number>)
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
    // Map other filters like model, shape, material if API supports them directly
    model: filters.model === 'all' ? undefined : filters.model,
    bag_type: filters.shape === 'all' ? undefined : filters.shape,
    material: filters.material === 'all' ? undefined : filters.material,
    // Pass generic filters if any
    ...(filters.filters || {})
  };
  // Remove undefined params
  Object.keys(apiParams).forEach(key => apiParams[key] === undefined && delete apiParams[key]);

  const response = await HttpServiceInstance.get<ConsumableListData>('/consumables', { params: apiParams });
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
      image_url: ASSETS.getUrl(product.image_url || '/images/placeholder.jpg'),
      specs: {
        material: product.material || '',
        shape: product.bag_type || '',
        thickness: product.thickness_met ? `${product.thickness_met}um` : (product.thickness_imp ? `${product.thickness_imp}mil` : undefined),
        weight: undefined,
        width: product.width_met ? `${product.width_met}cm` : (product.width_imp ? `${product.width_imp}inch` : ''),
        length: product.length_met ? `${product.length_met}cm` : (product.length_imp ? `${product.length_imp}inch` : ''),
        rollLength: product.total_length_met ? `${product.total_length_met}m` : (product.total_length_imp ? `${product.total_length_imp}ft` : undefined),
        compatibility: product.app_model || '',
      },
      pricing: product.prices.map((p: CentralConsumablePriceTier) => ({
        range: `${p.tiers[0].min_quantity}${p.tiers[0].max_quantity ? '-'+p.tiers[0].max_quantity : '+'}`,
        price: p.tiers[0].price,
        regionalPrices: {
          eu: p.region === 'EU' ? p.tiers[0].price : 0,
          na: p.region === 'US' ? p.tiers[0].price : 0,
          au: p.region === 'AU' ? p.tiers[0].price : 0,
          cn: p.region === 'CN' ? p.tiers[0].price : 0,
        }
      })),
      inventory: product.inventory.reduce((acc: Record<string, number>, inv: CentralConsumableInventory) => {
        acc[inv.region] = inv.quantity;
        return acc;
      }, {} as Record<string, number>)
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