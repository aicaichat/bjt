export interface PriceRange {
  range: string;
  price: number;
  eu?: number;
  na?: number;
  cn?: number;
  au?: number;
}

export interface PriceTier {
  minQuantity: number;
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

export interface CartItem {
  id: string;
  name: string;
  code: string;
  quantity: number;
  currentTier: PriceTier | null;
  currentPrice: number;
  subtotal: number;
  priceTiers: PriceTier[];
  image?: string;
}

export interface SparePartFilter {
  searchText: string;
  machineType?: string;
  isConsumable?: boolean;
} 