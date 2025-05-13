import { PriceTier, InventoryData } from './common';

export interface PriceRange {
  range: string;
  price: number;
  eu?: number;
  na?: number;
  cn?: number;
  au?: number;
}

export interface SimplePriceTier {
  minQuantity: number;
  maxQuantity?: number | null; // Optional if it's an open-ended range like "10+"
  price: number;
}

export interface Inventory {
  quantity: number;
  eu?: number;
  na?: number;
  cn?: number;
  au?: number;
}

export interface InventoryItem {
  region: string;
  amount: number;
}

export interface PriceInfo {
  currency: string;
  current: number;
  tiers: PriceRange[];
}

export interface SparePartProduct {
  id: string;
  name: string;
  name_en: string;
  part_number: string;
  description: string;
  type: string;
  image: string;
  prices: PriceRange[];
  inventory: Inventory;
  compatible_models: string[];
}

export interface CartItemProperties {
  type?: string;
  productType?: string;
  model?: string;
  serialNumber?: string;
  packageSize?: string;
  spec?: string | null;
  pcsPerBox?: number | null;
}

export interface CartItemSpecs {
  app_sn?: string | null;
  package_size_cm?: string | null;
}

export interface CartItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  currentTier: SimplePriceTier | null;
  currentPrice: number;
  subtotal: number;
  priceTiers: SimplePriceTier[];
  image?: string;
  category?: string;
  productId?: number;
  selected?: boolean;
  properties?: CartItemProperties;
  specs?: CartItemSpecs;
}

export interface SparePartFilter {
  searchText: string;
  machineType?: string;
  isConsumable?: boolean;
}

/**
 * Represents a single spare part product, including pricing and inventory.
 */
export interface SparePart {
  id: number;
  product_line_id: number;
  app_model: string | null;
  model: string;
  is_consumable: boolean;
  image_url: string | null;
  part_number: string;
  name_zh: string;
  name_en: string;
  spec: string | null;
  spec_imperial: string | null;
  app_sn: string | null;
  package_size_cm: string | null;
  package_size_inch: string | null;
  net_weight_kg: number | null;
  net_weight_lbs: number | null;
  gross_weight_kg: number | null;
  gross_weight_lbs: number | null;
  pcs_per_box: number | null;
  status: string;
  unit: string;
  prices: PriceTier[];
  inventory: InventoryData[];
  product_type: string;
  name?: string;
  code?: string;
  type?: string;
  description?: string;
  category?: string;
}

/**
 * Represents available filter options for spare parts.
 */
export interface SparePartFilterOptions {
  app_model: string[]; // List of applicable host/accessory models
  is_consumable: Array<{ id: string; name: string }>; // Options for boolean filter
}

/**
 * Represents the structure for API responses returning a list of spare parts.
 */
export interface SparePartListData {
  items: SparePart[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  filterOptions: SparePartFilterOptions;
} 