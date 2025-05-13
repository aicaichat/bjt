// This file defines the structure for consumable product data.

// Represents pricing tiers based on quantity and region.
export interface ConsumablePriceTier {
  region: string; // e.g., 'CN', 'US', 'EU', 'AU'
  currency: string; // e.g., 'CNY', 'USD', 'EUR', 'AUD'
  tiers: {
    min_quantity: number;
    max_quantity: number | null; // null for open-ended range
    price: number; // base_price from wp_bjt_prices
    discount_rate: number | null; // discount_rate from wp_bjt_prices
  }[];
}

// Represents inventory details for a specific region and warehouse.
export interface ConsumableInventory {
  region: string; // e.g., 'CN', 'US', 'EU', 'AU'
  warehouse: string; // e.g., 'WH-SH-01', 'WH-US-01'
  quantity: number; // Available quantity
  reserved: number; // Reserved quantity
}

// Represents a single consumable product.
export interface Consumable {
  id: number | string; // Unique identifier from wp_bjt_consumables
  product_line_id: number; // Link to wp_bjt_product_lines
  model: string;
  model_imperial?: string | null;
  part_number: string;
  spec?: string | null;
  spec_imperial?: string | null;
  brand?: string | null;
  app_model?: string | null; // Comma-separated host models
  bag_type?: string | null; // e.g., 'pillow', 'bubble', 'tube' (link to wp_bjt_shapes code)
  material?: string | null; // e.g., 'HDPE', 'LDPE', 'Nylon', 'PAPER+PE' (link to wp_bjt_materials code)
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
  package_type?: string | null; // e.g., 'Roll', 'Piece'
  package_size_cm?: string | null;
  package_size_inch?: string | null;
  net_weight_kg?: number | null;
  net_weight_lbs?: number | null;
  gross_weight_kg?: number | null;
  gross_weight_lbs?: number | null;
  pcs_per_box?: number | null;
  image_url?: string | null;
  package_image_url?: string | null;
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
  status: string; // e.g., 'publish', 'draft'
  unit: string; // e.g. 'pcs', 'roll', 'box'
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string

  // Populated by helper functions in mock data
  productId?: string; // Often same as part_number for frontend use
  prices: ConsumablePriceTier[];
  inventory: ConsumableInventory[];
}

// Represents the available filter options for consumables.
export interface ConsumableFilterOptions {
  app_model?: string[];
  bag_type?: string[];
  material?: string[];
  thickness_met?: number[];
  thickness_imp?: number[];
  width_met?: number[];
  width_imp?: number[];
  length_met?: number[];
  length_imp?: number[];
}

// Represents the structure for API responses returning a list of consumables.
export interface ConsumableListData {
  items: Consumable[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  filterOptions?: ConsumableFilterOptions; // Available options for filters
} 