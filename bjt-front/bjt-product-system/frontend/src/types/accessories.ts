export interface PriceTier {
  range: string;
  price: number;
}

export interface Prices {
  current: number;
  original: number;
  tiers: PriceTier[];
}

export interface Inventory {
  total: number;
  eu: number;
  na: number;
  au: number;
  cn: number;
}

export interface AccessoryProduct {
  id: string;
  name: string;
  name_en: string;
  code: string;
  part_number: string;
  model: string;
  type: string;
  image_url: string;
  product_type: string;
  brand: string;
  voltage: string;
  frequency: string;
  spec: string;
  spec_imperial: string;
  package_size: string;
  package_size_imperial: string;
  net_weight: number;
  net_weight_imperial: number;
  gross_weight: number;
  gross_weight_imperial: number;
  box_quantity: number;
  pallet_size: string;
  pallet_size_imperial: string;
  pallet_quantity: number;
  pallet_height: number;
  pallet_height_imperial: number;
  pallet_gross_weight: number;
  pallet_gross_weight_imperial: number;
  prices: Prices;
  inventory: Inventory;
  required_parts?: string | null;
  required_quantity?: string | null;
} 